#!/usr/bin/env node
/**
 * PSA OpenSTAT — census figures for Calatagan.
 *
 *   node scripts/psa.mjs fetch
 *
 * PSA's public web pages sit behind a bot challenge, but PSA's own statistical
 * database (OpenSTAT, a PxWeb instance) answers normally. This is a primary
 * government source: the same authority, the same release, served as data.
 *
 * Writes src/data/generated/psa-population.json. Deterministic output.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = resolve(ROOT, 'src/data/generated/psa-population.json');

const API = 'https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A';
/** CALABARZON: population, household population and households, by barangay. */
const TABLE_2024 = `${API}/PO_2024/0041A6DTPH3.px`;
/** Population, land area and density for 2015, 2020 and 2024 by municipality. */
const TABLE_SERIES = `${API}/PO_2024/0221A6DLPD0.px`;

const MUNICIPALITY_PSGC = '0401008000';
/**
 * Calatagan's 25 barangay PSGC codes. Note the real, non-contiguous sequence:
 * 012, 024 and 025 are unassigned. Confirmed against PSA's own geo keys.
 */
const BARANGAY_SUFFIXES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 27, 28,
];
const BARANGAY_PSGC = BARANGAY_SUFFIXES.map((n) => `04010080${String(n).padStart(2, '0')}`);

const USER_AGENT =
  'BetterCalatagan/0.1 (civic transparency project; +https://github.com/marcxxv/bettercalatagan)';

async function queryCsv(table, geoCodes) {
  const response = await fetch(table, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({
      query: [
        { code: 'Geographic Location', selection: { filter: 'item', values: geoCodes } },
        { code: 'Parameter', selection: { filter: 'all', values: ['*'] } },
      ],
      response: { format: 'csv' },
    }),
  });
  if (!response.ok) throw new Error(`${table} -> HTTP ${response.status}`);
  return parseCsv(await response.text());
}

/** Minimal CSV reader; PxWeb quotes labels and leaves numbers bare. */
function parseCsv(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const cells = [];
      let cell = '';
      let quoted = false;
      for (const char of line) {
        if (char === '"') quoted = !quoted;
        else if (char === ',' && !quoted) {
          cells.push(cell);
          cell = '';
        } else cell += char;
      }
      cells.push(cell);
      return cells;
    });
}

/** PxWeb indents the hierarchy with dots: 6 for a municipality, 8 for a barangay. */
const depth = (label) => (label.match(/^\.*/)?.[0].length ?? 0);
const cleanName = (label) => label.replace(/^\.+/, '').trim();

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])]));
  }
  return value;
}

async function fetchAll() {
  const retrievedAt = new Date().toISOString();

  // 2024 census: municipality plus every barangay.
  const census = await queryCsv(TABLE_2024, [MUNICIPALITY_PSGC, ...BARANGAY_PSGC]);
  const [, ...censusRows] = census;

  const municipalityRow = censusRows.find((row) => depth(row[0]) === 6);
  const barangayRows = censusRows.filter((row) => depth(row[0]) === 8);
  if (!municipalityRow) throw new Error('municipality row not found in 2024 census response');
  if (barangayRows.length !== BARANGAY_PSGC.length) {
    throw new Error(`expected ${BARANGAY_PSGC.length} barangays, got ${barangayRows.length}`);
  }

  const barangays = barangayRows.map((row, index) => ({
    psgc10: BARANGAY_PSGC[index],
    name: cleanName(row[0]),
    totalPopulation: Number(row[1]),
    householdPopulation: Number(row[2]),
    households: Number(row[3]),
  }));

  const municipality = {
    psgc10: MUNICIPALITY_PSGC,
    name: cleanName(municipalityRow[0]),
    totalPopulation: Number(municipalityRow[1]),
    householdPopulation: Number(municipalityRow[2]),
    households: Number(municipalityRow[3]),
  };

  // Reconciliation is a hard gate, not a warning: if PSA's own parts do not
  // sum to PSA's own total, we have misread the table and must not publish.
  const sumPopulation = barangays.reduce((total, b) => total + b.totalPopulation, 0);
  const sumHouseholds = barangays.reduce((total, b) => total + b.households, 0);
  if (sumPopulation !== municipality.totalPopulation) {
    throw new Error(`barangay population ${sumPopulation} != municipal ${municipality.totalPopulation}`);
  }
  if (sumHouseholds !== municipality.households) {
    throw new Error(`barangay households ${sumHouseholds} != municipal ${municipality.households}`);
  }

  // Longitudinal series; also carries PSA's land-area column.
  const series = await queryCsv(TABLE_SERIES, [MUNICIPALITY_PSGC]);
  const [seriesHeader, seriesRow] = series;
  const column = (pattern) => {
    const index = seriesHeader.findIndex((h) => pattern.test(h));
    return index === -1 ? null : seriesRow[index];
  };

  const populationSeries = [
    { census: '2015 POPCEN', referenceDate: '2015-08-01', population: Number(column(/2015 Population$/)) },
    { census: '2020 CPH', referenceDate: '2020-05-01', population: Number(column(/2020 Population$/)) },
    { census: '2024 POPCEN', referenceDate: '2024-07-01', population: Number(column(/2024 Population$/)) },
  ];

  const reportedLandAreaKm2 = Number(column(/Land Area/));
  const reportedDensity2024 = Number(column(/2024 Population Density/));

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(
    OUT_PATH,
    `${JSON.stringify(
      sortKeys({
        schemaVersion: '1.0.0',
        source: {
          name: 'PSA OpenSTAT — 2024 Census of Population',
          publisher: 'Philippine Statistics Authority',
          api: API,
          tables: { census2024: TABLE_2024, series: TABLE_SERIES },
        },
        retrievedAt,
        municipality,
        barangays,
        populationSeries,
        /**
         * Recorded, NOT published. PSA's land-area column gives 10.50 km² for
         * Calatagan, which implies a density of 5,754 persons/km² — an order of
         * magnitude denser than comparable Batangas municipalities. Treated as a
         * suspected data-entry error in the source table. See SOURCES.md.
         */
        reportedLandAreaKm2,
        reportedDensity2024,
      }),
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(`PSA census fetched for ${municipality.name}`);
  console.log(`  2024 population : ${municipality.totalPopulation.toLocaleString()}`);
  console.log(`  2024 households : ${municipality.households.toLocaleString()}`);
  console.log(`  barangays       : ${barangays.length} (reconcile exactly)`);
  console.log(`  series          : ${populationSeries.map((s) => `${s.census}=${s.population}`).join(', ')}`);
  console.log(`  land area (raw) : ${reportedLandAreaKm2} km² — suspected source error, not published`);
  console.log(`  → ${OUT_PATH}`);
}

const command = process.argv[2];
if (command === 'fetch') await fetchAll();
else {
  console.error('usage: node scripts/psa.mjs fetch');
  process.exit(1);
}
