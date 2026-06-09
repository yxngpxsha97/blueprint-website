// ─────────────────────────────────────────────────────────────────────────────
// Vessel Enrichment API
//
// GET  /api/fleet/enrich?imo=1234567
//   Returns vessel profile from DB. If not found or stale (>24h), scrapes
//   Equasis, stores result, then returns it.
//
// POST /api/fleet/enrich
//   Body: { imos: string[] }  — bulk enrich up to 50 vessels
//   Queues enrichment for each IMO (checks DB age, skips fresh ones)
//   Returns { queued: number, fresh: number, errors: string[] }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseFetch } from '@/lib/supabase';

const REFRESH_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Equasis scraping (same logic as /api/fleet/equasis but writes to DB) ──────

function extractText(html: string, pattern: RegExp): string {
  const m = html.match(pattern);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
}

let sessionCookie: string | null = null;
let sessionTs = 0;
const SESSION_TTL = 30 * 60 * 1000;

async function getEquasisSession(): Promise<string> {
  if (sessionCookie && Date.now() - sessionTs < SESSION_TTL) return sessionCookie;

  const username = process.env.EQUASIS_USERNAME ?? '';
  const password = process.env.EQUASIS_PASSWORD ?? '';

  function extractCookies(headers: Headers): string {
    const cookies: string[] = [];
    headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') cookies.push(value.split(';')[0]);
    });
    return cookies.join('; ');
  }

  const initResp = await fetch('https://www.equasis.org/EquasisWeb/public/HomePage', {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120', 'Accept': 'text/html,*/*' },
  });
  const initCookie = extractCookies(initResp.headers);

  const loginResp = await fetch('https://www.equasis.org/EquasisWeb/public/Login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 Chrome/120',
      'Referer': 'https://www.equasis.org/EquasisWeb/public/HomePage',
      'Cookie': initCookie,
    },
    body: new URLSearchParams({ j_email: username, j_password: password, submit: 'Login' }).toString(),
    redirect: 'follow',
  });

  const loginCookie = extractCookies(loginResp.headers);
  sessionCookie = [initCookie, loginCookie].filter(Boolean).join('; ');
  sessionTs = Date.now();
  return sessionCookie;
}

async function scrapeEquasis(imo: string): Promise<Record<string, unknown>> {
  const cookie = await getEquasisSession();
  const url = `https://www.equasis.org/EquasisWeb/restricted/ShipInfo?P_IMO=${imo}`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120', 'Cookie': cookie, 'Accept': 'text/html,*/*' },
    redirect: 'follow',
  });

  if (resp.url.includes('/public/')) {
    sessionCookie = null;
    throw new Error('Session expired');
  }

  const html = await resp.text();

  // Parse basic fields
  const name     = stripTags(extractText(html, /Ship name[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i)) || 'Unknown';
  const flag     = stripTags(extractText(html, /Flag[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i));
  const type     = stripTags(extractText(html, /Ship type[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i));
  const built    = stripTags(extractText(html, /Year of build[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i));
  const classSoc = stripTags(extractText(html, /Class society[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i));
  const gtStr    = stripTags(extractText(html, /Gross tonnage[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i));
  const dwtStr   = stripTags(extractText(html, /Deadweight[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i));
  const gt       = gtStr  ? parseInt(gtStr.replace(/\D/g, ''),  10) || null : null;
  const dwt      = dwtStr ? parseInt(dwtStr.replace(/\D/g, ''), 10) || null : null;

  // Companies
  const companies: Record<string, string>[] = [];
  const companySection = html.match(/Company information[\s\S]*?(?=<\/table>|Inspection|Certificate)/i)?.[0] ?? '';
  const companyRows = [...companySection.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const row of companyRows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => stripTags(c[1]));
    if (cells.length >= 2 && cells[1] && cells[1].length > 2 && !/^Role$/i.test(cells[0])) {
      companies.push({ role: cells[0], name: cells[1], address: cells[2] ?? '', country: cells[3] ?? '' });
    }
  }

  // Inspections
  const inspections: Record<string, unknown>[] = [];
  const inspSection = html.match(/Inspection[^<]*[\s\S]*?(?=Certificate|<\/div>)/i)?.[0] ?? '';
  const inspRows = [...inspSection.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const row of inspRows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => stripTags(c[1]));
    if (cells.length >= 4 && /\d{2}\/\d{2}\/\d{4}/.test(cells[0])) {
      inspections.push({
        date: cells[0], port: cells[1], authority: cells[2], result: cells[3],
        deficiencies: parseInt(cells[4] || '0', 10) || 0,
        detained: /detained|YES/i.test(cells[5] ?? ''),
      });
    }
  }

  // Certificates
  const certificates: Record<string, string>[] = [];
  const certSection = html.match(/Certificate[\s\S]*?(?=<\/div>)/i)?.[0] ?? '';
  const certRows = [...certSection.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const row of certRows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => stripTags(c[1]));
    if (cells.length >= 3 && cells[0] && !/^Certificate type$/i.test(cells[0])) {
      certificates.push({ type: cells[0], issuer: cells[1] ?? '', issued: cells[2] ?? '', expires: cells[3] ?? '' });
    }
  }

  // Derive summary flags
  const detentions = inspections.filter(i => i.detained);
  const lastDetention = detentions.length > 0
    ? detentions.sort((a, b) => String(b.date).localeCompare(String(a.date)))[0].date as string
    : null;
  const totalDeficiencies = inspections.reduce((sum, i) => sum + (i.deficiencies as number), 0);

  // Check certs expiring within 90 days
  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const certsExpiringSoon = certificates.some(c => {
    if (!c.expires) return false;
    const parts = c.expires.split('/');
    if (parts.length !== 3) return false;
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    return d > now && d < in90;
  });

  return {
    imo, name, flag, vessel_type: type, built, class_society: classSoc, gt, dwt,
    companies, inspections: inspections.slice(0, 15), certificates: certificates.slice(0, 20),
    last_detention: lastDetention,
    total_deficiencies: totalDeficiencies,
    has_detention: detentions.length > 0,
    certs_expiring_soon: certsExpiringSoon,
    equasis_fetched_at: new Date().toISOString(),
    equasis_error: null,
  };
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getFromDB(imo: string): Promise<Record<string, unknown> | null> {
  const res = await supabaseFetch<Record<string, unknown>>(
    'vessel_profiles',
    { query: `imo=eq.${imo}`, single: true, useServiceRole: true }
  );
  if (res.error || !res.data) return null;
  return res.data;
}

async function upsertToDB(data: Record<string, unknown>): Promise<void> {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
  await fetch(`${SUPABASE_URL}/rest/v1/vessel_profiles`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(data),
  });
}

function isFresh(row: Record<string, unknown>): boolean {
  if (!row.equasis_fetched_at) return false;
  const fetched = new Date(row.equasis_fetched_at as string).getTime();
  return Date.now() - fetched < REFRESH_TTL_MS;
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const imo = req.nextUrl.searchParams.get('imo');
  if (!imo || !/^\d{7}$/.test(imo)) {
    return NextResponse.json({ error: 'Invalid IMO (7 digits required)' }, { status: 400 });
  }

  // Check DB first
  const existing = await getFromDB(imo);
  if (existing && isFresh(existing)) {
    return NextResponse.json({ data: existing, source: 'db' });
  }

  // Scrape Equasis
  try {
    const scraped = await scrapeEquasis(imo);
    await upsertToDB(scraped);
    return NextResponse.json({ data: scraped, source: 'equasis' });
  } catch (err) {
    // If scrape fails but we have stale DB data, return it with warning
    if (existing) {
      return NextResponse.json({ data: existing, source: 'db_stale', warning: 'Equasis unavailable, showing cached data' });
    }
    // Record the error in DB
    await upsertToDB({ imo, equasis_error: String(err), equasis_fetched_at: new Date().toISOString() });
    return NextResponse.json({ error: 'Failed to fetch vessel data' }, { status: 500 });
  }
}

// ── POST handler — bulk enrich ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  let body: { imos?: string[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const imos = (body.imos ?? []).filter(i => /^\d{7}$/.test(i)).slice(0, 50);
  if (imos.length === 0) return NextResponse.json({ error: 'No valid IMO numbers' }, { status: 400 });

  let queued = 0, fresh = 0;
  const errors: string[] = [];

  for (const imo of imos) {
    const existing = await getFromDB(imo);
    if (existing && isFresh(existing)) {
      fresh++;
      continue;
    }

    try {
      const scraped = await scrapeEquasis(imo);
      await upsertToDB(scraped);
      queued++;
      // Small delay to be polite to Equasis
      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      errors.push(`${imo}: ${String(err)}`);
    }
  }

  return NextResponse.json({ queued, fresh, errors, total: imos.length });
}

export const maxDuration = 60; // bulk enrichment needs more time
