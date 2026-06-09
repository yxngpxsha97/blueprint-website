// ============================================================================
// Marifest — real account auth (Supabase Auth on the Marifest project).
// signup/login verify against Supabase GoTrue, then we issue the app's signed
// `bp_session` cookie (sector 'maritiem' → grants /fleet, not /hq) bridged to
// the existing middleware gate. No extra paid services — Supabase Auth is free.
// ============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import type { Session } from '@/lib/types';

const SUPA_URL = process.env.MARIFEST_SUPABASE_URL || 'https://bwegtwleqyfuyfkaluki.supabase.co';
const ANON = process.env.MARIFEST_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZWd0d2xlcXlmdXlma2FsdWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTM5MzUsImV4cCI6MjA5NjU2OTkzNX0.aH47GDjg_EZz3eRWXeB8TC3T5deBfZkSpxxoDLRU2EE';

// marketing plan → subscription tier
const TIER: Record<string, Session['subscription_tier']> = {
  free: 'starter', explorer: 'starter',
  pro: 'professional', professional: 'professional',
  business: 'enterprise', enterprise: 'enterprise',
};

async function issueSession(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }, plan?: string) {
  const name = (user.user_metadata?.name as string) || (user.email?.split('@')[0] ?? 'Operator');
  const session: Session = {
    org_id: user.id,
    user_id: user.id,
    role: 'owner',
    org_name: 'Marifest',
    user_name: name,
    user_email: user.email ?? '',
    sector: 'maritiem',
    subscription_tier: TIER[(plan || (user.user_metadata?.plan as string) || 'free').toLowerCase()] || 'starter',
    permissions: ['*'],
  };
  await setSessionCookie(session);
}

export async function POST(req: NextRequest) {
  let body: { action?: string; email?: string; password?: string; name?: string; plan?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 }); }
  const { action, email, password, name, plan } = body;

  if (!email || !password) return NextResponse.json({ error: 'E-mail en wachtwoord zijn vereist' }, { status: 400 });
  if (action === 'signup' && password.length < 8) return NextResponse.json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' }, { status: 400 });

  try {
    if (action === 'signup') {
      const res = await fetch(`${SUPA_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { apikey: ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, data: { name: name || '', plan: plan || 'free' } }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = /registered|already/i.test(json.msg || json.error_description || '') ? 'Dit e-mailadres is al geregistreerd' : (json.msg || json.error_description || 'Registratie mislukt');
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      const user = json.user || json; // autoconfirm returns user (and a session)
      await issueSession(user, plan);
      return NextResponse.json({ ok: true });
    }

    // login (default)
    const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.user) {
      return NextResponse.json({ error: 'Onjuist e-mailadres of wachtwoord' }, { status: 401 });
    }
    await issueSession(json.user);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Authenticatie tijdelijk niet beschikbaar' }, { status: 500 });
  }
}
