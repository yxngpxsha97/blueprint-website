'use client';

// ============================================================================
// Marifest — Ship Detail
// Deep-linkable vessel page. Pulls the ship from the 95k registry, its live
// AIS position, and Equasis compliance enrichment. Navy `fl-` house style.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useFleetLanguage } from '@/lib/fleet-i18n';
import { fmtInt, fmtMeters, fmtYear } from '@/lib/registry-ship';
import type { RegistryShip } from '@/lib/registry-ship';

interface LivePosition {
  imo: string;
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: string;
  destination: string;
  source: string;
}

interface EquasisData {
  imo: string;
  flag?: string;
  class?: string;
  type?: string;
  built?: string;
  inspections?: Array<{ detained: boolean; deficiencies: number }>;
  error?: string;
}

const statusNL: Record<string, string> = {
  underway: 'Onderweg',
  moored: 'Afgemeerd',
  anchored: 'Geankerd',
};

function statusBadgeClass(status?: string): string {
  if (status === 'underway') return 'fl-badge fl-badge--ok';
  if (status === 'anchored') return 'fl-badge fl-badge--warn';
  if (status === 'moored') return 'fl-badge fl-badge--info';
  return 'fl-badge fl-badge--neu';
}

// Spec row helper
function KV({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="fl-kv">
      {rows.map(({ label, value }) => (
        <div key={label} style={{ display: 'contents' }}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ShipDetailClient({ imo }: { imo: string }) {
  const { t } = useFleetLanguage();

  const [ship, setShip] = useState<RegistryShip | null>(null);
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [equasis, setEquasis] = useState<EquasisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // Watchlist state
  const [watchState, setWatchState] = useState<'idle' | 'adding' | 'added' | 'error'>('idle');
  const [watchMsg, setWatchMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      // 1) Ship from registry (search by IMO returns exact match)
      const shipRes = await fetch(`/api/fleet/ships?q=${encodeURIComponent(imo)}&limit=1`, { cache: 'no-store' })
        .then((r) => r.json())
        .catch(() => ({ data: [] }));
      const found: RegistryShip | undefined = (shipRes.data ?? []).find(
        (s: RegistryShip) => String(s.imo) === String(imo)
      ) ?? (shipRes.data ?? [])[0];

      if (!found) {
        setNotFound(true);
        setShip(null);
        return;
      }
      setShip(found);

      // 2) Live position — match by imo or mmsi (fire-and-forget; non-blocking failures)
      fetch('/api/fleet/positions', { cache: 'no-store' })
        .then((r) => r.json())
        .then((pos) => {
          const list: LivePosition[] = pos.data ?? [];
          const match = list.find(
            (p) => String(p.imo) === String(found.imo) ||
              (found.mmsi != null && String(p.mmsi) === String(found.mmsi))
          );
          setPosition(match ?? null);
        })
        .catch(() => setPosition(null));

      // 3) Equasis enrichment (7-digit IMO only)
      if (/^\d{7}$/.test(String(found.imo))) {
        fetch(`/api/fleet/equasis?imo=${found.imo}`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((eq) => { if (eq && !eq.error) setEquasis(eq as EquasisData); })
          .catch(() => { /* enrichment optional */ });
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [imo]);

  useEffect(() => { load(); }, [load]);

  async function addToWatchlist() {
    if (!ship || watchState === 'adding' || watchState === 'added') return;
    setWatchState('adding');
    setWatchMsg(null);
    try {
      const res = await fetch('/api/fleet/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imo: String(ship.imo),
          mmsi: ship.mmsi != null ? String(ship.mmsi) : undefined,
          custom_name: ship.name,
        }),
      });
      if (res.ok) {
        setWatchState('added');
      } else {
        const data = await res.json().catch(() => ({}));
        // 409 = already on the list → treat as "added"
        if (res.status === 409) { setWatchState('added'); }
        else { setWatchState('error'); setWatchMsg(data.error ?? 'Error'); }
      }
    } catch {
      setWatchState('error');
      setWatchMsg('Network error');
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="fl-spinner" />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !ship) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ minHeight: '100vh', background: 'var(--paper)', padding: 24 }}>
        <h2 style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>{t('detail.notFound')}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>{t('detail.notFoundDesc')}</p>
        <Link href="/fleet/vloot" className="fl-btn fl-btn--ghost">{t('detail.backToFleet')}</Link>
      </div>
    );
  }

  const sectorLabel = t(`sector.${ship.sector}`) !== `sector.${ship.sector}` ? t(`sector.${ship.sector}`) : ship.sector;
  const hasImage = ship.image_url && !imgFailed;

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Back link */}
        <Link
          href="/fleet/vloot"
          className="fl-btn fl-btn--ghost fl-btn--sm"
          style={{ marginBottom: 18 }}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('detail.backToFleet')}
        </Link>

        {/* Hero: photo + identity */}
        <div className="fl-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* Photo / fallback */}
            <div
              style={{
                flex: '1 1 340px', minHeight: 220, position: 'relative',
                background: hasImage ? '#000' : 'linear-gradient(135deg,var(--navy-2),var(--navy) 50%,var(--navy-3))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ship.image_url as string}
                  alt={ship.name}
                  onError={() => setImgFailed(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                />
              ) : (
                <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,.55)" strokeWidth={1.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </div>

            {/* Identity panel */}
            <div style={{ flex: '1 1 340px', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span className="fl-eyebrow">{sectorLabel}</span>
                <h1 style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 'clamp(1.4rem,3vw,1.9rem)', color: 'var(--ink)', marginTop: 8, lineHeight: 1.1 }}>
                  {ship.name}
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4 }}>
                  IMO <span className="fl-num">{ship.imo}</span>
                  {ship.mmsi != null && <> · MMSI <span className="fl-num">{ship.mmsi}</span></>}
                </p>
              </div>

              {position && (
                <div>
                  <span className={statusBadgeClass(position.status)}>
                    {statusNL[position.status] ?? position.status}
                    {position.status === 'underway' && (
                      <span className="fl-num" style={{ opacity: .75 }}> — {position.speed} kn</span>
                    )}
                  </span>
                </div>
              )}

              {/* Add to watchlist */}
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className={`fl-btn ${watchState === 'added' ? 'fl-btn--ghost' : 'fl-btn--primary'}`}
                  onClick={addToWatchlist}
                  disabled={watchState === 'adding' || watchState === 'added'}
                >
                  {watchState === 'added' ? (
                    <>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {t('detail.addedToWatchlist')}
                    </>
                  ) : watchState === 'adding' ? (
                    t('detail.adding')
                  ) : (
                    <>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                      {t('detail.addToWatchlist')}
                    </>
                  )}
                </button>
                {watchState === 'error' && watchMsg && (
                  <span style={{ color: 'var(--dang)', fontSize: 12.5 }}>{watchMsg}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spec grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>

          {/* Identity */}
          <div className="fl-card">
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--ink)', marginBottom: 12 }}>{t('detail.identity')}</h3>
            <KV rows={[
              { label: t('ship.imo'), value: <span className="fl-num">{ship.imo}</span> },
              { label: t('common.mmsi'), value: ship.mmsi != null ? <span className="fl-num">{ship.mmsi}</span> : '—' },
              { label: t('detail.sector'), value: sectorLabel },
              { label: t('detail.typeCode'), value: ship.ship_type_code || '—' },
              { label: t('ship.built'), value: fmtYear(ship.built) },
            ]} />
          </div>

          {/* Dimensions */}
          <div className="fl-card">
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--ink)', marginBottom: 12 }}>{t('detail.dimensions')}</h3>
            <KV rows={[
              { label: t('ship.gt'), value: <span className="fl-num">{fmtInt(ship.gross_tonnage)}</span> },
              { label: t('detail.length'), value: fmtMeters(ship.length_m) },
              { label: t('detail.beam'), value: fmtMeters(ship.beam_m) },
              { label: t('detail.draught'), value: fmtMeters(ship.draught_m) },
            ]} />
          </div>

          {/* Ownership & registry */}
          <div className="fl-card">
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--ink)', marginBottom: 12 }}>{t('detail.ownership')}</h3>
            <KV rows={[
              { label: t('detail.operator'), value: ship.operator || '—' },
              { label: t('ship.owner'), value: ship.owner || '—' },
              { label: t('detail.builder'), value: ship.builder || '—' },
              { label: t('common.flag'), value: ship.flag || '—' },
              { label: t('detail.homePort'), value: ship.home_port || '—' },
            ]} />
          </div>

          {/* Live position */}
          <div className="fl-card">
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--ink)', marginBottom: 12 }}>{t('detail.livePosition')}</h3>
            {position ? (
              <>
                <KV rows={[
                  { label: t('common.status'), value: statusNL[position.status] ?? position.status },
                  { label: t('common.speed'), value: <span className="fl-num">{position.speed} kn</span> },
                  { label: t('detail.heading'), value: <span className="fl-num">{position.heading}°</span> },
                  { label: t('detail.lat'), value: <span className="fl-num">{position.lat.toFixed(4)}</span> },
                  { label: t('detail.lng'), value: <span className="fl-num">{position.lng.toFixed(4)}</span> },
                  { label: t('ship.destination'), value: position.destination || '—' },
                ]} />
                <a
                  href={`https://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lng}#map=7/${position.lat}/${position.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fl-btn fl-btn--ghost fl-btn--sm"
                  style={{ marginTop: 12 }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  Open in map
                </a>
              </>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('detail.noPosition')}</p>
            )}
          </div>

          {/* Compliance (Equasis) — only when enrichment returned */}
          {equasis && (
            <div className="fl-card">
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--ink)', marginBottom: 12 }}>{t('detail.complianceTitle')}</h3>
              <KV rows={[
                { label: t('detail.classSociety'), value: equasis.class || '—' },
                {
                  label: t('detail.detentions'),
                  value: (
                    <span className="fl-num">
                      {(equasis.inspections ?? []).filter((i) => i.detained).length}
                    </span>
                  ),
                },
                {
                  label: t('detail.deficiencies'),
                  value: (
                    <span className="fl-num">
                      {(equasis.inspections ?? []).reduce((a, i) => a + (i.deficiencies || 0), 0)}
                    </span>
                  ),
                },
              ]} />
            </div>
          )}
        </div>

        {/* Source note */}
        {position?.source && (
          <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 18 }}>
            {position.source === 'live' ? t('ship.positionLive') : t('ship.positionSimulated')}
          </p>
        )}
      </div>
    </div>
  );
}
