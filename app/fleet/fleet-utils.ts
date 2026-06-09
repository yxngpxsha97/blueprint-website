// Shared constants and helpers for the Marifest module (navy/white house style)

export const STATUS_COLORS: Record<string, string> = {
  underway: '#2E7D54', // ok green
  moored: '#0F2A47',   // navy
  anchored: '#9A7A2E', // warn amber
};

export const STATUS_LABELS: Record<string, string> = {
  underway: 'Underway',
  moored: 'Moored',
  anchored: 'Anchored',
};

export const STATUS_BG: Record<string, string> = {
  underway: 'rgba(46,125,84,0.12)',
  moored: 'rgba(15,42,71,0.08)',
  anchored: 'rgba(154,122,46,0.14)',
};

// Navy monochrome series palette (charts) — replaces the old cyan palette.
export const NAVY_PALETTE = [
  '#0F2A47', '#1B4068', '#2A5685', '#3A6CA0', '#4E84B8',
  '#6B9BC9', '#88B2D8', '#A7C8E4', '#24507E', '#13558A',
];

// Back-compat alias: existing code imports CYAN_PALETTE — keep the name, navy values.
export const CYAN_PALETTE = NAVY_PALETTE;
