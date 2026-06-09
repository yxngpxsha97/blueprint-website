// ============================================================================
// Passive Ship Collection API — AIS passive discovery
// ----------------------------------------------------------------------------
// POST /api/fleet/collect
//   Opens AISStream WebSocket connections to all 5 bounding boxes for 30s,
//   saves EVERY ship seen (not just cruise ships) to an in-memory discovered
//   ships store. Deduplicates by MMSI. Requires sector=tech or maritiem.
//
// GET /api/fleet/collect
//   Returns current discovered ships count + stats summary.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import WebSocket from 'ws';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveredShip {
  mmsi: string;
  ship_name: string;
  ship_type: number;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  flag: string;        // derived from MMSI prefix when possible
  first_seen: string;
  last_seen: string;
  position_count: number;
}

// AISStream message shape (partial)
interface AisMessage {
  MessageType?: string;
  MetaData?: {
    MMSI?: number;
    MMSI_String?: string;
    ShipName?: string;
    latitude?: number;
    longitude?: number;
    time_utc?: string;
  };
  Message?: {
    PositionReport?: {
      Latitude?: number;
      Longitude?: number;
      TrueHeading?: number;
      SpeedOverGround?: number;
      NavigationalStatus?: number;
    };
    ShipStaticData?: {
      ImoNumber?: number;
      Name?: string;
      ShipType?: number;
      Latitude?: number;
      Longitude?: number;
      Destination?: string;
    };
  };
}

// ---------------------------------------------------------------------------
// Module-level in-memory store (persists across requests in one server instance)
// ---------------------------------------------------------------------------

export const discoveredShips = new Map<string, DiscoveredShip>();

// ---------------------------------------------------------------------------
// Bounding boxes — same 5 as the positions route
// ---------------------------------------------------------------------------

const BOUNDING_BOXES = [
  { name: 'Mediterranean',   start: [30, -10] as [number, number], end: [48, 40]  as [number, number] },
  { name: 'Caribbean',       start: [10, -90] as [number, number], end: [28, -58] as [number, number] },
  { name: 'Northern Europe', start: [48, -15] as [number, number], end: [62, 15]  as [number, number] },
  { name: 'Asia Pacific',    start: [-10, 95] as [number, number], end: [40, 145] as [number, number] },
  { name: 'Atlantic',        start: [0, -80]  as [number, number], end: [55, -5]  as [number, number] },
];

// ---------------------------------------------------------------------------
// MMSI → country/flag mapping (first 3 digits = MID)
// ---------------------------------------------------------------------------

const MID_TO_FLAG: Record<string, string> = {
  '211': 'Germany', '218': 'Germany', '219': 'Denmark', '220': 'Denmark',
  '230': 'Finland', '232': 'UK', '233': 'UK', '235': 'UK',
  '244': 'Netherlands', '245': 'Netherlands', '246': 'Netherlands',
  '247': 'Italy', '255': 'Portugal', '257': 'Norway', '258': 'Norway',
  '265': 'Sweden', '266': 'Sweden', '269': 'Switzerland',
  '271': 'Turkey', '273': 'Russia', '276': 'Estonia', '277': 'Latvia',
  '278': 'Lithuania', '279': 'Russia',
  '303': 'USA', '338': 'USA', '366': 'USA', '367': 'USA', '368': 'USA',
  '369': 'USA', '338': 'USA',
  '316': 'Canada', '319': 'Cayman Islands',
  '351': 'Panama', '352': 'Panama', '353': 'Panama', '354': 'Panama',
  '355': 'Panama', '356': 'Panama', '357': 'Panama',
  '374': 'Panama',
  '378': 'British Virgin Islands',
  '416': 'Taiwan', '431': 'Japan', '432': 'Japan', '433': 'Japan',
  '440': 'South Korea', '441': 'South Korea',
  '477': 'Hong Kong', '478': 'Hong Kong',
  '518': 'Cook Islands', '525': 'Indonesia', '533': 'Malaysia',
  '548': 'Philippines', '553': 'Papua New Guinea',
  '557': 'Marshall Islands', '538': 'Marshall Islands',
  '566': 'Singapore', '574': 'Vietnam',
  '636': 'Liberia',
  '710': 'Brazil',
  '725': 'Chile',
  '770': 'Argentina',
};

function mmsiToFlag(mmsi: string): string {
  const mid = mmsi.substring(0, 3);
  return MID_TO_FLAG[mid] ?? 'Unknown';
}

// ---------------------------------------------------------------------------
// Core collection function
// ---------------------------------------------------------------------------

async function collectPassive(durationMs: number = 30_000): Promise<{
  newShips: number;
  updatedShips: number;
  totalCollected: number;
}> {
  const AISSTREAM_API_KEY =
    // TODO: rotate + remove once AISSTREAM_API_KEY is set in env
    process.env.AISSTREAM_API_KEY ?? '78c39db66176103aa332f8e22283099019eddc3e';

  let newShips = 0;
  let updatedShips = 0;

  return new Promise((resolve) => {
    const sockets: WebSocket[] = [];
    let settled = false;

    const deadline = setTimeout(() => {
      if (!settled) {
        settled = true;
        sockets.forEach((ws) => { try { ws.close(); } catch { /* ignore */ } });
        resolve({ newShips, updatedShips, totalCollected: discoveredShips.size });
      }
    }, durationMs);

    for (const box of BOUNDING_BOXES) {
      let ws: WebSocket;
      try {
        ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
      } catch {
        continue;
      }

      sockets.push(ws);

      ws.on('open', () => {
        const sub = {
          APIKey: AISSTREAM_API_KEY,
          BoundingBoxes: [[box.start, box.end]],
          // No filter — capture all message types
          FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
        };
        ws.send(JSON.stringify(sub));
      });

      ws.on('message', (raw: Buffer | string) => {
        if (settled) return;

        let msg: AisMessage;
        try {
          msg = JSON.parse(raw.toString()) as AisMessage;
        } catch {
          return;
        }

        const meta = msg.MetaData;
        if (!meta) return;

        const mmsiStr = meta.MMSI_String ?? String(meta.MMSI ?? '');
        if (!mmsiStr || mmsiStr === '0') return;

        const lat = meta.latitude
          ?? msg.Message?.PositionReport?.Latitude
          ?? msg.Message?.ShipStaticData?.Latitude;
        const lng = meta.longitude
          ?? msg.Message?.PositionReport?.Longitude
          ?? msg.Message?.ShipStaticData?.Longitude;

        if (lat === undefined || lng === undefined) return;
        if (lat === 0 && lng === 0) return; // default/null position

        const shipName = (
          meta.ShipName
          ?? msg.Message?.ShipStaticData?.Name
          ?? ''
        ).trim();

        const posReport = msg.Message?.PositionReport;
        const staticData = msg.Message?.ShipStaticData;

        const heading = posReport?.TrueHeading ?? 0;
        const rawSpeed = posReport?.SpeedOverGround ?? 0;
        const speed = rawSpeed >= 102 ? 0 : Math.round(rawSpeed * 10) / 10;
        const finalHeading = heading === 511 ? 0 : heading;
        const shipType = staticData?.ShipType ?? 0;
        const flag = mmsiToFlag(mmsiStr);
        const now = meta.time_utc ?? new Date().toISOString();

        const existing = discoveredShips.get(mmsiStr);

        if (!existing) {
          // Brand new ship
          discoveredShips.set(mmsiStr, {
            mmsi: mmsiStr,
            ship_name: shipName || `MMSI ${mmsiStr}`,
            ship_type: shipType,
            lat: Math.round(lat * 10000) / 10000,
            lng: Math.round(lng * 10000) / 10000,
            speed,
            heading: finalHeading,
            flag,
            first_seen: now,
            last_seen: now,
            position_count: 1,
          });
          newShips++;
        } else {
          // Update existing — refresh position + increment count
          discoveredShips.set(mmsiStr, {
            ...existing,
            ship_name: shipName || existing.ship_name,
            ship_type: shipType || existing.ship_type,
            lat: Math.round(lat * 10000) / 10000,
            lng: Math.round(lng * 10000) / 10000,
            speed,
            heading: finalHeading,
            last_seen: now,
            position_count: existing.position_count + 1,
          });
          updatedShips++;
        }
      });

      ws.on('error', () => { /* swallow */ });
      ws.on('close', () => { /* handled by deadline */ });
    }

    if (sockets.length === 0) {
      settled = true;
      clearTimeout(deadline);
      resolve({ newShips: 0, updatedShips: 0, totalCollected: discoveredShips.size });
    }
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * POST — run a 30-second passive collection session.
 * Requires authenticated user with sector=tech or sector=maritiem.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sector = session.sector ?? '';
  if (sector !== 'tech' && sector !== 'maritiem') {
    return NextResponse.json({ error: 'Access denied — requires tech or maritiem sector' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { duration?: number };
  const duration = Math.min(body.duration ?? 30_000, 60_000); // max 60s

  const result = await collectPassive(duration);

  return NextResponse.json({
    success: true,
    session: result,
    store: {
      total: discoveredShips.size,
      sampleMmsis: [...discoveredShips.keys()].slice(0, 10),
    },
  });
}

/**
 * GET — return current discovered ships stats.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  const ships = [...discoveredShips.values()];

  // Ship type breakdown
  const typeMap = new Map<number, number>();
  ships.forEach((s) => typeMap.set(s.ship_type, (typeMap.get(s.ship_type) ?? 0) + 1));
  const byType = [...typeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));

  // Flag breakdown
  const flagMap = new Map<string, number>();
  ships.forEach((s) => flagMap.set(s.flag, (flagMap.get(s.flag) ?? 0) + 1));
  const byFlag = [...flagMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([flag, count]) => ({ flag, count }));

  // Most tracked ships (highest position_count)
  const mostTracked = [...ships]
    .sort((a, b) => b.position_count - a.position_count)
    .slice(0, 10)
    .map((s) => ({ mmsi: s.mmsi, name: s.ship_name, flag: s.flag, count: s.position_count }));

  return NextResponse.json({
    total: discoveredShips.size,
    stats: {
      byType,
      byFlag,
      mostTracked,
    },
  });
}
