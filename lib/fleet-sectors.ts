// ─────────────────────────────────────────────────────────────────────────────
// Fleet Sector Definitions
// Each sector defines which vessel types it tracks and how.
//
// AIS ship type codes (from ITU/IMO):
//   20-29: WIG
//   30-39: Fishing, towing, dredging, diving, military
//   40-49: High-speed craft
//   50-57: Pilots, SAR, tugs, port tenders, anti-pollution, law enforcement
//   60-69: Passenger ships
//   70-79: Cargo ships
//   80-89: Tankers
//   90-99: Other
//
// 'watchlist' source = uses a curated list (e.g. CRUISE_SHIPS)
// 'dynamic-ais' source = pulls live from AIS discoveredShips, filtered by shipTypes
// ─────────────────────────────────────────────────────────────────────────────

export type SectorId =
  | 'cruise'
  | 'cargo'
  | 'tanker'
  | 'passenger'
  | 'port-authority'
  | 'offshore'
  | 'fishing';

export interface FleetSector {
  id: SectorId;
  label: string;
  description: string;
  vesselCount: number | null; // null = dynamic count from AIS
  shipTypes: number[];        // AIS shipType codes to include (empty = use watchlist)
  vesselSource: 'watchlist' | 'dynamic-ais';
  accentColor: string;
  accentSoft: string;
  icon: string; // SVG path for the sector icon
  status: 'live' | 'beta' | 'coming-soon';
}

export const FLEET_SECTORS: FleetSector[] = [
  {
    id: 'cruise',
    // Cruise liner: tall multi-deck ship with funnel
    label: 'Cruise',
    description: 'Passenger cruise ships — 331 vessels across 40 cruise lines',
    vesselCount: 331,
    shipTypes: [],
    vesselSource: 'watchlist',
    accentColor: '#0F2A47',
    accentSoft: 'rgba(15,42,71,0.08)',
    icon: 'M5 18h14M3 21h18M7 18l2-10h6l2 10M10 8V5h4v3M12 3v2',
    status: 'live',
  },
  {
    id: 'cargo',
    // Container ship: flat hull, stacked boxes on deck
    label: 'Cargo',
    description: 'Container ships, bulk carriers, general cargo — global freight tracking',
    vesselCount: null,
    shipTypes: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    vesselSource: 'dynamic-ais',
    accentColor: '#1B4068',
    accentSoft: 'rgba(27,64,104,0.08)',
    icon: 'M2 19h20M4 19l2-9h12l2 9M8 10V7h3v3H8zm5 0V7h3v3h-3zM10 7V4h4v3',
    status: 'beta',
  },
  {
    id: 'tanker',
    // Tanker: long low hull with cylindrical tanks on deck
    label: 'Tanker',
    description: 'Oil tankers, chemical tankers, LNG/LPG carriers',
    vesselCount: null,
    shipTypes: [80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    vesselSource: 'dynamic-ais',
    accentColor: '#2A5685',
    accentSoft: 'rgba(42,86,133,0.08)',
    icon: 'M2 18h20M3 21h18M5 18l1-6h12l1 6M8 12a2 2 0 1 1 4 0M12 12a2 2 0 1 1 4 0M15 9V6h2v3',
    status: 'beta',
  },
  {
    id: 'passenger',
    // Ferry / RoPax: double-deck vessel with car deck
    label: 'Passenger',
    description: 'All passenger vessels: ferries, RoPax, high-speed craft',
    vesselCount: null,
    shipTypes: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    vesselSource: 'dynamic-ais',
    accentColor: '#3A6CA0',
    accentSoft: 'rgba(58,108,160,0.08)',
    icon: 'M2 19h20M4 19v-7l3-5h10l3 5v7M4 14h16M9 14v-5h6v5',
    status: 'beta',
  },
  {
    id: 'port-authority',
    // Tugboat / harbour patrol: compact hull with wheelhouse
    label: 'Port Authority',
    description: 'All vessels entering/leaving port — compliance, PSC, clearances',
    vesselCount: null,
    shipTypes: [], // all types
    vesselSource: 'dynamic-ais',
    accentColor: '#2E7D54',
    accentSoft: 'rgba(46,125,84,0.08)',
    icon: 'M3 18h18M4 18l1-5h5V9l5 4h5l1 5M7 13V9h3v4',
    status: 'beta',
  },
  {
    id: 'offshore',
    // PSV / offshore support: flat work deck, crane mast
    label: 'Offshore',
    description: 'Platform supply vessels, anchor handlers, offshore support',
    vesselCount: null,
    shipTypes: [31, 32, 33, 34, 35, 36, 37],
    vesselSource: 'dynamic-ais',
    accentColor: '#2D6CB5',
    accentSoft: 'rgba(45,108,181,0.08)',
    icon: 'M2 17h20M4 17l1-6h14l1 6M8 11V8h8v3M13 5v3M13 5l3 3M13 5l-2 1',
    status: 'beta',
  },
];

export const DEFAULT_SECTOR_ID: SectorId = 'cruise';

export function getSector(id: SectorId): FleetSector {
  return FLEET_SECTORS.find((s) => s.id === id) ?? FLEET_SECTORS[0];
}
