#!/usr/bin/env node
/**
 * What changed in the generated datasets, in words a reviewer can check.
 *
 *   node scripts/data-report.mjs            compare the working tree with HEAD
 *   node scripts/data-report.mjs --github   also set `substantive` in $GITHUB_OUTPUT
 *
 * Every pipeline run restamps retrieval times, so a raw `git diff` is mostly
 * noise and hides the one line that matters. This report ignores the volatile
 * timestamp fields and lists, per dataset, the records added, removed and
 * changed, with the fields that moved and their old and new values.
 *
 * It reads; it never writes a dataset. Output is Markdown on stdout, used as
 * the body of the scheduled refresh pull request.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Dataset file → the array of records inside it and each record's key. */
const DATASETS = [
  { file: 'src/data/generated/fdp-filings.json', label: 'DILG Full Disclosure filings', list: 'records', key: 'id' },
  { file: 'src/data/generated/sre-financials.json', label: 'Statements of Receipts and Expenditures', list: 'filings', key: 'filingId' },
  { file: 'src/data/generated/psa-population.json', label: 'PSA census by barangay', list: 'barangays', key: 'psgc10' },
  { file: 'src/data/generated/archived-documents.json', label: 'Archived municipal documents', list: 'documents', key: 'id' },
  { file: 'src/data/generated/dpwh-projects.json', label: 'DPWH infrastructure projects', list: 'projects', key: 'contractId' },
  { file: 'src/data/generated/cmci.json', label: 'DTI competitiveness index', list: 'years', key: 'year' },
  { file: 'src/data/generated/psa-poverty.json', label: 'PSA poverty statistics (province)', list: 'population.rows', key: 'place+year' },
];

/** Restamped on every run; a change here is not a change in the data. */
const VOLATILE = new Set(['generatedAt', 'retrievedAt', 'stagedAt', 'lastKnownGoodAt']);

const MAX_LISTED = 25;

function atHead(file) {
  try {
    return JSON.parse(execFileSync('git', ['show', `HEAD:${file}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  } catch {
    return null;
  }
}

const strip = (value) => {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([k]) => !VOLATILE.has(k)).map(([k, v]) => [k, strip(v)]));
  }
  return value;
};

const same = (a, b) => JSON.stringify(strip(a)) === JSON.stringify(strip(b));
const show = (value) => {
  const text = JSON.stringify(value);
  return text === undefined ? '—' : text.length > 80 ? `${text.slice(0, 77)}…` : text;
};

function compare({ file, label, list, key }) {
  const before = atHead(file);
  const after = JSON.parse(readFileSync(resolve(ROOT, file), 'utf8'));
  const lines = [];
  if (!before) return { substantive: true, lines: [`### ${label}`, '', 'New dataset (not in HEAD).', ''] };

  // `list` may be a dotted path ("population.rows"); `key` may join fields ("place+year").
  const at = (obj) => list.split('.').reduce((o, k) => o?.[k], obj) ?? [];
  const id = (r) => key.split('+').map((k) => r[k]).join(' ');
  const oldById = new Map(at(before).map((r) => [id(r), r]));
  const newById = new Map(at(after).map((r) => [id(r), r]));
  const added = [...newById.keys()].filter((id) => !oldById.has(id));
  const removed = [...oldById.keys()].filter((id) => !newById.has(id));
  const changed = [];
  for (const [id, record] of newById) {
    const prior = oldById.get(id);
    if (!prior || same(prior, record)) continue;
    const fields = [...new Set([...Object.keys(prior), ...Object.keys(record)])]
      .filter((f) => !VOLATILE.has(f) && !same(prior[f], record[f]))
      .map((f) => `\`${f}\` ${show(prior[f])} → ${show(record[f])}`);
    changed.push(`\`${id}\`: ${fields.join('; ')}`);
  }
  const header = Object.keys({ ...before, ...after }).filter(
    (k) => k !== list && !VOLATILE.has(k) && !same(before[k], after[k]),
  );

  const substantive = added.length + removed.length + changed.length + header.length > 0;
  lines.push(`### ${label}`, '');
  if (!substantive) {
    lines.push('No substantive change (retrieval timestamps only).', '');
    return { substantive, lines };
  }
  lines.push(`${newById.size} records: **${added.length} added, ${removed.length} removed, ${changed.length} changed.**`, '');
  const list_ = (title, items) => {
    if (!items.length) return;
    lines.push(`**${title}**`, '');
    for (const item of items.slice(0, MAX_LISTED)) lines.push(`- ${item}`);
    if (items.length > MAX_LISTED) lines.push(`- …and ${items.length - MAX_LISTED} more`);
    lines.push('');
  };
  list_('Added', added.map((id) => `\`${id}\``));
  list_('Removed (a scrape must never do this — check the pipeline)', removed.map((id) => `\`${id}\``));
  list_('Changed', changed);
  list_('Dataset header', header.map((k) => `\`${k}\` ${show(before[k])} → ${show(after[k])}`));
  return { substantive, lines };
}

const results = DATASETS.map(compare);
const substantive = results.some((r) => r.substantive);

const out = [
  '## Data refresh report',
  '',
  substantive
    ? 'The sources changed. Review each item against its source before merging; `npm run check` has already passed on this branch.'
    : 'Nothing changed at the sources since the last refresh.',
  '',
  ...results.flatMap((r) => r.lines),
  '---',
  '',
  'Merging does not update `lastVerified`: that date records a person checking the source (see CONTRIBUTING.md). Bump it in `src/data/*.ts` only after you have checked.',
].join('\n');

console.log(out);
if (process.argv.includes('--github') && process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `substantive=${substantive}\n`);
}
