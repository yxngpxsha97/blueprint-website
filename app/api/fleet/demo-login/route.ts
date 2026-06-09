// Marifest — demo session. Sets a valid signed session cookie so the demo
// works without real auth / accounts. Replace with real Marifest auth later.
import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import type { Session } from '@/lib/types';

export async function POST() {
  const demo: Session = {
    org_id: 'demo-marifest',
    user_id: 'demo-marifest',
    role: 'owner',
    org_name: 'Marifest',
    user_name: 'Demo Operator',
    user_email: 'demo@marifest.app',
    // 'maritiem' grants /fleet (ships + vloot modules) but NOT /hq, which is gated
    // on sector === 'tech' in middleware.ts. Keeps the demo cookie out of Blueprint HQ.
    sector: 'maritiem',
    subscription_tier: 'enterprise',
    permissions: ['*'],
  };
  await setSessionCookie(demo);
  return NextResponse.json({ ok: true });
}
