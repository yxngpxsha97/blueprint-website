import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { marifestFetch as supabaseFetch } from '@/lib/marifest-supabase';

// GET — return watchlist with enriched vessel profiles
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.org_id;

  // Ensure org has a default watchlist
  const wlRes = await supabaseFetch<{ id: string; name: string; sector: string | null }>(
    'fleet_watchlists',
    {
      query: `org_id=eq.${orgId}&is_default=eq.true&select=id,name,sector`,
      single: true,
      useServiceRole: true,
    }
  );

  let watchlistId: string;
  if (wlRes.error || !wlRes.data) {
    // Create default watchlist
    const created = await supabaseFetch<{ id: string; name: string; sector: string | null }>(
      'fleet_watchlists',
      {
        method: 'POST',
        body: { org_id: orgId, name: 'My Fleet', is_default: true },
        query: 'select=id,name,sector',
        single: true,
        useServiceRole: true,
      }
    );
    if (created.error || !created.data) {
      return NextResponse.json({ error: 'Failed to create watchlist' }, { status: 500 });
    }
    watchlistId = created.data.id;
  } else {
    watchlistId = wlRes.data.id;
  }

  // Fetch watchlist vessels (no join — no FK exists between fleet_watchlist_vessels.imo and vessel_profiles.imo)
  const vesRes = await supabaseFetch<Array<{ id: string; imo: string; mmsi: string | null; custom_name: string | null; notes: string | null; added_at: string }>>(
    'fleet_watchlist_vessels',
    {
      query: `watchlist_id=eq.${watchlistId}&order=added_at.desc&select=id,imo,mmsi,custom_name,notes,added_at`,
      useServiceRole: true,
    }
  );

  const vessels = vesRes.data ?? [];

  // Fetch vessel_profiles for each IMO separately
  let profiles: Record<string, unknown> = {};
  if (vessels.length > 0) {
    const imoList = vessels.map((v) => v.imo).join(',');
    const profRes = await supabaseFetch<Array<Record<string, unknown>>>(
      'vessel_profiles',
      {
        query: `imo=in.(${imoList})&select=imo,name,flag,vessel_type,built,class_society,gt,dwt,has_detention,total_deficiencies,certs_expiring_soon,last_detention,equasis_fetched_at,equasis_error`,
        useServiceRole: true,
      }
    );
    for (const p of (profRes.data ?? [])) {
      profiles[p.imo as string] = p;
    }
  }

  // Merge profiles into vessels
  const enriched = vessels.map((v) => ({
    ...v,
    vessel_profiles: profiles[v.imo] ?? null,
  }));

  return NextResponse.json({
    watchlist_id: watchlistId,
    vessels: enriched,
  });
}

// POST — add vessel to watchlist
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.org_id;
  let body: { imo?: string; mmsi?: string; custom_name?: string; notes?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.imo || !/^\d{7}$/.test(body.imo)) {
    return NextResponse.json({ error: 'Invalid IMO (7 digits required)' }, { status: 400 });
  }

  // Ensure default watchlist exists
  const wlRes = await supabaseFetch<{ id: string }>(
    'fleet_watchlists',
    {
      query: `org_id=eq.${orgId}&is_default=eq.true&select=id`,
      single: true,
      useServiceRole: true,
    }
  );

  let watchlistId: string;
  if (wlRes.error || !wlRes.data) {
    const created = await supabaseFetch<{ id: string }>(
      'fleet_watchlists',
      {
        method: 'POST',
        body: { org_id: orgId, name: 'My Fleet', is_default: true },
        query: 'select=id',
        single: true,
        useServiceRole: true,
      }
    );
    if (created.error || !created.data) {
      return NextResponse.json({ error: 'Failed to create watchlist' }, { status: 500 });
    }
    watchlistId = created.data.id;
  } else {
    watchlistId = wlRes.data.id;
  }

  // Insert vessel
  const ins = await supabaseFetch<{ id: string; imo: string; mmsi: string | null; custom_name: string | null; notes: string | null; added_at: string }>(
    'fleet_watchlist_vessels',
    {
      method: 'POST',
      body: {
        watchlist_id: watchlistId,
        imo: body.imo,
        mmsi: body.mmsi ?? null,
        custom_name: body.custom_name ?? null,
        notes: body.notes ?? null,
      },
      query: 'select=id,imo,mmsi,custom_name,notes,added_at',
      single: true,
      useServiceRole: true,
    }
  );

  if (ins.error) {
    if (ins.error.includes('23505')) {
      return NextResponse.json({ error: 'Vessel already in watchlist' }, { status: 409 });
    }
    return NextResponse.json({ error: ins.error }, { status: 500 });
  }

  // Trigger background enrichment (fire-and-forget)
  fetch(`${req.nextUrl.origin}/api/fleet/enrich?imo=${body.imo}`, { method: 'GET' }).catch(() => {});

  return NextResponse.json({ vessel: ins.data });
}

// DELETE — remove vessel from watchlist
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Verify ownership via watchlist join
  const vessel = await supabaseFetch<{ id: string; watchlist_id: string; fleet_watchlists: { org_id: string } }>(
    'fleet_watchlist_vessels',
    {
      query: `id=eq.${id}&select=id,watchlist_id,fleet_watchlists!inner(org_id)`,
      single: true,
      useServiceRole: true,
    }
  );

  if (vessel.error || !vessel.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (vessel.data.fleet_watchlists.org_id !== session.org_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await supabaseFetch('fleet_watchlist_vessels', {
    method: 'DELETE',
    query: `id=eq.${id}`,
    useServiceRole: true,
  });

  return NextResponse.json({ success: true });
}
