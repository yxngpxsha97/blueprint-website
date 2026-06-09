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

async function sbGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders() });
  return res.ok ? res.json() : [];
}

async function sbPost(table: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify(body),
  });
  return res.ok;
}

export async function POST(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const orgId = session.org_id;

  // Get org watchlists
  const watchlists: { id: string }[] = await sbGet(
    `fleet_watchlists?org_id=eq.${orgId}&select=id`
  );
  if (watchlists.length === 0) return NextResponse.json({ scanned: 0, created: 0, skipped: 0 });

  const wlIds = watchlists.map((w) => w.id).join(',');

  // Get watchlist vessels (no FK join — fetch profiles separately)
  const rawVessels: Array<{ id: string; imo: string; custom_name: string | null }> = await sbGet(
    `fleet_watchlist_vessels?watchlist_id=in.(${wlIds})&select=id,imo,custom_name`
  );

  // Fetch vessel_profiles for those IMOs
  const imoList = rawVessels.map((v) => v.imo).join(',');
  const profileRows: Array<{
    imo: string;
    name: string | null;
    flag: string | null;
    class_society: string | null;
    has_detention: boolean;
    total_deficiencies: number;
    certs_expiring_soon: boolean;
    last_detention: string | null;
  }> = imoList ? await sbGet(`vessel_profiles?imo=in.(${imoList})&select=imo,name,flag,class_society,has_detention,total_deficiencies,certs_expiring_soon,last_detention`) : [];

  const profileMap = new Map(profileRows.map((p) => [p.imo, p]));

  const vessels = rawVessels.map((v) => ({
    ...v,
    vessel_profiles: profileMap.get(v.imo) ?? null,
  }));

  // Get existing active alerts for this org
  const existing: Array<{ imo: string; alert_type: string }> = await sbGet(
    `vessel_alerts?org_id=eq.${orgId}&is_dismissed=eq.false&select=imo,alert_type`
  );
  const existingSet = new Set(existing.map((a) => `${a.imo}:${a.alert_type}`));

  let created = 0;
  let skipped = 0;

  for (const vessel of vessels) {
    const profile = vessel.vessel_profiles;
    if (!profile) { skipped++; continue; }

    const vesselName = vessel.custom_name || profile.name || `IMO ${vessel.imo}`;

    const alertsToCreate: Array<{
      org_id: string;
      imo: string;
      vessel_name: string;
      alert_type: string;
      severity: string;
      title: string;
      description: string;
      data: Record<string, unknown>;
    }> = [];

    // PSC Detention
    if (profile.has_detention) {
      const key = `${vessel.imo}:psc_detention`;
      if (!existingSet.has(key)) {
        alertsToCreate.push({
          org_id: orgId,
          imo: vessel.imo,
          vessel_name: vesselName,
          alert_type: 'psc_detention',
          severity: 'high',
          title: `PSC Detention — ${vesselName}`,
          description: `${vesselName} has a recorded PSC detention.${profile.last_detention ? ` Last detention: ${profile.last_detention}.` : ''}`,
          data: { last_detention: profile.last_detention, flag: profile.flag },
        });
        existingSet.add(key);
      }
    }

    // PSC Deficiencies > 5
    if (profile.total_deficiencies > 5) {
      const key = `${vessel.imo}:psc_deficiencies`;
      if (!existingSet.has(key)) {
        alertsToCreate.push({
          org_id: orgId,
          imo: vessel.imo,
          vessel_name: vesselName,
          alert_type: 'psc_deficiencies',
          severity: 'medium',
          title: `High Deficiency Count — ${vesselName}`,
          description: `${vesselName} has ${profile.total_deficiencies} recorded PSC deficiencies.`,
          data: { total_deficiencies: profile.total_deficiencies, flag: profile.flag },
        });
        existingSet.add(key);
      }
    }

    // Certs expiring soon
    if (profile.certs_expiring_soon) {
      const key = `${vessel.imo}:cert_expiry_30d`;
      if (!existingSet.has(key)) {
        alertsToCreate.push({
          org_id: orgId,
          imo: vessel.imo,
          vessel_name: vesselName,
          alert_type: 'cert_expiry_30d',
          severity: 'high',
          title: `Certificate Expiring Soon — ${vesselName}`,
          description: `One or more certificates for ${vesselName} expire within 90 days.`,
          data: { class_society: profile.class_society, flag: profile.flag },
        });
        existingSet.add(key);
      }
    }

    for (const alert of alertsToCreate) {
      const ok = await sbPost('vessel_alerts', alert);
      if (ok) created++;
    }
  }

  return NextResponse.json({ scanned: vessels.length, created, skipped });
}

export const maxDuration = 30;
