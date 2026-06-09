import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Equasis scraper — server-side only, credentials in env vars
// Caches per IMO for 24h to avoid hammering the site
// ─────────────────────────────────────────────────────────────────────────────

interface EquasisInspection {
  date: string;
  port: string;
  authority: string;
  result: string;
  deficiencies: number;
  detained: boolean;
}

interface EquasisCertificate {
  type: string;
  issuer: string;
  issued: string;
  expires: string;
}

interface EquasisCompany {
  name: string;
  role: string;
  address: string;
  country: string;
}

export interface EquasisVesselData {
  imo: string;
  name: string;
  flag: string;
  gt: number | null;
  dwt: number | null;
  type: string;
  built: string;
  class: string;
  companies: EquasisCompany[];
  inspections: EquasisInspection[];
  certificates: EquasisCertificate[];
  cachedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory cache: IMO → { data, ts }
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const cache = new Map<string, { data: EquasisVesselData; ts: number }>();

// Session cookie persisted across requests for the lifetime of the server
let sessionCookie: string | null = null;
let sessionTs = 0;
const SESSION_TTL = 30 * 60 * 1000; // 30min

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract Set-Cookie header value
// ─────────────────────────────────────────────────────────────────────────────

function extractCookies(headers: Headers): string {
  const cookies: string[] = [];
  headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      const cookiePart = value.split(';')[0];
      cookies.push(cookiePart);
    }
  });
  return cookies.join('; ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Login to Equasis and return session cookie
// ─────────────────────────────────────────────────────────────────────────────

async function login(): Promise<string> {
  const username = process.env.EQUASIS_USERNAME ?? '';
  const password = process.env.EQUASIS_PASSWORD ?? '';

  // First GET the login page to pick up any initial session cookie / CSRF token
  const initResp = await fetch('https://www.equasis.org/EquasisWeb/public/HomePage', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  });

  let initCookie = extractCookies(initResp.headers);

  // POST login form
  const formData = new URLSearchParams({
    j_email: username,
    j_password: password,
    submit: 'Login',
  });

  const loginResp = await fetch('https://www.equasis.org/EquasisWeb/public/Login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Referer': 'https://www.equasis.org/EquasisWeb/public/HomePage',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cookie': initCookie,
    },
    body: formData.toString(),
    redirect: 'follow',
  });

  const loginCookie = extractCookies(loginResp.headers);
  const combined = [initCookie, loginCookie].filter(Boolean).join('; ');

  // Verify we got a valid session by checking if we can access a restricted page
  const verifyResp = await fetch('https://www.equasis.org/EquasisWeb/restricted/Search', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Cookie': combined,
    },
    redirect: 'follow',
  });

  if (verifyResp.url.includes('/public/') || verifyResp.status === 401) {
    throw new Error('Equasis login failed — check credentials');
  }

  return combined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get (or reuse) session cookie
// ─────────────────────────────────────────────────────────────────────────────

async function getSession(): Promise<string> {
  if (sessionCookie && Date.now() - sessionTs < SESSION_TTL) {
    return sessionCookie;
  }
  sessionCookie = await login();
  sessionTs = Date.now();
  return sessionCookie;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse HTML helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractText(html: string, pattern: RegExp): string {
  const m = html.match(pattern);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractAllMatches(html: string, pattern: RegExp): RegExpMatchArray[] {
  const matches: RegExpMatchArray[] = [];
  let m: RegExpMatchArray | null;
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  while ((m = re.exec(html)) !== null) matches.push(m);
  return matches;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse ship info page HTML into structured data
// ─────────────────────────────────────────────────────────────────────────────

function parseShipInfo(html: string, imo: string): EquasisVesselData {
  // ── Basic ship details ──────────────────────────────────────────────────────
  const name = stripTags(extractText(html, /Ship name[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i)) ||
    stripTags(extractText(html, /class="shipName"[^>]*>([^<]+)/i)) || 'Unknown';

  const flag = stripTags(extractText(html, /Flag[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i)) || '';
  const type = stripTags(extractText(html, /Ship type[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i)) || '';
  const built = stripTags(extractText(html, /Year of build[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i)) || '';
  const classOrg = stripTags(extractText(html, /Class society[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i)) || '';

  const gtStr = stripTags(extractText(html, /Gross tonnage[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i));
  const dwtStr = stripTags(extractText(html, /Deadweight[^<]*<\/[^>]+>[^<]*<[^>]+>([^<]+)/i));
  const gt = gtStr ? parseInt(gtStr.replace(/[^0-9]/g, ''), 10) || null : null;
  const dwt = dwtStr ? parseInt(dwtStr.replace(/[^0-9]/g, ''), 10) || null : null;

  // ── Companies ───────────────────────────────────────────────────────────────
  const companies: EquasisCompany[] = [];
  // Look for company table rows: role | company name | address | country
  const companySection = html.match(/Company information[\s\S]*?(?=<\/table>|Inspection|Certificate)/i)?.[0] ?? '';
  const companyRows = extractAllMatches(companySection, /<tr[^>]*>([\s\S]*?)<\/tr>/i);
  for (const row of companyRows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => stripTags(c[1]));
    if (cells.length >= 2 && cells[1] && cells[1].length > 2 && !/^Role$/i.test(cells[0])) {
      companies.push({
        role: cells[0] || '',
        name: cells[1] || '',
        address: cells[2] || '',
        country: cells[3] || '',
      });
    }
  }

  // ── PSC Inspections ─────────────────────────────────────────────────────────
  const inspections: EquasisInspection[] = [];
  const inspSection = html.match(/Inspection[^<]*[\s\S]*?(?=Certificate|<\/div>)/i)?.[0] ?? '';
  const inspRows = extractAllMatches(inspSection, /<tr[^>]*>([\s\S]*?)<\/tr>/i);
  for (const row of inspRows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => stripTags(c[1]));
    if (cells.length >= 4 && /\d{2}\/\d{2}\/\d{4}/.test(cells[0])) {
      inspections.push({
        date: cells[0],
        port: cells[1] || '',
        authority: cells[2] || '',
        result: cells[3] || '',
        deficiencies: parseInt(cells[4] || '0', 10) || 0,
        detained: /detained|YES/i.test(cells[5] || ''),
      });
    }
  }

  // ── Certificates ────────────────────────────────────────────────────────────
  const certificates: EquasisCertificate[] = [];
  const certSection = html.match(/Certificate[\s\S]*?(?=<\/div>)/i)?.[0] ?? '';
  const certRows = extractAllMatches(certSection, /<tr[^>]*>([\s\S]*?)<\/tr>/i);
  for (const row of certRows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => stripTags(c[1]));
    if (cells.length >= 3 && cells[0] && !/^Certificate type$/i.test(cells[0])) {
      certificates.push({
        type: cells[0],
        issuer: cells[1] || '',
        issued: cells[2] || '',
        expires: cells[3] || '',
      });
    }
  }

  return {
    imo,
    name,
    flag,
    gt,
    dwt,
    type,
    built,
    class: classOrg,
    companies,
    inspections: inspections.slice(0, 10), // last 10 inspections
    certificates: certificates.slice(0, 15),
    cachedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch vessel data from Equasis
// ─────────────────────────────────────────────────────────────────────────────

async function fetchEquasisData(imo: string): Promise<EquasisVesselData> {
  // Check cache first
  const cached = cache.get(imo);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const cookie = await getSession();

  const url = `https://www.equasis.org/EquasisWeb/restricted/ShipInfo?P_IMO=${imo}`;
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.equasis.org/EquasisWeb/restricted/Search',
      'Cookie': cookie,
    },
    redirect: 'follow',
  });

  if (!resp.ok) {
    throw new Error(`Equasis fetch failed: ${resp.status}`);
  }

  // If redirected back to login, invalidate session and retry once
  if (resp.url.includes('/public/')) {
    sessionCookie = null;
    const freshCookie = await getSession();
    const retry = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cookie': freshCookie,
      },
      redirect: 'follow',
    });
    if (retry.url.includes('/public/')) {
      throw new Error('Equasis session expired and re-login failed');
    }
    const html2 = await retry.text();
    const data2 = parseShipInfo(html2, imo);
    cache.set(imo, { data: data2, ts: Date.now() });
    return data2;
  }

  const html = await resp.text();
  const data = parseShipInfo(html, imo);
  cache.set(imo, { data, ts: Date.now() });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const imo = req.nextUrl.searchParams.get('imo');

  if (!imo || !/^\d{7}$/.test(imo)) {
    return NextResponse.json({ error: 'Invalid IMO number (must be 7 digits)' }, { status: 400 });
  }

  try {
    const data = await fetchEquasisData(imo);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=86400' },
    });
  } catch (err) {
    console.error('[equasis]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
