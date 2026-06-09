'use client';

// ============================================================================
// Marifest — Vloot (Ship Registry list)
// Backed by the 95k-ship Supabase registry via /api/fleet/ships.
// Server-side search (q), sector filter, sort, and pagination (load more).
// Rows deep-link to the ship-detail page at /fleet/ship/[imo].
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useFleetLanguage } from '@/lib/fleet-i18n';
import {
  REGISTRY_SECTORS, sidebarSectorToRegistry, fetchRegistryShips,
  fmtInt, fmtMeters, fmtYear,
} from '@/lib/registry-ship';
import type { RegistryShip, RegistrySort } from '@/lib/registry-ship';

const PAGE_SIZE = 50;

type SortState = { key: RegistrySort; order: 'asc' | 'desc' };

// Sector → fl-badge tone. Keeps the navy house style; varied accents per group.
function sectorBadgeClass(sector: string): string {
  switch (sector) {
    case 'cruise':
    case 'passenger': return 'fl-badge fl-badge--info';
    case 'cargo':
    case 'tanker': return 'fl-badge fl-badge--plain';
    case 'fishing':
    case 'offshore': return 'fl-badge fl-badge--ok';
    case 'naval':
    case 'special': return 'fl-badge fl-badge--warn';
    default: return 'fl-badge fl-badge--neu';
  }
}

export default function VlootClient() {
  const { t } = useFleetLanguage();

  const [ships, setShips] = useState<RegistryShip[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sector, setSector] = useState<string>('all');
  const [sort, setSort] = useState<SortState>({ key: 'gt', order: 'desc' });

  const abortRef = useRef<AbortController | null>(null);

  // Debounce the search box (server-side query) ---------------------------------
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  // Sync sector from the global sidebar switcher --------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fleet_active_sector');
      if (saved) {
        const mapped = sidebarSectorToRegistry(saved);
        setSector(mapped ?? 'all');
      }
    } catch { /* ignore */ }

    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ sector: string }>).detail.sector;
      setSector(sidebarSectorToRegistry(id) ?? 'all');
    };
    window.addEventListener('fleet-sector-change', handler);
    return () => window.removeEventListener('fleet-sector-change', handler);
  }, []);

  // Load first page whenever query / sector / sort changes ----------------------
  const loadFirstPage = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetchRegistryShips({
        q: debounced, sector, sort: sort.key, order: sort.order,
        limit: PAGE_SIZE, offset: 0, signal: ctrl.signal,
      });
      setShips(res.data);
      setTotal(res.total);
    } catch {
      if (!ctrl.signal.aborted) { setShips([]); setTotal(0); }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [debounced, sector, sort]);

  useEffect(() => { loadFirstPage(); }, [loadFirstPage]);

  // Load-more (server-side pagination) -----------------------------------------
  async function loadMore() {
    if (loadingMore || ships.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await fetchRegistryShips({
        q: debounced, sector, sort: sort.key, order: sort.order,
        limit: PAGE_SIZE, offset: ships.length,
      });
      setShips((prev) => [...prev, ...res.data]);
      setTotal(res.total);
    } catch { /* keep current list */ } finally {
      setLoadingMore(false);
    }
  }

  function handleSort(key: RegistrySort) {
    setSort((prev) =>
      prev.key === key
        ? { key, order: prev.order === 'asc' ? 'desc' : 'asc' }
        : { key, order: key === 'name' ? 'asc' : 'desc' });
  }

  const SortIcon = ({ col }: { col: RegistrySort }) => {
    if (sort.key !== col) return <span style={{ opacity: 0.25, marginLeft: 4 }}>↕</span>;
    return <span style={{ color: 'var(--navy)', marginLeft: 4 }}>{sort.order === 'asc' ? '↑' : '↓'}</span>;
  };

  const hasMore = ships.length < total;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Page header ── */}
        <div className="flex-shrink-0 px-6 pt-8 pb-4" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="fl-pagehead">
            <div>
              <span className="fl-eyebrow">{t('registry.subtitle')}</span>
              <h1>{t('nav.fleet')}</h1>
              <p className="fl-sub">
                {t('registry.showing')} {fmtInt(ships.length)} {t('common.of')} {fmtInt(total)} {t('common.ships')}
              </p>
            </div>
            <button
              onClick={loadFirstPage}
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

        {/* ── Toolbar: search + sector filter ── */}
        <div className="flex-shrink-0 px-4 md:px-6" style={{ borderBottom: '1px solid var(--line)', background: 'var(--paper)', paddingTop: 12, paddingBottom: 12 }}>
          <div className="fl-toolbar" style={{ margin: 0 }}>
            <div className="flex flex-wrap gap-2 items-center" style={{ width: '100%' }}>
              {/* Search */}
              <div className="fl-search">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('registry.searchPlaceholder')}
                  style={{ fontSize: 16 /* prevent iOS zoom */ }}
                />
              </div>

              {/* Sector filter — full registry sector set + All */}
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="fl-input"
                style={{ minWidth: 150, marginLeft: 'auto' }}
                aria-label={t('detail.sector')}
              >
                <option value="all">{t('registry.allSectors')}</option>
                {REGISTRY_SECTORS.map((s) => (
                  <option key={s} value={s}>{t(`sector.${s}`)}</option>
                ))}
              </select>
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
            <>
              <div className="fl-tablewrap">
                <table className="fl-table">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort('name')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        {t('common.name')}<SortIcon col="name" />
                      </th>
                      <th>{t('col.sectorType')}</th>
                      <th>{t('common.flag')}</th>
                      <th>{t('detail.operator')}</th>
                      <th
                        className="r"
                        onClick={() => handleSort('gt')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        {t('ship.gt')}<SortIcon col="gt" />
                      </th>
                      <th
                        className="r"
                        onClick={() => handleSort('length')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        {t('col.length')}<SortIcon col="length" />
                      </th>
                      <th
                        className="r"
                        onClick={() => handleSort('built')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        {t('ship.built')}<SortIcon col="built" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ships.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="fl-empty">{t('registry.noResults')}</div>
                        </td>
                      </tr>
                    ) : ships.map((ship) => (
                      <tr
                        key={ship.imo}
                        onClick={() => { window.location.href = `/fleet/ship/${ship.imo}`; }}
                      >
                        {/* Name + IMO (link makes it keyboard-accessible + middle-clickable) */}
                        <td className="fl-cellmain">
                          <Link
                            href={`/fleet/ship/${ship.imo}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}
                          >
                            <b>{ship.name}</b>
                            <span>IMO <span className="code">{ship.imo}</span></span>
                          </Link>
                        </td>

                        {/* Sector + type code */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span className={sectorBadgeClass(ship.sector)}>
                              {t(`sector.${ship.sector}`) !== `sector.${ship.sector}` ? t(`sector.${ship.sector}`) : ship.sector}
                            </span>
                            {ship.ship_type_code && (
                              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ship.ship_type_code}</span>
                            )}
                          </div>
                        </td>

                        {/* Flag */}
                        <td style={{ color: 'var(--muted)', fontSize: 13 }}>{ship.flag || '—'}</td>

                        {/* Operator */}
                        <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                          {ship.operator || ship.owner || '—'}
                        </td>

                        {/* GT */}
                        <td className="r fl-num" style={{ fontSize: 13, color: 'var(--muted)' }}>
                          {fmtInt(ship.gross_tonnage)}
                        </td>

                        {/* Length (real, from registry) */}
                        <td className="r fl-num" style={{ fontSize: 13, color: 'var(--muted)' }}>
                          {fmtMeters(ship.length_m)}
                        </td>

                        {/* Built year */}
                        <td className="r fl-num" style={{ fontSize: 13, color: 'var(--muted)' }}>
                          {fmtYear(ship.built)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load more / end-of-list */}
              {ships.length > 0 && (
                <div className="flex items-center justify-center" style={{ padding: '18px 0 4px' }}>
                  {hasMore ? (
                    <button
                      className="fl-btn fl-btn--ghost"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? t('registry.loadingMore') : t('registry.loadMore')}
                    </button>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>{t('registry.noMore')}</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
