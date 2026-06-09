'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import type { CruiseShip } from '@/lib/cruise-ships';
import { CRUISE_SHIPS, getCruiseLines } from '@/lib/cruise-ships';
import { NAVY_PALETTE } from '../fleet-utils';
import { CRUISE_LINE_LOGOS, getCruiseLineInitials } from '../cruise-line-logos';
import { useFleetLanguage } from '@/lib/fleet-i18n';

// ── Cruise Line Logo Component ─────────────────────────────────────────────────
// EXPORTED — signature and behaviour must not change.
function CruiseLineLogo({ name, size = 40, className = '' }: { name: string; size?: number; className?: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoUrl = CRUISE_LINE_LOGOS[name.toUpperCase()];
  const initials = getCruiseLineInitials(name);

  // Fallback badge reskinned to navy/white house style (no arbitrary hex colors).
  const fallback = (
    <div
      className={`flex items-center justify-center rounded-xl font-bold select-none flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'var(--brand-soft)',
        border: '1px solid var(--brand-soft-2)',
        color: 'var(--navy)',
        fontSize: size * 0.35,
        fontFamily: 'var(--display)',
        fontFeatureSettings: '"tnum"',
      }}
    >
      {initials}
    </div>
  );

  if (!logoUrl || imgFailed) return fallback;

  return (
    <div
      className={`flex items-center justify-center rounded-xl overflow-hidden flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'var(--cream)',
        border: '1px solid var(--line)',
      }}
    >
      <Image
        src={logoUrl}
        alt={name}
        width={size - 8}
        height={size - 8}
        style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
        onError={() => setImgFailed(true)}
        unoptimized
      />
    </div>
  );
}

export { CruiseLineLogo };

type SortBy = 'name' | 'shipCount' | 'totalGt' | 'avgAge';

const CRUISE_LINES = getCruiseLines();

const CURRENT_YEAR = 2026;
const NEW_BUILD_CUTOFF = 2026; // built year > 2026 = nieuwbouw

const SECTOR_NAMES: Record<string, string> = {
  cruise: 'Cruise',
  cargo: 'Cargo',
  tanker: 'Tanker',
  passenger: 'Passagier',
  'port-authority': 'Havenautoriteit',
  offshore: 'Offshore',
};

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

interface CruiseLineData {
  name: string;
  ships: CruiseShip[];
  existingShips: CruiseShip[];
  newBuildings: CruiseShip[];
  shipCount: number;
  totalGt: number;
  avgGt: number;
  flags: string[];
  avgBuildYear: number;
  newestShip: CruiseShip | null;
  oldestShip: CruiseShip | null;
}

function buildCruiseLineData(): CruiseLineData[] {
  return CRUISE_LINES.map((name) => {
    const ships = CRUISE_SHIPS.filter((s) => s.cruiseLine === name);
    const totalGt = ships.reduce((sum, s) => sum + (s.gt ?? 0), 0);
    const avgGt = ships.length > 0 ? Math.round(totalGt / ships.length) : 0;
    const flags = [...new Set(ships.map((s) => s.flag).filter(Boolean))];

    // Split existing vs new buildings
    const existingShips = ships.filter((s) => {
      if (!s.built) return true;
      const year = parseInt(s.built.substring(0, 4));
      return isNaN(year) || year <= NEW_BUILD_CUTOFF;
    });
    const newBuildings = ships.filter((s) => {
      if (!s.built) return false;
      const year = parseInt(s.built.substring(0, 4));
      return !isNaN(year) && year > NEW_BUILD_CUTOFF;
    });

    const shipsWithYear = ships
      .filter((s) => s.built && !isNaN(parseInt(s.built.substring(0, 4))))
      .map((s) => ({ ship: s, year: parseInt(s.built!.substring(0, 4)) }))
      .filter((x) => x.year <= 2025);

    const avgBuildYear = shipsWithYear.length > 0
      ? Math.round(shipsWithYear.reduce((sum, x) => sum + x.year, 0) / shipsWithYear.length)
      : 0;

    const sorted = [...shipsWithYear].sort((a, b) => b.year - a.year);
    const newestShip = sorted[0]?.ship ?? null;
    const oldestShip = sorted[sorted.length - 1]?.ship ?? null;

    return { name, ships, existingShips, newBuildings, shipCount: ships.length, totalGt, avgGt, flags, avgBuildYear, newestShip, oldestShip };
  });
}

function formatTotalGt(gt: number): string {
  if (gt === 0) return '—';
  return `${(gt / 1_000_000).toFixed(2)} m/GT`;
}

// ── Operators & Vlaggen (non-cruise) ─────────────────────────────────────────

interface FlagGroup {
  flag: string;
  ships: DynamicShip[];
  avgSpeed: number;
}

function OperatorsVlaggen({ ships, sector }: { ships: DynamicShip[]; sector: string }) {
  const { t } = useFleetLanguage();
  const sectorLabel = SECTOR_NAMES[sector] ?? sector;

  const flagGroups: FlagGroup[] = useMemo(() => {
    const map = new Map<string, DynamicShip[]>();
    ships.forEach((s) => {
      const flag = s.flag || 'Onbekend';
      const existing = map.get(flag) ?? [];
      map.set(flag, [...existing, s]);
    });
    return [...map.entries()]
      .map(([flag, list]) => ({
        flag,
        ships: list,
        avgSpeed: list.length > 0
          ? list.reduce((sum, s) => sum + s.speed, 0) / list.length
          : 0,
      }))
      .sort((a, b) => b.ships.length - a.ships.length);
  }, [ships]);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      {/* Page header */}
      <div
        className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: 'var(--cream)', borderBottom: '1px solid var(--line)' }}
      >
        <div className="flex items-center gap-4">
          <div className="md:hidden w-8" />
          <div>
            <div className="fl-eyebrow">{t('cruiseLines.operatorsFlags')} — {sectorLabel}</div>
            <p className="fl-sub" style={{ font: '500 13.5px var(--body)', color: 'var(--muted)', marginTop: 4 }}>Gebaseerd op live AIS data</p>
          </div>
        </div>
        <span className="fl-badge fl-badge--plain">
          {flagGroups.length} {t('cruiseLines.flagStates')} &bull; {ships.length} {t('common.ships')}
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {flagGroups.length === 0 ? (
          <div className="fl-empty flex flex-col items-center justify-center py-24 gap-3">
            <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M3 9l6-3 4 4 5-5" />
            </svg>
            <p className="text-sm">{t('cruiseLines.noData')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flagGroups.map((group, i) => {
              const seriesColor = NAVY_PALETTE[i % 5];
              const visibleShips = group.ships.slice(0, 5);
              const remaining = group.ships.length - visibleShips.length;

              return (
                <div key={group.flag} className="fl-card fl-card--int" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Card header */}
                  <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--line-2)' }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {/* Flag initial avatar — navy monochrome */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 select-none fl-num"
                        style={{
                          background: 'var(--brand-soft)',
                          color: 'var(--navy)',
                          border: '1px solid var(--brand-soft-2)',
                          fontFamily: 'var(--display)',
                        }}
                      >
                        {group.flag.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="fl-badge fl-badge--plain">
                        {group.ships.length} {t('common.ships')}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: 'var(--display)', fontWeight: 500, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 12 }}>
                      {group.flag}
                    </h3>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl p-2.5" style={{ background: 'var(--brand-soft)' }}>
                        <div className="fl-num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                          {group.ships.length}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Schepen</div>
                      </div>
                      <div className="rounded-xl p-2.5" style={{ background: 'var(--paper)' }}>
                        <div className="fl-num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                          {group.avgSpeed.toFixed(1)} kn
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Gem. snelheid</div>
                      </div>
                    </div>
                  </div>

                  {/* Ship names list */}
                  <div className="px-5 py-3">
                    {/* Section label — Gugten style */}
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--navy)', marginBottom: 8 }}>
                      Schepen
                    </div>
                    <div className="space-y-1.5">
                      {visibleShips.map((ship) => (
                        <div key={ship.mmsi} className="flex items-center justify-between gap-2">
                          <span
                            className="text-xs truncate"
                            style={{ color: 'var(--ink)' }}
                            title={ship.name}
                          >
                            {ship.name}
                          </span>
                          <span
                            className="fl-num flex-shrink-0"
                            style={{ fontSize: 11, fontWeight: 600, color: seriesColor }}
                          >
                            {ship.speed.toFixed(1)} kn
                          </span>
                        </div>
                      ))}
                      {remaining > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          + {remaining} meer
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CruiseLijnenClient() {
  const { t } = useFleetLanguage();
  const [sortBy, setSortBy] = useState<SortBy>('shipCount');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const [sector, setSector] = useState<string>('cruise');
  const [dynamicShips, setDynamicShips] = useState<DynamicShip[]>([]);
  const [loadingDynamic, setLoadingDynamic] = useState(false);

  const allData = useMemo(() => buildCruiseLineData(), []);

  const filtered = useMemo(() => {
    let list = allData;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'shipCount') return b.shipCount - a.shipCount;
      if (sortBy === 'totalGt') return b.totalGt - a.totalGt;
      if (sortBy === 'avgAge') return (b.avgBuildYear ?? 0) - (a.avgBuildYear ?? 0);
      return 0;
    });
  }, [allData, search, sortBy]);

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

  // Non-cruise loading state
  if (sector !== 'cruise' && loadingDynamic) {
    return (
      <div
        className="flex flex-col h-screen overflow-hidden items-center justify-center gap-3"
        style={{ background: 'var(--paper)', color: 'var(--muted)' }}
      >
        <div className="fl-spinner" />
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          Gegevens laden voor {SECTOR_NAMES[sector] ?? sector}...
        </p>
      </div>
    );
  }

  // Non-cruise: show Operators & Vlaggen
  if (sector !== 'cruise') {
    return <OperatorsVlaggen ships={dynamicShips} sector={sector} />;
  }

  // Cruise: reskinned to navy/white house style
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>

      {/* ── Page header ── */}
      <div
        className="fl-pagehead flex-shrink-0 px-6 py-4"
        style={{ margin: 0, background: 'var(--cream)', borderBottom: '1px solid var(--line)' }}
      >
        <div className="flex items-center gap-4">
          <div className="md:hidden w-8" />
          <div>
            <div className="fl-eyebrow">Cruiselijnen</div>
            <p className="fl-sub" style={{ font: '500 13.5px var(--body)', color: 'var(--muted)', marginTop: 4 }}>{filtered.length} maatschappijen</p>
          </div>
        </div>
        {/* Sort control */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="fl-input"
          style={{
            fontSize: 13,
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='%230F2A47' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '16px',
            paddingRight: 32,
          }}
        >
          <option value="shipCount">Sorteren op: Schepen</option>
          <option value="totalGt">Sorteren op: Totaal GT</option>
          <option value="avgAge">Sorteren op: Nieuwste vloot</option>
          <option value="name">Sorteren op: Naam</option>
        </select>
      </div>

      {/* ── Search bar ── */}
      <div
        className="flex-shrink-0 px-6 py-3"
        style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line-2)' }}
      >
        <div className="fl-search" style={{ maxWidth: 380 }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek cruiselijn..."
            style={{ fontSize: 16 /* iOS zoom prevention */ }}
          />
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((line, i) => {
            // Navy series color for per-line accent (bars, numbers) — clamped to darkest 5 for WCAG AA on white
            const seriesColor = NAVY_PALETTE[i % 5];
            const isExpanded = expanded === line.name;
            const avgAge = line.avgBuildYear > 0 ? CURRENT_YEAR - line.avgBuildYear : null;

            return (
              <div
                key={line.name}
                className="fl-card fl-card--int"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  borderColor: isExpanded ? 'var(--navy)' : undefined,
                  boxShadow: isExpanded ? 'var(--sh-2)' : undefined,
                }}
              >
                {/* ── Card header (button) ── */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : line.name)}
                  className="w-full p-5 text-left"
                  style={{ background: 'transparent', cursor: 'pointer' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <CruiseLineLogo name={line.name} size={40} />
                    {/* Chevron — navy */}
                    <svg
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      style={{
                        color: 'var(--navy)',
                        transition: 'transform .2s',
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>

                  {/* Line name — Aventa */}
                  <h3 style={{ fontFamily: 'var(--display)', fontWeight: 500, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 12, lineHeight: 1.15 }}>
                    {line.name}
                  </h3>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Ships — split existing vs new builds */}
                    <div className="rounded-xl p-2.5" style={{ background: 'var(--brand-soft)' }}>
                      <div className="fl-num" style={{ fontSize: 13, fontWeight: 700, color: seriesColor }}>
                        {line.existingShips.length}
                        {line.newBuildings.length > 0 && (
                          <span style={{ color: 'var(--warn)', marginLeft: 4 }}>
                            +{line.newBuildings.length}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        Schepen
                        {line.newBuildings.length > 0 && (
                          <span style={{ color: 'var(--warn)', marginLeft: 4 }}>nieuwbouw</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl p-2.5" style={{ background: 'var(--paper)' }}>
                      <div className="fl-num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                        {formatTotalGt(line.totalGt)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Totaal GT</div>
                    </div>
                    <div className="rounded-xl p-2.5" style={{ background: 'var(--paper)' }}>
                      <div className="fl-num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                        {line.avgGt > 0 ? `${(line.avgGt / 1000).toFixed(0)}K` : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Gem. GT</div>
                    </div>
                    <div className="rounded-xl p-2.5" style={{ background: 'var(--paper)' }}>
                      <div className="fl-num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                        {avgAge !== null ? `${avgAge} jr` : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Gem. leeftijd</div>
                    </div>
                  </div>

                  {/* Flags — fl-pill */}
                  {line.flags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {line.flags.slice(0, 4).map((flag) => (
                        <span key={flag} className="fl-pill">{flag}</span>
                      ))}
                      {line.flags.length > 4 && (
                        <span className="fl-pill">+{line.flags.length - 4}</span>
                      )}
                    </div>
                  )}
                </button>

                {/* ── Expanded ship list ── */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--line)' }}>

                    {/* Bestaande Schepen section */}
                    {line.existingShips.length > 0 && (
                      <>
                        {/* Section label — Gugten uppercase navy style */}
                        <div
                          className="px-5 py-2.5 flex items-center gap-2"
                          style={{ background: 'var(--brand-soft)', borderBottom: '1px solid var(--line-2)' }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--navy)' }}>
                            Bestaande Schepen
                          </span>
                          <span
                            className="fl-num"
                            style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'var(--brand-soft-2)', color: 'var(--navy)' }}
                          >
                            {line.existingShips.length}
                          </span>
                        </div>
                        <div className="max-h-48 overflow-auto">
                          {line.existingShips.map((ship) => (
                            <div
                              key={ship.imo}
                              className="flex items-center justify-between px-5 py-2.5"
                              style={{ borderBottom: '1px solid var(--line-2)' }}
                            >
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{ship.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                                  IMO {ship.imo} &bull; {ship.flag}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                <div className="fl-num" style={{ fontSize: 12, fontWeight: 600, color: seriesColor }}>
                                  {ship.gt ? `${(ship.gt / 1000).toFixed(0)}K GT` : '—'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                                  {ship.built?.substring(0, 4) ?? '—'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Nieuwbouw section — uses warn (amber) semantic color */}
                    {line.newBuildings.length > 0 && (
                      <>
                        <div
                          className="px-5 py-2.5 flex items-center gap-2"
                          style={{ background: 'var(--warn-soft)', borderTop: '1px solid var(--line-2)', borderBottom: '1px solid var(--line-2)' }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--warn)' }}>
                            Nieuwbouw
                          </span>
                          <span
                            className="fl-num"
                            style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'rgba(154,122,46,.2)', color: 'var(--warn)' }}
                          >
                            {line.newBuildings.length}
                          </span>
                        </div>
                        <div className="max-h-48 overflow-auto">
                          {line.newBuildings.map((ship) => (
                            <div
                              key={ship.imo}
                              className="flex items-center justify-between px-5 py-2.5"
                              style={{ borderBottom: '1px solid var(--line-2)' }}
                            >
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{ship.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                                  IMO {ship.imo} &bull; {ship.flag}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                <div className="fl-num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--warn)' }}>
                                  {ship.gt ? `${(ship.gt / 1000).toFixed(0)}K GT` : '—'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                                  {ship.built?.substring(0, 4) ?? '—'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
