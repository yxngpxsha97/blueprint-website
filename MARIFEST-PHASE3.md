# Marifest — Phase 3: Accounts & Payments

## Auth — ✅ FUNCTIONAL (no extra services needed)
Real Marifest accounts run on **Supabase Auth** on the Marifest project (`bwegtwleqyfuyfkaluki`), bridged to the app's signed `bp_session` cookie.
- **Entry page:** `/marifest-login` — Login / Account maken toggle + one-click Demo.
- **API:** `app/api/marifest/auth/route.ts` — `POST {action:'signup'|'login', email, password, name?, plan?}` → verifies against Supabase GoTrue → issues a `bp_session` cookie (sector `maritiem` → grants `/fleet`, not `/hq`).
- Auto-confirm is **enabled** (no email server needed); accounts work instantly.
- Plan → tier: free→starter, pro→professional, business→enterprise (stored in the cookie + Supabase user_metadata).
- Try it: open `/marifest-login`, "Account maken", any email + 8-char password → lands in `/fleet`.

### Hardening TODO (later)
- Email verification + password reset (turn off auto-confirm, add an SMTP/Resend sender).
- Persist a `profiles`/`subscriptions` row per user (currently identity is the Supabase user; tier lives in the cookie).
- Per-user data isolation (watchlist/alerts are still on the shared demo org — give each account its own org_id scoping).

## Payments — ⚙️ SCAFFOLDED (needs your Stripe keys)
Stripe Checkout via REST (no SDK). Env-gated — returns "not configured" until keys exist.
- **Checkout:** `app/api/marifest/checkout/route.ts` — `POST {plan}` → Stripe Checkout Session → `{url}`.
- **Webhook:** `app/api/marifest/webhook/route.ts` — handles subscription lifecycle (signature verification + tier write are stubbed).

### To go live with billing — add these env vars (Vercel):
| Var | What |
|-----|------|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_… / sk_test_…) |
| `STRIPE_PRICE_PRO` | Price ID for the €19 plan |
| `STRIPE_PRICE_BUSINESS` | Price ID for the €99 plan |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (whsec_…) |
| `NEXT_PUBLIC_APP_URL` | e.g. https://marifest.app (success/cancel redirects) |

Then: create the two products/prices in Stripe, point a webhook at `/api/marifest/webhook`, and wire the in-app upgrade button (a `/fleet/abonnement` page) to `POST /api/marifest/checkout`. **Mollie** is the alternative (same shape — swap the checkout route for Mollie's API).

## Other env (already defaulted in code, override in prod)
- `MARIFEST_SUPABASE_URL`, `MARIFEST_SUPABASE_ANON_KEY` — Marifest data + auth project.
- `AISSTREAM_API_KEY` — set this so the literal dev fallback in the AIS routes can be removed (rotate the current key).
