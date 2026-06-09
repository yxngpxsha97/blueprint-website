// ============================================================================
// Marifest — Ship Registry API
// Serves the global ship database (Supabase `ships`): search by name/IMO/MMSI,
// filter by sector, sort, paginate. Public (open ship data) + CORS so the
// mobile-web / PWA app can read it cross-origin.
// ============================================================================
import { NextRequest, NextResponse } from 'next/server';

const SUPA_URL = process.env.MARIFEST_SUPABASE_URL || 'https://bwegtwleqyfuyfkaluki.supabase.co';
const SUPA_KEY = process.env.MARIFEST_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZWd0d2xlcXlmdXlma2FsdWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTM5MzUsImV4cCI6MjA5NjU2OTkzNX0.aH47GDjg_EZz3eRWXeB8TC3T5deBfZkSpxxoDLRU2EE';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const COLS = 'imo,mmsi,name,sector,ship_type_code,gross_tonnage,length_m,beam_m,draught_m,built,builder,operator,owner,flag,home_port,image_url,sources';
const SORTABLE: Record<string, string> = { name: 'name', built: 'built', gt: 'gross_tonnage', length: 'length_m', imo: 'imo' };

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') || sp.get('search') || '').trim();
  const sector = (sp.get('sector') || '').trim().toLowerCase();
  const limit = Math.min(parseInt(sp.get('limit') || '50', 10) || 50, 200);
  const offset = Math.max(parseInt(sp.get('offset') || '0', 10) || 0, 0);
  const sortKey = SORTABLE[sp.get('sort') || ''] || 'gross_tonnage';
  const order = sp.get('order') === 'asc' ? 'asc' : 'desc';

  const params = new URLSearchParams();
  params.set('select', COLS);

  // search: pure digits → IMO/MMSI exact; otherwise name/callsign contains
  if (q) {
    if (/^\d{6,9}$/.test(q)) {
      params.set('or', `(imo.eq.${q},mmsi.eq.${q})`);
    } else {
      const safe = q.replace(/[%,()]/g, ' ');
      params.set('or', `(name.ilike.*${safe}*,callsign.ilike.*${safe}*,operator.ilike.*${safe}*)`);
    }
  }
  if (sector && sector !== 'all') params.set('sector', `eq.${sector}`);
  params.set('order', `${sortKey}.${order}.nullslast`);

  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/ships?${params.toString()}`, {
      headers: {
        apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
        Range: `${offset}-${offset + limit - 1}`,
        Prefer: 'count=estimated',
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ data: [], total: 0, error: `registry ${res.status}` }, { status: 200, headers: CORS });
    }
    const data = await res.json();
    // content-range: "0-49/12345"
    const cr = res.headers.get('content-range') || '';
    const total = parseInt(cr.split('/')[1] || '0', 10) || data.length;
    return NextResponse.json({ data, total, limit, offset }, { headers: CORS });
  } catch {
    return NextResponse.json({ data: [], total: 0, error: 'registry unavailable' }, { status: 200, headers: CORS });
  }
}
