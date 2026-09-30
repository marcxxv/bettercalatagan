#!/usr/bin/env node
/**
 * DTI Cities and Municipalities Competitiveness Index — Calatagan's scores.
 *
 *   node scripts/cmci.mjs fetch
 *
 * The CMCI is DTI's own annual index (Regional Competitiveness Committees
 * gather the data; DTI publishes the rankings). For each year this reads
 * DTI's ranking table for the category Calatagan was ranked in, and records
 * Calatagan's overall rank and score, each pillar's rank and score, and how
 * many local governments were ranked in that category, all exactly as DTI's
 * table prints them.
 *
 * Deliberately NOT read: the contact block on DTI's LGU profile page (mayor,
 * population, telephone, e-mail). Those fields are stale and are withheld on
 * this site (see municipality.ts, WITHHELD).
 *
 * Writes src/data/generated/cmci.json. Deterministic output. Refuses to write
 * fewer years than the committed file holds.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = resolve(ROOT, 'src/data/generated/cmci.json');
const BASE = 'https://cmci.dti.gov.ph';
const LGU = 'Calatagan';
const PROVINCE = 'Batangas';
/** Ranking categories DTI has used for municipalities, tried in order. */
const UNITS = [
  '1st to 2nd Class Municipalities',
  '3rd to 6th Class Municipalities',
  '3rd to 4th Class Municipalities',
  '5th to 6th Class Municipalities',
  'Municipalities',
];
// DTI's server refuses requests that do not look like a browser.
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15 BetterCalatagan/0.1 (+https://github.com/marcxxv/bettercalatagan)';

async function getHtml(url, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(90_000) });
      if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt >= tries) throw error;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

const text = (html) =>
  html
    .replace(/<sup>.*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** Parse DTI's ranking table: header pillars, then one row per LGU. */
export function parseRankings(html) {
  const head = html.slice(html.indexOf('<thead'), html.indexOf('</thead>'));
  const pillars = [...head.matchAll(/<th[^>]*colspan=2[^>]*>(.*?)<\/th>/gi)].map((m) => text(m[1]));
  if (!pillars.length) throw new Error('ranking table header not found');
  const body = html.slice(html.indexOf('</thead>'));
  const rows = [];
  for (const [, row] of body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => text(m[1]));
    if (cells.length !== 5 + pillars.length * 2) continue;
    const [rank, score, lgu, province, region, ...rest] = cells;
    const n = (value) => (/^\d+(\.\d+)?$/.test(value) ? Number(value) : null);
    rows.push({
      rank: n(rank),
      score: n(score),
      lgu,
      province,
      region,
      pillars: pillars.map((name, i) => ({ name, rank: n(rest[i * 2]), score: n(rest[i * 2 + 1]) })),
    });
  }
  return { pillars, rows };
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])]));
  }
  return value;
}

async function fetchAll() {
  const retrievedAt = new Date().toISOString();
  const index = await getHtml(`${BASE}/rankings.php`);
  const firstUnit = await getHtml(`${BASE}/rankings-data.php?unit=${encodeURIComponent(UNITS[0])}`);
  const years = [...new Set([...firstUnit.matchAll(/<option value="(20\d\d)"/g)].map((m) => Number(m[1])))]
    .filter((y) => y >= 2014)
    .sort();
  if (!years.length || !index) throw new Error('no CMCI years found');

  const results = [];
  for (const year of years) {
    let found = null;
    for (const unit of UNITS) {
      const url = `${BASE}/rankings-data.php?unit=${encodeURIComponent(unit)}&year=${year}`;
      const html = await getHtml(url);
      if (!new RegExp(`<option value="${year}" selected`).test(html)) continue;
      const { rows } = parseRankings(html);
      const row = rows.find((r) => r.lgu === LGU && r.province === PROVINCE);
      if (!row) continue;
      // DTI's 2018 table prints every score as 0.0000 beside real ranks: a gap in
      // the publication, not a score of zero. Record it as not published.
      const unpublished = row.score === 0 && row.pillars.every((p) => !p.score);
      found = {
        year,
        category: unit,
        ranked: rows.length,
        url,
        rank: row.rank,
        score: unpublished ? null : row.score,
        pillars: row.pillars.map((p) => ({ ...p, score: unpublished ? null : p.score })),
      };
      break;
    }
    if (found && found.rank !== null) {
      results.push(found);
    } else {
      console.warn(`cmci: ${year}: Calatagan not ranked in any municipal category`);
    }
  }

  let previous = 0;
  try {
    previous = JSON.parse(await readFile(OUT_PATH, 'utf8')).years.length;
  } catch {
    /* first run */
  }
  if (results.length < previous) throw new Error(`refusing to write: ${results.length} years, down from ${previous}`);

  const dataset = { source: { base: BASE, lgu: LGU, province: PROVINCE }, retrievedAt, years: results };
  await writeFile(OUT_PATH, `${JSON.stringify(sortKeys(dataset), null, 2)}\n`);
  console.log(`cmci: ${results.map((r) => `${r.year} #${r.rank}/${r.ranked}`).join(' · ')}`);
}

if (process.argv[2] === 'fetch') {
  fetchAll().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.error('usage: node scripts/cmci.mjs fetch');
  process.exitCode = 1;
}
