'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { CruiseShip } from '@/lib/cruise-ships';
import type { AisShipPosition } from '@/app/api/fleet/positions/route';
import { STATUS_COLORS, STATUS_LABELS, STATUS_BG } from '../fleet-utils';
import { CruiseLineLogo } from '../cruise-lijnen/cruise-lijnen-client';
import type { EquasisVesselData } from '@/app/api/fleet/equasis/route';
import { FLEET_SECTORS, getSector, type SectorId } from '@/lib/fleet-sectors';
import { useFleetLanguage } from '@/lib/fleet-i18n';

// Local alias so the rest of the file can use the same name as before
type ShipPosition = AisShipPosition;

// Shape returned by /api/fleet/dynamic-positions
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
  length?: number;
  width?: number;
}

const MapComponent = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="fl-spinner" />
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Kaart laden…</span>
      </div>
    </div>
  ),
});

interface SelectedShip extends CruiseShip {
  position?: ShipPosition;
}

type PanelTab = 'info' | 'equasis';

// ─────────────────────────────────────────────────────────────────────────────
// Cruise ShipPanel — navy/white Gugten style
// ─────────────────────────────────────────────────────────────────────────────
function ShipPanel({ ship, position, onClose }: { ship: CruiseShip; position?: ShipPosition; onClose: () => void }) {
  const { t } = useFleetLanguage();
  const statusColor = STATUS_COLORS[position?.status ?? ''] ?? 'var(--neu)';
  const statusBg   = STATUS_BG[position?.status ?? '']   ?? 'rgba(92,107,130,0.13)';
  const [tab, setTab] = useState<PanelTab>('info');
  const [equasisData, setEquasisData] = useState<EquasisVesselData | null>(null);
  const [equasisLoading, setEquasisLoading] = useState(false);
  const [equasisError, setEquasisError] = useState<string | null>(null);

  const loadEquasis = useCallback(async () => {
    if (equasisData || equasisLoading) return;
    setEquasisLoading(true);
    setEquasisError(null);
    try {
      const res = await fetch(`/api/fleet/equasis?imo=${ship.imo}`);
      if (!res.ok) throw new Error('Failed to load');
      setEquasisData(await res.json());
    } catch {
      setEquasisError('Equasis data kon niet worden geladen');
    } finally {
      setEquasisLoading(false);
    }
  }, [ship.imo, equasisData, equasisLoading]);

  useEffect(() => {
    if (tab === 'equasis') loadEquasis();
  }, [tab, loadEquasis]);

  // Determine badge modifier from status
  const badgeMod = position?.status === 'underway' ? 'ok' : position?.status === 'anchored' ? 'warn' : 'neu';

  return (
    <>
      {/* Drawer header — navy */}
      <div className="fl-drawer__head">
        <div className="fl-shiphero mb-0" style={{ height: 108, marginBottom: 0 }}>
          <svg className="fl-shiphero__wave" viewBox="0 0 400 40" preserveAspectRatio="none">
            <path d="M0,20 C100,40 300,0 400,20 L400,40 L0,40 Z" fill="rgba(255,255,255,0.08)" />
          </svg>
          <CruiseLineLogo name={ship.cruiseLine} size={32} className="mb-1" />
          <span style={{ fontFamily: 'var(--display)', fontWeight: 500, fontSize: '1.05rem', color: '#fff', textAlign: 'center', padding: '0 12px' }}>{ship.name}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{ship.cruiseLine}</span>
        </div>
        <button className="fl-drawer__close" onClick={onClose} aria-label="Sluiten">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Drawer body */}
      <div className="fl-drawer__body">
        {/* Status badge */}
        {position && (
          <div className="mb-4">
            <span className={`fl-badge fl-badge--${badgeMod}`} style={{ color: statusColor, background: statusBg }}>
              {STATUS_LABELS[position.status]}
              {position.status === 'underway' && <span className="fl-num" style={{ opacity: .7 }}>— {position.speed} kn</span>}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="fl-tabs mb-4">
          {(['info', 'equasis'] as PanelTab[]).map((tabKey) => (
            <button
              key={tabKey}
              className={`fl-tab${tab === tabKey ? ' active' : ''}`}
              onClick={() => setTab(tabKey)}
            >
              {tabKey === 'info' ? 'AIS Info' : 'Equasis'}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <>
            <div className="fl-dsection">
              <h3>Scheepsgegevens</h3>
              <dl className="fl-kv">
                <dt>{t('ship.imo')}</dt>       <dd className="fl-num">{ship.imo}</dd>
                <dt>{t('ship.gt')}</dt>        <dd className="fl-num">{ship.gt ? ship.gt.toLocaleString('en-US') : '—'}</dd>
                <dt>{t('ship.built')}</dt>     <dd>{ship.built || '—'}</dd>
                <dt>{t('common.flag')}</dt>    <dd>{ship.flag}</dd>
                <dt>{t('ship.shipbuilder')}</dt><dd>{ship.shipbuilder || '—'}</dd>
                <dt>{t('ship.owner')}</dt>     <dd>{ship.owner || '—'}</dd>
              </dl>
            </div>

            {position && (
              <div className="fl-dsection">
                <h3>Positie</h3>
                <dl className="fl-kv">
                  <dt>{t('ship.position')}</dt>   <dd className="fl-num">{position.lat.toFixed(3)}°, {position.lng.toFixed(3)}°</dd>
                  <dt>{t('ship.heading')}</dt>     <dd className="fl-num">{position.heading}°</dd>
                  <dt>{t('ship.destination')}</dt> <dd>{position.destination}</dd>
                </dl>
              </div>
            )}

            {position?.source === 'simulated' && (
              <div className="fl-card" style={{ background: 'var(--warn-soft)', border: '1px solid rgba(154,122,46,.18)', color: 'var(--warn)', fontSize: 12, marginTop: 8 }}>
                {t('ship.positionSimulated')}
              </div>
            )}
            {position?.source === 'live' && (
              <div className="fl-card" style={{ background: 'var(--ok-soft)', border: '1px solid rgba(46,125,84,.18)', color: 'var(--ok)', fontSize: 12, marginTop: 8 }}>
                {t('ship.positionLive')}
              </div>
            )}
          </>
        )}

        {tab === 'equasis' && (
          <div>
            {equasisLoading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="fl-spinner" />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Equasis data laden…</span>
              </div>
            )}

            {equasisError && (
              <div className="fl-card" style={{ background: 'var(--dang-soft)', border: '1px solid rgba(176,74,56,.2)', color: 'var(--dang)', fontSize: 13 }}>
                {equasisError}
                <a
                  href={`https://www.equasis.org/EquasisWeb/restricted/SearchShip?P_IMO=${ship.imo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 underline"
                  style={{ color: 'var(--navy)' }}
                >
                  Open op Equasis →
                </a>
              </div>
            )}

            {equasisData && (
              <div>
                {/* Basic vessel info */}
                <div className="fl-dsection">
                  <h3>Scheepsgegevens</h3>
                  <dl className="fl-kv">
                    {[
                      { label: 'Naam', value: equasisData.name },
                      { label: 'Vlag', value: equasisData.flag },
                      { label: 'Type', value: equasisData.type },
                      { label: 'Bouwjaar', value: equasisData.built },
                      { label: 'Klasse', value: equasisData.class },
                      { label: 'GT', value: equasisData.gt?.toLocaleString('en-US') ?? '—' },
                      { label: 'DWT', value: equasisData.dwt?.toLocaleString('en-US') ?? '—' },
                    ].map(({ label, value }) => value ? (
                      <>
                        <dt key={`dt-${label}`}>{label}</dt>
                        <dd key={`dd-${label}`} className="fl-num">{value}</dd>
                      </>
                    ) : null)}
                  </dl>
                </div>

                {/* Companies */}
                {equasisData.companies.length > 0 && (
                  <div className="fl-dsection">
                    <h3>Bedrijfsinfo</h3>
                    {equasisData.companies.map((c, i) => (
                      <div key={i} className="fl-card mb-2">
                        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{c.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.role}{c.country ? ` · ${c.country}` : ''}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* PSC Inspections */}
                {equasisData.inspections.length > 0 && (
                  <div className="fl-dsection">
                    <h3>Inspecties ({equasisData.inspections.length})</h3>
                    {equasisData.inspections.map((ins, i) => (
                      <div
                        key={i}
                        className="fl-card mb-2"
                        style={ins.detained ? { background: 'var(--dang-soft)', border: '1px solid rgba(176,74,56,.2)' } : {}}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{ins.port}</p>
                            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{ins.date} · {ins.authority}</p>
                          </div>
                          <div className="text-right" style={{ flexShrink: 0, marginLeft: 12 }}>
                            {ins.detained && (
                              <span className="fl-badge fl-badge--dang">Aangehouden</span>
                            )}
                            {!ins.detained && ins.deficiencies === 0 && (
                              <span className="fl-badge fl-badge--ok">Schoon</span>
                            )}
                            {ins.deficiencies > 0 && (
                              <p style={{ fontSize: 12, color: ins.deficiencies > 3 ? 'var(--dang)' : 'var(--muted)', marginTop: ins.detained ? 4 : 0 }}>
                                {ins.deficiencies} tekortk.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Certificates */}
                {equasisData.certificates.length > 0 && (
                  <div className="fl-dsection">
                    <h3>Certificaten</h3>
                    <dl className="fl-kv">
                      {equasisData.certificates.slice(0, 5).map((cert, i) => (
                        <>
                          <dt key={`ct-${i}`} style={{ fontSize: 13, color: 'var(--muted)' }}>{cert.type}</dt>
                          <dd key={`cd-${i}`} style={{ fontSize: 13 }}>{cert.expires || cert.issued}</dd>
                        </>
                      ))}
                    </dl>
                  </div>
                )}

                <p style={{ fontSize: 11, color: 'var(--muted-d)', paddingTop: 8 }}>
                  Gecached op {new Date(equasisData.cachedAt).toLocaleString('nl-NL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DynamicShipPanel — simplified panel for non-cruise sectors, navy/white style
// ─────────────────────────────────────────────────────────────────────────────
function DynamicShipPanel({
  ship,
  accentColor,
  onClose,
}: {
  ship: DynamicShip;
  accentColor: string;
  onClose: () => void;
}) {
  const { t } = useFleetLanguage();
  const rows = [
    { label: t('common.mmsi'), value: ship.mmsi },
    { label: t('common.type'), value: ship.shipType || '—' },
    { label: t('common.flag'), value: ship.flag || '—' },
    { label: t('common.status'), value: ship.status || '—' },
    { label: t('common.speed'), value: ship.speed != null ? `${ship.speed} kn` : '—' },
    { label: t('ship.heading'), value: ship.heading != null ? `${ship.heading}°` : '—' },
    { label: t('ship.position'), value: `${ship.lat.toFixed(3)}°, ${ship.lng.toFixed(3)}°` },
    ...(ship.length ? [{ label: 'Lengte', value: `${ship.length} m` }] : []),
    ...(ship.width ? [{ label: 'Breedte', value: `${ship.width} m` }] : []),
  ];

  const statusBadgeMod = ship.status === 'underway' ? 'ok' : ship.status === 'anchored' ? 'warn' : 'neu';

  return (
    <>
      {/* Drawer header — navy */}
      <div className="fl-drawer__head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          {/* Generic ship silhouette — tinted per sector via accentColor */}
          <div style={{ width: 44, height: 44, borderRadius: 11, background: accentColor + '1a', border: `1px solid ${accentColor}40`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,.85)">
              <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.64 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.48L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.47.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', color: '#fff', fontFamily: 'var(--display)', fontWeight: 500, margin: 0 }}>{ship.name}</h2>
            {ship.shipType && (
              <div className="fl-sub" style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, marginTop: 2 }}>{ship.shipType}</div>
            )}
          </div>
        </div>
        <button className="fl-drawer__close" onClick={onClose} aria-label="Sluiten">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Drawer body */}
      <div className="fl-drawer__body">
        {/* Status badge */}
        {ship.status && (
          <div className="mb-4">
            <span className={`fl-badge fl-badge--${statusBadgeMod}`}>
              {ship.status}
              {ship.speed > 0 && <span className="fl-num" style={{ opacity: .7 }}>— {ship.speed} kn</span>}
            </span>
          </div>
        )}

        {/* Info rows */}
        <div className="fl-dsection">
          <h3>AIS Gegevens</h3>
          <dl className="fl-kv">
            {rows.map(({ label, value }) => (
              <>
                <dt key={`dt-${label}`}>{label}</dt>
                <dd key={`dd-${label}`} className="fl-num">{value}</dd>
              </>
            ))}
          </dl>
        </div>

        <div className="fl-card" style={{ background: 'var(--ok-soft)', border: '1px solid rgba(46,125,84,.18)', color: 'var(--ok)', fontSize: 12 }}>
          Live AIS data — dynamisch bijgewerkt
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function KaartClient() {
  // ── Sector state ────────────────────────────────────────────────────────────
  const [activeSector, setActiveSector] = useState<SectorId>('cruise');

  useEffect(() => {
    // Read initial sector from localStorage
    try {
      const stored = localStorage.getItem('fleet_active_sector') as SectorId | null;
      if (stored && FLEET_SECTORS.some((s) => s.id === stored)) {
        setActiveSector(stored);
      }
    } catch {
      // localStorage unavailable (SSR guard / private mode)
    }

    // Listen for sector-change events dispatched by the sidebar/header
    function onSectorChange(e: Event) {
      const detail = (e as CustomEvent<{ sector: SectorId }>).detail;
      if (detail?.sector && FLEET_SECTORS.some((s) => s.id === detail.sector)) {
        setActiveSector(detail.sector);
      }
    }
    window.addEventListener('fleet-sector-change', onSectorChange);
    return () => window.removeEventListener('fleet-sector-change', onSectorChange);
  }, []);

  const sectorConfig = getSector(activeSector);
  const { t } = useFleetLanguage();

  // ── Cruise state (unchanged) ─────────────────────────────────────────────
  const [ships, setShips] = useState<CruiseShip[]>([]);
  const [positions, setPositions] = useState<ShipPosition[]>([]);

  // ── Dynamic (non-cruise) state ───────────────────────────────────────────
  const [dynamicShips, setDynamicShips] = useState<DynamicShip[]>([]);

  // ── Shared state ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  // Panel state — cruise ship
  const [selectedShip, setSelectedShip] = useState<SelectedShip | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Panel state — dynamic ship
  const [selectedDynamic, setSelectedDynamic] = useState<DynamicShip | null>(null);
  const [dynamicPanelOpen, setDynamicPanelOpen] = useState(false);

  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set(['underway', 'moored', 'anchored']));
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isManual = false, sectorOverride?: SectorId) => {
    const sector = sectorOverride ?? activeSector;
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      if (sector === 'cruise') {
        // Existing cruise flow — untouched
        const [shipsRes, posRes] = await Promise.all([
          fetch('/api/dashboard/ships').then((r) => r.json()),
          fetch(`/api/fleet/positions${isManual ? '?t=' + Date.now() : ''}`).then((r) => r.json()),
        ]);
        setShips(shipsRes.data ?? []);
        setPositions(posRes.data ?? []);
        setIsLive(posRes.isLive ?? false);
        setDynamicShips([]);
      } else {
        // Dynamic sector flow
        const qs = `?sector=${sector}${isManual ? '&t=' + Date.now() : ''}`;
        const res = await fetch(`/api/fleet/dynamic-positions${qs}`).then((r) => r.json());
        setDynamicShips(res.data ?? []);
        setIsLive(res.isLive ?? false);
        // Clear cruise data so stale markers don't appear
        setShips([]);
        setPositions([]);
      }
      setFetchedAt(new Date());
    } catch {
      setShips([]);
      setPositions([]);
      setDynamicShips([]);
      setIsLive(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSector]);

  // Re-fetch whenever sector changes
  useEffect(() => {
    setLoading(true);
    // Close any open panels when switching sectors
    setPanelOpen(false);
    setDynamicPanelOpen(false);
    setSelectedShip(null);
    setSelectedDynamic(null);

    fetchData(false, activeSector);

    // Reset auto-refresh timer on sector change
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(() => fetchData(false, activeSector), 2 * 60 * 1000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [activeSector, fetchData]);

  // ── Age label ────────────────────────────────────────────────────────────
  const [ageLabel, setAgeLabel] = useState('');
  useEffect(() => {
    function update() {
      if (!fetchedAt) { setAgeLabel(''); return; }
      const secs = Math.floor((Date.now() - fetchedAt.getTime()) / 1000);
      const timeStr = fetchedAt.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (secs < 10) setAgeLabel(`${timeStr} — zojuist`);
      else if (secs < 60) setAgeLabel(`${timeStr} — ${secs}s geleden`);
      else setAgeLabel(`${timeStr} — ${Math.floor(secs / 60)} min geleden`);
    }
    update();
    const timer = setInterval(update, 5_000);
    return () => clearInterval(timer);
  }, [fetchedAt]);

  // ── Stats (cruise only — for filter pills) ───────────────────────────────
  const stats = useMemo(() => ({
    total: ships.length,
    underway: positions.filter((p) => p.status === 'underway').length,
    moored: positions.filter((p) => p.status === 'moored').length,
    anchored: positions.filter((p) => p.status === 'anchored').length,
  }), [ships, positions]);

  const filteredPositions = useMemo(() => {
    if (activeStatuses.size === 3) return positions;
    return positions.filter(p => activeStatuses.has(p.status));
  }, [positions, activeStatuses]);

  function toggleStatus(status: string) {
    setActiveStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  function handleSelectShip(ship: SelectedShip) {
    setSelectedShip(ship);
    setPanelOpen(true);
    setDynamicPanelOpen(false);
    setSelectedDynamic(null);
  }

  function handleSelectDynamic(ship: DynamicShip) {
    setSelectedDynamic(ship);
    setDynamicPanelOpen(true);
    setPanelOpen(false);
    setSelectedShip(null);
  }

  // ── Sector banner config ─────────────────────────────────────────────────
  const isCruise = activeSector === 'cruise';

  // Status filter pill data — using fleet-utils semantic colors
  const STATUS_PILL_DATA = [
    { label: 'Onderweg',   key: 'underway', value: stats.underway, color: STATUS_COLORS.underway },
    { label: 'Aangemeerd', key: 'moored',   value: stats.moored,   color: STATUS_COLORS.moored   },
    { label: 'Ankeren',    key: 'anchored', value: stats.anchored, color: STATUS_COLORS.anchored  },
  ];

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: 'var(--paper)' }}>
      {/* ── Top bar — white surface, navy text ─────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap"
        style={{
          background: 'var(--cream)',
          borderBottom: '1px solid var(--line)',
          boxShadow: 'var(--sh-1)',
        }}
      >
        {/* Left cluster */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mobile sidebar spacer */}
          <div className="md:hidden w-8 flex-none" />

          {/* Page title */}
          <span style={{ fontFamily: 'var(--display)', fontWeight: 500, fontSize: '1rem', color: 'var(--ink)', letterSpacing: '-.02em' }}>
            Live Map
          </span>

          {/* Sector label pill */}
          <span className="fl-pill">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ opacity: .7 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d={sectorConfig.icon ?? 'M9 6.75V15m6-6v8.25'} />
            </svg>
            {sectorConfig.label}
          </span>

          {/* Status filter tabs — cruise only */}
          {isCruise && (
            <>
              <div className="fl-tabs hidden sm:inline-flex">
                {STATUS_PILL_DATA.map(({ label, key, value, color }) => {
                  const active = activeStatuses.has(key);
                  return (
                    <button
                      key={key}
                      className={`fl-tab${active ? ' active' : ''}`}
                      onClick={() => toggleStatus(key)}
                    >
                      {active && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 4, flexShrink: 0 }} />
                      )}
                      <span className="fl-num">{value}</span>
                      <span style={{ marginLeft: 5 }}>{label}</span>
                    </button>
                  );
                })}
              </div>
              {/* Mobile fallback — total ship count visible below sm */}
              <span className="fl-pill sm:hidden">
                <span className="fl-num" style={{ fontWeight: 700 }}>{stats.total}</span>
                schepen
              </span>
            </>
          )}

          {/* Dynamic ship count — non-cruise */}
          {!isCruise && dynamicShips.length > 0 && (
            <span className="fl-pill hidden sm:inline-flex">
              <span className="fl-num" style={{ fontWeight: 700 }}>{dynamicShips.length}</span>
              schepen
            </span>
          )}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Live / Simulated badge — always visible */}
          {isLive ? (
            <span className="fl-live">Live AIS</span>
          ) : (
            <span className="fl-sim">Gesimuleerd</span>
          )}

          {/* Last-updated timestamp */}
          {ageLabel && (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--muted)', flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {ageLabel.split(' — ').map((part, i) => (
                  i === 0
                    ? <span key={i} className="fl-num">{part}</span>
                    : <span key={i}>{' — '}{part}</span>
                ))}
              </span>
            </div>
          )}

          {/* Refresh button */}
          <button
            className="fl-iconbtn"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Vernieuwen"
            style={{ opacity: refreshing ? .65 : 1 }}
          >
            <svg
              width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              style={{ animation: refreshing ? 'fl-rot .8s linear infinite' : 'none' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Map area — always full width ───────────────────────────────────── */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--paper)' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="fl-spinner" />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loadingMap')}</span>
            </div>
          </div>
        ) : isCruise ? (
          <MapComponent
            ships={ships}
            positions={filteredPositions}
            onSelectShip={handleSelectShip}
            selectedImo={selectedShip?.imo}
          />
        ) : (
          /* Non-cruise: reuse MapComponent but pass dynamic ships converted to compatible shape.
             We create minimal CruiseShip stubs so MapComponent can render the dots, and pass
             positions derived from the dynamic ships array. The click handler unwraps back to
             the DynamicShip record so DynamicShipPanel receives the full AIS object. */
          <MapComponent
            ships={dynamicShips.map((d) => ({
              imo: d.mmsi,
              name: d.name,
              cruiseLine: d.shipType ?? '',
              flag: d.flag ?? '',
              gt: 0,
            } as unknown as CruiseShip))}
            positions={dynamicShips.map((d) => ({
              imo: d.mmsi,
              mmsi: d.mmsi,
              name: d.name,
              lat: d.lat,
              lng: d.lng,
              heading: d.heading,
              speed: d.speed,
              status: 'underway' as const,
              destination: '',
              lastUpdate: '',
              source: 'live' as const,
            }))}
            onSelectShip={(stub) => {
              const full = dynamicShips.find((d) => d.mmsi === stub.imo);
              if (full) handleSelectDynamic(full);
            }}
            selectedImo={selectedDynamic?.mmsi}
          />
        )}
      </div>

      {/* ── Cruise detail drawer ────────────────────────────────────────────── */}
      <div
        className={`fl-scrim${isCruise && panelOpen && selectedShip ? ' show' : ''}`}
        onClick={() => setPanelOpen(false)}
      />
      <div className={`fl-drawer${isCruise && panelOpen && selectedShip ? ' show' : ''}`} style={{ zIndex: 70 }}>
        {selectedShip && (
          <ShipPanel
            ship={selectedShip}
            position={selectedShip.position}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </div>

      {/* ── Dynamic ship detail drawer ──────────────────────────────────────── */}
      <div
        className={`fl-scrim${!isCruise && dynamicPanelOpen && selectedDynamic ? ' show' : ''}`}
        onClick={() => setDynamicPanelOpen(false)}
      />
      <div className={`fl-drawer${!isCruise && dynamicPanelOpen && selectedDynamic ? ' show' : ''}`} style={{ zIndex: 70 }}>
        {selectedDynamic && (
          <DynamicShipPanel
            ship={selectedDynamic}
            accentColor={sectorConfig.accentColor}
            onClose={() => setDynamicPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
