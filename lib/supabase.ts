// ============================================================================
// Blueprint Admin Dashboard — Supabase PostgREST Wrapper
// Pure fetch() — no SDK dependency
// ============================================================================

const SUPABASE_URL = 'https://nfhesgwmbgmztjxuvrvy.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maGVzZ3dtYmdtenRqeHV2cnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzM1ODIsImV4cCI6MjA4ODMwOTU4Mn0.6Ma_cPPXq93gmjVSeHBsFw2KdgbkOAGRkj55X2Ry66g';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maGVzZ3dtYmdtenRqeHV2cnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjczMzU4MiwiZXhwIjoyMDg4MzA5NTgyfQ.TCpuvLGc0y2-3KOYunzoWfvVP3tiMd-JJtklC-tH8YY';

export interface SupabaseQueryOptions {
  /** PostgREST query string (e.g. "status=eq.active&order=created_at.desc") */
  query?: string;
  /** HTTP method (default: GET) */
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Request body for POST/PATCH */
  body?: unknown;
  /** Use service_role key (bypasses RLS) — only use server-side */
  useServiceRole?: boolean;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Return single row (adds Accept header for single object) */
  single?: boolean;
  /** Count mode: exact returns total count in response header */
  count?: 'exact' | 'planned' | 'estimated';
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: string | null;
  count: number | null;
}

/**
 * Fetch data from Supabase PostgREST API.
 *
 * @param table - Table name (e.g. "quotes", "customers")
 * @param options - Query options
 * @returns { data, error, count }
 *
 * @example
 * // Get all active quotes ordered by date
 * const { data } = await supabaseFetch<Quote[]>('quotes', {
 *   query: 'status=eq.sent&order=created_at.desc',
 *   useServiceRole: true,
 * });
 *
 * @example
 * // Create a new customer
 * const { data } = await supabaseFetch<Customer>('customers', {
 *   method: 'POST',
 *   body: { name: 'Jan de Vries', phone: '+31612345678', org_id: '...' },
 *   useServiceRole: true,
 *   single: true,
 * });
 */
export async function supabaseFetch<T>(
  table: string,
  options: SupabaseQueryOptions = {}
): Promise<SupabaseResponse<T>> {
  const {
    query = '',
    method = 'GET',
    body,
    useServiceRole = false,
    headers: extraHeaders = {},
    single = false,
    count,
  } = options;

  const apiKey = useServiceRole ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`;

  const headers: Record<string, string> = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  // For single-row responses
  if (single) {
    headers['Accept'] = 'application/vnd.pgrst.object+json';
  }

  // For POST/PATCH, request the created/updated row back
  if (method === 'POST' || method === 'PATCH') {
    headers['Prefer'] = 'return=representation';
  }

  // Count mode
  if (count) {
    headers['Prefer'] = headers['Prefer']
      ? `${headers['Prefer']}, count=${count}`
      : `count=${count}`;
    headers['Range-Unit'] = 'items';
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorBody = await res.text();
      let errorMessage: string;
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed.message || parsed.error || errorBody;
      } catch {
        errorMessage = errorBody;
      }
      return { data: null, error: `${res.status}: ${errorMessage}`, count: null };
    }

    // Parse count from Content-Range header if requested
    let totalCount: number | null = null;
    if (count) {
      const contentRange = res.headers.get('Content-Range');
      if (contentRange) {
        const match = contentRange.match(/\/(\d+|\*)/);
        if (match && match[1] !== '*') {
          totalCount = parseInt(match[1], 10);
        }
      }
    }

    // Handle empty responses (e.g., DELETE)
    const text = await res.text();
    if (!text) {
      return { data: null, error: null, count: totalCount };
    }

    const data = JSON.parse(text) as T;
    return { data, error: null, count: totalCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout';
    return { data: null, error: message, count: null };
  }
}

/**
 * Shorthand: fetch a single row by ID.
 */
export async function supabaseGetById<T>(
  table: string,
  id: string,
  options: { select?: string; useServiceRole?: boolean } = {}
): Promise<SupabaseResponse<T>> {
  const select = options.select ? `select=${options.select}&` : '';
  return supabaseFetch<T>(table, {
    query: `${select}id=eq.${id}`,
    single: true,
    useServiceRole: options.useServiceRole ?? true,
  });
}

/**
 * Shorthand: update a row by ID.
 */
export async function supabaseUpdate<T>(
  table: string,
  id: string,
  body: Partial<T>,
  options: { useServiceRole?: boolean } = {}
): Promise<SupabaseResponse<T>> {
  return supabaseFetch<T>(table, {
    query: `id=eq.${id}`,
    method: 'PATCH',
    body,
    single: true,
    useServiceRole: options.useServiceRole ?? true,
  });
}
