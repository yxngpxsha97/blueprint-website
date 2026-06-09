import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// Marifest project (DesignCheck org) — decoupled from Blueprint.
const SUPABASE_URL = process.env.MARIFEST_SUPABASE_URL || 'https://bwegtwleqyfuyfkaluki.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.MARIFEST_SUPABASE_SERVICE_KEY!;

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(params.get('limit') ?? '50', 10), 200);
  const offset = parseInt(params.get('offset') ?? '0', 10);
  const unreadOnly = params.get('unread_only') === 'true';

  let qs = `vessel_alerts?org_id=eq.${session.org_id}&is_dismissed=eq.false&order=detected_at.desc&limit=${limit}&offset=${offset}`;
  if (unreadOnly) qs += '&is_read=eq.false';

  const headers = { ...sbHeaders(), Prefer: 'count=exact' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${qs}`, { headers });
  const data = res.ok ? await res.json() : [];
  const count = parseInt(res.headers.get('content-range')?.split('/')[1] ?? '0', 10);

  return NextResponse.json({ alerts: data, total: count });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { id?: string; action?: 'read' | 'dismiss' };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.id || !body.action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });

  // Verify ownership
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/vessel_alerts?id=eq.${body.id}&org_id=eq.${session.org_id}&select=id`,
    { headers: sbHeaders() }
  );
  const rows = checkRes.ok ? await checkRes.json() : [];
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch = body.action === 'dismiss'
    ? { is_dismissed: true, dismissed_at: new Date().toISOString(), dismissed_by: session.user_id }
    : { is_read: true };

  await fetch(`${SUPABASE_URL}/rest/v1/vessel_alerts?id=eq.${body.id}`, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify(patch),
  });

  return NextResponse.json({ success: true });
}
