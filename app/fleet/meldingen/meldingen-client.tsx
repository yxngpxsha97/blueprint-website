'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type AlertType =
  | 'psc_detention'
  | 'psc_deficiencies'
  | 'cert_expiry_30d'
  | 'cert_expiry_60d'
  | 'cert_expiry_90d'
  | 'ownership_change'
  | 'flag_change'
  | 'class_change';

type Severity = 'high' | 'medium' | 'low';

interface VesselAlert {
  id: string;
  imo: string;
  vessel_name: string;
  alert_type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  data: Record<string, unknown>;
  is_read: boolean;
  is_dismissed: boolean;
  detected_at: string;
}

function formatAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 2) return 'zojuist';
  if (m < 60) return `${m}m geleden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}u geleden`;
  return `${Math.floor(h / 24)}d geleden`;
}

const ALERT_LABELS: Record<AlertType, string> = {
  psc_detention: 'PSC Detention',
  psc_deficiencies: 'PSC Deficiencies',
  cert_expiry_30d: 'Certificate Expiry (30d)',
  cert_expiry_60d: 'Certificate Expiry (60d)',
  cert_expiry_90d: 'Certificate Expiry (90d)',
  ownership_change: 'Ownership Change',
  flag_change: 'Flag Change',
  class_change: 'Class Change',
};

// Severity → design-system semantic token names
const SEVERITY_BADGE_CLASS: Record<Severity, string> = {
  high: 'fl-badge fl-badge--dang',
  medium: 'fl-badge fl-badge--warn',
  low: 'fl-badge fl-badge--info',
};

// Left accent border colour (inline var refs, no hardcoded hex)
const SEVERITY_BORDER_VAR: Record<Severity, string> = {
  high: 'var(--dang)',
  medium: 'var(--warn)',
  low: 'var(--info)',
};

// Icon tile background tint
const SEVERITY_TILE_BG: Record<Severity, string> = {
  high: 'var(--dang-soft)',
  medium: 'var(--warn-soft)',
  low: 'var(--info-soft)',
};

// Icon colour inside tile
const SEVERITY_ICON_COLOR: Record<Severity, string> = {
  high: 'var(--dang)',
  medium: 'var(--warn)',
  low: 'var(--info)',
};

function AlertIcon({ type }: { type: AlertType }) {
  if (type === 'psc_detention' || type === 'psc_deficiencies') {
    return (
      <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    );
  }
  if (type.startsWith('cert_')) {
    return (
      <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.064.097 1.876 1.076 1.876 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
      </svg>
    );
  }
  return (
    <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}

type TabId = 'all' | 'high' | 'medium' | 'low' | 'unread';

export default function MeldingenClient() {
  const [alerts, setAlerts] = useState<VesselAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [tab, setTab] = useState<TabId>('all');
  const [actionIds, setActionIds] = useState<Set<string>>(new Set());
  const [scanResult, setScanResult] = useState<{ created: number; scanned: number } | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/fleet/alerts?limit=100');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAlerts(data.alerts ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  async function handleScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/fleet/alerts/scan', { method: 'POST' });
      const data = await res.json();
      setScanResult({ created: data.created ?? 0, scanned: data.scanned ?? 0 });
      await loadAlerts();
    } finally { setScanning(false); }
  }

  async function handleAction(id: string, action: 'read' | 'dismiss') {
    setActionIds((s) => new Set(s).add(id));
    try {
      await fetch('/api/fleet/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (action === 'dismiss') {
        setAlerts((a) => a.filter((x) => x.id !== id));
      } else {
        setAlerts((a) => a.map((x) => x.id === id ? { ...x, is_read: true } : x));
      }
    } finally {
      setActionIds((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  }

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const filtered = alerts.filter((a) => {
    if (tab === 'all') return true;
    if (tab === 'unread') return !a.is_read;
    return a.severity === tab;
  });

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'all', label: 'Alle', count: alerts.length },
    { id: 'unread', label: 'Ongelezen', count: unreadCount },
    { id: 'high', label: 'Hoog', count: alerts.filter((a) => a.severity === 'high').length },
    { id: 'medium', label: 'Middel', count: alerts.filter((a) => a.severity === 'medium').length },
    { id: 'low', label: 'Laag', count: alerts.filter((a) => a.severity === 'low').length },
  ];

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', padding: '28px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="fl-pagehead" style={{ marginBottom: 20 }}>
          <div>
            <span className="fl-eyebrow">Meldingen</span>
            <h1>Vaartuig Meldingen</h1>
            <p className="fl-sub">
              PSC-aanhoudingen, certificaatvervaldatums en compliance-events van uw watchlist-vaartuigen.
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="fl-btn fl-btn--primary"
            style={{ flexShrink: 0, marginLeft: 8 }}
          >
            {scanning ? (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ animation: 'fl-rot .7s linear infinite' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Scannen…
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                Nu scannen
              </>
            )}
          </button>
        </div>

        {/* ── Scan result banner ──────────────────────────────────── */}
        {scanResult && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5 text-sm"
            style={{
              background: scanResult.created > 0 ? 'var(--warn-soft)' : 'var(--ok-soft)',
              border: `1px solid ${scanResult.created > 0 ? 'rgba(154,122,46,.28)' : 'rgba(46,125,84,.22)'}`,
              color: scanResult.created > 0 ? 'var(--warn)' : 'var(--ok)',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              {scanResult.created > 0
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l8.354 12.748Z" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              }
            </svg>
            {scanResult.created > 0
              ? `Scan afgerond — ${scanResult.created} nieuwe melding${scanResult.created !== 1 ? 'en' : ''} gevonden uit ${scanResult.scanned} vaartuigen.`
              : `Scan afgerond — geen nieuwe meldingen uit ${scanResult.scanned} vaartuigen. Alles in orde.`}
          </div>
        )}

        {/* ── Filter tabs ─────────────────────────────────────────── */}
        <div className="fl-tabs" style={{ marginBottom: 20 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`fl-tab${tab === t.id ? ' active' : ''}`}
            >
              {t.label}
              {(t.count ?? 0) > 0 && (
                <span className="n">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ─────────────────────────────────────────────── */}
        {loading ? (
          /* Loading state */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="fl-spinner" style={{ marginBottom: 16 }} />
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Meldingen laden…</p>
          </div>
        ) : alerts.length === 0 ? (
          /* Empty state — no alerts at all */
          <div className="fl-card fl-empty" style={{ border: '1px dashed var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px' }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="var(--navy)" strokeWidth={1} style={{ opacity: .25, marginBottom: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Nog geen meldingen</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', maxWidth: 300, marginBottom: 20 }}>
              Voeg vaartuigen toe aan uw{' '}
              <Link href="/fleet/watchlist" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>watchlist</Link>
              {' '}en klik op &ldquo;Nu scannen&rdquo; om te controleren op PSC-aanhoudingen en certificaatproblemen.
            </p>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="fl-btn fl-btn--primary fl-btn--sm"
            >
              {scanning ? 'Scannen…' : 'Nu scannen'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state — filter has no results */
          <div className="fl-card" style={{ padding: '48px 24px' }}>
            <p className="fl-empty" style={{ padding: 0 }}>Geen meldingen in deze categorie.</p>
          </div>
        ) : (
          /* Alert list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((alert) => {
              const inAction = actionIds.has(alert.id);
              return (
                <div
                  key={alert.id}
                  className="fl-card"
                  style={{
                    borderLeft: `3px solid ${SEVERITY_BORDER_VAR[alert.severity]}`,
                    borderRadius: 'var(--r-md)',
                    opacity: inAction ? 0.55 : alert.is_read ? 0.62 : 1,
                    transition: 'opacity .18s',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

                    {/* Icon tile */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: SEVERITY_TILE_BG[alert.severity],
                        display: 'grid',
                        placeItems: 'center',
                        color: SEVERITY_ICON_COLOR[alert.severity],
                        marginTop: 1,
                      }}
                    >
                      <AlertIcon type={alert.alert_type} />
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        {!alert.is_read && (
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: SEVERITY_BORDER_VAR[alert.severity],
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', lineHeight: 1.3 }}>
                          {alert.title}
                        </span>
                        {/* Severity badge */}
                        <span className={SEVERITY_BADGE_CLASS[alert.severity]}>
                          {alert.severity === 'high' ? 'Hoog' : alert.severity === 'medium' ? 'Middel' : 'Laag'}
                        </span>
                        {/* IMO pill */}
                        <span className="fl-pill fl-mono" style={{ fontSize: 11 }}>
                          IMO {alert.imo}
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.45 }}>
                        {alert.description}
                      </p>

                      {/* Meta row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                        <span>{formatAge(alert.detected_at)}</span>
                        <span style={{ color: 'var(--muted-d)', userSelect: 'none' }}>·</span>
                        <span>{ALERT_LABELS[alert.alert_type]}</span>
                        <span style={{ color: 'var(--muted-d)', userSelect: 'none' }}>·</span>
                        <Link
                          href="/fleet/watchlist"
                          style={{ color: 'var(--navy)', fontWeight: 600 }}
                        >
                          Bekijk op Watchlist
                        </Link>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {!alert.is_read && (
                        <button
                          onClick={() => handleAction(alert.id, 'read')}
                          disabled={inAction}
                          className="fl-btn fl-btn--ghost fl-btn--sm"
                        >
                          Gelezen
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(alert.id, 'dismiss')}
                        disabled={inAction}
                        className="fl-btn fl-btn--danger fl-btn--sm"
                        title="Verwijder melding"
                      >
                        {/* X icon */}
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
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
