// ============================================================================
// Marifest — Ship Registry types + client helpers
// Shared by the Vloot list and the ship-detail page. Talks to /api/fleet/ships
// (the 95k-ship Supabase registry) and /api/fleet/positions (live AIS).
// ============================================================================

// Matches the row shape returned by GET /api/fleet/ships
export interface RegistryShip {
  imo: number;
  mmsi: number | null;
  name: string;
  sector: string;
  ship_type_code: string | null;
  gross_tonnage: number | null;
  length_m: number | null;
  beam_m: number | null;
  draught_m: number | null;
  built: number | null;
  builder: string | null;
  operator: string | null;
  owner: string | null;
  flag: string | null;
  home_port: string | null;
  image_url: string | null;
  sources: string[] | null;
}

export interface RegistryResponse {
  data: RegistryShip[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

// Registry DB sectors (from the `ships.sector` column).
export const REGISTRY_SECTORS = [
  'cruise', 'passenger', 'cargo', 'tanker', 'fishing',
  'tug', 'offshore', 'pleasure', 'naval', 'special', 'other',
] as const;
export type RegistrySector = (typeof REGISTRY_SECTORS)[number];

// Sortable keys supported by the API.
export type RegistrySort = 'name' | 'gt' | 'built' | 'length';

// Map the global sidebar SectorId → registry sector. Sidebar uses a different,
// AIS-driven taxonomy; this collapses it onto the DB sector vocabulary.
// 'port-authority' has no DB equivalent → treat as 'all' (null).
export function sidebarSectorToRegistry(sectorId: string): RegistrySector | null {
  switch (sectorId) {
    case 'cruise': return 'cruise';
    case 'cargo': return 'cargo';
    case 'tanker': return 'tanker';
    case 'passenger': return 'passenger';
    case 'offshore': return 'offshore';
    case 'fishing': return 'fishing';
    case 'port-authority': return null; // → all sectors
    default: return null;
  }
}

export interface FetchShipsParams {
  q?: string;
  sector?: string;          // '' or 'all' = no filter
  sort?: RegistrySort;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

// Fetch a page of ships from the registry API (same-origin).
export async function fetchRegistryShips(p: FetchShipsParams): Promise<RegistryResponse> {
  const sp = new URLSearchParams();
  if (p.q) sp.set('q', p.q);
  if (p.sector && p.sector !== 'all') sp.set('sector', p.sector);
  if (p.sort) sp.set('sort', p.sort);
  if (p.order) sp.set('order', p.order);
  sp.set('limit', String(Math.min(p.limit ?? 50, 200)));
  sp.set('offset', String(p.offset ?? 0));

  const res = await fetch(`/api/fleet/ships?${sp.toString()}`, {
    cache: 'no-store',
    signal: p.signal,
  });
  if (!res.ok) return { data: [], total: 0, limit: p.limit ?? 50, offset: p.offset ?? 0 };
  return (await res.json()) as RegistryResponse;
}

// Format helpers ------------------------------------------------------------
export function fmtInt(n: number | null | undefined, locale = 'en-US'): string {
  return typeof n === 'number' && !Number.isNaN(n) ? n.toLocaleString(locale) : '—';
}

export function fmtMeters(n: number | null | undefined): string {
  return typeof n === 'number' && !Number.isNaN(n) ? `${n} m` : '—';
}

export function fmtYear(n: number | null | undefined): string {
  return typeof n === 'number' && n > 0 ? String(n) : '—';
}
