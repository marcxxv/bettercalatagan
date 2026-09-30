#!/usr/bin/env node
/**
 * PSA OpenSTAT — official poverty statistics for Batangas and CALABARZON.
 *
 *   node scripts/poverty.mjs fetch
 *
 * PSA's full-year poverty tables go down to the province, not the municipality.
 * PSA's municipal small-area estimates are published only on psa.gov.ph, which
 * sits behind a bot challenge, so they are not read here and Calatagan's own
 * poverty incidence stays unpublished on this site. What is recorded is the
 * figure for the province Calatagan belongs to, and for its region, exactly as
 * PSA's tables give them, with PSA's own measures of precision.
 *
 * Writes src/data/generated/psa-poverty.json. Deterministic output.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = resolve(ROOT, 'src/data/generated/psa-poverty.json');
const API = 'https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1F/FY';
const TABLES = {
  population: `${API}/0031F3DF020.px`,
  families: `${API}/0011F3DF010.px`,
};
const PLACES = { '32': 'Region IV-A (CALABARZON)', '33': 'Batangas' };
const USER_AGENT = 'BetterCalatagan/0.1 (civic transparency project; +https://github.com/marcxxv/bettercalatagan)';

async function pxweb(url, init) {
  const response = await fetch(url, { ...init, headers: { 'User-Agent': USER_AGENT, ...init?.headers }, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  // PSA's API prefixes its JSON with a byte-order mark.
  return JSON.parse((await response.text()).replace(/^\uFEFF/, ''));
}

/** One table: for each place and year, the threshold, incidence and precision PSA prints. */
async function readTable(url) {
  const meta = await pxweb(url);
  const [geo, parameter, year] = meta.variables;
  const labels = new Map(parameter.values.map((v, i) => [v, parameter.valueTexts[i]]));
  const years = new Map(year.values.map((v, i) => [v, Number(year.valueTexts[i])]));
  for (const code of Object.keys(PLACES)) {
    const text = geo.valueTexts[geo.values.indexOf(code)] ?? '';
    if (!text.includes(code === '33' ? 'Batangas' : 'CALABARZON')) {
      throw new Error(`${url}: geo code ${code} is "${text}", expected ${PLACES[code]}`);
    }
  }
  const data = await pxweb(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: [{ code: geo.code, selection: { filter: 'item', values: Object.keys(PLACES) } }],
      response: { format: 'json' },
    }),
  });
  const FIELD = [
    [/Threshold/i, 'threshold'],
    [/Incidence/i, 'incidence'],
    [/Coefficient/i, 'cv'],
    [/Standard Error/i, 'standardError'],
    [/Lower/i, 'ciLower'],
    [/Upper/i, 'ciUpper'],
  ];
  const rows = new Map();
  for (const { key, values } of data.data) {
    const [g, p, y] = key;
    const field = FIELD.find(([re]) => re.test(labels.get(p) ?? ''))?.[1];
    if (!field) throw new Error(`${url}: unknown parameter "${labels.get(p)}"`);
    const id = `${g}:${y}`;
    const row = rows.get(id) ?? { place: PLACES[g], year: years.get(y) };
    const n = Number(values[0]);
    row[field] = Number.isFinite(n) && values[0] !== '..' ? n : null;
    rows.set(id, row);
  }
  return { title: meta.title, url, rows: [...rows.values()].sort((a, b) => a.place.localeCompare(b.place) || a.year - b.year) };
}

async function fetchAll() {
  const [population, families] = await Promise.all([readTable(TABLES.population), readTable(TABLES.families)]);
  for (const t of [population, families]) {
    if (t.rows.length < 4) throw new Error(`${t.url}: only ${t.rows.length} rows`);
    for (const r of t.rows) {
      if (r.incidence === null || r.incidence < 0 || r.incidence > 100) throw new Error(`${t.url}: bad incidence ${JSON.stringify(r)}`);
    }
  }
  const dataset = { retrievedAt: new Date().toISOString(), population, families };
  await writeFile(OUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`);
  const b = population.rows.filter((r) => r.place === 'Batangas').map((r) => `${r.year} ${r.incidence}%`);
  console.log(`poverty: Batangas population incidence ${b.join(' · ')}`);
}

if (process.argv[2] === 'fetch') {
  fetchAll().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
