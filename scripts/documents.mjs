#!/usr/bin/env node
/**
 * Archived municipal documents from calatagan.gov.ph.
 *
 *   node scripts/documents.mjs build
 *
 * The official municipal website is offline: the domain is still delegated to
 * DICT nameservers but has no A record, and the Internet Archive's last capture
 * is from 2025. What it published is still public record, so we index what the
 * archive holds.
 *
 * These are ARCHIVED documents, not current ones. Nothing here is presented as
 * the municipality's current position — the classification below exists
 * precisely so that a reader can tell an expired plan from a live one.
 *
 * We index and link. We do not bulk-mirror: the Internet Archive already
 * preserves these, and re-hosting hundreds of government PDFs is neither
 * necessary nor ours to do.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = resolve(ROOT, 'src/data/generated/archived-documents.json');

const CDX =
  'http://web.archive.org/cdx/search/cdx?url=calatagan.gov.ph&matchType=domain&output=json' +
  '&fl=timestamp,original,mimetype,statuscode,digest,length' +
  '&filter=urlkey:.*(pdf|xls|doc|csv).*&collapse=urlkey&limit=600';

const USER_AGENT =
  'BetterCalatagan/0.1 (civic transparency project; +https://github.com/marcxxv/bettercalatagan)';

/**
 * Document kinds, matched on the filename the municipality itself chose.
 *
 * Patterns are deliberately specific. An unmatched document is recorded as
 * `other` and listed as such, rather than guessed into a category.
 */
const KINDS = [
  { kind: 'citizens-charter', test: /citizen.?s?.?charter|frontline-services/i },
  /**
   * The February 2022 set: one document per office, plus a list of offices and
   * a feedback mechanism.
   *
   * A sample was opened to establish what these actually are rather than guess
   * from the filename. They are Citizen's Charter service standards in the
   * Anti-Red Tape Authority format — each service lists "Office or Division",
   * "Classification", "Type of Transaction", a checklist of requirements, fees
   * and processing times. They are therefore classified as charters.
   *
   * Classifying them is NOT the same as publishing them. They are from 2022 and
   * remain archived: no fee, requirement, processing time or contact detail
   * from them appears anywhere on this site as current.
   */
  {
    kind: 'citizens-charter',
    test: /^(office-o?f?-?the-|municipal-)|^(business-permit-and-licensing|public-employment-services)/i,
  },
  /** Components of the same 2022 charter package that are not per-office. */
  { kind: 'office-document', test: /^(list-of-offices|feedback-and-complaints)/i },
  { kind: 'executive-order', test: /executive-order|^EO-|\bEO\d/i },
  { kind: 'ordinance', test: /ordinance/i },
  { kind: 'resolution', test: /resolution/i },
  { kind: 'land-use-plan', test: /\bCLUP\b|land-use|zoning/i },
  { kind: 'budget', test: /annual-budget|appropriation|budget/i },
  { kind: 'procurement-award', test: /^\d+\.?NOA|notice-of-award|\bNOA\b/i },
  { kind: 'procurement-notice', test: /invitation-to-bid|bidding|ITB|bid-results|abstract/i },
  { kind: 'procurement-plan', test: /procurement-plan/i },
  { kind: 'fdp-disclosure', test: /utilization|statement-of-receipts|statement-of-debt|cash-flow|unliquidated|trust-fund|manpower|complement/i },
  { kind: 'personnel', test: /plantilla|casual-employees|personnel/i },
  { kind: 'report', test: /accomplishment|annual|report|ulat/i },
  { kind: 'profile', test: /socio-economic|profile|population|brochure|himno/i },
];

/** Infrastructure and goods contracts are the bulk of the 2019 and 2022 sets. */
// Includes spellings the municipality actually used ("Costruction", "Catreing").
const PROJECT_AWARD =
  /co[ns]+truction|concreting|rehabilitation|improvement|repair|supply|purchase|procurement|installation|fabrication|cat(?:er|re)ing|hire-of|printing|safe-closure|processing-center|local-access-road/i;

function classify(filename) {
  for (const { kind, test } of KINDS) if (test.test(filename)) return kind;
  if (PROJECT_AWARD.test(filename)) return 'procurement-award';
  return 'other';
}

/**
 * Status, from the document itself rather than from its age.
 *
 * Every document here is `archived`: it comes from a site that no longer
 * exists. `superseded` additionally marks documents whose own stated period has
 * ended, such as the CLUP for 2001-2010.
 */
function statusOf(filename, uploadYear) {
  const period = filename.match(/(\d{4})\s*-\s*(\d{4})/);
  if (period) {
    const end = Number(period[2]);
    if (end < new Date().getUTCFullYear()) return 'superseded';
  }
  return uploadYear ? 'archived' : 'archived';
}

/** Turns "Construction-of-Water-System-Phase-III-at-Pob.II-Aug-282018.pdf" into prose. */
function titleFrom(filename) {
  return filename
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const archiveUrl = (timestamp, original) => `https://web.archive.org/web/${timestamp}/${original}`;

/**
 * Documents a maintainer has actually opened, with what was found inside.
 *
 * Everything else in this index is described only by its filename. Recording
 * the difference matters: it separates "we know what this is" from "this is
 * what the municipality called the file".
 */
const INSPECTED = {
  'OFFICE-OF-THE-MAYOR.pdf': {
    pages: 11,
    inspectedOn: '2026-09-22',
    summary:
      "Citizen's Charter for the Office of the Mayor, in the ARTA format. Covers mayor\u2019s clearance, certifications, and job recommendation and endorsement letters, each with a checklist of requirements.",
  },
  'MUNICIPAL-CIVIL-REGISTRAR.pdf': {
    pages: 43,
    inspectedOn: '2026-09-22',
    summary:
      "Citizen's Charter for the Municipal Civil Registrar, in the ARTA format. The longest of the set; covers birth, marriage and death registration services.",
  },
  'BUSINESS-PERMIT-AND-LICENSING-OFFICE.pdf': {
    pages: 3,
    inspectedOn: '2026-09-22',
    summary: "Citizen's Charter for the Business Permits and Licensing Office, in the ARTA format.",
  },
  'List-of-Offices.pdf': {
    pages: 1,
    inspectedOn: '2026-09-22',
    summary:
      'A one-page directory of municipal offices with e-mail addresses and telephone numbers, as of 2022. These contact details are deliberately NOT republished on this site as current; see the Government page.',
  },
  'Feedback-and-Complaints-Mechanism.pdf': {
    pages: 1,
    inspectedOn: '2026-09-22',
    summary:
      'The feedback and complaints procedure that accompanies the Citizen\u2019s Charter: a drop box in the municipal lobby, monthly collection, and a three-day response target.',
  },
};

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])]));
  }
  return value;
}

async function build() {
  const response = await fetch(CDX, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) throw new Error(`CDX returned HTTP ${response.status}`);
  const rows = await response.json();
  const [, ...entries] = rows;

  const documents = [];
  const seen = new Set();

  for (const [timestamp, original, , statuscode, digest, length] of entries) {
    // cPanel's bundled timezone files are not municipal documents.
    if (original.includes('cpanel.')) continue;
    // Plugin assets and images are not documents either.
    if (/\/wp-content\/plugins\/|\.(jpe?g|png|gif|css|js)(\?|$)/i.test(original)) continue;
    if (statuscode !== '200') continue;

    const filename = decodeURIComponent(original.split('/').pop() ?? '').trim();
    if (!filename) continue;
    const extension = filename.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    if (!extension || !['pdf', 'xls', 'xlsx', 'doc', 'docx', 'csv'].includes(extension)) continue;

    const key = digest || original;
    if (seen.has(key)) continue;
    seen.add(key);

    const uploadMatch = original.match(/\/uploads\/(\d{4})\/(\d{2})\//);
    documents.push({
      id: `doc-${timestamp}-${digest.slice(0, 8).toLowerCase()}`,
      title: titleFrom(filename),
      filename,
      kind: classify(filename),
      status: statusOf(filename, uploadMatch?.[1]),
      fileType: extension,
      byteLength: Number(length) || null,
      /** When the municipality uploaded it, where the path records that. */
      publishedYear: uploadMatch ? Number(uploadMatch[1]) : null,
      publishedMonth: uploadMatch ? Number(uploadMatch[2]) : null,
      /** The URL it had on the municipal site, now dead. */
      originalUrl: original.replace(/^http:/, 'https:'),
      archiveUrl: archiveUrl(timestamp, original),
      capturedAt: `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`,
      /** The archive's own content digest for this capture. */
      archiveDigest: digest,
      /** Present only where a maintainer opened the document. */
      inspected: INSPECTED[filename] ?? null,
    });
  }

  documents.sort(
    (a, b) =>
      (b.publishedYear ?? 0) - (a.publishedYear ?? 0) ||
      (b.publishedMonth ?? 0) - (a.publishedMonth ?? 0) ||
      a.title.localeCompare(b.title),
  );

  const byKind = {};
  for (const document of documents) byKind[document.kind] = (byKind[document.kind] ?? 0) + 1;

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(
    OUT_PATH,
    `${JSON.stringify(
      sortKeys({
        schemaVersion: '1.0.0',
        sourceSite: 'calatagan.gov.ph',
        sourceSiteStatus:
          'Offline. The domain is still delegated to DICT nameservers but has no A record; the Internet Archive holds no capture after 2025.',
        archive: 'Internet Archive Wayback Machine',
        cdxQuery: CDX,
        generatedAt: new Date().toISOString(),
        documentCount: documents.length,
        countsByKind: byKind,
        documents,
      }),
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(`indexed ${documents.length} archived documents`);
  for (const [kind, count] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${kind}`);
  }
  console.log(`  → ${OUT_PATH}`);
}

const command = process.argv[2];
if (command === 'build') await build();
else {
  console.error('usage: node scripts/documents.mjs build');
  process.exit(1);
}
