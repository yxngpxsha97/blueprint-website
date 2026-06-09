'use client';

// ============================================================================
// Marifest — standalone entry. Real accounts (Supabase Auth via /api/marifest/auth)
// with login + signup, plus a one-click demo. Navy maritime, decoupled from Blueprint.
// ============================================================================

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const plan = params.get('plan') || undefined;

  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/marifest/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, email, password, name, plan }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Er ging iets mis'); setLoading(false); return; }
      router.push(redirect);
    } catch {
      setError('Verbinding mislukt. Probeer het opnieuw.'); setLoading(false);
    }
  }

  async function openDemo() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/fleet/demo-login', { method: 'POST' });
      if (!res.ok) throw new Error();
      router.push(redirect);
    } catch { setError('Kon de demo niet starten.'); setLoading(false); }
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '12px 14px', marginBottom: 10, fontSize: 14.5,
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.16)',
    borderRadius: 11, color: '#fff', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: "'Inter',system-ui,sans-serif", background: 'radial-gradient(120% 90% at 50% -10%, #1B4068, #0F2A47 55%, #0A1E33)' }}>
      <div style={{ width: '100%', maxWidth: 416, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, margin: '0 auto 14px', display: 'grid', placeItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marifest-emblem.png" alt="Marifest" style={{ width: 66, height: 66, objectFit: 'contain' }} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 28, color: '#fff', lineHeight: 1 }}>Marifest</div>
        <p style={{ marginTop: 9, fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>Maritime Intelligence</p>

        {/* Login / Signup toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.06)', borderRadius: 11, padding: 4, margin: '22px auto 16px', maxWidth: 320 }}>
          {(['login', 'signup'] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{ flex: 1, padding: '9px 0', fontSize: 13.5, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#0F2A47' : 'rgba(255,255,255,.7)' }}>
              {m === 'login' ? 'Inloggen' : 'Account maken'}
            </button>
          ))}
        </div>

        {error && <div style={{ background: 'rgba(176,74,56,.18)', border: '1px solid rgba(176,74,56,.4)', color: '#FFD9D2', padding: '10px 14px', borderRadius: 11, fontSize: 13, marginBottom: 12, maxWidth: 320, marginInline: 'auto' }}>{error}</div>}

        <form onSubmit={submit} style={{ maxWidth: 320, margin: '0 auto' }}>
          {mode === 'signup' && (
            <input style={input} placeholder="Naam" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          )}
          <input style={input} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <input style={input} type="password" placeholder={mode === 'signup' ? 'Wachtwoord (min. 8 tekens)' : 'Wachtwoord'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required />
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px 18px', marginTop: 4, background: '#fff', color: '#0F2A47', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, boxShadow: '0 14px 34px rgba(0,0,0,.3)' }}>
            {loading ? 'Bezig…' : mode === 'signup' ? 'Account maken →' : 'Inloggen →'}
          </button>
        </form>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 320, marginInline: 'auto' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.4)' }}>of</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
        </div>
        <button onClick={openDemo} disabled={loading}
          style={{ width: '100%', maxWidth: 320, marginTop: 14, padding: '12px 18px', background: 'transparent', color: 'rgba(255,255,255,.85)', fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,.22)', borderRadius: 13, cursor: 'pointer' }}>
          Demo openen — geen account nodig
        </button>
      </div>
    </div>
  );
}
