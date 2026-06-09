// ============================================================================
// Marifest — Stripe webhook (scaffold). Receives subscription lifecycle events
// and upgrades/downgrades the user's tier. Signature verification + the tier
// write are stubbed until the owner adds STRIPE_WEBHOOK_SECRET and decides where
// subscription state lives (a `subscriptions` table keyed by client_reference_id).
// ============================================================================
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();

  // TODO: verify the Stripe-Signature header against `secret` (HMAC-SHA256 of
  // `${timestamp}.${raw}`) before trusting the event. Skipped until secret is set.
  if (!secret) {
    return NextResponse.json({ received: true, note: 'STRIPE_WEBHOOK_SECRET not set — verification skipped' });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad payload' }, { status: 400 }); }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // TODO: map event.data.object.client_reference_id → user, write their tier
      // to a `subscriptions` table, and reflect it in the session on next login.
      break;
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
