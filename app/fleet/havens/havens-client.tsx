'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AisShipPosition } from '@/app/api/fleet/positions/route';
import { STATUS_COLORS, STATUS_BG, NAVY_PALETTE } from '../fleet-utils';
import { useFleetLanguage } from '@/lib/fleet-i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Port {
  id: string;
  name: string;
  country: string;
  region: Region;
  lat: number;
  lng: number;
}

type Region =
  | 'Mediterranean'
  | 'Caribbean'
  | 'Northern Europe'
  | 'Asia-Pacific'
  | 'Americas';

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Major cruise ports — 54 ports across all regions
// ---------------------------------------------------------------------------

const MAJOR_PORTS: Port[] = [
  // Mediterranean
  { id: 'barcelona', name: 'Barcelona', country: 'Spain', region: 'Mediterranean', lat: 41.3502, lng: 2.1736 },
  { id: 'civitavecchia', name: 'Civitavecchia', country: 'Italy', region: 'Mediterranean', lat: 42.0941, lng: 11.7961 },
  { id: 'piraeus', name: 'Piraeus', country: 'Greece', region: 'Mediterranean', lat: 37.9474, lng: 23.6405 },
  { id: 'marseille', name: 'Marseille', country: 'France', region: 'Mediterranean', lat: 43.2965, lng: 5.3698 },
  { id: 'genoa', name: 'Genoa', country: 'Italy', region: 'Mediterranean', lat: 44.4048, lng: 8.9445 },
  { id: 'naples', name: 'Naples', country: 'Italy', region: 'Mediterranean', lat: 40.8358, lng: 14.2488 },
  { id: 'dubrovnik', name: 'Dubrovnik', country: 'Croatia', region: 'Mediterranean', lat: 42.6507, lng: 18.0944 },
  { id: 'venice', name: 'Venice', country: 'Italy', region: 'Mediterranean', lat: 45.4408, lng: 12.3155 },
  { id: 'palma', name: 'Palma de Mallorca', country: 'Spain', region: 'Mediterranean', lat: 39.5697, lng: 2.6502 },
  { id: 'valletta', name: 'Valletta', country: 'Malta', region: 'Mediterranean', lat: 35.8997, lng: 14.5147 },
  { id: 'santorini', name: 'Santorini', country: 'Greece', region: 'Mediterranean', lat: 36.3932, lng: 25.4615 },
  { id: 'kusadasi', name: 'Kusadasi', country: 'Turkey', region: 'Mediterranean', lat: 37.8581, lng: 27.2588 },
  { id: 'limassol', name: 'Limassol', country: 'Cyprus', region: 'Mediterranean', lat: 34.6823, lng: 33.0464 },
  { id: 'alexandria', name: 'Alexandria', country: 'Egypt', region: 'Mediterranean', lat: 31.2001, lng: 29.9187 },

  // Caribbean
  { id: 'miami', name: 'Miami', country: 'USA', region: 'Caribbean', lat: 25.7741, lng: -80.1975 },
  { id: 'fortlauderdale', name: 'Fort Lauderdale', country: 'USA', region: 'Caribbean', lat: 26.1018, lng: -80.1129 },
  { id: 'portcanaveral', name: 'Port Canaveral', country: 'USA', region: 'Caribbean', lat: 28.4167, lng: -80.6167 },
  { id: 'nassau', name: 'Nassau', country: 'Bahamas', region: 'Caribbean', lat: 25.0780, lng: -77.3376 },
  { id: 'sanjuan', name: 'San Juan', country: 'Puerto Rico', region: 'Caribbean', lat: 18.4655, lng: -66.1057 },
  { id: 'stthomas', name: 'St. Thomas', country: 'USVI', region: 'Caribbean', lat: 18.3426, lng: -64.9307 },
  { id: 'stmaarten', name: 'St. Maarten', country: 'NL/France', region: 'Caribbean', lat: 18.0255, lng: -63.0521 },
  { id: 'cozumel', name: 'Cozumel', country: 'Mexico', region: 'Caribbean', lat: 20.5088, lng: -86.9468 },
  { id: 'willemstad', name: 'Willemstad', country: 'Curaçao', region: 'Caribbean', lat: 12.1224, lng: -68.8824 },
  { id: 'bridgetown', name: 'Bridgetown', country: 'Barbados', region: 'Caribbean', lat: 13.0969, lng: -59.6145 },
  { id: 'kingston', name: 'Kingston', country: 'Jamaica', region: 'Caribbean', lat: 17.9713, lng: -76.7929 },

  // Northern Europe
  { id: 'rotterdam', name: 'Rotterdam', country: 'Netherlands', region: 'Northern Europe', lat: 51.9225, lng: 4.4792 },
  { id: 'southampton', name: 'Southampton', country: 'UK', region: 'Northern Europe', lat: 50.9048, lng: -1.4044 },
  { id: 'hamburg', name: 'Hamburg', country: 'Germany', region: 'Northern Europe', lat: 53.5462, lng: 9.9762 },
  { id: 'copenhagen', name: 'Copenhagen', country: 'Denmark', region: 'Northern Europe', lat: 55.6802, lng: 12.5934 },
  { id: 'stockholm', name: 'Stockholm', country: 'Sweden', region: 'Northern Europe', lat: 59.3293, lng: 18.0686 },
  { id: 'oslo', name: 'Oslo', country: 'Norway', region: 'Northern Europe', lat: 59.9139, lng: 10.7522 },
  { id: 'bergen', name: 'Bergen', country: 'Norway', region: 'Northern Europe', lat: 60.3929, lng: 5.3241 },
  { id: 'geiranger', name: 'Geiranger', country: 'Norway', region: 'Northern Europe', lat: 62.1005, lng: 7.2061 },
  { id: 'helsinki', name: 'Helsinki', country: 'Finland', region: 'Northern Europe', lat: 60.1699, lng: 24.9384 },
  { id: 'tallinn', name: 'Tallinn', country: 'Estonia', region: 'Northern Europe', lat: 59.4370, lng: 24.7536 },

  // Asia Pacific
  { id: 'singapore', name: 'Singapore', country: 'Singapore', region: 'Asia-Pacific', lat: 1.2653, lng: 103.8201 },
  { id: 'hongkong', name: 'Hong Kong', country: 'China', region: 'Asia-Pacific', lat: 22.3049, lng: 114.1694 },
  { id: 'yokohama', name: 'Yokohama', country: 'Japan', region: 'Asia-Pacific', lat: 35.4494, lng: 139.6421 },
  { id: 'sydney', name: 'Sydney', country: 'Australia', region: 'Asia-Pacific', lat: -33.8688, lng: 151.2093 },
  { id: 'melbourne', name: 'Melbourne', country: 'Australia', region: 'Asia-Pacific', lat: -37.8136, lng: 144.9631 },
  { id: 'bali', name: 'Bali (Benoa)', country: 'Indonesia', region: 'Asia-Pacific', lat: -8.7396, lng: 115.2144 },
  { id: 'shanghai', name: 'Shanghai', country: 'China', region: 'Asia-Pacific', lat: 31.2304, lng: 121.4737 },
  { id: 'busan', name: 'Busan', country: 'South Korea', region: 'Asia-Pacific', lat: 35.1796, lng: 129.0756 },

  // Americas / Other
  { id: 'vancouver', name: 'Vancouver', country: 'Canada', region: 'Americas', lat: 49.2827, lng: -123.1207 },
  { id: 'juneau', name: 'Juneau', country: 'USA', region: 'Americas', lat: 58.3005, lng: -134.4197 },
  { id: 'valparaiso', name: 'Valparaíso', country: 'Chile', region: 'Americas', lat: -33.0472, lng: -71.6127 },
  { id: 'buenosaires', name: 'Buenos Aires', country: 'Argentina', region: 'Americas', lat: -34.6037, lng: -58.3816 },
  { id: 'dubai', name: 'Dubai', country: 'UAE', region: 'Americas', lat: 25.2048, lng: 55.2708 },
  { id: 'muscat', name: 'Muscat', country: 'Oman', region: 'Americas', lat: 23.5880, lng: 58.3829 },
];

const ALL_REGIONS: Region[] = ['Mediterranean', 'Caribbean', 'Northern Europe', 'Asia-Pacific', 'Americas'];

// Navy-ramp palette per region (no cyan/violet/orange rainbow)
const REGION_COLORS: Record<Region, string> = {
  'Mediterranean': NAVY_PALETTE[0],   // #0F2A47
  'Caribbean':     NAVY_PALETTE[2],   // #2A5685
  'Northern Europe': NAVY_PALETTE[4], // #4E84B8
  'Asia-Pacific':  NAVY_PALETTE[6],   // #88B2D8
  'Americas':      NAVY_PALETTE[8],   // #24507E
};

const AT_PORT_RADIUS_KM = 30;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="fl-card animate-pulse" style={{ borderRadius: 'var(--r-lg)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-4 w-32 rounded mb-1.5" style={{ background: 'var(--brand-soft-2)' }} />
          <div className="h-3 w-20 rounded" style={{ background: 'var(--brand-soft)' }} />
        </div>
        <div className="h-6 w-8 rounded-full" style={{ background: 'var(--brand-soft)' }} />
      </div>
      <div className="space-y-1.5">
        {[1, 2].map((i) => (
          <div key={i} className="h-8 rounded-lg" style={{ background: 'var(--line)' }} />
        ))}
      </div>
    </div>
  );
}

interface ShipRowProps {
  ship: AisShipPosition;
}

function ShipRow({ ship }: ShipRowProps) {
  const color = STATUS_COLORS[ship.status] ?? 'var(--muted)';
  const bg = STATUS_BG[ship.status] ?? 'var(--brand-soft)';

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
      style={{ background: bg, border: `1px solid ${color}26` }}
    >
      {/* Status dot */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
      {/* Ship name */}
      <span
        className="text-xs font-medium truncate flex-1 fl-num"
        style={{ color: 'var(--ink)' }}
        title={ship.name}
      >
        {ship.name}
      </span>
      {/* Speed badge — only for underway */}
      {ship.status === 'underway' && ship.speed > 0 && (
        <span
          className="fl-badge fl-badge--ok fl-num"
          style={{ fontSize: 10.5 }}
        >
          {ship.speed.toFixed(1)} kn
        </span>
      )}
      {/* Status label for non-underway */}
      {ship.status !== 'underway' && (
        <span
          className="text-xs flex-shrink-0"
          style={{ color, fontWeight: 600 }}
        >
          {ship.status === 'moored' ? 'Moored' : 'Anchored'}
        </span>
      )}
    </div>
  );
}

interface PortCardProps {
  port: Port;
  ships: AisShipPosition[];
  expanded: boolean;
  onToggle: () => void;
}

function PortCard({ port, ships, expanded, onToggle }: PortCardProps) {
  const regionColor = REGION_COLORS[port.region];
  const hasShips = ships.length > 0;
  const PREVIEW_COUNT = 3;
  const previewShips = ships.slice(0, PREVIEW_COUNT);
  const remainingCount = ships.length - PREVIEW_COUNT;

  return (
    <div
      className={`fl-card fl-card--int overflow-hidden transition-all`}
      style={{ borderRadius: 'var(--r-lg)', borderColor: hasShips ? `${regionColor}40` : undefined }}
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3"
        style={{ cursor: 'pointer', background: 'transparent' }}
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* Region color stripe using navy-ramp bar */}
          <div
            className="flex-shrink-0 mt-0.5 rounded-full"
            style={{
              width: 4,
              height: 36,
              background: regionColor,
              opacity: hasShips ? 1 : 0.3,
            }}
          />
          <div className="min-w-0">
            <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--ink)' }}>
              {port.name}
            </div>
            <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
              <span>{port.country}</span>
              <span style={{ color: 'var(--muted)' }}>·</span>
              <span
                className="flex items-center gap-1"
                style={{ color: 'var(--muted)' }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: regionColor,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                {port.region}
              </span>
            </div>
            {/* Coordinates */}
            <div className="text-xs mt-0.5 fl-num" style={{ color: 'var(--muted-d)', fontSize: 10.5 }}>
              {port.lat.toFixed(2)}°, {port.lng.toFixed(2)}°
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Ship count badge */}
          {hasShips ? (
            <span
              className="fl-num"
              style={{
                fontFamily: 'var(--display)',
                fontWeight: 600,
                fontSize: 15,
                color: 'var(--navy)',
                minWidth: 24,
                textAlign: 'center',
                fontFeatureSettings: '"tnum"',
              }}
            >
              {ships.length}
            </span>
          ) : (
            <span
              className="fl-badge fl-badge--neu"
            >
              0
            </span>
          )}

          {/* Chevron */}
          <svg
            className="w-4 h-4 flex-shrink-0 transition-transform"
            style={{
              color: hasShips ? regionColor : 'var(--muted-d)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform .2s var(--ease)',
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Ship preview — always visible when ships present and not expanded */}
      {hasShips && !expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {previewShips.map((ship) => (
            <ShipRow key={ship.mmsi} ship={ship} />
          ))}
          {remainingCount > 0 && (
            <button
              onClick={onToggle}
              className="w-full text-xs py-1.5 rounded-lg text-center transition-colors"
              style={{
                color: 'var(--navy)',
                background: 'var(--brand-soft)',
                border: `1px dashed ${regionColor}50`,
                fontWeight: 600,
              }}
            >
              + {remainingCount} meer schip{remainingCount !== 1 ? 'en' : ''}
            </button>
          )}
        </div>
      )}

      {/* Expanded ship list */}
      {expanded && hasShips && (
        <div className="px-4 pb-4 space-y-1.5">
          <div
            className="text-xs font-medium mb-2 pb-2"
            style={{ color: 'var(--muted)', borderBottom: '1px solid var(--line-2)' }}
          >
            {ships.length} schip{ships.length !== 1 ? 'en' : ''} in haven
          </div>
          {ships.map((ship) => (
            <ShipRow key={ship.mmsi} ship={ship} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasShips && (
        <div className="px-4 pb-3">
          <div
            className="text-xs py-2 text-center rounded-lg"
            style={{
              color: 'var(--muted-d)',
              background: 'var(--line-2)',
              border: '1px dashed var(--line)',
            }}
          >
            Geen schepen gevolgd
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats KPI strip
// ---------------------------------------------------------------------------

interface StatsBarProps {
  totalPorts: number;
  portsWithShips: number;
  totalShips: number;
  isLive: boolean;
}

function StatsBar({ totalPorts, portsWithShips, totalShips, isLive }: StatsBarProps) {
  const kpis = [
    {
      label: 'Totaal havens',
      value: totalPorts,
      sub: 'wereldwijd',
      iconPath: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
    },
    {
      label: 'Actieve havens',
      value: portsWithShips,
      sub: 'met schepen',
      iconPath: 'M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418',
    },
    {
      label: 'Schepen gevolgd',
      value: totalShips,
      sub: 'in havengebied',
      iconPath: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
    },
  ];

  // Utilization bar: portsWithShips / totalPorts
  const utilizationPct = totalPorts > 0 ? Math.round((portsWithShips / totalPorts) * 100) : 0;

  return (
    <div
      className="flex-shrink-0 px-6 py-4"
      style={{ borderBottom: '1px solid var(--line)' }}
    >
      {/* KPI row */}
      <div className="fl-kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
        {kpis.map(({ label, value, sub, iconPath }) => (
          <div key={label} className="fl-kpi" style={{ padding: '14px 16px' }}>
            <div className="fl-kpi__ic">
              <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="var(--navy)" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
              </svg>
            </div>
            <div className="fl-kpi__v fl-num">{value}</div>
            <div className="fl-kpi__l">{label}</div>
            <div className="fl-kpi__s">{sub}</div>
          </div>
        ))}
      </div>

      {/* Utilization bar + live badge row */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Havenbenutting
            </span>
            <span className="fl-num" style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)' }}>
              {utilizationPct}%
            </span>
          </div>
          <div className="fl-bar">
            <i style={{ width: `${utilizationPct}%`, background: NAVY_PALETTE[0] }} />
          </div>
        </div>
        <div className="flex-none">
          {isLive ? (
            <span className="fl-live">Live AIS</span>
          ) : (
            <span className="fl-sim">Gesimuleerd</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HavensClient() {
  const { t } = useFleetLanguage();

  const [positions, setPositions] = useState<AisShipPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [activeRegion, setActiveRegion] = useState<Region | 'All'>('All');
  const [search, setSearch] = useState('');
  const [expandedPorts, setExpandedPorts] = useState<Set<string>>(new Set());

  const fetchPositions = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/fleet/positions${isManual ? '?t=' + Date.now() : ''}`);
      const json = await res.json();
      setPositions(json.data ?? []);
      setIsLive(json.isLive ?? false);
    } catch {
      setPositions([]);
      setIsLive(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(() => fetchPositions(), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  // Match each ship to the nearest port within 30 km
  const portShipMap = useMemo(() => {
    const map = new Map<string, AisShipPosition[]>();
    MAJOR_PORTS.forEach((p) => map.set(p.id, []));

    for (const ship of positions) {
      let closestPort: Port | null = null;
      let closestDist = Infinity;

      for (const port of MAJOR_PORTS) {
        const dist = haversineKm(ship.lat, ship.lng, port.lat, port.lng);
        if (dist < AT_PORT_RADIUS_KM && dist < closestDist) {
          closestDist = dist;
          closestPort = port;
        }
      }

      if (closestPort) {
        map.get(closestPort.id)!.push(ship);
      }
    }

    return map;
  }, [positions]);

  // Filtered ports
  const filteredPorts = useMemo(() => {
    let ports = MAJOR_PORTS;

    if (activeRegion !== 'All') {
      ports = ports.filter((p) => p.region === activeRegion);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      ports = ports.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q)
      );
    }

    // Sort: ports with ships first, then alphabetically
    return [...ports].sort((a, b) => {
      const aCount = portShipMap.get(a.id)?.length ?? 0;
      const bCount = portShipMap.get(b.id)?.length ?? 0;
      if (bCount !== aCount) return bCount - aCount;
      return a.name.localeCompare(b.name, 'en');
    });
  }, [activeRegion, search, portShipMap]);

  const stats = useMemo(() => {
    const portsWithShips = Array.from(portShipMap.values()).filter((s) => s.length > 0).length;
    return { portsWithShips, totalShips: positions.length };
  }, [portShipMap, positions]);

  function togglePort(portId: string) {
    setExpandedPorts((prev) => {
      const next = new Set(prev);
      if (next.has(portId)) next.delete(portId);
      else next.add(portId);
      return next;
    });
  }

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: 'var(--paper)' }}>

      {/* ── Page header bar ─────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-6 pt-6 pb-4"
        style={{ borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}
      >
        <div className="fl-pagehead" style={{ marginBottom: 16 }}>
          <div>
            <div className="fl-eyebrow">{t('nav.ports')}</div>
            <h1>Havens</h1>
            <p className="fl-sub">
              {filteredPorts.length} haven{filteredPorts.length !== 1 ? 's' : ''} — wereldwijde cruise-infrastructuur
            </p>
          </div>

          {/* Toolbar: search + refresh */}
          <div className="flex items-center gap-2">
            {/* Desktop search */}
            <div className="fl-search hidden sm:block">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Haven zoeken…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: 14 }}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchPositions(true)}
              disabled={refreshing}
              className="fl-iconbtn"
              title="Vernieuwen"
              style={{ opacity: refreshing ? 0.6 : 1 }}
            >
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.9}
                style={{ animation: refreshing ? 'fl-rot .7s linear infinite' : 'none' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="fl-search sm:hidden" style={{ maxWidth: '100%', marginBottom: 12 }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Haven zoeken…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: 16 /* iOS zoom prevention */ }}
          />
        </div>

        {/* Region filter tabs */}
        <div className="fl-toolbar" style={{ marginTop: 4, marginBottom: 0 }}>
          <div className="fl-tabs" style={{ flexWrap: 'wrap' }}>
            {(['All', ...ALL_REGIONS] as const).map((region) => {
              const active = activeRegion === region;
              const count =
                region === 'All'
                  ? MAJOR_PORTS.length
                  : MAJOR_PORTS.filter((p) => p.region === region).length;

              return (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region as Region | 'All')}
                  className={`fl-tab${active ? ' active' : ''}`}
                >
                  {region === 'All' ? t('common.all') : region}
                  <span className="n fl-num">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── KPI + utilization bar ───────────────────────────────────── */}
      <StatsBar
        totalPorts={MAJOR_PORTS.length}
        portsWithShips={stats.portsWithShips}
        totalShips={stats.totalShips}
        isLive={isLive}
      />

      {/* ── Scrollable port grid ─────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="fl-spinner" />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('common.loading')}</span>
          </div>
        ) : filteredPorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="fl-kpi__ic" style={{ width: 52, height: 52, borderRadius: 'var(--r-md)' }}>
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="var(--navy)" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--ink)' }}>
                Geen havens gevonden
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Probeer een andere zoekopdracht of regio
              </p>
            </div>
            <button
              onClick={() => { setSearch(''); setActiveRegion('All'); }}
              className="fl-btn fl-btn--ghost fl-btn--sm"
            >
              Filters wissen
            </button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPorts.map((port) => (
              <PortCard
                key={port.id}
                port={port}
                ships={portShipMap.get(port.id) ?? []}
                expanded={expandedPorts.has(port.id)}
                onToggle={() => togglePort(port.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
