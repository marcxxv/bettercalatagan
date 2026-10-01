#!/usr/bin/env node
/**
 * Barangay boundaries for the map on /barangays.
 *
 *   node scripts/boundaries.mjs fetch
 *
 * PSA publishes the barangay codes (PSGC) but no boundary files of its own.
 * The outlines here come from faeldon/philippines-json-maps (MIT), built from
 * altcoder/philippines-psgc-shapefiles, which carries PSGC codes as of the end
 * of 2023. They are drawn for orientation only: not a survey, not an official
 * boundary, and never used to compute an area (land area is withheld, see
 * municipality.ts). The file's own area fields are therefore dropped.
 *
 * Refuses to write unless every one of Calatagan's 25 PSGC codes is present
 * exactly once. Writes src/data/generated/barangay-boundaries.json.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = resolve(ROOT, 'src/data/generated/barangay-boundaries.json');
const SOURCE =
  'https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/municities/hires/bgysubmuns-municity-401008000.0.1.json';
const USER_AGENT = 'BetterCalatagan/0.1 (civic transparency project; +https://github.com/marcxxv/bettercalatagan)';

/** Five decimals is about a metre: finer than the source's own accuracy. */
const round = (coords) =>
  typeof coords[0] === 'number' ? coords.map((n) => Math.round(n * 1e5) / 1e5) : coords.map(round);

async function fetchAll() {
  const expected = JSON.parse(await readFile(resolve(ROOT, 'src/data/generated/psa-population.json'), 'utf8')).barangays.map(
    (b) => b.psgc10,
  );
  const response = await fetch(SOURCE, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${SOURCE} -> HTTP ${response.status}`);
  const geo = await response.json();

  const features = geo.features.map((f) => {
    const psgc10 = String(f.properties.adm4_psgc).padStart(10, '0');
    if (!['Polygon', 'MultiPolygon'].includes(f.geometry?.type)) throw new Error(`${psgc10}: not a polygon`);
    return {
      type: 'Feature',
      properties: { psgc10, name: f.properties.adm4_en },
      geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) },
    };
  });
  const codes = features.map((f) => f.properties.psgc10).sort();
  const missing = expected.filter((c) => !codes.includes(c));
  const unknown = codes.filter((c) => !expected.includes(c));
  if (missing.length || unknown.length || new Set(codes).size !== codes.length) {
    throw new Error(`boundaries do not match PSA's 25 barangays: missing ${missing}, unknown ${unknown}`);
  }
  features.sort((a, b) => a.properties.psgc10.localeCompare(b.properties.psgc10));
  const dataset = { source: SOURCE, retrievedAt: new Date().toISOString(), type: 'FeatureCollection', features };
  await writeFile(OUT_PATH, `${JSON.stringify(dataset)}\n`);
  console.log(`boundaries: ${features.length} barangays`);
}

if (process.argv[2] === 'fetch') {
  fetchAll().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
