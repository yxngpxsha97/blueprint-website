// Emit the Marifest cruise-ship → MMSI list for the AIS collector.
// Run from blueprint/website:  npx tsx scripts/gen-marifest-ships.ts
import { writeFileSync } from 'fs';
import { CRUISE_SHIPS } from '../lib/cruise-ships';
import { buildMmsiIndex } from '../lib/ship-mmsi';

const idx = buildMmsiIndex(CRUISE_SHIPS); // Map<mmsi, CruiseShip>
const imoToMmsi = new Map<string, string>();
for (const [mmsi, ship] of idx) { if (mmsi && mmsi.length >= 6) imoToMmsi.set(ship.imo, mmsi); }
// Emit ALL ships (name-match covers the fleet; mmsi-match covers the ~43 we have)
const out = CRUISE_SHIPS.map((s) => ({
  imo: s.imo,
  name: s.name,
  mmsi: imoToMmsi.get(s.imo) ?? '',
  cruiseLine: (s as { cruiseLine?: string }).cruiseLine ?? '',
}));
const target = 'c:/Users/yxngpxsha/CC/marifest-collector/ships.json';
writeFileSync(target, JSON.stringify(out, null, 0));
console.log(`wrote ${out.length} cruise ships with MMSI → ${target}`);
console.log('total CRUISE_SHIPS:', CRUISE_SHIPS.length);
