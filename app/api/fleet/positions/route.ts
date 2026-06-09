// ============================================================================
// Fleet Positions API — Real-time AIS data via AISStream.io
// ----------------------------------------------------------------------------
// - Opens server-side WebSocket connections to AISStream
// - Uses geographic bounding boxes covering all major cruise ship areas
// - Collects data for 10-15 seconds, then closes all connections
// - Matches incoming AIS messages against our cruise ship database by:
//     1. MMSI (exact) if we have the mapping
//     2. Ship name (case-insensitive fuzzy match)
// - Caches results for 5 minutes in module-level state (shared across requests)
// - Falls back to simulated data if AISStream is unavailable
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { CRUISE_SHIPS } from '@/lib/cruise-ships';
import { buildMmsiIndex } from '@/lib/ship-mmsi';
import WebSocket from 'ws';
// Passive collection store — shared in-memory
import { discoveredShips } from '../collect/route';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AisShipPosition {
  imo: string;
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: 'underway' | 'moored' | 'anchored';
  destination: string;
  lastUpdate: string;
  source: 'live' | 'simulated';
}

// AISStream message shape (partial — only fields we need)
interface AisMessage {
  MessageType: string;
  MetaData?: {
    MMSI?: number;
    ShipName?: string;
    latitude?: number;
    longitude?: number;
    time_utc?: string;
    MMSI_String?: string;
  };
  Message?: {
    PositionReport?: {
      Latitude?: number;
      Longitude?: number;
      TrueHeading?: number;
      SpeedOverGround?: number;
      NavigationalStatus?: number;
      Destination?: string;
    };
    ShipStaticData?: {
      ImoNumber?: number;
      Destination?: string;
      Name?: string;
      Latitude?: number;
      Longitude?: number;
    };
  };
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface PositionCache {
  positions: AisShipPosition[];
  fetchedAt: number;   // Date.now()
  isLive: boolean;
}

// Module-level cache (persists between requests within a single server instance)
let cache: PositionCache | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes — keeps "live" feel

// Bounding boxes: [[minLat, minLng], [maxLat, maxLng]]
// AISStream format: { start: [minLat, minLng], end: [maxLat, maxLng] }
const BOUNDING_BOXES = [
  { name: 'Mediterranean',   start: [30, -10] as [number, number], end: [48, 40]  as [number, number] },
  { name: 'Caribbean',       start: [10, -90] as [number, number], end: [28, -58] as [number, number] },
  { name: 'Northern Europe', start: [48, -15] as [number, number], end: [62, 15]  as [number, number] },
  { name: 'Asia Pacific',    start: [-10, 95] as [number, number], end: [40, 145] as [number, number] },
  { name: 'Atlantic',        start: [0, -80]  as [number, number], end: [55, -5]  as [number, number] },
];

// AIS navigational status → our status
function mapNavStatus(navStatus: number | undefined): AisShipPosition['status'] {
  if (navStatus === undefined) return 'underway';
  // 0 = underway using engine, 8 = underway under sail
  if (navStatus === 0 || navStatus === 8) return 'underway';
  // 1 = at anchor, 3 = not under command (treat as anchored)
  if (navStatus === 1 || navStatus === 3) return 'anchored';
  // 5 = moored
  if (navStatus === 5) return 'moored';
  // Default: treat any moving ship as underway
  return navStatus <= 2 ? 'underway' : 'moored';
}

// Normalise a ship name for fuzzy matching (uppercase, strip punctuation/spaces)
function normaliseName(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// ---------------------------------------------------------------------------
// Lookup indexes (built once)
// ---------------------------------------------------------------------------

const mmsiIndex = buildMmsiIndex(CRUISE_SHIPS);

// Name index: normalisedName → CruiseShip
const nameIndex = new Map(
  CRUISE_SHIPS.map((s) => [normaliseName(s.name), s])
);

// ---------------------------------------------------------------------------
// Core: fetch live positions from AISStream
// ---------------------------------------------------------------------------

async function fetchLivePositions(): Promise<AisShipPosition[]> {
  const AISSTREAM_API_KEY =
    // TODO: rotate + remove once AISSTREAM_API_KEY is set in env
    process.env.AISSTREAM_API_KEY ?? '78c39db66176103aa332f8e22283099019eddc3e';

  const collected = new Map<string, AisShipPosition>(); // keyed by MMSI

  return new Promise((resolve) => {
    const sockets: WebSocket[] = [];
    let settled = false;

    // Hard deadline: close everything and return after 8 seconds (fits Vercel Hobby 10s limit)
    const deadline = setTimeout(() => {
      if (!settled) {
        settled = true;
        sockets.forEach((ws) => { try { ws.close(); } catch { /* ignore */ } });
        resolve([...collected.values()]);
      }
    }, 8_000);

    // Check if we have enough matches to resolve early
    function checkEarlyResolve() {
      if (settled) return;
      // Resolve early once we have matched at least 10 ships
      if (collected.size >= 10) {
        settled = true;
        clearTimeout(deadline);
        sockets.forEach((ws) => { try { ws.close(); } catch { /* ignore */ } });
        resolve([...collected.values()]);
      }
    }

    // Open one WebSocket per bounding box to spread the load
    for (const box of BOUNDING_BOXES) {
      let ws: WebSocket;
      try {
        ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
      } catch {
        continue; // skip if WebSocket construction fails
      }

      sockets.push(ws);

      ws.on('open', () => {
        const sub = {
          APIKey: AISSTREAM_API_KEY,
          BoundingBoxes: [[box.start, box.end]],
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
        if (!mmsiStr) return;

        const shipName = (meta.ShipName ?? '').trim();
        const lat = meta.latitude ?? msg.Message?.PositionReport?.Latitude ?? msg.Message?.ShipStaticData?.Latitude;
        const lng = meta.longitude ?? msg.Message?.PositionReport?.Longitude ?? msg.Message?.ShipStaticData?.Longitude;

        if (!lat || !lng) return;

        // Passively collect ALL ships seen into the discovery store
        {
          const now = meta.time_utc ?? new Date().toISOString();
          const posReport = msg.Message?.PositionReport;
          const staticData = msg.Message?.ShipStaticData;
          const rawSpeed = posReport?.SpeedOverGround ?? 0;
          const speed = rawSpeed >= 102 ? 0 : Math.round(rawSpeed * 10) / 10;
          const heading = posReport?.TrueHeading ?? 0;
          const finalHeading = heading === 511 ? 0 : heading;
          const shipType = staticData?.ShipType ?? 0;
          const mid = mmsiStr.substring(0, 3);
          // Inline MID lookup (keep it simple — avoid circular imports)
          const MID: Record<string, string> = {
            '211': 'Germany', '232': 'UK', '233': 'UK', '235': 'UK',
            '244': 'Netherlands', '245': 'Netherlands',
            '247': 'Italy', '255': 'Portugal', '257': 'Norway',
            '265': 'Sweden', '266': 'Sweden', '271': 'Turkey',
            '273': 'Russia', '279': 'Russia',
            '303': 'USA', '338': 'USA', '366': 'USA', '367': 'USA',
            '316': 'Canada', '319': 'Cayman Islands',
            '351': 'Panama', '352': 'Panama', '353': 'Panama',
            '431': 'Japan', '432': 'Japan',
            '440': 'South Korea', '441': 'South Korea',
            '477': 'Hong Kong', '538': 'Marshall Islands',
            '557': 'Marshall Islands', '566': 'Singapore',
            '636': 'Liberia', '710': 'Brazil',
          };
          const flag = MID[mid] ?? 'Unknown';

          const existing = discoveredShips.get(mmsiStr);
          if (!existing) {
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
          } else {
            discoveredShips.set(mmsiStr, {
              ...existing,
              ship_name: (shipName || existing.ship_name),
              ship_type: shipType || existing.ship_type,
              lat: Math.round(lat * 10000) / 10000,
              lng: Math.round(lng * 10000) / 10000,
              speed,
              heading: finalHeading,
              last_seen: now,
              position_count: existing.position_count + 1,
            });
          }
        }

        // Try to match against our cruise ship database
        let matchedShip = mmsiIndex.get(mmsiStr);
        if (!matchedShip && shipName) {
          matchedShip = nameIndex.get(normaliseName(shipName));
        }

        // Discard if not one of our 331 ships
        if (!matchedShip) return;

        // Already have a recent position for this ship
        if (collected.has(mmsiStr)) return;

        const posReport = msg.Message?.PositionReport;
        const staticData = msg.Message?.ShipStaticData;

        const heading = posReport?.TrueHeading ?? 0;
        const speed = Math.round((posReport?.SpeedOverGround ?? 0) * 10) / 10;
        const navStatus = posReport?.NavigationalStatus;
        const destination =
          (posReport?.Destination ?? staticData?.Destination ?? '').trim() || 'Unknown';

        // AIS occasionally reports 511 for "heading not available"
        const finalHeading = heading === 511 ? 0 : heading;

        // Speed 102.3 means "not available" in AIS
        const finalSpeed = speed >= 102 ? 0 : speed;

        const status = finalSpeed > 0.5
          ? 'underway'
          : mapNavStatus(navStatus);

        const imoNumber = staticData?.ImoNumber
          ? String(staticData.ImoNumber)
          : matchedShip.imo;

        collected.set(mmsiStr, {
          imo: imoNumber,
          mmsi: mmsiStr,
          name: matchedShip.name,
          lat: Math.round(lat * 10000) / 10000,
          lng: Math.round(lng * 10000) / 10000,
          heading: finalHeading,
          speed: finalSpeed,
          status,
          destination,
          lastUpdate: meta.time_utc ?? new Date().toISOString(),
          source: 'live',
        });

        checkEarlyResolve();
      });

      ws.on('error', () => {
        // Swallow individual socket errors; deadline will clean up
      });

      ws.on('close', () => {
        // Nothing to do — deadline handles final resolution
      });
    }

    // If WebSocket constructor threw for all boxes, resolve immediately
    if (sockets.length === 0) {
      settled = true;
      clearTimeout(deadline);
      resolve([]);
    }
  });
}

// ---------------------------------------------------------------------------
// Simulated fallback (re-uses logic from old positions route)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Known ocean waypoints for simulated positions — all verified water locations
// Each waypoint is a lat/lng with a spread radius (degrees) and a weight.
// Waypoints cover major cruise routes and are all mid-ocean or in confirmed
// navigable water near ports. None are on land.
// ---------------------------------------------------------------------------

interface OceanWaypoint {
  lat: number;
  lng: number;
  spreadLat: number;   // random spread ± degrees latitude
  spreadLng: number;   // random spread ± degrees longitude
  weight: number;
  destination: string; // likely destination port from this area
}

const OCEAN_WAYPOINTS: OceanWaypoint[] = [
  // Mediterranean — open water between Balearics and Sardinia
  { lat: 39.0, lng:  6.0, spreadLat: 1.0, spreadLng: 2.0,  weight: 12, destination: 'Barcelona' },
  // Mediterranean — Tyrrhenian Sea (center, far from any coast)
  { lat: 39.5, lng: 12.0, spreadLat: 1.0, spreadLng: 1.5,  weight: 10, destination: 'Civitavecchia' },
  // Mediterranean — Ionian Sea (open water south of Greece)
  { lat: 36.5, lng: 18.0, spreadLat: 1.0, spreadLng: 1.5,  weight: 8,  destination: 'Piraeus' },
  // Mediterranean — eastern basin (open water south of Cyprus)
  { lat: 33.5, lng: 31.0, spreadLat: 0.8, spreadLng: 1.5,  weight: 5,  destination: 'Limassol' },
  // Caribbean — open waters between islands
  { lat: 17.0, lng:-64.0, spreadLat: 1.5, spreadLng: 3.0,  weight: 14, destination: 'St. Thomas' },
  // Caribbean — open sea south of Cuba
  { lat: 19.0, lng:-78.0, spreadLat: 1.2, spreadLng: 2.5,  weight: 8,  destination: 'Nassau' },
  // Caribbean — Florida Strait
  { lat: 25.0, lng:-80.5, spreadLat: 1.0, spreadLng: 1.5,  weight: 6,  destination: 'Miami' },
  // North Atlantic — open ocean west of Biscay
  { lat: 47.0, lng:-10.0, spreadLat: 1.5, spreadLng: 2.0,  weight: 8,  destination: 'Southampton' },
  // North Sea — center (far from UK and continental coasts)
  { lat: 56.0, lng:  3.0, spreadLat: 1.0, spreadLng: 1.5,  weight: 6,  destination: 'Amsterdam' },
  // Norwegian Sea — open water off coast
  { lat: 63.0, lng:  4.0, spreadLat: 0.8, spreadLng: 1.0,  weight: 5,  destination: 'Bergen' },
  // Baltic Sea — center (open water)
  { lat: 58.0, lng: 20.0, spreadLat: 0.8, spreadLng: 1.5,  weight: 4,  destination: 'Stockholm' },
  // South China Sea — deep open water
  { lat: 12.0, lng:113.0, spreadLat: 2.0, spreadLng: 3.0,  weight: 6,  destination: 'Singapore' },
  // Strait of Malacca — open shipping lane
  { lat:  3.0, lng:102.5, spreadLat: 0.8, spreadLng: 1.5,  weight: 4,  destination: 'Singapore' },
  // Japan — Pacific open water east of coast
  { lat: 33.0, lng:137.0, spreadLat: 1.5, spreadLng: 2.0,  weight: 4,  destination: 'Tokyo' },
  // Mid-Atlantic — central ocean (Azores area)
  { lat: 38.5, lng:-27.0, spreadLat: 2.0, spreadLng: 3.0,  weight: 5,  destination: 'Funchal' },
  // Indian Ocean — open water
  { lat:  3.0, lng: 72.0, spreadLat: 1.5, spreadLng: 2.5,  weight: 3,  destination: 'Dubai' },
  // Alaska — open water in Gulf of Alaska
  { lat: 57.0, lng:-140.0,spreadLat: 1.0, spreadLng: 1.5,  weight: 4,  destination: 'Juneau' },
  // Southern Caribbean — open water south of Aruba
  { lat: 12.0, lng:-69.0, spreadLat: 0.8, spreadLng: 1.2,  weight: 5,  destination: 'Willemstad' },
  // South America — deep Pacific off Chile
  { lat:-35.0, lng:-78.0, spreadLat: 1.5, spreadLng: 2.0,  weight: 2,  destination: 'Valparaiso' },
  // Australia — Coral Sea open water
  { lat:-22.0, lng:155.0, spreadLat: 1.5, spreadLng: 2.0,  weight: 2,  destination: 'Sydney' },
];

const DESTINATION_PORTS = [
  'Rotterdam','Amsterdam','Piraeus','Barcelona','Civitavecchia',
  'Marseille','Genoa','Venice','Naples','Dubrovnik',
  'Miami','Fort Lauderdale','Nassau','St. Thomas','St. Maarten',
  'Southampton','Hamburg','Copenhagen','Stockholm','Helsinki',
  'Oslo','Bergen','Geiranger','Singapore','Hong Kong',
  'Tokyo','Shanghai','Sydney','Vancouver','Juneau',
  'Dubai','Abu Dhabi','Buenos Aires','Ushuaia','Valparaiso',
  'Funchal','Tenerife','Limassol','Willemstad','Bridgetown',
];

function seeded(imo: string, offset: number): number {
  const seed = parseInt(imo.replace(/\D/g, '')) + offset;
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function buildSimulated(): AisShipPosition[] {
  const now = new Date();
  const nowIso = now.toISOString();

  // Time-bucket: advance ships every 2 minutes so positions drift realistically.
  // Each bucket = 2 minutes of simulated travel at the ship's heading + speed.
  const timeBucketMinutes = Math.floor(now.getTime() / (2 * 60 * 1000));

  const totalWeight = OCEAN_WAYPOINTS.reduce((a, w) => a + w.weight, 0);

  return CRUISE_SHIPS.map((ship) => {
    // Pick a weighted waypoint deterministically from the ship's IMO
    const r = seeded(ship.imo, 1) * totalWeight;
    let cum = 0;
    let waypoint = OCEAN_WAYPOINTS[0];
    for (const wp of OCEAN_WAYPOINTS) {
      cum += wp.weight;
      if (r <= cum) { waypoint = wp; break; }
    }

    // Base position scattered within the waypoint's spread radius
    const latOffset = (seeded(ship.imo, 2) * 2 - 1) * waypoint.spreadLat;
    const lngOffset = (seeded(ship.imo, 3) * 2 - 1) * waypoint.spreadLng;
    const baseLat = waypoint.lat + latOffset;
    const baseLng = waypoint.lng + lngOffset;

    const heading = Math.floor(seeded(ship.imo, 4) * 360);
    const roll = seeded(ship.imo, 5);
    const status: AisShipPosition['status'] =
      roll < 0.60 ? 'underway' : roll < 0.90 ? 'moored' : 'anchored';
    const speed = status === 'underway'
      ? Math.round((8 + seeded(ship.imo, 6) * 15) * 10) / 10
      : 0;

    // Apply time-based drift for underway ships:
    // speed is in knots → degrees/minute ≈ speed / 60 / 60 (very roughly at equator)
    // We apply along heading direction so ships move realistically between refreshes.
    let lat = baseLat;
    let lng = baseLng;

    if (status === 'underway') {
      // Distance per 2-minute bucket in degrees (1 deg lat ≈ 60 nm)
      const degPerBucket = (speed * 2) / (60 * 60); // knots × 2 min / (60 nm/deg × 60 min/h)
      const headingRad = (heading * Math.PI) / 180;
      // Accumulate drift over time buckets — modular so ships stay in their region
      const bucketFraction = (timeBucketMinutes * 7 + parseInt(ship.imo.slice(-3))) % 2000;
      lat = baseLat + Math.sin(headingRad) * degPerBucket * bucketFraction;
      lng = baseLng + Math.cos(headingRad) * degPerBucket * bucketFraction;

      // Clamp within waypoint bounds so ships don't wander to land
      lat = Math.max(waypoint.lat - waypoint.spreadLat, Math.min(waypoint.lat + waypoint.spreadLat, lat));
      lng = Math.max(waypoint.lng - waypoint.spreadLng, Math.min(waypoint.lng + waypoint.spreadLng, lng));
    }

    // Pick destination: prefer the waypoint's own port, occasionally pick a random one
    const destRoll = seeded(ship.imo, 7);
    const destination = destRoll < 0.55
      ? waypoint.destination
      : DESTINATION_PORTS[Math.floor(seeded(ship.imo, 8) * DESTINATION_PORTS.length)];

    return {
      imo: ship.imo,
      mmsi: ship.mmsi || '',
      name: ship.name,
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      heading,
      speed,
      status,
      destination,
      lastUpdate: nowIso,
      source: 'simulated' as const,
    };
  });
}

// ---------------------------------------------------------------------------
// Read collected positions from the Marifest Supabase (filled by the AIS
// collector every ~6h). Fast + reliable — no serverless WebSocket needed.
// ---------------------------------------------------------------------------
const MARIFEST_SUPA_URL = process.env.MARIFEST_SUPABASE_URL || 'https://bwegtwleqyfuyfkaluki.supabase.co';
const MARIFEST_SUPA_KEY = process.env.MARIFEST_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZWd0d2xlcXlmdXlma2FsdWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTM5MzUsImV4cCI6MjA5NjU2OTkzNX0.aH47GDjg_EZz3eRWXeB8TC3T5deBfZkSpxxoDLRU2EE';

async function fetchFromSupabase(): Promise<AisShipPosition[]> {
  try {
    const res = await fetch(
      `${MARIFEST_SUPA_URL}/rest/v1/vessel_positions?select=mmsi,imo,name,lat,lng,heading,speed,status,destination,updated_at`,
      { headers: { apikey: MARIFEST_SUPA_KEY, Authorization: `Bearer ${MARIFEST_SUPA_KEY}` }, cache: 'no-store' }
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{
      mmsi: string; imo: string; name: string; lat: number; lng: number;
      heading: number; speed: number; status: string; destination: string | null; updated_at: string;
    }>;
    return rows
      .filter((r) => r.imo && typeof r.lat === 'number' && typeof r.lng === 'number')
      .map((r) => ({
        imo: r.imo, mmsi: r.mmsi, name: r.name,
        lat: r.lat, lng: r.lng, heading: r.heading ?? 0, speed: r.speed ?? 0,
        status: (r.status as AisShipPosition['status']) ?? 'underway',
        destination: r.destination ?? 'Unknown',
        lastUpdate: r.updated_at, source: 'live' as const,
      }));
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

// Public CORS — Marifest is a public ship database; positions are open data
// (auth + rate-limits arrive with paid accounts). Lets the mobile-web/PWA app
// fetch positions cross-origin without a session cookie.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_req: NextRequest) {
  // Serve from cache if still fresh
  if (cache && (Date.now() - cache.fetchedAt) < CACHE_TTL_MS) {
    const ageSeconds = Math.floor((Date.now() - cache.fetchedAt) / 1000);
    return NextResponse.json({
      data: cache.positions,
      total: cache.positions.length,
      isLive: cache.isLive,
      cachedAgeSeconds: ageSeconds,
      fetchedAt: new Date(cache.fetchedAt).toISOString(),
    }, { headers: CORS });
  }

  // Try live AIS data
  let positions: AisShipPosition[] = [];
  let isLive = false;

  try {
    const live = await fetchFromSupabase();

    if (live.length > 0) {
      // For any ships NOT found in live data, fill in with simulated positions
      const liveImos = new Set(live.map((p) => p.imo));
      const simulated = buildSimulated().filter((p) => !liveImos.has(p.imo));
      positions = [...live, ...simulated];
      isLive = true;
    } else {
      positions = buildSimulated();
      isLive = false;
    }
  } catch {
    positions = buildSimulated();
    isLive = false;
  }

  // Update cache
  cache = {
    positions,
    fetchedAt: Date.now(),
    isLive,
  };

  return NextResponse.json({
    data: positions,
    total: positions.length,
    isLive,
    cachedAgeSeconds: 0,
    fetchedAt: new Date(cache.fetchedAt).toISOString(),
  }, { headers: CORS });
}

// Allow longer execution for WebSocket collection (Vercel Pro: up to 60s)
export const maxDuration = 15;
