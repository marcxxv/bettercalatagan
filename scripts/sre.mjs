#!/usr/bin/env node
/**
 * Statement of Receipts and Expenditures — structured extraction.
 *
 *   node scripts/sre.mjs extract
 *
 * The SRE (FDP Form 3, BLGF MC 023-2019 Annex A) is the most standardised of
 * the Full Disclosure forms: fixed labels, four value columns, and several
 * internal identities that must hold. That makes it the right place to start
 * extracting figures rather than only indexing documents.
 *
 * Principles, in order:
 *  1. The original filing stays authoritative. Every value records the sheet
 *     and the exact cell it came from, so any figure can be checked.
 *  2. Rows are located by LABEL, not by row number, so a shifted layout does
 *     not silently misattribute values.
 *  3. Reconciliation is a gate. If a filing's own totals do not add up, its
 *     figures are marked unverified and are not published.
 *  4. Nothing is normalised when its meaning is unclear — unmatched labels are
 *     reported, not guessed at.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readWorkbook } from './lib/xlsx.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILINGS_PATH = resolve(ROOT, 'src/data/generated/fdp-filings.json');
const OUT_PATH = resolve(ROOT, 'src/data/generated/sre-financials.json');

const USER_AGENT =
  'BetterCalatagan/0.1 (civic transparency project; +https://github.com/marcxxv/bettergov)';

/** Value columns of FDP Form 3. */
const COLUMNS = {
  /** "Income/Target Budget Appropriations" — a target for income rows, an appropriation for expenditure rows. */
  budget: 'D',
  generalFund: 'E',
  sef: 'F',
  total: 'G',
};

/**
 * Line items we extract, keyed by a stable slug and matched on the form's own
 * label. `kind` records what the budget column means for that row, so the two
 * senses are never collapsed.
 *
 * `aliases` lists labels literally observed in earlier filings. They are exact
 * strings, never fuzzy matches: the LGU's own spreadsheets carry typos
 * ("General Pubic Services", "TOTAL CURRENT OPERATING INCOE") which must be
 * accepted without loosening matching to the point where two different line
 * items could collide.
 *
 * One alias is not a typo. "Internal Revenue Allotment" was renamed the
 * "National Tax Allotment" following the Mandanas-Garcia ruling, so filings
 * before and after the change use different names for the same line.
 */
const LINE_ITEMS = [
  { key: 'local-sources', label: 'LOCAL SOURCES', kind: 'income', level: 1 },
  { key: 'tax-revenue', label: 'TAX REVENUE', kind: 'income', level: 2 },
  { key: 'real-property-tax', label: 'Real Property Tax', kind: 'income', level: 3 },
  { key: 'tax-on-business', label: 'Tax on Business', kind: 'income', level: 3 },
  { key: 'other-taxes', label: 'Other Taxes', kind: 'income', level: 3 },
  { key: 'non-tax-revenue', label: 'NON TAX REVENUE', kind: 'income', level: 2 },
  {
    key: 'regulatory-fees',
    label: 'Regulatory Fees permits and Licenses',
    aliases: ['Regulatory Fees 9permits and Licenses'],
    kind: 'income',
    level: 3,
  },
  { key: 'service-user-charges', label: 'Sevice/User Charges (Service Income)', kind: 'income', level: 3 },
  { key: 'economic-enterprises', label: 'Receipts from Economic Enterprises (Business Income)', kind: 'income', level: 3 },
  { key: 'other-receipts', label: 'Other Receipts (Other General Income)', kind: 'income', level: 3 },
  { key: 'external-sources', label: 'EXTERNAL SOURCES', kind: 'income', level: 1 },
  {
    key: 'national-tax-allotment',
    label: 'National Tax Allotment',
    // Renamed from "Internal Revenue Allotment" after Mandanas-Garcia.
    aliases: ['Internal Revenue Allotment'],
    kind: 'income',
    level: 2,
  },
  { key: 'other-national-shares', label: 'Other Shares from National Tax Collections', kind: 'income', level: 2 },
  { key: 'inter-local-transfers', label: 'Inter-Local Transfers', kind: 'income', level: 2 },
  { key: 'extraordinary-receipts', label: 'Extraordinary Receipt/Grants/Donations/Aids', kind: 'income', level: 2 },
  {
    key: 'total-current-operating-income',
    label: 'TOTAL CURRENT OPERATING INCOME',
    aliases: ['TOTAL CURRENT OPERATING INCOE'],
    kind: 'income',
    level: 0,
  },

  {
    key: 'general-public-services',
    label: 'General Public Services',
    aliases: ['General Pubic Services'],
    kind: 'expenditure',
    level: 2,
  },
  { key: 'education-culture-sports', label: 'Education, Culture & Sports/Manpower Development', kind: 'expenditure', level: 2 },
  { key: 'health-nutrition-population', label: 'Health, Nutrition & Population Control', kind: 'expenditure', level: 2 },
  { key: 'labor-and-employment', label: 'Labor and Employment', kind: 'expenditure', level: 2 },
  { key: 'housing-community-development', label: 'Housing and Community Development', kind: 'expenditure', level: 2 },
  {
    key: 'social-services-welfare',
    label: 'Social Services and Social Welfare',
    aliases: ['Scial Services and Social Welfare'],
    kind: 'expenditure',
    level: 2,
  },
  { key: 'economic-services', label: 'Economic Services', kind: 'expenditure', level: 2 },
  { key: 'debt-service-interest', label: 'Debt Service (FE) (Interest Expense & Other Charges)', kind: 'expenditure', level: 2 },
  { key: 'total-current-operating-expenditures', label: 'TOTAL CURRENT OPERATING EXPENDITURES', kind: 'expenditure', level: 0 },

  { key: 'net-operating-income', label: 'NET OPERATING INCOME (LOSS) FROM CURRENT OPERATIONS', kind: 'derived', level: 0 },
  { key: 'total-available-for-operating-expenditures', label: 'TOTAL AVAILABLE FOR CURRENT OPERATING EXPENDITURES', kind: 'derived', level: 0 },
  { key: 'capital-investment-expenditures', label: 'CAPITAL/INVESTMENT EXPENDITURES', kind: 'expenditure', level: 1 },
  { key: 'debt-service-principal', label: 'DEBT SERVICE (Principal Cost)', kind: 'expenditure', level: 1 },
  {
    key: 'total-non-operating-expenditures',
    label: 'TOTAL NON-OPERATING EXPENDITURES',
    aliases: ['TOTAL NON-OPERATING EXPENDITIRES'],
    kind: 'expenditure',
    level: 0,
  },
  {
    key: 'cash-balance-beginning',
    label: 'ADD: CASH BALANCE, BEGINNING',
    aliases: ['ADD:CASH BALANCE, BEGINNING'],
    kind: 'balance',
    level: 0,
  },
  { key: 'cash-balance-end', label: 'FUND/CASH BALANCE, END', kind: 'balance', level: 0 },
];

/** Identities the form asserts about itself. Tolerance is one centavo per term. */
const IDENTITIES = [
  { id: 'local-sources-split', total: 'local-sources', parts: ['tax-revenue', 'non-tax-revenue'] },
  { id: 'tax-revenue-split', total: 'tax-revenue', parts: ['real-property-tax', 'tax-on-business', 'other-taxes'] },
  {
    id: 'non-tax-revenue-split',
    total: 'non-tax-revenue',
    parts: ['regulatory-fees', 'service-user-charges', 'economic-enterprises', 'other-receipts'],
  },
  {
    id: 'external-sources-split',
    total: 'external-sources',
    parts: ['national-tax-allotment', 'other-national-shares', 'inter-local-transfers', 'extraordinary-receipts'],
  },
  {
    id: 'total-income-split',
    total: 'total-current-operating-income',
    parts: ['local-sources', 'external-sources'],
  },
  {
    id: 'operating-expenditure-split',
    total: 'total-current-operating-expenditures',
    parts: [
      'general-public-services',
      'education-culture-sports',
      'health-nutrition-population',
      'labor-and-employment',
      'housing-community-development',
      'social-services-welfare',
      'economic-services',
      'debt-service-interest',
    ],
  },
  {
    id: 'non-operating-expenditure-split',
    total: 'total-non-operating-expenditures',
    parts: ['capital-investment-expenditures', 'debt-service-principal'],
  },
];

const normalise = (text) =>
  String(text)
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const round2 = (value) => Math.round(value * 100) / 100;

function extractFiling(buffer, filing) {
  const workbook = readWorkbook(buffer);
  const sheet =
    workbook.sheets.find((s) => /form\s*3|sre/i.test(s.name)) ?? workbook.sheets[0];
  if (!sheet) return { ok: false, reason: 'no sheet found' };
  const { cells } = sheet;

  // Confirm the sheet really is Calatagan's, for the period we think it is.
  const header = {
    region: cells.get('C4'),
    province: cells.get('C5'),
    lgu: cells.get('C6'),
    year: cells.get('F4'),
    quarter: cells.get('F5'),
  };
  if (normalise(header.lgu ?? '') !== 'calatagan') {
    return { ok: false, reason: `sheet is for ${header.lgu ?? 'an unknown LGU'}` };
  }
  if (Number(header.year) !== filing.documentPeriod.year) {
    return { ok: false, reason: `sheet year ${header.year} != filing year ${filing.documentPeriod.year}` };
  }
  if (Number(header.quarter) !== filing.documentPeriod.quarter) {
    return {
      ok: false,
      reason: `sheet quarter ${header.quarter} != filing quarter ${filing.documentPeriod.quarter}`,
    };
  }

  // Index label cells in columns A and B by their normalised text.
  const labelRows = new Map();
  for (const [ref, value] of cells) {
    if (typeof value !== 'string') continue;
    const match = ref.match(/^([AB])(\d+)$/);
    if (!match) continue;
    const key = normalise(value);
    if (key && !labelRows.has(key)) labelRows.set(key, Number(match[2]));
  }

  const items = [];
  const unmatched = [];
  for (const item of LINE_ITEMS) {
    const candidates = [item.label, ...(item.aliases ?? [])];
    let row;
    let matchedLabel;
    for (const candidate of candidates) {
      const found = labelRows.get(normalise(candidate));
      if (found !== undefined) {
        row = found;
        matchedLabel = candidate;
        break;
      }
    }
    if (row === undefined) {
      unmatched.push(item.key);
      continue;
    }
    const readCell = (column) => {
      const ref = `${column}${row}`;
      const value = cells.get(ref);
      return typeof value === 'number' ? { value: round2(value), cell: ref } : null;
    };
    items.push({
      key: item.key,
      label: item.label,
      // What this particular filing actually called the line.
      sourceLabel: matchedLabel,
      kind: item.kind,
      level: item.level,
      row,
      budget: readCell(COLUMNS.budget),
      generalFund: readCell(COLUMNS.generalFund),
      sef: readCell(COLUMNS.sef),
      total: readCell(COLUMNS.total),
    });
  }

  const byKey = new Map(items.map((item) => [item.key, item]));
  const checks = [];

  // Identity 1: the fund columns must add to the total column.
  for (const item of items) {
    if (!item.generalFund || !item.sef || !item.total) continue;
    const sum = round2(item.generalFund.value + item.sef.value);
    checks.push({
      id: `fund-split:${item.key}`,
      kind: 'fund-split',
      expected: item.total.value,
      actual: sum,
      delta: round2(sum - item.total.value),
      passed: Math.abs(sum - item.total.value) <= 0.02,
    });
  }

  // Identity 2: each subtotal must equal the sum of its parts, per column.
  for (const identity of IDENTITIES) {
    const totalItem = byKey.get(identity.total);
    const partItems = identity.parts.map((key) => byKey.get(key));
    if (!totalItem || partItems.some((part) => !part)) continue;
    for (const column of ['budget', 'generalFund', 'sef', 'total']) {
      const totalCell = totalItem[column];
      const parts = partItems.map((part) => part[column]);
      if (!totalCell || parts.some((part) => !part)) continue;
      const sum = round2(parts.reduce((acc, part) => acc + part.value, 0));
      const tolerance = 0.01 * parts.length + 0.01;
      checks.push({
        id: `${identity.id}:${column}`,
        kind: 'subtotal',
        expected: totalCell.value,
        actual: sum,
        delta: round2(sum - totalCell.value),
        passed: Math.abs(sum - totalCell.value) <= tolerance,
      });
    }
  }

  const failed = checks.filter((check) => !check.passed);

  return {
    ok: true,
    filingId: filing.id,
    fdppId: filing.fdppId,
    documentPeriod: filing.documentPeriod,
    sheet: sheet.name,
    formReference: 'FDP Form 3 (BLGF MC 023-2019 Annex A)',
    header: {
      region: header.region ?? null,
      province: header.province ?? null,
      lgu: header.lgu ?? null,
      calendarYear: Number(header.year),
      quarter: Number(header.quarter),
    },
    columns: COLUMNS,
    items,
    unmatchedLabels: unmatched,
    checks,
    reconciliation: {
      total: checks.length,
      passed: checks.length - failed.length,
      failed: failed.length,
      failures: failed.map(({ id, expected, actual, delta }) => ({ id, expected, actual, delta })),
    },
    // A filing only reaches publication if every identity it asserts holds and
    // every expected label was found.
    verification: failed.length === 0 && unmatched.length === 0 ? 'verified' : 'unverified',
  };
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])]));
  }
  return value;
}

async function extract() {
  const filings = JSON.parse(await readFile(FILINGS_PATH, 'utf8'));
  const targets = filings.records
    .filter((r) => r.formSlug === 'statement-of-receipts-and-expenditures')
    .filter((r) => r.availability === 'available')
    .sort(
      (a, b) =>
        a.documentPeriod.year - b.documentPeriod.year ||
        (a.documentPeriod.quarter ?? 0) - (b.documentPeriod.quarter ?? 0),
    );

  const extracted = [];
  const skipped = [];

  for (const filing of targets) {
    let buffer;
    try {
      const response = await fetch(filing.downloadUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(45_000),
      });
      if (!response.ok) {
        skipped.push({ filingId: filing.id, reason: `HTTP ${response.status}` });
        continue;
      }
      buffer = Buffer.from(await response.arrayBuffer());
    } catch (error) {
      skipped.push({ filingId: filing.id, reason: String(error?.message ?? error) });
      continue;
    }

    let result;
    try {
      result = extractFiling(buffer, filing);
    } catch (error) {
      skipped.push({ filingId: filing.id, reason: `parse failed: ${error?.message ?? error}` });
      continue;
    }
    if (!result.ok) {
      skipped.push({ filingId: filing.id, reason: result.reason });
      continue;
    }
    extracted.push(result);
    const { reconciliation, verification, unmatchedLabels } = result;
    console.log(
      `  ${filing.id.padEnd(58)} ${verification.padEnd(10)} checks ${reconciliation.passed}/${reconciliation.total}` +
        (unmatchedLabels.length ? `  unmatched: ${unmatchedLabels.join(', ')}` : ''),
    );
  }

  const verified = extracted.filter((e) => e.verification === 'verified');

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(
    OUT_PATH,
    `${JSON.stringify(
      sortKeys({
        schemaVersion: '1.0.0',
        form: 'statement-of-receipts-and-expenditures',
        formReference: 'FDP Form 3 (BLGF MC 023-2019 Annex A)',
        psgc: filings.psgc,
        lgu: filings.lgu,
        generatedAt: new Date().toISOString(),
        methodology:
          'Each filing was downloaded from the DILG portal and parsed directly. Line items are located by their label in column A or B, never by row number, and every value records the cell it came from. A filing is marked verified only when all of the form’s own internal identities hold and every expected label was found.',
        extractedCount: extracted.length,
        verifiedCount: verified.length,
        skipped,
        filings: extracted,
      }),
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(`\nextracted ${extracted.length} filings, ${verified.length} fully reconciled`);
  if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.map((s) => s.filingId).join(', ')}`);
  console.log(`  → ${OUT_PATH}`);
}

const command = process.argv[2];
if (command === 'extract') await extract();
else {
  console.error('usage: node scripts/sre.mjs extract');
  process.exit(1);
}
