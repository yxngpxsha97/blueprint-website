'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CruiseShip } from '@/lib/cruise-ships';
import { getCruiseLines } from '@/lib/cruise-ships';
import type { ShipPosition } from '@/app/api/dashboard/ships/positions/route';
import { STATUS_COLORS, STATUS_BG } from '../fleet-utils';
import { CruiseLineLogo } from '../cruise-lijnen/cruise-lijnen-client';
import { FLEET_SECTORS, DEFAULT_SECTOR_ID } from '@/lib/fleet-sectors';
import type { SectorId } from '@/lib/fleet-sectors';
import type { AisShipPosition } from '@/app/api/fleet/positions/route';
import { useFleetLanguage } from '@/lib/fleet-i18n';

type SortKey = 'name' | 'cruiseLine' | 'flag' | 'gt' | 'built';

interface SelectedShip extends CruiseShip {
  position?: ShipPosition;
}

const CRUISE_LINES = getCruiseLines();

function getShipDimensions(gt: number) {
  if (gt < 30000) return { length: 200, beam: 28, draft: 7, engines: 2 };
  if (gt < 50000) return { length: 270, beam: 32, draft: 8, engines: 2 };
  if (gt < 80000) return { length: 270, beam: 32, draft: 8, engines: 4 };
  if (gt < 100000) return { length: 330, beam: 38, draft: 8.5, engines: 4 };
  if (gt < 150000) return { length: 330, beam: 38, draft: 8.5, engines: 6 };
  return { length: 360, beam: 47, draft: 9.5, engines: 6 };
}

// Map status key → fl-badge modifier
function statusBadgeClass(status?: string): string {
  if (status === 'underway') return 'fl-badge fl-badge--ok';
  if (status === 'anchored') return 'fl-badge fl-badge--warn';
  if (status === 'moored') return 'fl-badge fl-badge--info';
  return 'fl-badge fl-badge--neu';
}

// Dutch status labels shared by both drawer panels
const statusNL: Record<string, string> = {
  underway: 'Onderweg',
  moored: 'Afgemeerd',
  anchored: 'Geankerd',
};

function ShipPanel({ ship, position, onClose }: { ship: CruiseShip; position?: ShipPosition; onClose: () => void }) {
  const { t } = useFleetLanguage();
  const dims = getShipDimensions(ship.gt ?? 0);

  return (
    <>
      {/* Navy header */}
      <div className="fl-drawer__head">
        <div className="fl-shiphero mb-0" style={{ height: 112, borderRadius: 'var(--r-md)', marginBottom: 14 }}>
          {/* Wave decoration */}
          <svg className="fl-shiphero__wave" viewBox="0 0 400 40" preserveAspectRatio="none">
            <path d="M0,20 C100,40 300,0 400,20 L400,40 L0,40 Z" fill="rgba(255,255,255,.15)" />
          </svg>
          <CruiseLineLogo name={ship.cruiseLine} size={34} className="mb-1.5" />
          <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: '#fff', textAlign: 'center', padding: '0 12px', position: 'relative' }}>
            {ship.name}
          </span>
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', position: 'relative' }}>{ship.cruiseLine}</span>
        </div>

        <h2>{t('ship.details')}</h2>

        <button className="fl-drawer__close" onClick={onClose} aria-label="Sluiten">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="fl-drawer__body">
        {position && (
          <div className="mb-4">
            <span className={statusBadgeClass(position.status)}>
              {statusNL[position.status] ?? position.status}
              {position.status === 'underway' && <span className="fl-num" style={{ opacity: .75 }}> — {position.speed} kn</span>}
            </span>
          </div>
        )}
        {[
          {
            section: t('ship.aisInfo'), rows: [
              { label: t('ship.imo'), value: ship.imo },
              { label: t('common.type'), value: ship.type },
              { label: t('ship.gt'), value: ship.gt ? ship.gt.toLocaleString('en-US') : '—' },
              { label: t('ship.built'), value: ship.built || '—' },
              { label: t('ship.shipbuilder'), value: ship.shipbuilder || '—' },
              { label: t('common.flag'), value: ship.flag || '—' },
            ],
          },
          {
            section: t('ship.owner'), rows: [
              { label: t('ship.owner'), value: ship.owner || '—' },
              { label: 'Manager', value: ship.manager || '—' },
              { label: t('ship.cruiseLine'), value: ship.cruiseLine },
            ],
          },
        ].map(({ section, rows }) => (
          <div key={section} className="fl-dsection">
            <h3>{section}</h3>
            <dl className="fl-kv">
              {rows.map(({ label, value }) => (
                <>
                  <dt key={`dt-${label}`}>{label}</dt>
                  <dd key={`dd-${label}`}>{value}</dd>
                </>
              ))}
            </dl>
          </div>
        ))}

        {/* Ship dimensions */}
        <div className="fl-dsection">
          <h3>Scheepsafmetingen</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Lengte (m)', value: `~${dims.length} m` },
              { label: 'Breedte (m)', value: `~${dims.beam} m` },
              { label: 'Diepgang (m)', value: `~${dims.draft} m` },
              { label: 'Motoren', value: `${dims.engines}` },
            ].map(({ label, value }) => (
              <div key={label} className="fl-card" style={{ padding: '10px 12px' }}>
                <div className="fl-num" style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, color: 'var(--navy)' }}>{value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>Schattingen gebaseerd op bruto tonnage.</p>
        </div>

        {/* Position source note */}
        <div className="fl-card" style={{ background: 'var(--brand-soft)', borderColor: 'var(--line)' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Posities komen van AIS en worden elke ~6 uur ververst. Schepen buiten kustdekking tonen een geschatte positie.
          </p>
        </div>
      </div>
    </>
  );
}

// Derive flag country from MMSI MID prefix
function mmsiToFlag(mmsi: string): string {
  const MID: Record<string, string> = {
    '211': 'Duitsland', '232': 'VK', '233': 'VK', '235': 'VK',
    '244': 'Nederland', '245': 'Nederland', '247': 'Italië',
    '255': 'Portugal', '257': 'Noorwegen', '265': 'Zweden', '266': 'Zweden',
    '271': 'Turkije', '273': 'Rusland', '303': 'VS', '338': 'VS',
    '366': 'VS', '367': 'VS', '316': 'Canada', '319': 'Kaaimaneilanden',
    '351': 'Panama', '352': 'Panama', '353': 'Panama',
    '431': 'Japan', '432': 'Japan', '440': 'Zuid-Korea', '441': 'Zuid-Korea',
    '477': 'Hongkong', '538': 'Marshalleilanden', '566': 'Singapore',
    '636': 'Liberia', '710': 'Brazilië',
  };
  return MID[mmsi.substring(0, 3)] ?? 'Onbekend';
}

// AIS vessel panel — shown for non-cruise sectors
function AisShipPanel({ ship, position, onClose }: { ship: CruiseShip; position?: ShipPosition; onClose: () => void }) {
  const { t } = useFleetLanguage();

  const fields = [
    { label: t('common.name'), value: ship.name || '—' },
    { label: t('common.mmsi'), value: ship.mmsi || '—' },
    { label: t('common.type'), value: ship.type || '—' },
    { label: t('common.flag'), value: ship.mmsi ? mmsiToFlag(ship.mmsi) : '—' },
    { label: t('common.speed'), value: position?.speed !== undefined ? `${position.speed} kn` : '—' },
    { label: t('ship.heading'), value: position?.heading !== undefined ? `${position.heading}°` : '—' },
    { label: t('common.status'), value: position?.status ? (statusNL[position.status] ?? position.status) : '—' },
  ];

  return (
    <>
      {/* Navy header */}
      <div className="fl-drawer__head">
        {/* Hero banner */}
        <div className="fl-shiphero" style={{ height: 88, borderRadius: 'var(--r-md)', marginBottom: 14 }}>
          <svg className="fl-shiphero__wave" viewBox="0 0 400 40" preserveAspectRatio="none">
            <path d="M0,20 C100,40 300,0 400,20 L400,40 L0,40 Z" fill="rgba(255,255,255,.15)" />
          </svg>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,.85)" strokeWidth={1.5} style={{ position: 'relative' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: '#fff', textAlign: 'center', padding: '0 12px', position: 'relative' }}>
            {ship.name}
          </span>
        </div>

        <h2>{t('ship.details')}</h2>

        <button className="fl-drawer__close" onClick={onClose} aria-label="Sluiten">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="fl-drawer__body">
        {position && (
          <div className="mb-4">
            <span className={statusBadgeClass(position.status)}>
              {statusNL[position.status] ?? position.status}
              {position.status === 'underway' && (
                <span className="fl-num" style={{ opacity: .75 }}> — {position.speed} kn</span>
              )}
            </span>
          </div>
        )}
        <div className="fl-dsection">
          <h3>{t('ship.aisInfo')}</h3>
          <dl className="fl-kv">
            {fields.map(({ label, value }) => (
              <>
                <dt key={`dt-${label}`}>{label}</dt>
                <dd key={`dd-${label}`}>{value}</dd>
              </>
            ))}
          </dl>
        </div>

        {/* Disclaimer */}
        <div className="fl-card" style={{ background: 'var(--info-soft)', borderColor: 'rgba(45,108,181,.2)' }}>
          <p style={{ fontSize: 12, color: 'var(--info)' }}>
            Live AIS via AISStream — posities worden elke ~6 uur ververst.
          </p>
        </div>
      </div>
    </>
  );
}

// Convert a dynamic AIS position into a minimal CruiseShip-compatible record for display
function aisToCruiseShip(pos: AisShipPosition): CruiseShip {
  return {
    imo: pos.imo || pos.mmsi,
    name: pos.name,
    type: 'Cargo',
    shipbuilder: '',
    gt: 0,
    built: '',
    shipClass: '',
    flag: '',
    owner: '',
    manager: '',
    cruiseLine: `MMSI ${pos.mmsi}`,
    mmsi: pos.mmsi,
  };
}

// Stat pill — clickable filter chip for the status strip
function StatPill({
  label, value, active, onClick,
  colorVar, bgVar,
}: {
  label: string; value: number; active: boolean;
  onClick: () => void;
  colorVar: string; bgVar: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '8px 12px', borderRadius: 999,
        background: active ? bgVar : 'var(--cream)',
        border: `1px solid ${active ? colorVar : 'var(--line)'}`,
        cursor: 'pointer', transition: 'background .15s, border-color .15s',
        minHeight: 40,
      }}
    >
      <span className="fl-num" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: colorVar }}>{value}</span>
      <span style={{ font: '600 11.5px var(--body)', color: active ? colorVar : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
    </button>
  );
}

export default function VlootClient() {
  const { t } = useFleetLanguage();
  const [ships, setShips] = useState<CruiseShip[]>([]);
  const [positions, setPositions] = useState<ShipPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCruiseLine, setSelectedCruiseLine] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedShip, setSelectedShip] = useState<SelectedShip | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeSector, setActiveSector] = useState<SectorId>(DEFAULT_SECTOR_ID);

  const currentSector = FLEET_SECTORS.find((s) => s.id === activeSector) ?? FLEET_SECTORS[0];

  // Read sector from localStorage on mount and listen for changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fleet_active_sector') as SectorId | null;
      if (saved && FLEET_SECTORS.find((s) => s.id === saved)) setActiveSector(saved);
    } catch { /* ignore */ }

    const handler = (e: Event) => {
      const sector = (e as CustomEvent<{ sector: SectorId }>).detail.sector;
      setActiveSector(sector);
      setSelectedCruiseLine('');
      setSelectedStatus('');
    };
    window.addEventListener('fleet-sector-change', handler);
    return () => window.removeEventListener('fleet-sector-change', handler);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeSector === 'cruise') {
        const [shipsRes, posRes] = await Promise.all([
          fetch('/api/dashboard/ships').then((r) => r.json()),
          fetch('/api/dashboard/ships/positions').then((r) => r.json()),
        ]);
        setShips(shipsRes.data ?? []);
        setPositions(posRes.data ?? []);
      } else {
        // Dynamic AIS sector
        const posRes = await fetch(`/api/fleet/dynamic-positions?sector=${activeSector}`).then((r) => r.json());
        const aisPositions: AisShipPosition[] = posRes.data ?? [];
        setShips(aisPositions.map(aisToCruiseShip));
        setPositions(aisPositions as unknown as ShipPosition[]);
      }
    } catch {
      setShips([]);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [activeSector]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const positionMap = useMemo(() => new Map(positions.map((p) => [p.imo, p])), [positions]);

  const stats = useMemo(() => ({
    total: ships.length,
    underway: positions.filter((p) => p.status === 'underway').length,
    moored: positions.filter((p) => p.status === 'moored').length,
    anchored: positions.filter((p) => p.status === 'anchored').length,
  }), [ships, positions]);

  const filteredShips = useMemo(() => {
    let list = ships;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.imo.includes(q) ||
        s.cruiseLine.toLowerCase().includes(q) ||
        s.flag.toLowerCase().includes(q)
      );
    }
    if (selectedCruiseLine) list = list.filter((s) => s.cruiseLine?.trim().toUpperCase() === selectedCruiseLine.trim().toUpperCase());
    if (selectedStatus) list = list.filter((s) => positionMap.get(s.imo)?.status === selectedStatus);

    return [...list].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';
      if (sortKey === 'name') { valA = a.name; valB = b.name; }
      else if (sortKey === 'cruiseLine') { valA = a.cruiseLine; valB = b.cruiseLine; }
      else if (sortKey === 'flag') { valA = a.flag; valB = b.flag; }
      else if (sortKey === 'gt') { valA = a.gt; valB = b.gt; }
      else if (sortKey === 'built') { valA = a.built ?? ''; valB = b.built ?? ''; }

      if (typeof valA === 'number' && typeof valB === 'number') return sortAsc ? valA - valB : valB - valA;
      const cmp = String(valA).localeCompare(String(valB));
      return sortAsc ? cmp : -cmp;
    });
  }, [ships, search, selectedCruiseLine, selectedStatus, sortKey, sortAsc, positionMap]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  // Sort indicator — uses navy token, never cyan
  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span style={{ opacity: 0.25, marginLeft: 4 }}>↕</span>;
    return <span style={{ color: 'var(--navy)', marginLeft: 4 }}>{sortAsc ? '↑' : '↓'}</span>;
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Page header ── */}
        <div className="flex-shrink-0 px-6 pt-8 pb-4" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="fl-pagehead">
            <div>
              <span className="fl-eyebrow">{currentSector.label}</span>
              <h1>{t('nav.fleet')}</h1>
              <p className="fl-sub">{filteredShips.length} {t('common.of')} {ships.length} {t('common.ships')}</p>
            </div>
            <button
              onClick={fetchData}
              className="fl-iconbtn"
              title="Vernieuwen"
              aria-label="Vernieuwen"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Sector indicator banner (non-cruise) ── */}
        {activeSector !== 'cruise' && (
          <div
            className="flex-shrink-0 px-6 py-2 flex items-center gap-2"
            style={{ background: 'var(--brand-soft)', borderBottom: '1px solid var(--line)', color: 'var(--navy)' }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--navy)' }} />
            <span style={{ font: '600 11.5px var(--body)', letterSpacing: '.04em', textTransform: 'uppercase' }}>{currentSector.label} sector</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>— Live AIS vessels · Switch sector in the sidebar</span>
          </div>
        )}

        {/* ── Toolbar: status pills + search + filter ── */}
        <div className="flex-shrink-0 px-4 md:px-6" style={{ borderBottom: '1px solid var(--line)', background: 'var(--paper)', paddingTop: 12, paddingBottom: 12 }}>
          <div className="fl-toolbar" style={{ margin: 0 }}>
            {/* Status strip */}
            <div className="flex flex-wrap gap-2">
              <StatPill
                label="Totaal" value={stats.total} active={selectedStatus === ''}
                onClick={() => setSelectedStatus('')}
                colorVar="var(--navy)" bgVar="var(--brand-soft)"
              />
              <StatPill
                label="Onderweg" value={stats.underway} active={selectedStatus === 'underway'}
                onClick={() => setSelectedStatus(selectedStatus === 'underway' ? '' : 'underway')}
                colorVar="var(--ok)" bgVar="var(--ok-soft)"
              />
              <StatPill
                label="Afgemeerd" value={stats.moored} active={selectedStatus === 'moored'}
                onClick={() => setSelectedStatus(selectedStatus === 'moored' ? '' : 'moored')}
                colorVar="var(--info)" bgVar="var(--info-soft)"
              />
              <StatPill
                label="Geankerd" value={stats.anchored} active={selectedStatus === 'anchored'}
                onClick={() => setSelectedStatus(selectedStatus === 'anchored' ? '' : 'anchored')}
                colorVar="var(--warn)" bgVar="var(--warn-soft)"
              />
            </div>

            <div className="flex flex-wrap gap-2" style={{ marginLeft: 'auto' }}>
              {/* Search */}
              <div className="fl-search">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('common.search')}
                  style={{ fontSize: 16 /* prevent iOS zoom */ }}
                />
              </div>

              {/* Cruise line filter — cruise sector only */}
              {activeSector === 'cruise' && (
                <select
                  value={selectedCruiseLine}
                  onChange={(e) => setSelectedCruiseLine(e.target.value)}
                  className="fl-input"
                  style={{ minWidth: 160 }}
                >
                  <option value="">{t('vloot.allCruiseLines')}</option>
                  {CRUISE_LINES.map((cl) => (
                    <option key={cl} value={cl}>{cl}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* ── Table / loading ── */}
        <div className="flex-1 overflow-auto relative" style={{ padding: '20px 16px', paddingTop: 20 }}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="fl-spinner" />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loadingFleet')}</span>
              </div>
            </div>
          ) : (
            <div className="fl-tablewrap">
              <table className="fl-table">
                <thead>
                  <tr>
                    {(
                      [
                        { key: 'name', label: t('common.name') },
                        { key: 'cruiseLine', label: activeSector === 'cruise' ? t('ship.cruiseLine') : t('nav.operators') },
                        { key: 'flag', label: t('common.flag') },
                        { key: 'gt', label: t('ship.gt') },
                        { key: 'built', label: t('ship.built') },
                      ] as { key: SortKey; label: string }[]
                    ).map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className={key === 'gt' || key === 'built' ? 'r' : ''}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        {label}<SortIcon col={key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredShips.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="fl-empty">Geen schepen gevonden</div>
                      </td>
                    </tr>
                  ) : filteredShips.map((ship) => {
                    const pos = positionMap.get(ship.imo);
                    const isSelected = ship.imo === selectedShip?.imo;
                    return (
                      <tr
                        key={ship.imo}
                        onClick={() => { setSelectedShip({ ...ship, position: pos }); setPanelOpen(true); }}
                        style={isSelected ? { background: 'var(--brand-soft)' } : undefined}
                      >
                        {/* Name + IMO */}
                        <td className="fl-cellmain">
                          <b>{ship.name}</b>
                          <span>IMO <span className="code">{ship.imo}</span></span>
                        </td>

                        {/* Operator / cruise line */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CruiseLineLogo name={ship.cruiseLine} size={20} />
                            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{ship.cruiseLine}</span>
                          </div>
                        </td>

                        {/* Flag */}
                        <td style={{ color: 'var(--muted)', fontSize: 13 }}>{ship.flag || '—'}</td>

                        {/* GT — tabular */}
                        <td className="r fl-num" style={{ fontSize: 13, color: 'var(--muted)' }}>
                          {ship.gt ? ship.gt.toLocaleString('nl-NL') : '—'}
                        </td>

                        {/* Built year */}
                        <td className="r fl-num" style={{ fontSize: 13, color: 'var(--muted)' }}>
                          {ship.built?.substring(0, 4) ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Ship detail drawer ── */}
      <div
        className={`fl-scrim${panelOpen ? ' show' : ''}`}
        onClick={() => setPanelOpen(false)}
      />
      <div className={`fl-drawer${panelOpen ? ' show' : ''}`}>
        {panelOpen && selectedShip && (
          activeSector === 'cruise' ? (
            <ShipPanel
              ship={selectedShip}
              position={selectedShip.position}
              onClose={() => setPanelOpen(false)}
            />
          ) : (
            <AisShipPanel
              ship={selectedShip}
              position={selectedShip.position}
              onClose={() => setPanelOpen(false)}
            />
          )
        )}
      </div>
    </div>
  );
}
