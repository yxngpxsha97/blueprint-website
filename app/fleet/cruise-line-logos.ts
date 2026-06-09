// ============================================================================
// Cruise Line Logos — using Google favicon service (always available, no CORS)
// Falls back to colored SVG initials for unknown lines
// ============================================================================

// Google's favicon service reliably returns logos for any domain
const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const CRUISE_LINE_LOGOS: Record<string, string> = {
  'CARNIVAL CRUISE LINE': favicon('carnival.com'),
  'ROYAL CARIBBEAN INTERNATIONAL': favicon('royalcaribbean.com'),
  'MSC CRUISES': favicon('msccruises.com'),
  'NORWEGIAN CRUISE LINE': favicon('ncl.com'),
  'DISNEY CRUISE LINE': favicon('disneycruise.disney.go.com'),
  'DISNEY CRUISE LINES: SBP Natasha Pritchard': favicon('disneycruise.disney.go.com'),
  'CELEBRITY CRUISES': favicon('celebritycruises.com'),
  'HOLLAND AMERICA LINE': favicon('hollandamerica.com'),
  'PRINCESS CRUISES': favicon('princess.com'),
  'COSTA CRUISES': favicon('costacruises.com'),
  'AIDA CRUISES': favicon('aida.de'),
  'P&O CRUISES': favicon('pocruises.com'),
  'P&O CRUISES (AUSTRALIA)': favicon('pocruises.com.au'),
  'CUNARD LINE': favicon('cunard.com'),
  'CUNARD': favicon('cunard.com'),
  'VIKING OCEAN CRUISES': favicon('vikingcruises.com'),
  'VIKING': favicon('vikingcruises.com'),
  'SILVERSEA CRUISES': favicon('silversea.com'),
  'SEABOURN CRUISE LINE': favicon('seabourn.com'),
  'SEABOURN': favicon('seabourn.com'),
  'AZAMARA': favicon('azamara.com'),
  'OCEANIA CRUISES': favicon('oceaniacruises.com'),
  'REGENT SEVEN SEAS CRUISES': favicon('rssc.com'),
  'HURTIGRUTEN': favicon('hurtigruten.com'),
  'TUI CRUISES': favicon('tuicruises.com'),
  'HAPAG-LLOYD CRUISES': favicon('hl-cruises.com'),
  'FRED OLSEN CRUISE LINES': favicon('fredolsencruises.com'),
  'SAGA CRUISES': favicon('saga.co.uk'),
  'MARELLA CRUISES': favicon('tui.co.uk'),
  'WINDSTAR CRUISES': favicon('windstarcruises.com'),
  'PONANT': favicon('ponant.com'),
  'EXPLORA': favicon('explorajourneys.com'),
  'EXPLORA JOURNEYS': favicon('explorajourneys.com'),
  'AMBASSADOR CRUISES': favicon('ambassadorcruiseline.com'),
  'ADORA CRUISES': favicon('adoracruises.com'),
  'ALBATROS EXPEDITIONS': favicon('albatros-expeditions.com'),
  'ANTARTICA XXI': favicon('antarcticaxxi.com'),
  'CELESTYAL CRUISES': favicon('celestyal.com'),
  'CORDELIA CRUISES': favicon('cordeliacruises.com'),
  'CRYSTAL CRUISES': favicon('crystalcruises.com'),
  'LINDBLAD EXPEDITIONS': favicon('expeditions.com'),
  'NICKO CRUISES': favicon('nicko-cruises.de'),
  'QUARK EXPEDITIONS': favicon('quarkexpeditions.com'),
  'SCENIC': favicon('scenic.com.au'),
  'SCENIC LUXURY CRUISES': favicon('scenic.com.au'),
  'SWAN HELLENIC': favicon('swanhellenic.com'),
  'VIRGIN VOYAGES': favicon('virginvoyages.com'),
  'RITZ-CARLTON YACHT COLLECTION': favicon('rfritz-carltonreserve.com'),
  'STAR CLIPPERS': favicon('starclippers.com'),
  'HAVILA VOYAGES': favicon('havilavoyages.com'),
  'DREAM CRUISES': favicon('dreamcruiseline.com'),
  'AURORA EXPEDITIONS': favicon('auroraexpeditions.com.au'),
  'AMERICAN CRUISE LINES': favicon('americancruiselines.com'),
};

// Brand colors for SVG fallback initials
const BRAND_COLORS: Record<string, string> = {
  'CARNIVAL CRUISE LINE': '#003DA5',
  'ROYAL CARIBBEAN INTERNATIONAL': '#00205B',
  'MSC CRUISES': '#002B5C',
  'NORWEGIAN CRUISE LINE': '#001E60',
  'DISNEY CRUISE LINE': '#1A3C6E',
  'CELEBRITY CRUISES': '#1C2B4A',
  'HOLLAND AMERICA LINE': '#003876',
  'PRINCESS CRUISES': '#00263A',
  'COSTA CRUISES': '#FFD700',
  'AIDA CRUISES': '#FF6600',
  'CUNARD LINE': '#B8001C',
  'VIKING': '#C8102E',
  'SILVERSEA CRUISES': '#8B8B8B',
  'SEABOURN': '#003057',
  'AZAMARA': '#0076A8',
  'OCEANIA CRUISES': '#002D62',
  'HURTIGRUTEN': '#C8102E',
  'TUI CRUISES': '#D40E14',
  'HAPAG-LLOYD CRUISES': '#FF6600',
  'PONANT': '#002B5C',
  'VIRGIN VOYAGES': '#E30613',
};

export function getCruiseLineInitials(name: string): string {
  // Clean up common suffixes
  const clean = name
    .replace(/CRUISE LINE[S]?/gi, '')
    .replace(/CRUISES/gi, '')
    .replace(/INTERNATIONAL/gi, '')
    .replace(/EXPEDITIONS/gi, '')
    .replace(/OCEAN/gi, '')
    .replace(/: SBP.*$/i, '')
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function getCruiseLineColor(name: string): string {
  const upper = name.toUpperCase();
  for (const [key, color] of Object.entries(BRAND_COLORS)) {
    if (upper.includes(key) || key.includes(upper)) return color;
  }
  // Deterministic color from name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}
