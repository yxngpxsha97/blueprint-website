// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Positions API — returns AIS positions for non-cruise sectors
//
// GET /api/fleet/dynamic-positions?sector=cargo
//   Returns discovered ships filtered by AIS shipType codes for the sector.
//   If the discovery store has data, uses it immediately.
//   If store is empty, triggers a 10s AIS collection first.
//   If AIS returns fewer than 30 positions, supplements with vessel_profiles
//   seed data from Supabase at demo coordinates per shipping lane.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { SectorId } from '@/lib/fleet-sectors';
import { getSector } from '@/lib/fleet-sectors';
import { discoveredShips } from '../collect/route';
import type { AisShipPosition } from '../positions/route';
import WebSocket from 'ws';

// Map AIS navStatus → our status (same as positions route)
function mapNavStatus(nav: number | undefined): AisShipPosition['status'] {
  if (nav === undefined) return 'underway';
  if (nav === 0 || nav === 8) return 'underway';
  if (nav === 1 || nav === 3) return 'anchored';
  if (nav === 5) return 'moored';
  return nav <= 2 ? 'underway' : 'moored';
}

// Cache per sector — 3-minute TTL
const sectorCaches = new Map<SectorId, { data: AisShipPosition[]; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

// Demo shipping lane coordinates per sector used when AIS data is sparse
const SECTOR_POSITIONS: Record<string, Array<[number, number]>> = {
  cargo: [
    [51.5, 3.2], [51.8, 4.1], [52.1, 4.8], [50.9, 1.5], [50.5, -0.2],
    [49.2, -2.1], [35.8, -5.9], [36.1, -5.4], [37.5, 0.8], [38.2, 15.4],
    [31.5, 32.3], [30.8, 32.8], [22.4, 59.8], [1.2, 103.8], [1.8, 104.2],
    [5.5, -0.2], [6.1, 2.3], [53.2, 8.4], [53.8, 9.1], [54.2, 10.2],
    [55.8, 12.4], [57.2, 10.5], [51.2, 3.8], [50.2, -4.1], [48.5, -4.8],
    [43.2, -8.5], [40.8, -9.2], [38.1, -9.1], [36.5, -6.2], [35.9, -5.7],
  ],
  tanker: [
    [26.5, 56.3], [26.8, 57.1], [27.2, 58.4], [24.5, 58.8], [25.1, 57.6],
    [22.8, 61.2], [20.1, 63.5], [18.4, 65.2], [15.8, 68.1], [12.5, 70.8],
    [57.8, 3.2], [58.2, 4.5], [59.1, 5.8], [60.2, 4.1], [56.5, 6.2],
    [36.5, 22.8], [37.8, 24.2], [35.2, 14.8], [38.5, 18.2], [40.1, 22.5],
    [51.8, 1.2], [52.1, 2.8], [53.2, 4.5], [54.8, 8.2], [56.2, 9.8],
    [1.5, 104.8], [2.8, 106.2], [5.2, 108.8], [4.1, 107.5], [3.2, 105.9],
  ],
  passenger: [
    [51.1, 1.5], [50.9, 1.8], [50.5, 0.2], [50.8, -0.5], [51.2, -0.8],
    [51.4, -1.2], [50.2, -2.8], [49.8, -4.1], [55.9, 9.8], [56.5, 10.5],
    [57.8, 10.2], [56.2, 12.8], [59.5, 17.8], [59.8, 22.5], [60.2, 25.1],
    [59.9, 24.8], [37.8, 15.2], [38.5, 15.8], [40.2, 18.5], [41.5, 19.8],
    [43.5, 15.2], [44.8, 14.8], [45.2, 13.5], [46.5, 14.2], [42.5, 18.8],
    [35.5, 23.5], [36.8, 24.2], [37.5, 26.8], [38.2, 24.5], [36.2, 22.8],
  ],
  offshore: [
    [59.2, 2.8], [59.8, 3.5], [60.5, 4.2], [61.2, 4.8], [62.5, 5.2],
    [63.8, 6.5], [65.2, 7.8], [64.5, 9.2], [63.2, 8.5], [62.8, 7.2],
    [56.8, 2.1], [57.2, 3.8], [58.1, 4.5], [58.8, 5.2], [57.5, 6.8],
    [55.5, 5.2], [56.2, 6.8], [57.8, 8.2], [58.5, 9.5], [59.8, 10.2],
    [28.5, -89.5], [28.8, -90.2], [29.2, -90.8], [28.2, -88.5], [27.8, -91.2],
    [72.5, 22.8], [71.8, 24.5], [73.2, 26.8], [70.5, 21.2], [69.8, 19.5],
  ],
  'port-authority': [
    [51.97, 4.12], [51.95, 4.05], [51.98, 4.18], [51.93, 4.22], [51.99, 4.08],
    [53.52, 9.98], [53.55, 10.02], [53.48, 9.95], [53.51, 10.05], [53.54, 9.88],
    [1.26, 103.82], [1.28, 103.88], [1.24, 103.78], [1.30, 103.92], [1.22, 103.85],
    [51.45, 0.72], [51.48, 0.78], [51.42, 0.68], [51.50, 0.82], [51.44, 0.65],
    [53.88, 8.72], [53.92, 8.78], [53.85, 8.68], [53.95, 8.82], [53.82, 8.75],
    [57.68, 11.92], [57.72, 11.98], [57.65, 11.88], [57.75, 12.02], [57.62, 11.95],
  ],
};

// AIS bounding boxes (same as positions route)
const BOUNDING_BOXES = [
  { start: [30, -10] as [number, number], end: [48, 40]  as [number, number] },
  { start: [10, -90] as [number, number], end: [28, -58] as [number, number] },
  { start: [48, -15] as [number, number], end: [62, 15]  as [number, number] },
  { start: [-10, 95] as [number, number], end: [40, 145] as [number, number] },
  { start: [0, -80]  as [number, number], end: [55, -5]  as [number, number] },
];

// MID → country (same inline table as positions route)
const MID: Record<string, string> = {
  '211': 'Germany', '232': 'UK', '233': 'UK', '235': 'UK',
  '244': 'Netherlands', '245': 'Netherlands', '247': 'Italy',
  '255': 'Portugal', '257': 'Norway', '265': 'Sweden', '266': 'Sweden',
  '271': 'Turkey', '273': 'Russia', '303': 'USA', '338': 'USA',
  '366': 'USA', '367': 'USA', '316': 'Canada', '319': 'Cayman Islands',
  '351': 'Panama', '352': 'Panama', '353': 'Panama',
  '431': 'Japan', '432': 'Japan', '440': 'South Korea', '441': 'South Korea',
  '477': 'Hong Kong', '538': 'Marshall Islands', '566': 'Singapore',
  '636': 'Liberia', '710': 'Brazil',
};

// Trigger a fresh AIS collection and populate discoveredShips
async function triggerCollection(): Promise<void> {
  const AISSTREAM_API_KEY = process.env.AISSTREAM_API_KEY ?? '78c39db66176103aa332f8e22283099019eddc3e';

  return new Promise((resolve) => {
    const sockets: WebSocket[] = [];
    let done = false;

    const deadline = setTimeout(() => {
      if (!done) {
        done = true;
        sockets.forEach((ws) => { try { ws.close(); } catch { /* ignore */ } });
        resolve();
      }
    }, 10_000);

    for (const box of BOUNDING_BOXES) {
      let ws: WebSocket;
      try { ws = new WebSocket('wss://stream.aisstream.io/v0/stream'); } catch { continue; }
      sockets.push(ws);

      ws.on('open', () => {
        ws.send(JSON.stringify({
          APIKey: AISSTREAM_API_KEY,
          BoundingBoxes: [[box.start, box.end]],
          FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
        }));
      });

      ws.on('message', (raw: Buffer | string) => {
        if (done) return;
        let msg: Record<string, unknown>;
        try { msg = JSON.parse(raw.toString()); } catch { return; }

        const meta = msg.MetaData as Record<string, unknown> | undefined;
        if (!meta) return;

        const mmsiStr = String(meta.MMSI_String ?? meta.MMSI ?? '');
        if (!mmsiStr) return;

        const shipName = String(meta.ShipName ?? '').trim();
        const lat = (meta.latitude as number | undefined) ??
          ((msg.Message as Record<string, unknown> | undefined)?.PositionReport as Record<string, unknown> | undefined)?.Latitude as number | undefined ??
          ((msg.Message as Record<string, unknown> | undefined)?.ShipStaticData as Record<string, unknown> | undefined)?.Latitude as number | undefined;
        const lng = (meta.longitude as number | undefined) ??
          ((msg.Message as Record<string, unknown> | undefined)?.PositionReport as Record<string, unknown> | undefined)?.Longitude as number | undefined ??
          ((msg.Message as Record<string, unknown> | undefined)?.ShipStaticData as Record<string, unknown> | undefined)?.Longitude as number | undefined;

        if (!lat || !lng) return;

        const posReport = ((msg.Message as Record<string, unknown> | undefined)?.PositionReport as Record<string, unknown> | undefined);
        const staticData = ((msg.Message as Record<string, unknown> | undefined)?.ShipStaticData as Record<string, unknown> | undefined);
        const shipType = (staticData?.ShipType as number | undefined) ?? 0;
        const speed = (posReport?.SpeedOverGround as number | undefined) ?? 0;
        const finalSpeed = speed >= 102 ? 0 : Math.round(speed * 10) / 10;
        const heading = (posReport?.TrueHeading as number | undefined) ?? 0;
        const flag = MID[mmsiStr.substring(0, 3)] ?? 'Unknown';
        const now = (meta.time_utc as string | undefined) ?? new Date().toISOString();

        const existing = discoveredShips.get(mmsiStr);
        if (!existing) {
          discoveredShips.set(mmsiStr, {
            mmsi: mmsiStr,
            ship_name: shipName || `MMSI ${mmsiStr}`,
            ship_type: shipType,
            lat: Math.round(lat * 10000) / 10000,
            lng: Math.round(lng * 10000) / 10000,
            speed: finalSpeed,
            heading: heading === 511 ? 0 : heading,
            flag,
            first_seen: now,
            last_seen: now,
            position_count: 1,
          });
        } else {
          discoveredShips.set(mmsiStr, {
            ...existing,
            ship_name: shipName || existing.ship_name,
            ship_type: shipType || existing.ship_type,
            lat: Math.round(lat * 10000) / 10000,
            lng: Math.round(lng * 10000) / 10000,
            speed: finalSpeed,
            heading: heading === 511 ? 0 : (heading || existing.heading),
            last_seen: now,
            position_count: existing.position_count + 1,
          });
        }
      });

      ws.on('error', () => { /* ignore */ });
    }

    if (sockets.length === 0) {
      done = true;
      clearTimeout(deadline);
      resolve();
    }
  });
}

// Convert discovered ships to AisShipPosition format, filtered by sector
function buildPositionsForSector(sector: ReturnType<typeof getSector>): (AisShipPosition & { shipType: number; flag: string })[] {
  const results: (AisShipPosition & { shipType: number; flag: string })[] = [];

  for (const ship of discoveredShips.values()) {
    // Filter by ship type — but ships with type 0 (unknown, no static data yet) are always included
    if (sector.shipTypes.length > 0 && ship.ship_type !== 0 && !sector.shipTypes.includes(ship.ship_type)) continue;

    const status: AisShipPosition['status'] = ship.speed > 0.5 ? 'underway' : 'moored';

    results.push({
      imo: '',
      mmsi: ship.mmsi,
      name: ship.ship_name,
      lat: ship.lat,
      lng: ship.lng,
      heading: ship.heading,
      speed: ship.speed,
      status,
      destination: 'Unknown',
      lastUpdate: ship.last_seen,
      source: 'live',
      shipType: ship.ship_type,
      flag: ship.flag,
    });
  }

  // Sort by position_count desc (most active ships first)
  return results.sort((a, b) => {
    const da = discoveredShips.get(a.mmsi);
    const db = discoveredShips.get(b.mmsi);
    return (db?.position_count ?? 0) - (da?.position_count ?? 0);
  });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const sectorId = (req.nextUrl.searchParams.get('sector') ?? 'cargo') as SectorId;
  const sector = getSector(sectorId);

  if (sector.vesselSource === 'watchlist') {
    return NextResponse.json({ error: 'Use /api/fleet/positions for watchlist sectors' }, { status: 400 });
  }

  // Check cache
  const cached = sectorCaches.get(sectorId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({
      data: cached.data,
      total: cached.data.length,
      sector: sectorId,
      isLive: true,
      cachedAgeSeconds: Math.floor((Date.now() - cached.ts) / 1000),
    });
  }

  // If the discovery store is empty, trigger a collection
  if (discoveredShips.size === 0) {
    try {
      await triggerCollection();
    } catch {
      // Return empty rather than crash
    }
  }

  const positions = buildPositionsForSector(sector);

  // Supplement with vessel_profiles seed data when AIS returns fewer than 30 ships
  if (positions.length < 30) {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      // PostgREST OR filter syntax: comma-separated within the same param key
      const typeFilters: Record<string, string> = {
        cargo:          'vessel_type=ilike.*cargo*&vessel_type=ilike.*container*&vessel_type=ilike.*bulk*',
        tanker:         'vessel_type=ilike.*tanker*&vessel_type=ilike.*lng*&vessel_type=ilike.*lpg*',
        passenger:      'vessel_type=ilike.*passenger*&vessel_type=ilike.*ropax*&vessel_type=ilike.*ferry*',
        offshore:       'vessel_type=ilike.*offshore*&vessel_type=ilike.*supply*&vessel_type=ilike.*anchor*&vessel_type=ilike.*cable*',
        'port-authority': 'vessel_type=ilike.*tug*&vessel_type=ilike.*pilot*',
      };

      const filterClause = typeFilters[sectorId];
      if (filterClause) {
        try {
          // PostgREST OR queries use the `or` param: or=(col.ilike.val,col.ilike.val)
          const orParts: Record<string, string[]> = {
            cargo:          ['vessel_type.ilike.*cargo*', 'vessel_type.ilike.*container*', 'vessel_type.ilike.*bulk*'],
            tanker:         ['vessel_type.ilike.*tanker*', 'vessel_type.ilike.*lng*', 'vessel_type.ilike.*lpg*'],
            passenger:      ['vessel_type.ilike.*passenger*', 'vessel_type.ilike.*ropax*', 'vessel_type.ilike.*ferry*'],
            offshore:       ['vessel_type.ilike.*offshore*', 'vessel_type.ilike.*supply*', 'vessel_type.ilike.*anchor*', 'vessel_type.ilike.*cable*'],
            'port-authority': ['vessel_type.ilike.*tug*', 'vessel_type.ilike.*pilot*'],
          };

          const orParam = `or=(${(orParts[sectorId] ?? []).join(',')})`;
          const profileRes = await fetch(
            `${SUPABASE_URL}/rest/v1/vessel_profiles?select=imo,name,flag,vessel_type&${orParam}&limit=60`,
            {
              headers: {
                apikey: SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              },
            }
          );

          if (profileRes.ok) {
            const profileData: Array<{ imo: string; name: string; flag: string; vessel_type: string }> = await profileRes.json();
            const demoCoords = SECTOR_POSITIONS[sectorId] ?? SECTOR_POSITIONS.cargo;
            const mmsiSet = new Set(positions.map((p) => p.mmsi));

            profileData.forEach((vessel, idx) => {
              if (mmsiSet.has(vessel.imo)) return; // skip if already present from AIS
              const [lat, lng] = demoCoords[idx % demoCoords.length];
              const demoSpeed = 8 + (idx % 12);
              positions.push({
                imo:         vessel.imo,
                mmsi:        vessel.imo, // use IMO as MMSI key for seed ships
                name:        vessel.name,
                lat:         lat + (Math.sin(idx * 1.3) * 0.08),
                lng:         lng + (Math.cos(idx * 1.7) * 0.08),
                heading:     (idx * 37) % 360,
                speed:       demoSpeed,
                status:      'underway',
                destination: 'Various',
                lastUpdate:  new Date().toISOString(),
                source:      'db',
                shipType:    sector.shipTypes[0] ?? 70,
                flag:        vessel.flag,
              } as AisShipPosition & { shipType: number; flag: string });
            });
          }
        } catch {
          // ignore — fall through with whatever AIS data was collected
        }
      }
    }
  }

  sectorCaches.set(sectorId, { data: positions, ts: Date.now() });

  return NextResponse.json({
    data: positions,
    total: positions.length,
    sector: sectorId,
    isLive: discoveredShips.size > 0,
    cachedAgeSeconds: 0,
  });
}

export const maxDuration = 15;
