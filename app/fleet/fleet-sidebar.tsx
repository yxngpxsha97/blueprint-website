'use client';

// ============================================================================
// Marifest — Sidebar (navy house style, light-only)
// Navy ground · white text · sector switcher · NL/EN/DE · "Back to Blueprint"
// ============================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FLEET_SECTORS, DEFAULT_SECTOR_ID } from '@/lib/fleet-sectors';
import type { SectorId } from '@/lib/fleet-sectors';
import { getFleetT } from '@/lib/fleet-i18n';
import type { FleetLanguage } from '@/lib/fleet-i18n';

const SECTOR_STORAGE_KEY = 'fleet_active_sector';

interface FleetSidebarProps {
  orgName: string;
  userName: string;
  userEmail: string;
}

const LANG_FLAGS: Record<FleetLanguage, string> = { NL: '🇳🇱', EN: '🇬🇧', DE: '🇩🇪' };

const NAV_ITEMS = [
  { href: '/fleet', key: 'nav.dashboard', exact: true, d: 'm2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
  { href: '/fleet/kaart', key: 'nav.liveMap', d: 'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z' },
  { href: '/fleet/vloot', key: 'nav.fleet', d: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z' },
  { href: '/fleet/cruise-lijnen', key: 'nav.cruiseLines', d: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z' },
  { href: '/fleet/havens', key: 'nav.ports', d: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z' },
  { href: '/fleet/analyses', key: 'nav.analytics', d: 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z' },
  { href: '/fleet/watchlist', key: 'nav.watchlist', d: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z' },
  { href: '/fleet/meldingen', key: 'nav.alerts', d: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0' },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function FleetSidebar({ orgName, userName, userEmail }: FleetSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sectorOpen, setSectorOpen] = useState(false);
  const [activeSector, setActiveSector] = useState<SectorId>(DEFAULT_SECTOR_ID);
  const [language, setLanguage] = useState<FleetLanguage>('NL');

  useEffect(() => {
    try {
      const lang = localStorage.getItem('fleet_language') as FleetLanguage | null;
      if (lang === 'NL' || lang === 'EN' || lang === 'DE') setLanguage(lang);
      const sec = localStorage.getItem(SECTOR_STORAGE_KEY) as SectorId | null;
      if (sec && FLEET_SECTORS.find((s) => s.id === sec)) setActiveSector(sec);
    } catch { /* ignore */ }
  }, []);

  function cycleLanguage() {
    const next: FleetLanguage = language === 'NL' ? 'EN' : language === 'EN' ? 'DE' : 'NL';
    setLanguage(next);
    try { localStorage.setItem('fleet_language', next); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('fleet-language-change', { detail: { language: next } }));
  }

  function handleSectorSelect(id: SectorId) {
    setActiveSector(id);
    setSectorOpen(false);
    try { localStorage.setItem(SECTOR_STORAGE_KEY, id); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('fleet-sector-change', { detail: { sector: id } }));
  }

  const t = getFleetT(language);
  const currentSector = FLEET_SECTORS.find((s) => s.id === activeSector) ?? FLEET_SECTORS[0];

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const initials = userName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const content = (
    <div className="flex flex-col h-full" style={{ background: 'var(--navy)', color: '#fff' }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div className="flex-none grid place-items-center" style={{ width: 42, height: 42 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marifest-emblem.png" alt="Marifest" style={{ width: 42, height: 42, objectFit: 'contain' }} />
        </div>
        <div className="min-w-0">
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, lineHeight: 1.05, letterSpacing: '.06em' }}>Marifest</div>
          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,.5)', letterSpacing: '.2em', textTransform: 'uppercase', marginTop: 1, whiteSpace: 'nowrap' }}>Maritime Intelligence</div>
        </div>
      </div>

      {/* Sector switcher */}
      <div className="px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', padding: '0 4px 7px' }}>
          {t('sidebar.fleetSector')}
        </p>
        <button
          onClick={() => setSectorOpen((o) => !o)}
          className="w-full flex items-center justify-between"
          style={{ padding: '9px 12px', borderRadius: 11, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <span className="flex items-center gap-2.5">
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d={currentSector.icon} />
            </svg>
            {currentSector.label}
            {currentSector.vesselCount !== null && (
              <span style={{ color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>— {currentSector.vesselCount}</span>
            )}
          </span>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            style={{ transition: 'transform .2s', transform: sectorOpen ? 'rotate(180deg)' : 'none' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </button>

        {sectorOpen && (
          <div className="mt-1.5 overflow-hidden" style={{ borderRadius: 11, background: 'rgba(0,0,0,.18)', border: '1px solid rgba(255,255,255,.1)' }}>
            {FLEET_SECTORS.map((s) => {
              const active = activeSector === s.id;
              const soon = s.status === 'coming-soon';
              return (
                <button
                  key={s.id}
                  onClick={() => !soon && handleSectorSelect(s.id)}
                  disabled={soon}
                  className="w-full flex items-center justify-between"
                  style={{
                    padding: '9px 12px', fontSize: 12.5,
                    background: active ? 'rgba(255,255,255,.12)' : 'transparent',
                    color: soon ? 'rgba(255,255,255,.35)' : '#fff',
                    cursor: soon ? 'not-allowed' : 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,.06)',
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} style={{ opacity: .85 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                    </svg>
                    <span style={{ fontWeight: active ? 600 : 500 }}>{s.label}</span>
                  </span>
                  <span style={{ fontSize: 9, opacity: .55, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {s.status === 'live' ? '' : s.status === 'beta' ? 'beta' : 'soon'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const labelKey = item.href === '/fleet/cruise-lijnen'
            ? (activeSector === 'cruise' ? 'nav.cruiseLines' : 'nav.operators')
            : item.key;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3"
              style={{
                padding: '10px 12px', borderRadius: 11, fontSize: 14, fontWeight: 500,
                color: active ? '#fff' : 'rgba(255,255,255,.78)',
                background: active ? 'rgba(255,255,255,.13)' : 'transparent',
                transition: 'background .18s, color .18s',
              }}
            >
              <span style={{ flex: 'none', opacity: active ? 1 : .82 }}><NavIcon d={item.d} /></span>
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <a href="/api/auth/logout" className="flex items-center gap-3 mb-2"
          style={{ padding: '10px 12px', borderRadius: 11, fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,.8)', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H3" />
          </svg>
          Uitloggen
        </a>

        <div className="flex items-center gap-2.5" style={{ padding: '8px 10px', borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
          <div className="flex-none grid place-items-center" style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', color: 'var(--navy)', fontWeight: 700, fontSize: 13 }}>{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ fontWeight: 600, fontSize: 13 }}>{userName}</div>
            <div className="truncate" style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>{userEmail}</div>
          </div>
          <button onClick={cycleLanguage} title={`Language: ${language}`} aria-label="Switch language"
            className="flex-none grid place-items-center" style={{ width: 38, height: 30, borderRadius: 9, background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {LANG_FLAGS[language]}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col flex-none h-screen sticky top-0" style={{ width: 248 }}>
        {content}
      </aside>

      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
        className="md:hidden fixed top-4 left-4 z-50 grid place-items-center"
        style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--navy)', color: '#fff' }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(10,18,33,.55)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col" style={{ width: 264 }}>
            {content}
          </aside>
        </>
      )}
    </>
  );
}
