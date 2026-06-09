'use client';

import { useEffect, useMemo, useState } from 'react';
import { CRUISE_SHIPS } from '@/lib/cruise-ships';
import type { CruiseShip } from '@/lib/cruise-ships';
import { useFleetLanguage } from '@/lib/fleet-i18n';
import { NAVY_PALETTE, STATUS_COLORS, STATUS_BG } from '@/app/fleet/fleet-utils';

const CURRENT_YEAR = 2026;

const SECTOR_NAMES: Record<string, string> = {
  cruise: 'Cruise',
  cargo: 'Cargo',
  tanker: 'Tanker',
  passenger: 'Passagier',
  'port-authority': 'Havenautoriteit',
  offshore: 'Offshore',
};

// ── Dynamic ship type ─────────────────────────────────────────────────────────
interface DynamicShip {
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  shipType: string;
  flag: string;
  status: string;
  length: number;
  width: number;
}

// ── Chart helpers ─────────────────────────────────────────────────────────────
function HBar({
  label,
  value,
  max,
  color,
  unit = '',
  onClick,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
  onClick?: () => void;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      className="mb-3"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex justify-between items-center mb-1">
        <span
          className="text-xs truncate max-w-[60%]"
          style={{
            color: 'var(--muted)',
            textDecoration: onClick ? 'underline dotted' : 'none',
          }}
          title={label}
        >
          {label}
        </span>
        <span className="fl-num text-xs font-semibold ml-2 flex-shrink-0" style={{ color: 'var(--navy)' }}>
          {value.toLocaleString('en-US')}{unit}
        </span>
      </div>
      <div className="fl-bar">
        <i style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Panel wrapper (replaces old dark Card) ────────────────────────────────────
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fl-panel">
      <div className="fl-panel__head">
        <h3 className="flex items-center gap-2">
          <span className="fl-panel__bar" />
          {title}
        </h3>
      </div>
      <div className="fl-panel__body">{children}</div>
    </div>
  );
}

// ── Timeline Bar Chart ────────────────────────────────────────────────────────
function TimelineChart({ data, color }: { data: { year: number; count: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 120;

  return (
    <div className="flex items-end gap-0.5 h-36 overflow-x-auto pb-2">
      {data.map(({ year, count }) => {
        return (
          <div key={year} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 20 }}>
            <div
              className="rounded-t-sm w-full transition-all duration-500"
              style={{
                height: `${(count / max) * chartHeight}px`,
                background: color,
                opacity: 0.75,
                minWidth: 14,
              }}
              title={`${year}: ${count} ships`}
            />
            {year % 5 === 0 && (
              <span className="text-xs mt-1" style={{ color: 'var(--muted)', fontSize: 9 }}>
                {year}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Ship Popup (cruise only) ──────────────────────────────────────────────────
function ShipPopup({
  title,
  ships,
  onClose,
}: {
  title: string;
  ships: CruiseShip[];
  onClose: () => void;
}) {
  return (
    <>
      {/* Scrim */}
      <div
        className="fl-scrim show"
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 overflow-hidden"
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--sh-3)',
          borderRadius: 'var(--r-xl)',
          maxWidth: 560,
          margin: '0 auto',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header — navy strip */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: 'var(--navy)', borderRadius: 'var(--r-xl) var(--r-xl) 0 0' }}
        >
          <div>
            <div className="font-semibold text-sm" style={{ color: '#fff', fontFamily: 'var(--display)' }}>{title}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,.65)' }}>{ships.length} schepen</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', cursor: 'pointer' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ship list */}
        <div className="overflow-auto flex-1">
          <div className="fl-tablewrap" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
            <table className="fl-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Cruise Line</th>
                  <th className="r">GT</th>
                  <th className="r">Gebouwd</th>
                </tr>
              </thead>
              <tbody>
                {ships.map((ship) => (
                  <tr key={ship.imo}>
                    <td className="fl-cellmain"><b>{ship.name}</b></td>
                    <td style={{ color: 'var(--muted)' }}>{ship.cruiseLine}</td>
                    <td className="r fl-num" style={{ color: 'var(--navy)' }}>
                      {ship.gt ? ship.gt.toLocaleString('en-US') : '—'}
                    </td>
                    <td className="r" style={{ color: 'var(--muted)' }}>
                      {ship.built?.substring(0, 4) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Classification Society mapping ────────────────────────────────────────────
const SOCIETY_MAP: Record<string, { label: string; country: string }> = {
  LR: { label: 'Lloyd\'s Register', country: 'UK' },
  NV: { label: 'Norske Veritas', country: 'Norway' },
  RI: { label: 'RINA', country: 'Italy' },
  BV: { label: 'Bureau Veritas', country: 'France' },
  AB: { label: 'American Bureau', country: 'USA' },
};
const KNOWN_CODES = Object.keys(SOCIETY_MAP);

// ── Dynamic analytics panels ─────────────────────────────────────────────────

type SortCol = 'naam' | 'mmsi' | 'vlag' | 'type' | 'snelheid' | 'status';
type SortDir = 'asc' | 'desc';

// Map status key to semantic CSS variable name
function statusCssColor(s: string): string {
  const key = s?.toLowerCase();
  return STATUS_COLORS[key] ?? 'var(--muted)';
}
function statusCssBg(s: string): string {
  const key = s?.toLowerCase();
  return STATUS_BG[key] ?? 'var(--neu-soft)';
}

function DynamicAnalytics({ ships, sector }: { ships: DynamicShip[]; sector: string }) {
  const { t } = useFleetLanguage();
  const [sortCol, setSortCol] = useState<SortCol>('naam');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  // Speed histogram buckets
  const speedBuckets = useMemo(() => {
    const buckets = [
      { label: '0–5 kn', min: 0, max: 5 },
      { label: '5–10 kn', min: 5, max: 10 },
      { label: '10–15 kn', min: 10, max: 15 },
      { label: '15–20 kn', min: 15, max: 20 },
      { label: '20+ kn', min: 20, max: Infinity },
    ];
    return buckets.map((b) => ({
      label: b.label,
      value: ships.filter((s) => s.speed >= b.min && s.speed < b.max).length,
    }));
  }, [ships]);

  // Flag distribution
  const flagDist = useMemo(() => {
    const counts = new Map<string, number>();
    ships.forEach((s) => {
      const flag = s.flag || 'Onbekend';
      counts.set(flag, (counts.get(flag) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label, value }));
  }, [ships]);

  // Ship type distribution
  const typeDist = useMemo(() => {
    const counts = new Map<string, number>();
    ships.forEach((s) => {
      const t = s.shipType || 'Onbekend';
      counts.set(t, (counts.get(t) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [ships]);

  // Status distribution
  const statusDist = useMemo(() => {
    const counts = new Map<string, number>();
    ships.forEach((s) => {
      const st = s.status || 'Onbekend';
      counts.set(st, (counts.get(st) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [ships]);

  // Sorted table
  const sortedShips = useMemo(() => {
    return [...ships].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'naam') cmp = a.name.localeCompare(b.name);
      else if (sortCol === 'mmsi') cmp = a.mmsi.localeCompare(b.mmsi);
      else if (sortCol === 'vlag') cmp = (a.flag || '').localeCompare(b.flag || '');
      else if (sortCol === 'type') cmp = (a.shipType || '').localeCompare(b.shipType || '');
      else if (sortCol === 'snelheid') cmp = a.speed - b.speed;
      else if (sortCol === 'status') cmp = (a.status || '').localeCompare(b.status || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [ships, sortCol, sortDir]);

  const maxSpeed = Math.max(...speedBuckets.map((b) => b.value), 1);
  const maxFlag = flagDist[0]?.value ?? 1;
  const maxType = typeDist[0]?.value ?? 1;

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <span style={{ opacity: 0.3 }}> ↕</span>;
    return <span style={{ color: 'var(--navy)' }}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>;
  }

  return (
    <div className="space-y-5">
      {/* Summary KPIs — navy house style */}
      <div className="fl-kpis grid-cols-1 sm:grid-cols-3">
        {[
          {
            label: t('analyses.shipsFound'),
            value: ships.length,
            sub: `${t('analyses.sector')}: ${SECTOR_NAMES[sector] ?? sector}`,
            icon: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
          },
          {
            label: t('dashboard.avgSpeed'),
            value: ships.length > 0
              ? `${(ships.reduce((s, x) => s + x.speed, 0) / ships.length).toFixed(1)} kn`
              : '—',
            sub: 'Live AIS data',
            icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
          },
          {
            label: t('dashboard.flags'),
            value: new Set(ships.map((s) => s.flag).filter(Boolean)).size,
            sub: t('analyses.diverseFleet'),
            icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
          },
        ].map(({ label, value, sub, icon }) => (
          <div key={label} className="fl-kpi">
            <div className="fl-kpi__ic">
              <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="var(--navy)" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
            </div>
            <div className="fl-kpi__v fl-num">{value}</div>
            <div className="fl-kpi__l">{label}</div>
            <div className="fl-kpi__s">{sub}</div>
          </div>
        ))}
      </div>

      {/* Speed histogram + Flag distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title={t('analyses.speedAnalysis')}>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            Verdeling van scheepssnelheden in knopen (live AIS).
          </p>
          {speedBuckets.map(({ label, value }, i) => (
            <HBar key={label} label={label} value={value} max={maxSpeed} color={NAVY_PALETTE[i] ?? NAVY_PALETTE[0]} unit=" schepen" />
          ))}
        </Panel>

        <Panel title={t('analyses.flagDistribution')}>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            {t('analyses.topFlagsDesc')}
          </p>
          {flagDist.map(({ label, value }, i) => (
            <HBar key={label} label={label} value={value} max={maxFlag} color={NAVY_PALETTE[i % NAVY_PALETTE.length]} unit=" schepen" />
          ))}
        </Panel>
      </div>

      {/* Type distribution + Status overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title={t('analyses.typeDistribution')}>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            {t('analyses.typesDesc')}
          </p>
          {typeDist.slice(0, 8).map(({ label, value }, i) => (
            <HBar key={label} label={label} value={value} max={maxType} color={NAVY_PALETTE[i % NAVY_PALETTE.length]} unit=" schepen" />
          ))}
        </Panel>

        <Panel title={t('analyses.statusOverview')}>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            {t('analyses.statusDesc')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {statusDist.map(([status, count]) => (
              <div
                key={status}
                className="rounded-xl p-3"
                style={{ background: statusCssBg(status), border: `1px solid ${statusCssColor(status)}33` }}
              >
                <div className="fl-num text-lg font-bold" style={{ color: statusCssColor(status) }}>{count}</div>
                <div className="text-xs mt-0.5 capitalize" style={{ color: 'var(--muted)' }}>{status}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Ships table */}
      <Panel title={t('analyses.shipsTable')}>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
          {t('analyses.tableDesc')}
        </p>
        <div className="fl-tablewrap" style={{ borderRadius: 'var(--r-md)' }}>
          <table className="fl-table">
            <thead>
              <tr>
                {(
                  [
                    { col: 'naam', label: t('common.name') },
                    { col: 'mmsi', label: t('common.mmsi') },
                    { col: 'vlag', label: t('common.flag') },
                    { col: 'type', label: t('common.type') },
                    { col: 'snelheid', label: `${t('common.speed')} (kn)` },
                    { col: 'status', label: t('common.status') },
                  ] as { col: SortCol; label: string }[]
                ).map(({ col, label }) => (
                  <th
                    key={col}
                    className="select-none"
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => handleSort(col)}
                  >
                    {label}<SortIcon col={col} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedShips.map((ship) => (
                <tr key={ship.mmsi}>
                  <td className="fl-cellmain"><b>{ship.name}</b></td>
                  <td className="code">{ship.mmsi}</td>
                  <td style={{ color: 'var(--muted)' }}>{ship.flag || '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{ship.shipType || '—'}</td>
                  <td className="r fl-num" style={{ color: 'var(--navy)' }}>{ship.speed.toFixed(1)}</td>
                  <td>
                    <span
                      className={`fl-badge ${
                        ship.status === 'underway' ? 'fl-badge--ok'
                        : ship.status === 'moored' ? 'fl-badge--plain'
                        : ship.status === 'anchored' ? 'fl-badge--warn'
                        : 'fl-badge--neu'
                      }`}
                    >
                      {ship.status || '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {sortedShips.length === 0 && (
                <tr>
                  <td colSpan={6} className="fl-empty">
                    Geen schepen gevonden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AnalysesClient() {
  const { t } = useFleetLanguage();
  const ships = CRUISE_SHIPS;

  const [sector, setSector] = useState<string>('cruise');
  const [dynamicShips, setDynamicShips] = useState<DynamicShip[]>([]);
  const [loadingDynamic, setLoadingDynamic] = useState(false);

  const [popupShips, setPopupShips] = useState<CruiseShip[] | null>(null);
  const [popupTitle, setPopupTitle] = useState('');

  // Read sector from localStorage on mount and listen for changes
  useEffect(() => {
    const stored = localStorage.getItem('fleet_active_sector');
    if (stored) setSector(stored);

    function onSectorChange(e: Event) {
      const detail = (e as CustomEvent<{ sector: string }>).detail;
      if (detail?.sector) setSector(detail.sector);
    }
    window.addEventListener('fleet-sector-change', onSectorChange);
    return () => window.removeEventListener('fleet-sector-change', onSectorChange);
  }, []);

  // Fetch dynamic positions when sector is not cruise
  useEffect(() => {
    if (sector === 'cruise') return;
    setLoadingDynamic(true);
    fetch(`/api/fleet/dynamic-positions?sector=${sector}`)
      .then((r) => r.json())
      .then((data) => {
        setDynamicShips(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => setDynamicShips([]))
      .finally(() => setLoadingDynamic(false));
  }, [sector]);

  function openPopup(title: string, list: CruiseShip[]) {
    setPopupTitle(title);
    setPopupShips(list);
  }

  // ── Cruise analytics (unchanged) ────────────────────────────────────────────

  // Fleet age distribution (by year built, 1990–2026)
  const byYear = useMemo(() => {
    const counts = new Map<number, number>();
    ships.forEach((s) => {
      if (!s.built) return;
      const year = parseInt(s.built.substring(0, 4));
      if (isNaN(year) || year < 1990 || year > 2026) return;
      counts.set(year, (counts.get(year) ?? 0) + 1);
    });
    const years: number[] = [];
    for (let y = 1990; y <= 2026; y++) years.push(y);
    return years.map((year) => ({ year, count: counts.get(year) ?? 0 }));
  }, [ships]);

  // GT distribution buckets — with ship lists for click
  const GT_BUCKETS: { label: string; min: number; max: number }[] = [
    { label: '< 10K GT', min: 0, max: 10000 },
    { label: '10K – 50K GT', min: 10000, max: 50000 },
    { label: '50K – 100K GT', min: 50000, max: 100000 },
    { label: '100K – 150K GT', min: 100000, max: 150000 },
    { label: '150K – 200K GT', min: 150000, max: 200000 },
    { label: '> 200K GT', min: 200000, max: Infinity },
  ];

  const byGtBucket = useMemo(() => {
    return GT_BUCKETS.map(({ label, min, max }) => {
      const list = ships.filter((s) => {
        const gt = s.gt ?? 0;
        return gt >= min && gt < max;
      });
      return { label, value: list.length, ships: list };
    });
  }, [ships]);

  // Ships by country of build — with ship lists for click
  const byBuilderCountry = useMemo(() => {
    const COUNTRY_MAP: Record<string, string> = {
      'Fincantieri': 'Italy', 'Meyer Werft': 'Germany', 'Meyer Turku': 'Finland',
      'Mitsubishi': 'Japan', 'Samsung': 'South Korea', 'Hyundai': 'South Korea',
      'STX': 'South Korea', 'Kvaerner': 'Finland', 'Atlantique': 'France',
      'CMHI': 'China', 'Shanghai': 'China', 'Chantiers': 'France',
      'Astilleros': 'Spain', 'Monfalcone': 'Italy', 'Nagasaki': 'Japan',
    };
    const countryShips = new Map<string, CruiseShip[]>();
    ships.forEach((s) => {
      if (!s.shipbuilder) return;
      let country = 'Other';
      for (const [key, val] of Object.entries(COUNTRY_MAP)) {
        if (s.shipbuilder.includes(key)) { country = val; break; }
      }
      const existing = countryShips.get(country) ?? [];
      countryShips.set(country, [...existing, s]);
    });
    return [...countryShips.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .map(([label, list]) => ({ label, value: list.length, ships: list }));
  }, [ships]);

  // Classification societies — only 5 known + "Overig"
  const byClass = useMemo(() => {
    const counts = new Map<string, number>();
    let overigCount = 0;

    ships.forEach((s) => {
      if (!s.shipClass) return;
      const codes = s.shipClass.split(' ').filter((c) => c.length > 0);
      let matched = false;
      codes.forEach((c) => {
        if (KNOWN_CODES.includes(c)) {
          counts.set(c, (counts.get(c) ?? 0) + 1);
          matched = true;
        }
      });
      if (!matched) overigCount++;
    });

    const result = KNOWN_CODES
      .map((code) => ({ label: `${code} — ${SOCIETY_MAP[code].label}`, code, value: counts.get(code) ?? 0 }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);

    if (overigCount > 0) {
      result.push({ label: 'Other', code: 'Other', value: overigCount });
    }

    return result;
  }, [ships]);

  // Summary stats
  const totalGt = useMemo(() => ships.reduce((sum, s) => sum + (s.gt ?? 0), 0), [ships]);
  const shipsWithYear = useMemo(() =>
    ships.filter((s) => s.built && !isNaN(parseInt(s.built.substring(0, 4))) && parseInt(s.built.substring(0, 4)) <= 2025),
    [ships]
  );
  const avgAge = useMemo(() => {
    if (shipsWithYear.length === 0) return 0;
    const avgYear = shipsWithYear.reduce((sum, s) => sum + parseInt(s.built!.substring(0, 4)), 0) / shipsWithYear.length;
    return Math.round(CURRENT_YEAR - avgYear);
  }, [shipsWithYear]);

  const maxGtBucket = Math.max(...byGtBucket.map((d) => d.value), 1);
  const maxBuilderCountry = byBuilderCountry[0]?.value ?? 1;
  const maxClass = Math.max(...byClass.map((d) => d.value), 1);

  const SUMMARY_KPIS = [
    {
      label: 'Total Fleet GT',
      value: `${(totalGt / 1000000).toFixed(1)}M`,
      sub: 'Combined gross tonnage',
      icon: 'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z',
    },
    {
      label: 'Gemiddelde leeftijd',
      value: `${avgAge} jaar`,
      sub: 'Gebouwd tot 2025',
      icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
    },
    {
      label: 'Geanalyseerde schepen',
      value: ships.length,
      sub: '40 cruise lijnen',
      icon: 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z',
    },
  ];

  const sectorLabel = SECTOR_NAMES[sector] ?? sector;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      {/* Page header */}
      <div
        className="flex-shrink-0 px-6 py-5"
        style={{ background: 'rgba(241,244,248,.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)' }}
      >
        <div className="md:hidden w-8 mb-1" />
        <div className="fl-pagehead" style={{ marginBottom: 0 }}>
          <div>
            <div className="fl-eyebrow">Analyses</div>
            <h1 style={{ fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', marginTop: 6 }}>
              {sector === 'cruise' ? 'Vlootstatistieken' : `${sectorLabel} Analyse`}
            </h1>
            <p className="fl-sub" style={{ marginTop: 4 }}>
              {sector === 'cruise'
                ? `${ships.length} schepen • historische AIS-data`
                : `${sectorLabel} sector • live AIS data`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-5">

        {sector === 'cruise' ? (
          <>
            {/* Summary KPIs */}
            <div className="fl-kpis grid-cols-1 sm:grid-cols-3">
              {SUMMARY_KPIS.map(({ label, value, sub, icon }) => (
                <div key={label} className="fl-kpi">
                  <div className="fl-kpi__ic">
                    <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="var(--navy)" strokeWidth={1.7}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                  </div>
                  <div className="fl-kpi__v fl-num">{value}</div>
                  <div className="fl-kpi__l">{label}</div>
                  <div className="fl-kpi__s">{sub}</div>
                </div>
              ))}
            </div>

            {/* Timeline: ships per build year (1990–2026) */}
            <Panel title="Nieuwe schepen per jaar (1990–2026)">
              <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                Aantal gebouwde schepen per jaar. Toont de groei van de cruise-industrie.
              </p>
              <TimelineChart data={byYear} color={NAVY_PALETTE[2]} />
            </Panel>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* GT distribution — clickable */}
              <Panel title="GT-verdeling">
                <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                  Vlootverdeling per tonmaat-categorie. Klik een categorie om schepen te bekijken.
                </p>
                {byGtBucket.map(({ label, value, ships: bucketShips }, i) => (
                  <HBar
                    key={label}
                    label={label}
                    value={value}
                    max={maxGtBucket}
                    color={NAVY_PALETTE[i % NAVY_PALETTE.length]}
                    unit=" schepen"
                    onClick={value > 0 ? () => openPopup(label, bucketShips) : undefined}
                  />
                ))}
              </Panel>

              {/* Build nations — clickable */}
              <Panel title="Schepen per bouwland (Top 10)">
                <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                  Welke landen domineren de cruise-scheepsbouw? Klik een land om schepen te bekijken.
                </p>
                {byBuilderCountry.map(({ label, value, ships: countryShips }, i) => (
                  <HBar
                    key={label}
                    label={label}
                    value={value}
                    max={maxBuilderCountry}
                    color={NAVY_PALETTE[i % NAVY_PALETTE.length]}
                    unit=" schepen"
                    onClick={value > 0 ? () => openPopup(`Schepen gebouwd in ${label}`, countryShips) : undefined}
                  />
                ))}
              </Panel>
            </div>

            {/* Classification societies */}
            <Panel title="Classificatiebureaus">
              <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                Welk classificatiebureau certificeert de meeste cruiseschepen?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {byClass.map(({ label, value }, i) => (
                  <HBar key={label} label={label} value={value} max={maxClass} color={NAVY_PALETTE[i % NAVY_PALETTE.length]} unit=" schepen" />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { code: 'LR', name: 'Lloyd\'s Register', country: 'UK' },
                  { code: 'NV', name: 'Norske Veritas', country: 'Norway' },
                  { code: 'RI', name: 'RINA', country: 'Italy' },
                  { code: 'BV', name: 'Bureau Veritas', country: 'France' },
                  { code: 'AB', name: 'American Bureau', country: 'USA' },
                ].map(({ code, name, country }) => (
                  <div key={code} style={{ color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--navy)', fontWeight: 600 }}>{code}</span> — {name}{' '}
                    <span style={{ color: 'var(--muted-d)' }}>({country})</span>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        ) : loadingDynamic ? (
          /* Loading state */
          <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: 'var(--muted)' }}>
            <div className="fl-spinner" />
            <span style={{ fontSize: 14 }}>Gegevens laden voor {sectorLabel}…</span>
          </div>
        ) : (
          <DynamicAnalytics ships={dynamicShips} sector={sector} />
        )}

      </div>

      {/* Ship popup (cruise only) */}
      {popupShips && (
        <ShipPopup
          title={popupTitle}
          ships={popupShips}
          onClose={() => setPopupShips(null)}
        />
      )}
    </div>
  );
}
