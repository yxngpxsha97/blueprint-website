// ============================================================================
// Marifest PostgREST wrapper — same shape as lib/supabase.ts but pointed at the
// dedicated Marifest project (DesignCheck org), NOT Blueprint. Server-side only:
// always uses the Marifest service_role key (tables are RLS-locked, no anon
// policy), org scoping is done in the query string like the Blueprint routes.
// Env: MARIFEST_SUPABASE_URL, MARIFEST_SUPABASE_SERVICE_KEY.
// ============================================================================
import type { SupabaseQueryOptions, SupabaseResponse } from './supabase';

const SUPA_URL = process.env.MARIFEST_SUPABASE_URL || 'https://bwegtwleqyfuyfkaluki.supabase.co';
const SERVICE_KEY = process.env.MARIFEST_SUPABASE_SERVICE_KEY || '';

export async function marifestFetch<T>(
  table: string,
  options: SupabaseQueryOptions = {},
): Promise<SupabaseResponse<T>> {
  const { query = '', method = 'GET', body, headers: extraHeaders = {}, single = false, count } = options;

  if (!SERVICE_KEY) {
    return { data: null, error: 'MARIFEST_SUPABASE_SERVICE_KEY not set', count: null };
  }

  const url = `${SUPA_URL}/rest/v1/${table}${query ? `?${query}` : ''}`;
  const headers: Record<string, string> = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (single) headers['Accept'] = 'application/vnd.pgrst.object+json';
  if (method === 'POST' || method === 'PATCH') headers['Prefer'] = 'return=representation';
  if (count) {
    headers['Prefer'] = headers['Prefer'] ? `${headers['Prefer']}, count=${count}` : `count=${count}`;
    headers['Range-Unit'] = 'items';
  }

  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    if (!res.ok) {
      const errorBody = await res.text();
      let errorMessage: string;
      try { const p = JSON.parse(errorBody); errorMessage = p.message || p.error || errorBody; } catch { errorMessage = errorBody; }
      return { data: null, error: `${res.status}: ${errorMessage}`, count: null };
    }
    let totalCount: number | null = null;
    if (count) {
      const cr = res.headers.get('Content-Range');
      const m = cr?.match(/\/(\d+|\*)/);
      if (m && m[1] !== '*') totalCount = parseInt(m[1], 10);
    }
    const text = await res.text();
    if (!text) return { data: null, error: null, count: totalCount };
    return { data: JSON.parse(text) as T, error: null, count: totalCount };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Onbekende fout', count: null };
  }
}
