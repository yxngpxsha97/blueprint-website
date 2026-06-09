import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'bp_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? 'dev-secret-change-in-production';

// Web Crypto API HMAC-SHA256 (Edge Runtime compatible)
let _cryptoKey: CryptoKey | null = null;
async function getCryptoKey(): Promise<CryptoKey> {
  if (_cryptoKey) return _cryptoKey;
  const enc = new TextEncoder();
  _cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return _cryptoKey;
}

function hexFromBuffer(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyAndDecode(cookieValue: string): Promise<Record<string, unknown> | null> {
  const dotIndex = cookieValue.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const payload = cookieValue.slice(0, dotIndex);
  const receivedSig = cookieValue.slice(dotIndex + 1);

  try {
    const key = await getCryptoKey();
    const enc = new TextEncoder();
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const expectedSig = hexFromBuffer(sigBuf);
    if (!constantTimeEqual(expectedSig, receivedSig)) return null;
  } catch {
    return null;
  }

  try {
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/portal', '/hq', '/fleet'];

// Routes blocked per role
// admin role CAN access /dashboard/setup and /dashboard/onboarding
// (admin can help set up other client accounts on behalf of the owner)
const BLOCKED_ROUTES: Record<string, string[]> = {
  // employees (drivers/field workers) only get: rittenplanner, uren, agenda
  employee: [
    '/dashboard/setup',
    '/dashboard/onboarding',
    '/dashboard/designer',
    '/dashboard/crm',
    '/dashboard/facturatie',
    '/dashboard/whatsapp',
    '/dashboard/wms',
    '/dashboard/pooling',
    '/dashboard/rapportages',
    '/dashboard/recruitment',
    '/dashboard/tracking',
    '/dashboard/social',
    '/dashboard/sjablonen',
    '/dashboard/ships',
    '/dashboard/voertuigen',
    '/dashboard/vloot',
    '/dashboard/telefoon',
    '/dashboard/projecten',
    '/dashboard/settings',
    '/dashboard/integrations',
  ],
  staff: [
    '/dashboard/setup',
    '/dashboard/onboarding',
    '/dashboard/recruitment',
    '/dashboard/wms',
    '/dashboard/pooling',
    '/dashboard/rapportages',
    '/dashboard/settings',
    '/dashboard/integrations',
  ],
  demo: [], // demo can view all pages, just can't mutate
};

// Roles that cannot access /portal at all
const NO_PORTAL_ROLES = ['employee', 'staff', 'demo'];

// ── Sector-based module filtering (mirrors sidebar-config.ts) ────────────

const UNIVERSAL_MODULES = [
  'sales-hub', 'whatsapp', 'crm', 'facturatie', 'rapportages', 'agenda', 'documenten', 'social', 'telefoon', 'uren',
];

const SECTOR_EXTRAS: Record<string, string[]> = {
  bouw:        ['rittenplanner', 'projecten'],
  installatie: ['rittenplanner', 'projecten'],
  schilders:   ['rittenplanner', 'projecten'],
  tuiniers:    ['rittenplanner', 'projecten'],
  beauty:      ['wms'],
  horeca:      ['wms'],
  kappers:     ['wms'],
  automotive:  ['wms'],
  garage:      ['wms'],
  schoonmaak:  ['rittenplanner'],
  gezondheid:  [],
  tandarts:    [],
  logistiek:   ['tracking', 'rittenplanner', 'wms', 'voertuigen', 'recruitment', 'projecten'],
  transport:   ['tracking', 'rittenplanner', 'wms', 'voertuigen', 'recruitment', 'projecten'],
  maritiem:    ['tracking', 'rittenplanner', 'ships', 'vloot'],
  tech:        ['tracking', 'wms', 'rittenplanner', 'recruitment', 'pooling', 'ships', 'voertuigen', 'vloot'],
};

// Map route prefixes to module IDs
const ROUTE_TO_MODULE: Record<string, string> = {
  '/dashboard/recruitment': 'recruitment',
  '/dashboard/tracking': 'tracking',
  '/dashboard/wms': 'wms',
  '/dashboard/rittenplanner': 'rittenplanner',
  '/dashboard/pooling': 'pooling',
  '/dashboard/designer': 'designer',
  '/dashboard/ships': 'ships',
  '/dashboard/vloot': 'vloot',
  '/dashboard/telefoon': 'telefoon',
  '/dashboard/uren': 'uren',
  '/dashboard/voertuigen': 'voertuigen',
  '/dashboard/projecten': 'projecten',
};

function getAllowedModules(sector: string | null, tier: string | null): string[] {
  const modules = [...UNIVERSAL_MODULES];
  const extras = SECTOR_EXTRAS[sector ?? ''] ?? [];
  modules.push(...extras);
  if (tier === 'enterprise') modules.push('designer');
  return modules;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') ?? '';

  // HQ subdomain: redirect non-HQ paths to /hq
  if (hostname.startsWith('hq.')) {
    if (!pathname.startsWith('/hq') && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/logo') && !pathname.startsWith('/icon') && !pathname.startsWith('/favicon') && !pathname.startsWith('/login') && !pathname.startsWith('/aanmelden')) {
      return NextResponse.redirect(new URL('/hq', request.url));
    }
  }

  // Check if the route requires auth
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  // Check for session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    // HQ + Marifest get their own login portals
    const loginPath = pathname.startsWith('/hq') ? '/hq-login' : pathname.startsWith('/fleet') ? '/marifest-login' : '/login';
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate the signed session cookie
  try {
    const session = await verifyAndDecode(sessionCookie.value);
    if (!session || !session.org_id || !session.user_id || !session.role) {
      const loginUrl = new URL(pathname.startsWith('/fleet') ? '/marifest-login' : '/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const role: string = session.role;

    // Block portal access for staff and demo roles
    if (pathname.startsWith('/portal') && NO_PORTAL_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Block HQ access — only sector 'tech' allowed
    if (pathname.startsWith('/hq')) {
      const sector: string | null = session.sector ?? null;
      if (sector !== 'tech') {
        // On HQ subdomain, redirect to login (not /dashboard which would loop)
        const isHQSubdomain = hostname.startsWith('hq.');
        const redirectTo = isHQSubdomain ? '/hq-login' : '/dashboard';
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }

    // Block specific dashboard routes per role
    const blocked = BLOCKED_ROUTES[role] ?? [];
    if (blocked.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // ── Onboarding redirect ───────────────────────────────────────────────
    // Owners and admins who haven't completed onboarding are redirected to
    // /dashboard/onboarding. This check lives here (not in layout.tsx) because
    // headers x-invoke-path / x-pathname are unreliable on Vercel serverless,
    // whereas pathname is always correct in middleware.
    if (
      pathname.startsWith('/dashboard') &&
      !pathname.startsWith('/dashboard/onboarding') &&
      !pathname.startsWith('/dashboard/setup') &&
      (role === 'owner' || role === 'admin')
    ) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
      if (supabaseUrl && serviceKey && session.org_id) {
        try {
          const res = await fetch(
            `${supabaseUrl}/rest/v1/onboarding_progress?org_id=eq.${session.org_id}&select=go_live,completed_at&limit=1`,
            {
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (res.ok) {
            const rows: Array<{ go_live: boolean; completed_at: string | null }> = await res.json();
            const progress = rows[0];
            if (progress && !progress.go_live && !progress.completed_at) {
              return NextResponse.redirect(new URL('/dashboard/onboarding', request.url));
            }
          }
        } catch {
          // Non-fatal — if this check fails, let the request through
        }
      }
    }

    // Block routes based on sector + subscription tier
    const sector: string | null = session.sector ?? null;
    const tier: string | null = session.subscription_tier ?? 'starter';
    const allowed = getAllowedModules(sector, tier);

    for (const [routePrefix, moduleId] of Object.entries(ROUTE_TO_MODULE)) {
      if (pathname.startsWith(routePrefix) && !allowed.includes(moduleId)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Block /fleet for sectors without ships access
    if (pathname.startsWith('/fleet') && !allowed.includes('ships')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Block routes based on per-employee permissions (permissions field in session)
    if (role === 'employee') {
      const permissions: string[] = Array.isArray(session.permissions) ? session.permissions as string[] : ['*'];
      if (!permissions.includes('*')) {
        // Check if the route requires a specific module the employee doesn't have
        for (const [routePrefix, moduleId] of Object.entries(ROUTE_TO_MODULE)) {
          if (pathname.startsWith(routePrefix) && !permissions.includes(moduleId)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        }
      }
    }
  } catch {
    const loginUrl = new URL(pathname.startsWith('/fleet') ? '/marifest-login' : '/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/portal/:path*', '/hq/:path*', '/hq', '/fleet/:path*', '/fleet'],
};
