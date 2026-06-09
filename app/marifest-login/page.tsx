'use client';

// ============================================================================
// Marifest — standalone entry (demo). Navy maritime, decoupled from Blueprint.
// For now: a demo session. Real accounts / subscriptions come later.
// ============================================================================

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function MarifestEntry() {
  return (
    <Suspense>
      <Entry />
    </Suspense>
  );
}

function Entry() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/fleet';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function openDemo() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/fleet/demo-login', { method: 'POST' });
      if (!res.ok) throw new Error();
      router.push(redirect);
    } catch {
      setError('Kon de demo niet starten. Probeer het opnieuw.');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: "'Inter',system-ui,sans-serif", background: 'radial-gradient(120% 90% at 50% -10%, #1B4068, #0F2A47 55%, #0A1E33)' }}>
      <div style={{ width: '100%', maxWidth: 416, textAlign: 'center' }}>
        {/* Brand */}
        <div style={{ width: 80, height: 80, margin: '0 auto 16px', display: 'grid', placeItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marifest-emblem.png" alt="Marifest" style={{ width: 72, height: 72, objectFit: 'contain' }} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 30, letterSpacing: '.01em', color: '#fff', lineHeight: 1 }}>Marifest</div>
        <p style={{ marginTop: 10, fontSize: 13, letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>Maritime Intelligence</p>
        <p style={{ marginTop: 18, fontSize: 14.5, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', maxWidth: 360, marginInline: 'auto' }}>
          Live vloot- &amp; scheepsintelligentie — zoek elk schip op IMO, volg posities en bekijk specificaties per sector.
        </p>

        <div style={{ marginTop: 26 }}>
          {error && <div style={{ background: 'rgba(176,74,56,.18)', border: '1px solid rgba(176,74,56,.4)', color: '#FFD9D2', padding: '10px 14px', borderRadius: 11, fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button onClick={openDemo} disabled={loading}
            style={{ width: '100%', maxWidth: 320, padding: '14px 18px', background: '#fff', color: '#0F2A47', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, boxShadow: '0 14px 34px rgba(0,0,0,.3)' }}>
            {loading ? 'Bezig…' : 'Demo openen →'}
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,.4)' }}>Eigen account &amp; abonnement — binnenkort</p>
      </div>
    </div>
  );
}
