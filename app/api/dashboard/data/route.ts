// ============================================================================
// GET /api/dashboard/data — Server-side proxy for Supabase PostgREST queries
// Keeps the service_role key server-side while allowing client components
// to fetch dashboard data securely.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const SUPABASE_URL = 'https://nfhesgwmbgmztjxuvrvy.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maGVzZ3dtYmdtenRqeHV2cnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjczMzU4MiwiZXhwIjoyMDg4MzA5NTgyfQ.TCpuvLGc0y2-3KOYunzoWfvVP3tiMd-JJtklC-tH8YY';

// Allowed tables that clients can query
const ALLOWED_TABLES = new Set([
  'quotes',
  'conversations',
  'bookings',
  'customers',
  'audit_log',
  'messages',
  'organizations',
  'subscriptions',
  'services',
  'webshop_config',
  'wa_templates',
  'monthly_conversation_counts',
  'payments',
]);

export async function GET(request: NextRequest) {
  // Auth check
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  if (!table || !ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: 'Ongeldige tabel' }, { status: 400 });
  }

  // Build PostgREST query — forward all params except 'table'
  // Use append to support duplicate keys (e.g. PostgREST range filters)
  const queryParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'table') {
      queryParams.append(key, value);
    }
  });

  // Always scope to the user's organization (multi-tenant isolation)
  // Tables that have org_id directly
  const tablesWithOrgId = new Set([
    'quotes', 'conversations', 'bookings', 'customers',
    'audit_log', 'organizations', 'subscriptions',
    'services', 'webshop_config', 'wa_templates',
    'monthly_conversation_counts', 'payments',
  ]);

  if (tablesWithOrgId.has(table)) {
    if (table === 'organizations') {
      queryParams.set('id', `eq.${session.org_id}`);
    } else {
      queryParams.set('org_id', `eq.${session.org_id}`);
    }
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Supabase fout: ${res.status}`, details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: 'Kon data niet ophalen', details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  if (!table || !ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: 'Ongeldige tabel' }, { status: 400 });
  }

  const body = await request.json();
  // Inject org_id from session
  body.org_id = session.org_id;

  const url = `${SUPABASE_URL}/rest/v1/${table}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Aanmaken mislukt: ${res.status}`, details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: 'Kon niet aanmaken', details: String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const id = searchParams.get('id');

  if (!table || !ALLOWED_TABLES.has(table) || !id) {
    return NextResponse.json({ error: 'Ongeldige parameters' }, { status: 400 });
  }

  const body = await request.json();

  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&org_id=eq.${session.org_id}`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Update mislukt: ${res.status}`, details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: 'Kon niet bijwerken', details: String(err) },
      { status: 500 }
    );
  }
}
