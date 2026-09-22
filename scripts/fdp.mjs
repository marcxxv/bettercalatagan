#!/usr/bin/env node
/**
 * DILG Full Disclosure Policy Portal — stage / promote pipeline for Calatagan.
 *
 *   node scripts/fdp.mjs stage     fetch the listing, try each download, write staging
 *   node scripts/fdp.mjs promote   merge staging into the reviewed dataset
 *
 * The two steps are separate on purpose. Staging is what the portal said today;
 * the reviewed dataset is what this project is willing to publish. A bad scrape
 * or a portal outage can never delete a filing that was previously verified —
 * see docs/adr/0004-fdp-stage-review-promote.md.
 *
 * No OCR (the corpus is XLSX, measured), no database, no server.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STAGING_PATH = resolve(ROOT, 'data/staging/fdp-staged.json');
const REVIEWED_PATH = resolve(ROOT, 'src/data/generated/fdp-filings.json');

const PORTAL_ORIGIN = 'https://fdpp.dilg.gov.ph';
/** Calatagan's filter keys on the portal: Region IV-A / Batangas / Calatagan. */
const FILTERS = { region_filter: '04', province_filter: '010', lgu_filter: '08' };
const LISTING_PATH = '/fdpp/report/index';
const DOWNLOAD_PATH = '/fdpp/report/document-download';
const PSGC = '0401008000';

const USER_AGENT =
  'BetterCalatagan/0.1 (civic transparency project; +https://github.com/marcxxv/bettercalatagan)';

/** The 14 statutory FDP forms, mapped to stable local slugs. */
const FORM_TYPES = [
  { slug: 'annual-budget-report', label: 'Annual Budget Report', match: /^ANNUAL BUDGET REPORT/, cadence: 'annual' },
  { slug: 'gad-accomplishment-report', label: 'Annual Gender and Development Accomplishment Report', match: /^ANNUAL GENDER AND DEVELOPMENT/, cadence: 'annual' },
  { slug: 'annual-procurement-plan', label: 'Annual Procurement Plan', match: /^ANNUAL PROCUREMENT PLAN/, cadence: 'annual' },
  { slug: 'supplemental-procurement-plan', label: 'Supplemental Procurement Plan', match: /^SUPPLEMENTAL PROCUREMENT PLAN/, cadence: 'annual' },
  { slug: 'statement-of-indebtedness', label: 'Statement of Indebtedness, Payments and Balances', match: /^STATEMENT OF INDEBTEDNESS/, cadence: 'quarterly' },
  { slug: 'nta-20-percent-utilization', label: '20% of the National Tax Allotment Utilization', match: /^20% OF THE NATIONAL TAX ALLOTMENT/, cadence: 'quarterly' },
  { slug: 'bid-results', label: 'Bid Results on Civil Works, Goods and Services, and Consulting Services', match: /^BID RESULTS ON CIVIL WORKS/, cadence: 'quarterly' },
  { slug: 'ldrrmf-utilization', label: 'Local Disaster Risk Reduction and Management Fund Utilization', match: /^LOCAL DISASTER RISK REDUCTION/, cadence: 'quarterly' },
  { slug: 'manpower-complement', label: 'Manpower Complement', match: /^MANPOWER COMPLEMENT/, cadence: 'quarterly' },
  { slug: 'statement-of-receipts-and-expenditures', label: 'Statement of Receipts and Expenditures', match: /^STATEMENT OF RECEIPTS AND EXPENDITURES/, cadence: 'quarterly' },
  { slug: 'trust-fund-utilization', label: 'Trust Fund Utilization', match: /^TRUST FUND UTILIZATION/, cadence: 'quarterly' },
  { slug: 'quarterly-statement-of-cash-flow', label: 'Quarterly Statement of Cash Flow', match: /^QUARTERLY STATEMENT OF CASH FLOW/, cadence: 'quarterly' },
  { slug: 'sef-utilization', label: 'Report of Special Education Fund Utilization', match: /^REPORT OF SPECIAL EDUCATION FUND/, cadence: 'quarterly' },
  { slug: 'unliquidated-cash-advances', label: 'Unliquidated Cash Advances', match: /^UNLIQUIDATED CASH ADVANCES/, cadence: 'quarterly' },
];

const listingUrl = (page) => {
  const params = new URLSearchParams({
    ...FILTERS,
    document_filter: '',
    year_filter: '',
    quarter_filter: '',
    docperiod_filter: '',
    page: String(page),
  });
  return `${PORTAL_ORIGIN}${LISTING_PATH}?${params}`;
};

export const downloadUrl = (fdppId) => `${PORTAL_ORIGIN}${DOWNLOAD_PATH}?id=${fdppId}`;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const stripTags = (fragment) =>
  decodeEntities(fragment.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

/** "QUARTER 2 • CY 2026" and "CY 2025" both appear. Returns {year, quarter|null}. */
export function parsePeriod(text) {
  if (!text) return null;
  const year = text.match(/CY\s*(\d{4})/i);
  if (!year) return null;
  const quarter = text.match(/QUARTER\s*([1-4])/i);
  return {
    year: Number(year[1]),
    quarter: quarter ? Number(quarter[1]) : null,
  };
}

export function classifyForm(name) {
  const normalised = name.replace(/^[->\s]+/, '').trim().toUpperCase();
  return FORM_TYPES.find((form) => form.match.test(normalised)) ?? null;
}

/**
 * Stable local id derived from civic meaning, not from the portal's numeric id.
 * The portal reassigns ids on resubmission, so the numeric id identifies a
 * FILE while this identifies a FILING SLOT.
 */
export function localId({ formSlug, period }) {
  const quarter = period.quarter ? `q${period.quarter}-` : '';
  return `fdp-${period.year}-${quarter}${formSlug}`;
}

/** Tolerates the portal's unclosed <td> tags. */
function parseRows(htmlText) {
  const rows = htmlText.match(/<tr id="row\d+"[\s\S]*?<\/tr>/g) ?? [];
  return rows.flatMap((row) => {
    const fdppId = row.match(/document-download\?id=(\d+)/)?.[1];
    if (!fdppId) return [];
    const cells = row.split(/<td\b[^>]*>/).slice(1).map(stripTags);
    const [rawName, lgu, postingRaw, documentRaw, description] = cells;
    const form = classifyForm(rawName ?? '');
    const documentPeriod = parsePeriod(documentRaw ?? '');
    const postingPeriod = parsePeriod(postingRaw ?? '');
    if (!form || !documentPeriod) {
      return [{ unparsed: true, fdppId, rawName, documentRaw, postingRaw }];
    }
    return [{
      fdppId: Number(fdppId),
      formSlug: form.slug,
      formLabel: form.label,
      formCadence: form.cadence,
      documentPeriod,
      postingPeriod,
      lgu: lgu ?? '',
      postingLocations: (description ?? '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    }];
  });
}

/** Without a bound, a stalled connection hangs the whole run. */
const REQUEST_TIMEOUT_MS = 30_000;
/** Parallel download probes. Deliberately modest. */
const CONCURRENCY = 6;

async function request(url, { retries = 4 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      // The portal returns 500 for a meaningful share of downloads. Back off
      // and retry: some recover, many do not, and both outcomes are recorded.
      if (response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`);
        if (attempt < retries) {
          await sleep(600 * 2 ** attempt);
          continue;
        }
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(600 * 2 ** attempt);
    }
  }
  throw lastError ?? new Error('request failed');
}

/**
 * A content fingerprint that ignores the container's timestamps.
 *
 * The DILG portal regenerates each XLSX at request time, stamping the current
 * clock into the zip entries. The raw bytes therefore differ on every fetch
 * even when the spreadsheet is unchanged, which makes a byte hash useless for
 * detecting a real revision — and noisy in the committed dataset.
 *
 * We instead read the zip central directory and hash each entry's name, CRC-32
 * and uncompressed size. CRC-32 is computed over the entry's *content*, so this
 * is stable across regenerations and still changes when the data changes.
 */
function zipContentHash(bytes) {
  // Locate the End Of Central Directory record (signature 0x06054b50).
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 66_000; i -= 1) {
    if (bytes.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) return null;

  const entryCount = bytes.readUInt16LE(eocd + 10);
  let offset = bytes.readUInt32LE(eocd + 16);
  const entries = [];

  for (let n = 0; n < entryCount; n += 1) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50) return null;
    const crc = bytes.readUInt32LE(offset + 16);
    const uncompressedSize = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    entries.push(`${name}:${crc}:${uncompressedSize}`);
    offset += 46 + nameLength + extraLength + commentLength;
  }

  entries.sort();
  return createHash('sha256').update(entries.join('\n')).digest('hex');
}

const XLSX_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // PK.. — Office Open XML is a zip

function detectFileType(bytes, contentType) {
  if (bytes.length >= 4 && XLSX_MAGIC.every((byte, index) => bytes[index] === byte)) {
    return 'xlsx';
  }
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50) return 'pdf';
  if (bytes.length === 0) return 'empty';
  if (/html/i.test(contentType ?? '')) return 'html-error';
  return 'unknown';
}

async function probeDownload(fdppId) {
  const url = downloadUrl(fdppId);
  try {
    const response = await request(url);
    if (!response.ok) {
      return { availability: 'source-error', httpStatus: response.status, fileType: null };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type');
    const fileType = detectFileType(buffer, contentType);
    if (fileType === 'html-error' || fileType === 'empty' || fileType === 'unknown') {
      return { availability: 'source-error', httpStatus: response.status, fileType };
    }
    const contentSha256 =
      fileType === 'xlsx' ? zipContentHash(buffer) : createHash('sha256').update(buffer).digest('hex');
    if (!contentSha256) {
      return { availability: 'source-error', httpStatus: response.status, fileType, error: 'unreadable archive' };
    }
    return {
      availability: 'available',
      httpStatus: response.status,
      fileType,
      contentType,
      byteLength: buffer.byteLength,
      contentSha256,
    };
  } catch (error) {
    return { availability: 'source-error', httpStatus: null, fileType: null, error: String(error?.message ?? error) };
  }
}

/** Runs `worker` over `items`, at most `limit` at a time, preserving order. */
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

/** Deterministic: stable key order and a stable sort, so reruns diff cleanly. */
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]),
    );
  }
  return value;
}

const byFilingOrder = (a, b) =>
  b.documentPeriod.year - a.documentPeriod.year ||
  (b.documentPeriod.quarter ?? 0) - (a.documentPeriod.quarter ?? 0) ||
  a.formSlug.localeCompare(b.formSlug);

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(sortKeys(payload), null, 2)}\n`, 'utf8');
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function stage({ skipDownloads = false } = {}) {
  const retrievedAt = new Date().toISOString();
  const seen = new Map();
  const unparsed = [];
  let reportedTotal = null;

  for (let page = 1; page <= 40; page += 1) {
    const response = await request(listingUrl(page));
    const body = await response.text();
    // The counter is split across tags, so match against stripped text.
    reportedTotal ??= Number(
      stripTags(body).match(/Showing\s+\d+\s+Results?\s+of\s+([\d,]+)\s+Entries/i)?.[1]
        ?.replace(/,/g, '') ?? 0,
    ) || null;
    const rows = parseRows(body);
    if (rows.length === 0) break;
    let added = 0;
    for (const row of rows) {
      if (row.unparsed) { unparsed.push(row); continue; }
      if (seen.has(row.fdppId)) continue;
      seen.set(row.fdppId, row);
      added += 1;
    }
    if (added === 0 && page > 1) break;
  }

  const ordered = [...seen.values()].sort(byFilingOrder);
  let done = 0;

  const toRecord = async (row) => {
    const probe = skipDownloads
      ? { availability: 'not-checked', fileType: null }
      : await probeDownload(row.fdppId);
    done += 1;
    if (!skipDownloads && done % 20 === 0) {
      process.stdout.write(`  probed ${done}/${ordered.length}\n`);
    }
    return {
      id: localId({ formSlug: row.formSlug, period: row.documentPeriod }),
      fdppId: row.fdppId,
      formSlug: row.formSlug,
      formLabel: row.formLabel,
      formCadence: row.formCadence,
      documentPeriod: row.documentPeriod,
      postingPeriod: row.postingPeriod,
      postingLocations: row.postingLocations,
      downloadUrl: downloadUrl(row.fdppId),
      ...probe,
      retrievedAt,
    };
  };

  // Bounded concurrency: fast enough to finish in a minute or two, gentle
  // enough not to hammer a government server that already returns 500s.
  const records = await mapWithConcurrency(ordered, CONCURRENCY, toRecord);
  records.sort(byFilingOrder);

  await writeJson(STAGING_PATH, {
    stagedAt: retrievedAt,
    listingUrl: listingUrl(1),
    reportedTotal,
    parsedCount: records.length,
    unparsedCount: unparsed.length,
    unparsed,
    records,
  });

  const available = records.filter((r) => r.availability === 'available').length;
  console.log(`staged ${records.length} filings (portal reported ${reportedTotal ?? '?'})`);
  console.log(`  available: ${available}   source-error: ${records.length - available}`);
  if (unparsed.length) console.log(`  UNPARSED ROWS: ${unparsed.length} — inspect staging file`);
  console.log(`  → ${STAGING_PATH}`);
}

/**
 * Merge staging into the reviewed dataset.
 *
 * Rules, in order of importance:
 *  1. A filing already in the reviewed set is never deleted by a scrape.
 *  2. A failed download never overwrites a previously good checksum; the last
 *     known-good file metadata is retained and the record is flagged instead.
 *  3. A changed fdppId is recorded as a resubmission, keeping the prior id.
 */
async function promote() {
  const staged = await readJson(STAGING_PATH);
  if (!staged) throw new Error(`no staging file at ${STAGING_PATH} — run "stage" first`);

  const previous = await readJson(REVIEWED_PATH);
  const existing = new Map((previous?.records ?? []).map((record) => [record.id, record]));
  const stagedIds = new Set();

  const merged = [];
  let added = 0;
  let resubmitted = 0;
  let degraded = 0;

  for (const record of staged.records) {
    stagedIds.add(record.id);
    const prior = existing.get(record.id);
    if (!prior) {
      merged.push({ ...record, firstSeenAt: record.retrievedAt });
      added += 1;
      continue;
    }

    const next = { ...prior, ...record, firstSeenAt: prior.firstSeenAt ?? record.retrievedAt };

    if (prior.fdppId !== record.fdppId) {
      // The portal reassigns ids on resubmission. Keep the history.
      next.supersededFdppIds = [...new Set([...(prior.supersededFdppIds ?? []), prior.fdppId])];
      resubmitted += 1;
    }

    if (record.availability !== 'available' && prior.availability === 'available') {
      // Rule 2: keep the last known-good metadata, flag the current failure.
      next.contentSha256 = prior.contentSha256;
      next.byteLength = prior.byteLength;
      next.fileType = prior.fileType;
      next.contentType = prior.contentType;
      next.lastKnownGoodAt = prior.lastKnownGoodAt ?? prior.retrievedAt;
      degraded += 1;
    } else if (record.availability === 'available') {
      next.lastKnownGoodAt = record.retrievedAt;
    }

    merged.push(next);
  }

  // Rule 1: retain anything the scrape no longer returned.
  let missing = 0;
  for (const [id, record] of existing) {
    if (stagedIds.has(id)) continue;
    merged.push({ ...record, availability: 'missing-from-source', missingSince: staged.stagedAt });
    missing += 1;
  }

  merged.sort(byFilingOrder);

  await writeJson(REVIEWED_PATH, {
    schemaVersion: '1.0.0',
    psgc: PSGC,
    lgu: 'Calatagan, Batangas',
    generatedAt: staged.stagedAt,
    listingUrl: staged.listingUrl,
    portalReportedTotal: staged.reportedTotal,
    recordCount: merged.length,
    records: merged,
  });

  console.log(`promoted ${merged.length} filings`);
  console.log(`  new: ${added}   resubmitted: ${resubmitted}   newly failing: ${degraded}   missing from source: ${missing}`);
  console.log(`  → ${REVIEWED_PATH}`);
}

const command = process.argv[2];
const skipDownloads = process.argv.includes('--skip-downloads');

if (command === 'stage') await stage({ skipDownloads });
else if (command === 'promote') await promote();
else {
  console.error('usage: node scripts/fdp.mjs <stage|promote> [--skip-downloads]');
  process.exit(1);
}
