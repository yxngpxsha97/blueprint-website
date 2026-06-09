// ============================================================================
// Marifest — Stripe Checkout (scaffold). Creates a subscription Checkout Session
// for a plan. Uses Stripe's REST API directly (no SDK dependency). Env-gated:
// returns "not configured" until the owner adds Stripe keys + price IDs.
//
// Needs (Vercel env): STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_BUSINESS,
// and optionally NEXT_PUBLIC_APP_URL for success/cancel redirects.
// ============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const PRICE: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  professional: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS,
  enterprise: process.env.STRIPE_PRICE_BUSINESS,
};

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'payments_not_configured', message: 'Stripe is nog niet ingesteld. Voeg STRIPE_SECRET_KEY + price IDs toe in de omgeving.' },
      { status: 501 },
    );
  }

  let body: { plan?: string }; try { body = await req.json(); } catch { body = {}; }
  const plan = (body.plan || 'pro').toLowerCase();
  const price = PRICE[plan];
  if (!price) return NextResponse.json({ error: 'unknown_plan', message: `Geen price ID voor plan "${plan}"` }, { status: 400 });

  const session = await getSession();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  // Stripe Checkout Session via REST (application/x-www-form-urlencoded)
  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('line_items[0][price]', price);
  form.set('line_items[0][quantity]', '1');
  form.set('success_url', `${appUrl}/fleet?upgraded=1`);
  form.set('cancel_url', `${appUrl}/fleet/abonnement?canceled=1`);
  form.set('allow_promotion_codes', 'true');
  if (session?.user_email) form.set('customer_email', session.user_email);
  if (session?.user_id) form.set('client_reference_id', session.user_id);

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const json = await res.json();
    if (!res.ok) return NextResponse.json({ error: 'stripe_error', message: json.error?.message || 'Checkout mislukt' }, { status: 400 });
    return NextResponse.json({ url: json.url });
  } catch {
    return NextResponse.json({ error: 'stripe_unreachable' }, { status: 502 });
  }
}
