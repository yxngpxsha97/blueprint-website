'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { CruiseShip } from '@/lib/cruise-ships';
import { getCruiseLines, CRUISE_SHIPS } from '@/lib/cruise-ships';
import type { AisShipPosition } from '@/app/api/fleet/positions/route';
import { STATUS_COLORS, STATUS_LABELS, STATUS_BG, CYAN_PALETTE, NAVY_PALETTE } from './fleet-utils';
import { CruiseLineLogo } from './cruise-lijnen/cruise-lijnen-client';
import { useFleetLanguage } from '@/lib/fleet-i18n';

// ── Sector labels (no more rainbow color map) ─────────────────────────────────
const SECTOR_LABELS: Record<string, string> = {
  cruise: 'Cruise',
  cargo: 'Cargo',
  tanker: 'Tanker',
  passenger: 'Passagier',
  'port-authority': 'Havenautoriteit',
  offshore: 'Offshore',
};

// ── AIS dynamic ship type ──────────────────────────────────────────────────────
interface DynamicShip {
  mmsi: string;
  name: string;
  flag?: string;
  speed?: number;
  status?: string;
  lat?: number;
  lng?: number;
}

// ── Sector Stats Dashboard ────────────────────────────────────────────────────
function SectorDashboard({ sector, orgName }: { sector: string; orgName: string }) {
  const [ships, setShips] = useState<DynamicShip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useFleetLanguage();
  const sectorLabel = SECTOR_LABELS[sector] ?? sector;

  const fetchDynamic = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fleet/dynamic-positions?sector=${encodeURIComponent(sector)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setShips(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ophalen mislukt');
      setShips([]);
    } finally {
      setLoading(false);
    }
  }, [sector]);

  useEffect(() => { fetchDynamic(); }, [fetchDynamic]);

  // Derived stats
  const stats = useMemo(() => {
    const count = ships.length;
    const avgSpeed = count > 0
      ? ships.reduce((s, v) => s + (v.speed ?? 0), 0) / count
      : 0;
    const active = ships.filter((s) => {
      const st = (s.status ?? '').toLowerCase();
      return st.includes('underway') || (s.speed ?? 0) > 0;
    }).length;
    const flagSet = new Set(ships.map((s) => s.flag ?? '—').filter((f) => f !== '—'));
    return { count, avgSpeed, active, flags: flagSet.size };
  }, [ships]);

  // Speed distribution
  const speedBuckets = useMemo(() => {
    const buckets = [
      { label: '0–5 kn', min: 0, max: 5, count: 0 },
      { label: '5–10 kn', min: 5, max: 10, count: 0 },
      { label: '10–15 kn', min: 10, max: 15, count: 0 },
      { label: '15–20 kn', min: 15, max: 20, count: 0 },
      { label: '20+ kn', min: 20, max: Infinity, count: 0 },
    ];
    ships.forEach((s) => {
      const sp = s.speed ?? 0;
      const b = buckets.find((bk) => sp >= bk.min && sp < bk.max);
      if (b) b.count++;
    });
    return buckets;
  }, [ships]);

  const maxSpeedBucket = Math.max(...speedBuckets.map((b) => b.count), 1);

  // Top flags
  const topFlags = useMemo(() => {
    const m = new Map<string, number>();
    ships.forEach((s) => {
      const f = s.flag ?? '—';
      m.set(f, (m.get(f) ?? 0) + 1);
    });
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));
  }, [ships]);

  const maxFlagCount = topFlags[0]?.value ?? 1;

  // Status breakdown
  const statusGroups = useMemo(() => {
    const m = new Map<string, number>();
    ships.forEach((s) => {
      const st = s.status ?? 'Onbekend';
      m.set(st, (m.get(st) ?? 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [ships]);

  // Recent 10 ships
  const recentShips = useMemo(() => ships.slice(0, 10), [ships]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--paper)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="fl-spinner" />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            {t('common.loading')} {sectorLabel}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--paper)' }}>
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
          <div className="rounded-2xl p-3" style={{ background: 'var(--dang-soft)', border: '1px solid rgba(176,74,56,.22)' }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="var(--dang)" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{error}</p>
          <button onClick={fetchDynamic} className="fl-btn fl-btn--primary fl-btn--sm">
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Page header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{
          background: 'var(--fleet-header)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="md:hidden w-8" />
          <div>
            <div className="fl-eyebrow mb-1">Dashboard</div>
            <h1 style={{ fontSize: '1.15rem', fontFamily: 'var(--display)', fontWeight: 500, color: 'var(--ink)', margin: 0 }}>
              {sectorLabel}
            </h1>
            <p className="fl-sub" style={{ marginTop: 2 }}>
              {stats.count} {t('common.ships')} &bull; {orgName}
            </p>
          </div>
        </div>
        <button
          onClick={fetchDynamic}
          className="fl-iconbtn"
          title="Vernieuwen"
        >
          <svg fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* Row 1 — KPI cards */}
        <div className="fl-kpis" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <div className="fl-kpi" style={{ gridColumn: 'span 1' }}>
            <div className="fl-kpi__ic">
              <svg fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.589-1.202L18.75 4.971Zm-16.5.52c.99.203 1.99.377 3 .52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.589-1.202L5.25 5.491Z" /></svg>
            </div>
            <div className="fl-kpi__v fl-num">{stats.count.toLocaleString()}</div>
            <div className="fl-kpi__l">{t('dashboard.shipsDetected')}</div>
          </div>

          <div className="fl-kpi">
            <div className="fl-kpi__ic">
              <svg fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
            </div>
            <div className="fl-kpi__v fl-num">{stats.avgSpeed.toFixed(1)} kn</div>
            <div className="fl-kpi__l">{t('dashboard.avgSpeed')}</div>
          </div>

          <div className="fl-kpi">
            <div className="fl-kpi__ic" style={{ background: 'var(--ok-soft)' }}>
              <svg fill="none" viewBox="0 0 24 24" style={{ stroke: 'var(--ok)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </div>
            <div className="fl-kpi__v fl-num" style={{ color: 'var(--ok)' }}>{stats.active.toLocaleString()}</div>
            <div className="fl-kpi__l">{t('dashboard.active')}</div>
          </div>

          <div className="fl-kpi">
            <div className="fl-kpi__ic">
              <svg fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /></svg>
            </div>
            <div className="fl-kpi__v fl-num">{stats.flags.toLocaleString()}</div>
            <div className="fl-kpi__l">{t('dashboard.flags')}</div>
          </div>
        </div>

        {/* Row 2 — Speed Distribution + Top Flags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="fl-panel">
            <div className="fl-panel__head">
              <h2 style={{ fontSize: '0.95rem' }}>
                <span className="fl-panel__bar" />
                {t('dashboard.speedDistribution')}
              </h2>
            </div>
            <div className="fl-panel__body">
              <div className="space-y-3">
                {speedBuckets.map((b, idx) => {
                  const pct = maxSpeedBucket > 0 ? (b.count / maxSpeedBucket) * 100 : 0;
                  const barColor = NAVY_PALETTE[idx % NAVY_PALETTE.length];
                  return (
                    <div key={b.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{b.label}</span>
                        <span className="text-xs font-semibold fl-num" style={{ color: 'var(--navy)' }}>{b.count}</span>
                      </div>
                      <div className="fl-bar">
                        <i style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="fl-panel">
            <div className="fl-panel__head">
              <h2 style={{ fontSize: '0.95rem' }}>
                <span className="fl-panel__bar" />
                {t('dashboard.topFlags')}
              </h2>
              <span className="fl-sub">Top 5</span>
            </div>
            <div className="fl-panel__body">
              {topFlags.length === 0 ? (
                <p className="fl-empty" style={{ padding: '16px 0' }}>Geen vlagdata beschikbaar</p>
              ) : (
                <div className="space-y-3">
                  {topFlags.map(({ label, value }, idx) => {
                    const pct = maxFlagCount > 0 ? (value / maxFlagCount) * 100 : 0;
                    const barColor = NAVY_PALETTE[idx % NAVY_PALETTE.length];
                    return (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs truncate max-w-[60%]" style={{ color: 'var(--muted)' }} title={label}>{label}</span>
                          <span className="text-xs font-semibold ml-2 fl-num" style={{ color: barColor }}>{value}</span>
                        </div>
                        <div className="fl-bar fl-bar--thin">
                          <i style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3 — Status Overzicht */}
        <div className="fl-panel">
          <div className="fl-panel__head">
            <h2 style={{ fontSize: '0.95rem' }}>
              <span className="fl-panel__bar" />
              {t('dashboard.statusOverview')}
            </h2>
          </div>
          <div className="fl-panel__body">
            {statusGroups.length === 0 ? (
              <p className="fl-empty" style={{ padding: '16px 0' }}>{t('common.noData')}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {statusGroups.map(({ label, value }) => (
                  <div key={label} className="fl-card" style={{ textAlign: 'center' }}>
                    <div className="fl-kpi__v fl-num" style={{ fontSize: '1.5rem' }}>{value}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.3 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 4 — Recent Ships */}
        <div className="fl-panel">
          <div className="fl-panel__head">
            <h2 style={{ fontSize: '0.95rem' }}>
              <span className="fl-panel__bar" />
              {t('dashboard.recentShips')}
            </h2>
            <span className="fl-sub">Laatste 10</span>
          </div>
          <div className="fl-panel__body" style={{ padding: '0 0 4px' }}>
            {recentShips.length === 0 ? (
              <p className="fl-empty">{t('common.noData')}</p>
            ) : (
              <div className="fl-tablewrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table className="fl-table">
                  <thead>
                    <tr>
                      {[t('common.name'), t('common.mmsi'), t('common.flag'), t('common.speed'), t('common.status')].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentShips.map((s, i) => (
                      <tr key={s.mmsi ?? i}>
                        <td className="fl-cellmain"><b>{s.name || '—'}</b></td>
                        <td className="code">{s.mmsi || '—'}</td>
                        <td>{s.flag || '—'}</td>
                        <td className="fl-num" style={{ color: 'var(--navy)' }}>{s.speed != null ? `${s.speed} kn` : '—'}</td>
                        <td>{s.status || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type ShipPosition = AisShipPosition;

interface SelectedShip extends CruiseShip {
  position?: ShipPosition;
}

const CRUISE_LINES = getCruiseLines();

// ── Corporation groupings ──────────────────────────────────────────────────────
const CORPORATIONS: { name: string; lines: string[] }[] = [
  {
    name: 'Carnival Corporation',
    lines: [
      'AIDA CRUISES',
      'CARNIVAL CRUISE LINE',
      'COSTA CRUISES',
      'CUNARD LINE',
      'HOLLAND AMERICAN LINE',
      'P&O CRUISES',
      'PRINCESS CRUISES',
      'SEABOURN',
    ],
  },
  {
    name: 'MSC',
    lines: ['MSC CRUISES', 'EXPLORA'],
  },
  {
    name: 'NCL Holdings',
    lines: ['NORWEGIAN CRUISE LINE', 'OCEANIA CRUISES', 'REGENT SEVEN SEAS CRUISES'],
  },
  {
    name: 'Royal Caribbean Group',
    lines: [
      'ROYAL CARIBEEAN',
      'CELEBRITY CRUISES',
      'MARELLA CRUISES',
      'TUI CRUISES',
      'SILVERSEA CRUISES',
    ],
  },
];

// ── Shipyard definitions ───────────────────────────────────────────────────────
const SHIPYARDS = [
  { name: 'Fincantieri SpA', match: 'Fincantieri', flag: '🇮🇹' },
  { name: 'Meyer Werft', match: 'Meyer Werft', flag: '🇩🇪' },
  { name: 'Meyer Turku', match: 'Meyer Turku', flag: '🇫🇮' },
  { name: "Chantiers d'Atlantique", match: 'Atlantique', flag: '🇫🇷' },
  { name: 'SWS', match: 'Shanghai Waigaoqiao', flag: '🇨🇳' },
  { name: 'Mariotti SpA', match: 'Mariotti', flag: '🇮🇹' },
  { name: 'GSI', match: 'Guangzhou Shipyard', flag: '🇨🇳' },
];

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function HBarChart({
  data,
  max,
  colorFn,
}: {
  data: { label: string; value: number }[];
  max: number;
  colorFn?: (i: number) => string;
}) {
  return (
    <div className="space-y-2">
      {data.map(({ label, value }, i) => {
        const pct = max > 0 ? (value / max) * 100 : 0;
        const color = colorFn ? colorFn(i) : NAVY_PALETTE[i % NAVY_PALETTE.length];
        return (
          <div key={label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs truncate max-w-[60%]" style={{ color: 'var(--muted)' }} title={label}>
                {label}
              </span>
              <span className="text-xs font-semibold ml-2 fl-num" style={{ color }}>{value}</span>
            </div>
            <div className="fl-bar fl-bar--thin">
              <i style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Ship detail drawer ────────────────────────────────────────────────────────
function ShipPanel({
  ship,
  position,
  onClose,
}: {
  ship: CruiseShip;
  position?: ShipPosition;
  onClose: () => void;
}) {
  const statusColor = STATUS_COLORS[position?.status ?? ''] ?? 'var(--neu)';
  const statusBg = STATUS_BG[position?.status ?? ''] ?? 'var(--neu-soft)';

  return (
    <>
      {/* Drawer head — navy */}
      <div className="fl-drawer__head">
        <div className="fl-shiphero" style={{ marginBottom: 0, height: 112 }}>
          <div className="fl-shiphero__wave">
            <svg viewBox="0 0 400 40" preserveAspectRatio="none" style={{ width: '100%', height: 40 }}>
              <path d="M0,20 C100,40 300,0 400,20 L400,40 L0,40 Z" fill="rgba(255,255,255,.18)" />
            </svg>
          </div>
          <CruiseLineLogo name={ship.cruiseLine} size={36} className="mb-1.5" />
          <span style={{ fontFamily: 'var(--display)', fontWeight: 500, fontSize: '0.9rem', color: '#fff', textAlign: 'center', padding: '0 12px', zIndex: 1 }}>{ship.name}</span>
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.65)', zIndex: 1 }}>{ship.cruiseLine}</span>
        </div>
        <button className="fl-drawer__close" onClick={onClose} aria-label="Sluiten">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Drawer body */}
      <div className="fl-drawer__body">
        {position && (
          <div className="mb-4">
            <span
              className={position.status === 'underway' ? 'fl-live' : position.status === 'anchored' ? 'fl-badge fl-badge--warn' : 'fl-badge fl-badge--neu'}
            >
              {STATUS_LABELS[position.status] ?? position.status}
              {position.status === 'underway' && <span style={{ opacity: .75, marginLeft: 4 }}>— {position.speed} kn</span>}
            </span>
          </div>
        )}

        <div className="fl-dsection">
          <h3>Scheepsgegevens</h3>
          <dl className="fl-kv">
            <dt>IMO</dt><dd className="fl-num">{ship.imo}</dd>
            <dt>Type</dt><dd>{ship.type}</dd>
            <dt>Gross Tonnage</dt><dd className="fl-num">{ship.gt ? ship.gt.toLocaleString('en-US') : '—'}</dd>
            <dt>Gebouwd</dt><dd className="fl-num">{ship.built || '—'}</dd>
            <dt>Werf</dt><dd>{ship.shipbuilder || '—'}</dd>
            <dt>Klasse</dt><dd>{ship.shipClass || '—'}</dd>
            <dt>Vlag</dt><dd>{ship.flag || '—'}</dd>
          </dl>
        </div>

        <div className="fl-dsection">
          <h3>Eigendom</h3>
          <dl className="fl-kv">
            <dt>Eigenaar</dt><dd>{ship.owner || '—'}</dd>
            <dt>Beheerder</dt><dd>{ship.manager || '—'}</dd>
            <dt>Cruise lijn</dt><dd>{ship.cruiseLine}</dd>
          </dl>
        </div>

        {position && (
          <div className="fl-dsection">
            <h3>Huidige positie</h3>
            <dl className="fl-kv">
              <dt>Breedtegraad</dt><dd className="fl-num">{position.lat.toFixed(4)}°</dd>
              <dt>Lengtegraad</dt><dd className="fl-num">{position.lng.toFixed(4)}°</dd>
              <dt>Koers</dt><dd className="fl-num">{position.heading}°</dd>
              <dt>Snelheid</dt><dd className="fl-num">{position.status === 'underway' ? `${position.speed} kn` : '0 kn'}</dd>
              <dt>Bestemming</dt><dd>{position.destination}</dd>
            </dl>
          </div>
        )}

        {position?.source === 'simulated' && (
          <span className="fl-sim">Gesimuleerde data — niet gevonden in live AIS</span>
        )}
        {position?.source === 'live' && (
          <span className="fl-live">Live AIS via AISStream.io</span>
        )}
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FleetDashboardClient({ orgName }: { orgName: string }) {
  const { t } = useFleetLanguage();
  const [activeSector, setActiveSector] = useState<string>('cruise');

  // Read initial sector from localStorage and listen for sector changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('fleet_active_sector');
    if (stored) setActiveSector(stored);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ sector: string }>).detail;
      if (detail?.sector) setActiveSector(detail.sector);
    };
    window.addEventListener('fleet-sector-change', handler);
    return () => window.removeEventListener('fleet-sector-change', handler);
  }, []);

  const [ships, setShips] = useState<CruiseShip[]>([]);
  const [positions, setPositions] = useState<ShipPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShip, setSelectedShip] = useState<SelectedShip | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const [shipsRes, posRes] = await Promise.all([
        fetch('/api/dashboard/ships', { signal: controller.signal }).then((r) => r.json()),
        fetch('/api/fleet/positions', { signal: controller.signal }).then((r) => r.json()),
      ]);
      setShips(shipsRes.data ?? []);
      setPositions(posRes.data ?? []);
      setIsLive(posRes.isLive ?? false);
    } catch (err) {
      const msg = err instanceof Error && err.name === 'AbortError'
        ? 'Request timed out. Please try again.'
        : 'Failed to load fleet data. Please try again.';
      setError(msg);
      setShips([]);
      setPositions([]);
      setIsLive(false);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const positionMap = useMemo(() => new Map(positions.map((p) => [p.imo, p])), [positions]);

  // Use the static CRUISE_SHIPS for all computed stats (ships state may lag on load)
  const allShips = ships.length > 0 ? ships : CRUISE_SHIPS;

  const stats = useMemo(() => {
    const existing = allShips.filter((s) => {
      if (!s.built) return true;
      const year = parseInt(s.built.substring(0, 4));
      return !isNaN(year) && year <= 2026;
    }).length;
    const newBuilding = allShips.filter((s) => {
      if (!s.built) return false;
      const year = parseInt(s.built.substring(0, 4));
      return !isNaN(year) && year > 2026;
    }).length;
    const totalGt = allShips.reduce((sum, s) => sum + (s.gt ?? 0), 0);
    return { total: allShips.length, existing, newBuilding, totalGt };
  }, [allShips]);

  // Fleet by cruise line — top 50 with corporation grouping
  const byCruiseLineMap = useMemo(() => {
    const counts = new Map<string, number>();
    allShips.forEach((s) => counts.set(s.cruiseLine, (counts.get(s.cruiseLine) ?? 0) + 1));
    return counts;
  }, [allShips]);

  const top50Lines = useMemo(() => {
    return [...byCruiseLineMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([label, value]) => ({ label, value }));
  }, [byCruiseLineMap]);

  // Build the ordered corporation display list
  const corporationDisplay = useMemo(() => {
    const corporateLines = new Set(CORPORATIONS.flatMap((c) => c.lines));
    const independents = top50Lines.filter((l) => !corporateLines.has(l.label));

    const result: Array<
      | { type: 'corp'; name: string }
      | { type: 'line'; label: string; value: number; indented: boolean }
    > = [];

    for (const corp of CORPORATIONS) {
      const corpLines = corp.lines
        .map((lineName) => ({ label: lineName, value: byCruiseLineMap.get(lineName) ?? 0 }))
        .filter((l) => l.value > 0);
      if (corpLines.length === 0) continue;
      result.push({ type: 'corp', name: corp.name });
      for (const line of corpLines) {
        result.push({ type: 'line', label: line.label, value: line.value, indented: true });
      }
    }

    if (independents.length > 0) {
      result.push({ type: 'corp', name: 'Independent Lines' });
      for (const line of independents) {
        result.push({ type: 'line', label: line.label, value: line.value, indented: true });
      }
    }

    return result;
  }, [byCruiseLineMap, top50Lines]);

  const maxLineCnt = useMemo(() => Math.max(...[...byCruiseLineMap.values()], 1), [byCruiseLineMap]);

  const byFlag = useMemo(() => {
    const counts = new Map<string, number>();
    allShips.forEach((s) => counts.set(s.flag, (counts.get(s.flag) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [allShips]);

  const maxFlagCnt = byFlag[0]?.value ?? 1;

  const byDecade = useMemo(() => {
    const counts = new Map<string, number>();
    allShips.forEach((s) => {
      if (!s.built) return;
      const year = parseInt(s.built.substring(0, 4));
      if (isNaN(year)) return;
      const decade = `${Math.floor(year / 10) * 10}s`;
      counts.set(decade, (counts.get(decade) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value }));
  }, [allShips]);

  const decadeShips = useMemo(() => {
    if (!selectedDecade) return [];
    const decadeYear = parseInt(selectedDecade);
    return allShips.filter((s) => {
      if (!s.built) return false;
      const year = parseInt(s.built.substring(0, 4));
      return !isNaN(year) && Math.floor(year / 10) * 10 === decadeYear;
    }).sort((a, b) => parseInt(a.built?.substring(0, 4) ?? '0') - parseInt(b.built?.substring(0, 4) ?? '0'));
  }, [selectedDecade, allShips]);

  // Total GT per cruise line (top 10)
  const totalGtByLine = useMemo(() => {
    const data = new Map<string, number>();
    allShips.forEach((s) => {
      if (!s.gt) return;
      data.set(s.cruiseLine, (data.get(s.cruiseLine) ?? 0) + s.gt);
    });
    return [...data.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [allShips]);

  const maxTotalGt = totalGtByLine[0]?.value ?? 1;

  // Shipyard counts
  const shipyardCounts = useMemo(() => {
    return SHIPYARDS.map((yard) => {
      const count = allShips.filter((s) =>
        s.shipbuilder?.toLowerCase().includes(yard.match.toLowerCase())
      ).length;
      return { ...yard, count };
    }).sort((a, b) => b.count - a.count);
  }, [allShips]);

  const maxShipyardCount = Math.max(...shipyardCounts.map((y) => y.count), 1);

  const maxDecadeCnt = Math.max(...byDecade.map((d) => d.value), 1);

  const totalFlagCount = byFlag.reduce((sum, f) => sum + f.value, 0);

  const formatGtMillions = (gt: number) => {
    return `${(gt / 1_000_000).toFixed(1)} m/GT`;
  };

  // KPI card definitions — all navy/semantic, no rainbow
  const STAT_CARDS = [
    {
      label: 'Totaal schepen',
      value: stats.total.toLocaleString('nl-NL'),
      sub: `${CRUISE_LINES.length} cruise lijnen`,
      iconPath: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.589-1.202L18.75 4.971Zm-16.5.52c.99.203 1.99.377 3 .52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.589-1.202L5.25 5.491Z',
    },
    {
      label: 'Bestaande schepen',
      value: stats.existing.toLocaleString('nl-NL'),
      sub: 'gebouwd ≤ 2026',
      iconPath: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      accentOk: true,
    },
    {
      label: 'Nieuwbouw',
      value: stats.newBuilding.toLocaleString('nl-NL'),
      sub: 'besteld / gebouwd > 2026',
      iconPath: 'M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    },
    {
      label: 'Totaal GT',
      value: formatGtMillions(stats.totalGt),
      sub: 'gecombineerd brutotonnage',
      iconPath: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
    },
  ];

  // Non-cruise sectors render the AIS dynamic dashboard
  if (activeSector !== 'cruise') {
    return (
      <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--paper)' }}>
        <SectorDashboard sector={activeSector} orgName={orgName} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="fl-spinner" />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>{t('common.loadingFleet')}</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Dit kan tot 20 seconden duren</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--paper)' }}>
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
          <div className="fl-kpi__ic" style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--dang-soft)', border: '1px solid rgba(176,74,56,.22)' }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="var(--dang)" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: 'var(--ink)' }}>Laden mislukt</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{error}</p>
          </div>
          <button onClick={fetchData} className="fl-btn fl-btn--primary fl-btn--sm">
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      {/* Main scroll area */}
      <div className="flex-1 overflow-auto">

        {/* ── Page header ── */}
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
          style={{
            background: 'var(--fleet-header)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="md:hidden w-8" /> {/* spacer for mobile hamburger */}
            <div>
              <div className="fl-eyebrow">Marifest</div>
              <h1 style={{ fontSize: '1.2rem', fontFamily: 'var(--display)', fontWeight: 500, color: 'var(--ink)', margin: '4px 0 2px' }}>Dashboard</h1>
              <p className="fl-sub">
                {stats.total} schepen &bull; {CRUISE_LINES.length} cruise lijnen &bull; {orgName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live / Simulated badge */}
            {isLive ? (
              <span className="fl-live hidden sm:inline-flex">Live AIS</span>
            ) : (
              <span className="fl-sim hidden sm:inline-flex">Gesimuleerde data</span>
            )}

            <button
              onClick={fetchData}
              className="fl-iconbtn"
              title="Vernieuwen"
            >
              <svg fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-5">

          {/* ── KPI cards ── */}
          <div className="fl-kpis grid grid-cols-2 lg:grid-cols-4" style={{ gap: 13 }}>
            {STAT_CARDS.map(({ label, value, sub, iconPath, accentOk }) => (
              <div key={label} className="fl-kpi">
                <div
                  className="fl-kpi__ic"
                  style={accentOk ? { background: 'var(--ok-soft)' } : undefined}
                >
                  <svg
                    width="19" height="19" fill="none" viewBox="0 0 24 24"
                    stroke={accentOk ? 'var(--ok)' : 'var(--navy)'}
                    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d={iconPath} />
                  </svg>
                </div>
                <div
                  className="fl-kpi__v fl-num"
                  style={accentOk ? { color: 'var(--ok)' } : undefined}
                >
                  {value}
                </div>
                <div className="fl-kpi__l">{label}</div>
                <div className="fl-kpi__s">{sub}</div>
              </div>
            ))}
          </div>

          {/* ── Quick link cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                href: '/fleet/vloot',
                label: t('nav.fleet'),
                desc: t('dashboard.quickFleetDesc'),
                iconPath: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
              },
              {
                href: '/fleet/cruise-lijnen',
                label: t('nav.cruiseLines'),
                desc: `${CRUISE_LINES.length} ${t('dashboard.quickCruiseLinesDesc')}`,
                iconPath: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z',
              },
              {
                href: '/fleet/analyses',
                label: t('nav.analytics'),
                desc: t('dashboard.quickAnalyticsDesc'),
                iconPath: 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z',
              },
            ].map(({ href, label, desc, iconPath }) => (
              <Link key={href} href={href} className="fl-card fl-card--int flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <div className="fl-kpi__ic" style={{ width: 30, height: 30, borderRadius: 9, marginBottom: 0, flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--navy)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d={iconPath} />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{label}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.45 }}>{desc}</p>
                <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="var(--navy)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ))}
          </div>

          {/* ── Shipyards ── */}
          <div className="fl-panel">
            <div className="fl-panel__head">
              <h2 style={{ fontSize: '0.95rem' }}>
                <span className="fl-panel__bar" />
                Scheepswerven
              </h2>
              <span className="fl-sub">7 werven</span>
            </div>
            <div className="fl-panel__body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shipyardCounts.map((yard, idx) => {
                  const pct = maxShipyardCount > 0 ? (yard.count / maxShipyardCount) * 100 : 0;
                  const barColor = NAVY_PALETTE[idx % NAVY_PALETTE.length];
                  return (
                    <div key={yard.name} className="fl-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{yard.flag}</span>
                          <span className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{yard.name}</span>
                        </div>
                        <span className="text-xs font-bold ml-2 flex-shrink-0 fl-num" style={{ color: barColor }}>{yard.count}</span>
                      </div>
                      <div className="fl-bar fl-bar--thin">
                        <i style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Charts row 1 — Fleet by cruise line + Fleet by flag ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Fleet by cruise line (corporation grouping) */}
            <div className="fl-panel">
              <div className="fl-panel__head">
                <h2 style={{ fontSize: '0.95rem' }}>
                  <span className="fl-panel__bar" />
                  {t('dashboard.fleetByCruiseLine')}
                </h2>
                <span className="fl-sub">Top 50</span>
              </div>
              <div className="fl-panel__body">
                <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
                  {corporationDisplay.map((item, idx) => {
                    if (item.type === 'corp') {
                      return (
                        <div key={`corp-${item.name}-${idx}`} className="pt-3 pb-1 first:pt-0">
                          <span className="fl-eyebrow" style={{ fontSize: 10 }}>{item.name}</span>
                        </div>
                      );
                    }
                    const pct = maxLineCnt > 0 ? (item.value / maxLineCnt) * 100 : 0;
                    const barColor = NAVY_PALETTE[idx % NAVY_PALETTE.length];
                    return (
                      <div key={`line-${item.label}`} className="pl-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs truncate max-w-[65%]" style={{ color: 'var(--muted)' }} title={item.label}>
                            {item.label}
                          </span>
                          <span className="text-xs font-semibold ml-2 flex-shrink-0 fl-num" style={{ color: barColor }}>{item.value}</span>
                        </div>
                        <div className="fl-bar" style={{ height: 4 }}>
                          <i style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fleet by flag */}
            <div className="fl-panel">
              <div className="fl-panel__head">
                <h2 style={{ fontSize: '0.95rem' }}>
                  <span className="fl-panel__bar" />
                  {t('dashboard.fleetByFlag')}
                </h2>
                <span className="fl-sub">Top 10</span>
              </div>
              <div className="fl-panel__body">
                <div className="space-y-3">
                  {byFlag.map(({ label, value }, i) => {
                    const pct = maxFlagCnt > 0 ? (value / maxFlagCnt) * 100 : 0;
                    const pctOfTotal = totalFlagCount > 0 ? ((value / totalFlagCount) * 100).toFixed(1) : '0';
                    const barColor = NAVY_PALETTE[i % NAVY_PALETTE.length];
                    return (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs truncate max-w-[55%]" style={{ color: 'var(--muted)' }} title={label}>
                            {label}
                          </span>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs fl-num" style={{ color: 'var(--muted)' }}>{pctOfTotal}%</span>
                            <span className="text-xs font-semibold fl-num" style={{ color: barColor }}>{value}</span>
                          </div>
                        </div>
                        <div className="fl-bar fl-bar--thin">
                          <i style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Charts row 2 — Build decade (clickable) + Total GT per cruise line ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Build decade */}
            <div className="fl-panel">
              <div className="fl-panel__head">
                <h2 style={{ fontSize: '0.95rem' }}>
                  <span className="fl-panel__bar" />
                  Schepen per bouwdecennium
                </h2>
                <span className="fl-sub">
                  {selectedDecade ? `${selectedDecade} geselecteerd` : 'Klik een decennium'}
                </span>
              </div>
              <div className="fl-panel__body">
                <div className="space-y-2">
                  {byDecade.map(({ label, value }, idx) => {
                    const pct = (value / maxDecadeCnt) * 100;
                    const isSelected = selectedDecade === label;
                    const barColor = NAVY_PALETTE[idx % NAVY_PALETTE.length];
                    return (
                      <button
                        key={label}
                        className="w-full text-left"
                        onClick={() => setSelectedDecade(isSelected ? null : label)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className="text-xs font-medium"
                            style={{ color: isSelected ? 'var(--navy)' : 'var(--muted)' }}
                          >
                            {label}
                          </span>
                          <span className="text-xs font-semibold fl-num" style={{ color: 'var(--navy)' }}>{value}</span>
                        </div>
                        <div
                          className="fl-bar"
                          style={{
                            background: isSelected ? 'var(--brand-soft-2)' : undefined,
                            outline: isSelected ? '1px solid var(--navy)' : 'none',
                          }}
                        >
                          <i style={{ width: `${pct}%`, background: isSelected ? 'var(--navy)' : barColor }} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Decade ship list */}
                {selectedDecade && decadeShips.length > 0 && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--brand-soft)' }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: 'var(--navy)' }}>
                      {decadeShips.length} schepen gebouwd in de {selectedDecade}
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {decadeShips.map((ship) => (
                        <button
                          key={ship.imo}
                          onClick={() => {
                            const pos = positionMap.get(ship.imo);
                            setSelectedShip({ ...ship, position: pos });
                            setPanelOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors fl-card--int"
                          style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
                        >
                          <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--ink)' }}>{ship.name}</span>
                          <span className="text-xs flex-shrink-0 fl-num" style={{ color: 'var(--muted)' }}>{ship.built?.substring(0, 4)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Total GT per cruise line */}
            <div className="fl-panel">
              <div className="fl-panel__head">
                <h2 style={{ fontSize: '0.95rem' }}>
                  <span className="fl-panel__bar" />
                  Totaal GT per cruise lijn
                </h2>
                <span className="fl-sub">Top 10</span>
              </div>
              <div className="fl-panel__body">
                <div className="space-y-3">
                  {totalGtByLine.map(({ label, value }, i) => {
                    const pct = maxTotalGt > 0 ? (value / maxTotalGt) * 100 : 0;
                    const barColor = NAVY_PALETTE[i % NAVY_PALETTE.length];
                    return (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs truncate max-w-[55%]" style={{ color: 'var(--muted)' }} title={label}>
                            {label}
                          </span>
                          <span className="text-xs font-semibold ml-2 fl-num" style={{ color: barColor }}>
                            {(value / 1_000_000).toFixed(2)} m/GT
                          </span>
                        </div>
                        <div className="fl-bar fl-bar--thin">
                          <i style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>Waarden in miljoenen GT</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Ship detail slide-over ── */}
      <div className={`fl-scrim${panelOpen ? ' show' : ''}`} onClick={() => setPanelOpen(false)} />
      <div className={`fl-drawer${panelOpen ? ' show' : ''}`}>
        {panelOpen && selectedShip && (
          <ShipPanel
            ship={selectedShip}
            position={selectedShip.position}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </div>

    </div>
  );
}
