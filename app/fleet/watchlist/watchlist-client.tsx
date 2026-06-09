'use client';

import { useState, useEffect, useCallback } from 'react';

interface VesselProfile {
  name: string | null;
  flag: string | null;
  vessel_type: string | null;
  built: string | null;
  class_society: string | null;
  gt: number | null;
  dwt: number | null;
  has_detention: boolean;
  total_deficiencies: number;
  certs_expiring_soon: boolean;
  equasis_fetched_at: string | null;
  equasis_error: string | null;
}

interface WatchlistVessel {
  id: string;
  imo: string;
  mmsi: string | null;
  custom_name: string | null;
  notes: string | null;
  added_at: string;
  vessel_profiles: VesselProfile | null;
}

function formatAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'zojuist';
  if (h < 24) return `${h}u geleden`;
  return `${Math.floor(h / 24)}d geleden`;
}

function FlagEmoji({ flag }: { flag: string | null }) {
  if (!flag) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>;
  return <span style={{ fontSize: 13, color: 'var(--muted)' }}>{flag}</span>;
}

export default function WatchlistClient() {
  const [vessels, setVessels] = useState<WatchlistVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imoInput, setImoInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [enrichingAll, setEnrichingAll] = useState(false);

  const loadVessels = useCallback(async () => {
    try {
      const res = await fetch('/api/fleet/watchlist');
      if (!res.ok) throw new Error('Failed to load watchlist');
      const data = await res.json();
      setVessels(data.vessels ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVessels(); }, [loadVessels]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const imo = imoInput.trim();
    if (!/^\d{7}$/.test(imo)) { setAddError('IMO must be exactly 7 digits'); return; }
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch('/api/fleet/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imo, custom_name: customName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? 'Failed to add vessel'); return; }
      setImoInput('');
      setCustomName('');
      await loadVessels();
    } catch { setAddError('Network error'); } finally { setAdding(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/fleet/watchlist?id=${id}`, { method: 'DELETE' });
    setVessels((v) => v.filter((x) => x.id !== id));
  }

  async function handleEnrich(vessel: WatchlistVessel) {
    setEnrichingIds((s) => new Set(s).add(vessel.id));
    try {
      await fetch(`/api/fleet/enrich?imo=${vessel.imo}`);
      await loadVessels();
    } finally {
      setEnrichingIds((s) => { const n = new Set(s); n.delete(vessel.id); return n; });
    }
  }

  async function handleEnrichAll() {
    const unenriched = vessels.filter((v) => !v.vessel_profiles?.equasis_fetched_at);
    if (unenriched.length === 0) return;
    setEnrichingAll(true);
    try {
      await fetch('/api/fleet/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imos: unenriched.map((v) => v.imo) }),
      });
      await loadVessels();
    } finally { setEnrichingAll(false); }
  }

  const unenrichedCount = vessels.filter((v) => !v.vessel_profiles?.equasis_fetched_at).length;

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', padding: '28px 24px' }}>
      {/* Page header */}
      <div className="fl-pagehead" style={{ maxWidth: 1100, marginBottom: 24 }}>
        <div>
          <span className="fl-eyebrow">Watchlist</span>
          <h1>Vessel Watchlist</h1>
          <p className="fl-sub">
            Track vessels and monitor their PSC, certification and ownership status via Equasis.
          </p>
        </div>
        {unenrichedCount > 0 && !loading && (
          <button
            onClick={handleEnrichAll}
            disabled={enrichingAll}
            className="fl-btn fl-btn--primary"
          >
            {enrichingAll ? (
              <>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  style={{ animation: 'fl-rot .7s linear infinite' }}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Verrijken...
              </>
            ) : (
              <>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Alles verrijken ({unenrichedCount})
              </>
            )}
          </button>
        )}
      </div>

      {/* Add vessel form */}
      <form
        onSubmit={handleAdd}
        className="fl-card"
        style={{
          maxWidth: 1100,
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 12,
          borderRadius: 'var(--r-lg)',
        }}
      >
        <div className="flex flex-col gap-1" style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            IMO-nummer
          </label>
          <input
            type="text"
            placeholder="bijv. 9074729"
            value={imoInput}
            onChange={(e) => setImoInput(e.target.value.replace(/\D/g, '').slice(0, 7))}
            className="fl-input fl-mono"
            style={addError ? { borderColor: 'var(--dang)' } : undefined}
          />
        </div>
        <div className="flex flex-col gap-1" style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Aangepaste naam (optioneel)
          </label>
          <input
            type="text"
            placeholder="bijv. Cliënt Tanker A"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="fl-input"
          />
        </div>
        <div className="flex flex-col gap-1">
          {/* invisible label to align button to input baseline */}
          <span style={{ fontSize: 11, color: 'transparent', userSelect: 'none' }}>x</span>
          <button
            type="submit"
            disabled={adding || imoInput.length !== 7}
            className="fl-btn fl-btn--primary"
          >
            {adding ? 'Toevoegen...' : '+ Vaartuig toevoegen'}
          </button>
        </div>
        {addError && (
          <div style={{ width: '100%', fontSize: 12, color: 'var(--dang)', fontWeight: 500 }}>{addError}</div>
        )}
      </form>

      {/* Vessels list */}
      {loading ? (
        <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
          <div className="fl-spinner" />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Watchlist laden...</span>
        </div>
      ) : error ? (
        <div
          className="fl-tablewrap"
          style={{ maxWidth: 1100 }}
        >
          <div className="fl-empty" style={{ color: 'var(--dang)' }}>{error}</div>
        </div>
      ) : vessels.length === 0 ? (
        <div
          className="fl-tablewrap"
          style={{
            maxWidth: 1100,
            border: '1px dashed var(--line)',
          }}
        >
          <div className="fl-empty" style={{ padding: '56px 20px' }}>
            <svg
              width="44" height="44"
              fill="none" viewBox="0 0 24 24"
              stroke="var(--navy)" strokeWidth={1}
              style={{ opacity: 0.22, marginBottom: 14, display: 'block', margin: '0 auto 14px' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Geen vaartuigen in watchlist</p>
            <p style={{ fontSize: 13 }}>Voeg een vaartuig toe via het IMO-nummer hierboven om het te monitoren.</p>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {vessels.map((v) => {
            const profile = v.vessel_profiles;
            const displayName = v.custom_name || profile?.name || null;
            const isDetained = profile?.has_detention ?? false;
            const hasDeficiencies = (profile?.total_deficiencies ?? 0) > 0;
            const certsWarning = profile?.certs_expiring_soon ?? false;
            const enriched = !!profile?.equasis_fetched_at;
            const isEnriching = enrichingIds.has(v.id);

            return (
              <div
                key={v.id}
                className="fl-card"
                style={{
                  borderRadius: 'var(--r-lg)',
                  borderColor: isDetained
                    ? 'rgba(176,74,56,.38)'
                    : certsWarning
                    ? 'rgba(154,122,46,.38)'
                    : 'var(--line)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  outline: isDetained ? '1px solid rgba(176,74,56,.14)' : undefined,
                }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  {/* Left: identity */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                      <span className="fl-pill fl-mono" style={{ fontSize: 11 }}>
                        IMO {v.imo}
                      </span>
                      {v.mmsi && (
                        <span className="fl-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                          MMSI {v.mmsi}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
                      {displayName ?? (
                        <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontWeight: 400 }}>
                          Verrijking uitstaand
                        </span>
                      )}
                    </div>
                    {v.custom_name && profile?.name && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Equasis: {profile.name}</div>
                    )}
                    <div className="flex items-center gap-3" style={{ marginTop: 4 }}>
                      <FlagEmoji flag={profile?.flag ?? null} />
                      {profile?.vessel_type && (
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{profile.vessel_type}</span>
                      )}
                    </div>
                  </div>

                  {/* Center: PSC status badges */}
                  <div className="flex flex-wrap items-center gap-2" style={{ paddingTop: 2 }}>
                    {!enriched ? (
                      <span className="fl-badge fl-badge--neu">Niet verrijkt</span>
                    ) : (
                      <>
                        {isDetained && (
                          <span className="fl-badge fl-badge--dang">Vastgehouden</span>
                        )}
                        {hasDeficiencies && (
                          <span className="fl-badge fl-badge--warn">
                            {profile!.total_deficiencies} tekortkomingen
                          </span>
                        )}
                        {!isDetained && !hasDeficiencies && (
                          <span className="fl-badge fl-badge--ok">PSC Schoon</span>
                        )}
                        {certsWarning ? (
                          <span className="fl-badge fl-badge--warn">Certs verlopen binnenkort</span>
                        ) : (
                          <span className="fl-badge fl-badge--ok">Certs OK</span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right: fetch age + actions */}
                  <div
                    className="flex flex-col items-end gap-2"
                    style={{ marginLeft: 'auto' }}
                  >
                    <div className="flex items-center gap-2">
                      {!enriched && (
                        <button
                          onClick={() => handleEnrich(v)}
                          disabled={isEnriching}
                          className="fl-btn fl-btn--ghost fl-btn--sm"
                        >
                          {isEnriching ? (
                            <>
                              <span
                                style={{
                                  width: 12, height: 12,
                                  border: '1.5px solid var(--navy)',
                                  borderTopColor: 'transparent',
                                  borderRadius: '50%',
                                  display: 'inline-block',
                                  animation: 'fl-rot .7s linear infinite',
                                  flexShrink: 0,
                                }}
                              />
                              Verrijken...
                            </>
                          ) : (
                            'Verrijken →'
                          )}
                        </button>
                      )}
                      <a
                        href={`https://www.equasis.org/EquasisWeb/restricted/ShipInfo?P_IMO=${v.imo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fl-btn fl-btn--ghost fl-btn--sm"
                      >
                        Equasis ↗
                      </a>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="fl-iconbtn"
                        style={{ width: 34, height: 34, color: 'var(--dang)' }}
                        title="Verwijder uit watchlist"
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                    {enriched && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Bijgewerkt {formatAge(profile!.equasis_fetched_at!)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom row: vessel detail metadata */}
                {enriched && (profile?.class_society || profile?.built || profile?.gt || profile?.dwt) && (
                  <div
                    className="flex flex-wrap gap-5"
                    style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-2)' }}
                  >
                    {profile?.class_society && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                          Klasse
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                          {profile.class_society}
                        </div>
                      </div>
                    )}
                    {profile?.built && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                          Gebouwd
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                          {profile.built}
                        </div>
                      </div>
                    )}
                    {profile?.gt && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                          GT
                        </div>
                        <div className="fl-num" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                          {profile.gt.toLocaleString('en-US')}
                        </div>
                      </div>
                    )}
                    {profile?.dwt && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                          DWT
                        </div>
                        <div className="fl-num" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                          {profile.dwt.toLocaleString('en-US')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
