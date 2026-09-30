#!/usr/bin/env node
/**
 * DPWH infrastructure projects in Calatagan.
 *
 *   node scripts/dpwh.mjs fetch
 *
 * DPWH publishes every contract it lets (description, budget, contractor,
 * dates, status, procurement). BetterGov.ph mirrors that publication as an
 * open API, which is what the other Better LGU portals read; this pipeline
 * reads the same API, keeps only what the descriptions place in Calatagan
 * (see lib/dpwh-location.mjs), and fetches each kept contract's procurement
 * details. Nothing is estimated: every value is the record's own.
 *
 * Writes src/data/generated/dpwh-projects.json. Deterministic output. Refuses
 * to write if the number of Calatagan projects falls (a source outage must not
 * delete records).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { barangaysIn, classify } from './lib/dpwh-location.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = resolve(ROOT, 'src/data/generated/dpwh-projects.json');
const API = 'https://api.dpwh.bettergov.ph/projects';
const USER_AGENT =
  'BetterCalatagan/0.1 (civic transparency project; +https://github.com/marcxxv/bettercalatagan)';

async function getJson(url, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
      const body = await response.json();
      if (body.status !== 200) throw new Error(`${url} -> ${body.code ?? 'error'}`);
      return body.data;
    } catch (error) {
      if (attempt >= tries) throw error;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

async function searchAll(query) {
  const rows = [];
  for (let page = 1; ; page++) {
    const data = await getJson(`${API}?search=${encodeURIComponent(query)}&limit=100&page=${page}`);
    rows.push(...data.data);
    if (!data.pagination?.hasNext) break;
  }
  return rows;
}

const money = (value) => {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};
const day = (value) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null);

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])]));
  }
  return value;
}

async function fetchAll() {
  const retrievedAt = new Date().toISOString();
  const hits = await searchAll('Calatagan');
  const unique = [...new Map(hits.map((h) => [h.contractId, h])).values()];

  const kept = [];
  const excluded = { elsewhere: 0 };
  for (const hit of unique) {
    const scope = classify(hit);
    if (scope === 'elsewhere') {
      excluded.elsewhere += 1;
      continue;
    }
    kept.push({ hit, scope });
  }

  const projects = [];
  for (const { hit, scope } of kept) {
    const detail = await getJson(`${API}/${encodeURIComponent(hit.contractId)}`);
    const procurement = detail.procurement ?? {};
    projects.push({
      contractId: hit.contractId,
      description: hit.description.replace(/\s+/g, ' ').trim(),
      scope,
      barangays: scope === 'road' ? [] : barangaysIn(hit.description),
      category: hit.category ?? null,
      status: hit.status,
      progress: typeof hit.progress === 'number' ? hit.progress : null,
      infraYear: hit.infraYear ? Number(hit.infraYear) : null,
      budget: money(hit.budget),
      abc: money(procurement.abc),
      contractor: detail.winnerNames ?? hit.contractor ?? null,
      bidders: Array.isArray(detail.bidders) ? detail.bidders.length : null,
      startDate: day(hit.startDate),
      completionDate: day(hit.completionDate),
      advertisementDate: day(procurement.advertisementDate),
      programName: hit.programName ?? null,
      sourceOfFunds: hit.sourceOfFunds ?? null,
      fundingInstrument: procurement.fundingInstrument ?? null,
      implementingOffice: hit.location?.province ?? null,
    });
    await new Promise((r) => setTimeout(r, 120));
  }
  projects.sort((a, b) => (b.infraYear ?? 0) - (a.infraYear ?? 0) || a.contractId.localeCompare(b.contractId));

  const counted = projects.filter((p) => p.scope === 'calatagan').length;
  let previous = 0;
  try {
    previous = JSON.parse(await readFile(OUT_PATH, 'utf8')).projects.filter((p) => p.scope === 'calatagan').length;
  } catch {
    /* first run */
  }
  if (counted < previous) {
    throw new Error(`refusing to write: ${counted} Calatagan projects, down from ${previous}`);
  }

  const dataset = {
    source: {
      api: API,
      query: 'Calatagan',
      publisher: 'Department of Public Works and Highways, via the BetterGov.ph DPWH transparency API',
    },
    retrievedAt,
    searched: unique.length,
    excluded,
    projects,
  };
  await writeFile(OUT_PATH, `${JSON.stringify(sortKeys(dataset), null, 2)}\n`);
  const by = (s) => projects.filter((p) => p.scope === s).length;
  console.log(
    `dpwh: ${unique.length} matches · ${by('calatagan')} in Calatagan · ${by('shared')} shared · ${by('road')} on the national road · ${excluded.elsewhere} elsewhere`,
  );
}

const command = process.argv[2];
if (command === 'fetch') {
  fetchAll().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.error('usage: node scripts/dpwh.mjs fetch');
  process.exitCode = 1;
}
