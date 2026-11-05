/**
 * Text of the archived municipal PDFs, so the assistant can answer questions
 * about what a document says (ADR 0015).
 *
 *   node scripts/document-text.mjs            extract every eligible PDF
 *   node scripts/document-text.mjs --missing  only documents not yet extracted
 *   node scripts/document-text.mjs --reprocess re-apply the withheld filters to stored text (no fetching)
 *
 * Reads each capture's raw bytes from the Internet Archive (`id_`), extracts
 * the text layer page by page with PDF.js, and writes
 * src/data/generated/document-text.json. Nothing is reworded. Scanned PDFs
 * have no text layer and are recorded as such — never guessed at.
 *
 * Withheld means withheld (AGENTS.md §1): a page that contains a withheld
 * value, an unverified official's surname, a telephone number or an e-mail
 * address is dropped whole, and its omission is recorded. Personal names (after
 * an honorific, or written with a middle initial) become "[name withheld]". Personnel files and
 * unclassified documents are not extracted at all, since they can name
 * private individuals.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { pagePasses, redactNames } from './lib/withheld.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = `${ROOT}src/data/generated/archived-documents.json`;
const OUT = `${ROOT}src/data/generated/document-text.json`;
const USER_AGENT = 'BetterCalatagan/0.1 (civic transparency project; +https://github.com/marcxxv/bettercalatagan)';

/** Institutional records only. */
export const ELIGIBLE_KINDS = new Set([
  'citizens-charter',
  'procurement-award',
  'procurement-notice',
  'procurement-plan',
  'fdp-disclosure',
  'executive-order',
  'ordinance',
  'resolution',
  'report',
  'budget',
  'profile',
  'land-use-plan',
  'office-document',
]);
const MAX_PAGES = 60;
const MAX_CHARS_PER_PAGE = 6000;
const CONCURRENCY = 4;
const TIMEOUT_MS = 120_000;

const rawUrl = (archiveUrl) => archiveUrl.replace(/\/web\/(\d{14})\//, '/web/$1id_/');

async function fetchBytes(url) {
  let last;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
      last = new Error(`HTTP ${res.status}`);
      if (res.status < 500 && res.status !== 429) break;
    } catch (error) {
      last = error;
    }
    await sleep(3_000 * 2 ** attempt);
  }
  throw last;
}

/** PDF.js text items to readable lines: a new line where the baseline moves. */
function pageText(content) {
  let out = '';
  let lastY = null;
  for (const item of content.items) {
    if (!('str' in item)) continue;
    const y = Math.round(item.transform[5]);
    if (lastY !== null && Math.abs(y - lastY) > 2) out += '\n';
    else if (out && !out.endsWith(' ') && item.str && !item.str.startsWith(' ')) out += ' ';
    out += item.str;
    lastY = y;
  }
  return out
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extract(pdfjs, doc) {
  const bytes = await fetchBytes(rawUrl(doc.archiveUrl));
  const task = pdfjs.getDocument({ data: bytes, useSystemFonts: false, isEvalSupported: false, verbosity: 0 });
  const pdf = await task.promise;
  const pages = [];
  let withheld = 0;
  let textless = 0;
  const count = Math.min(pdf.numPages, MAX_PAGES);
  for (let n = 1; n <= count; n += 1) {
    const page = await pdf.getPage(n);
    const text = redactNames(pageText(await page.getTextContent())).slice(0, MAX_CHARS_PER_PAGE);
    page.cleanup();
    if (text.replace(/\s/g, '').length < 40) {
      textless += 1;
      continue;
    }
    if (!pagePasses(text)) {
      withheld += 1;
      continue;
    }
    pages.push({ page: n, text });
  }
  await task.destroy();
  const status = pages.length ? 'text' : textless === count ? 'no-text-layer' : 'all-withheld';
  return { status, pageCount: pdf.numPages, extractedPages: count, pagesWithheld: withheld, pagesWithoutText: textless, pages };
}

async function main() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const archive = JSON.parse(await readFile(SOURCE, 'utf8'));
  let previous = { documents: {} };
  try {
    previous = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    /* first run */
  }
  if (process.argv.includes('--reprocess')) {
    for (const d of Object.values(previous.documents)) {
      const kept = [];
      for (const pg of d.pages ?? []) {
        const text = redactNames(pg.text);
        if (pagePasses(text)) kept.push({ page: pg.page, text });
        else d.pagesWithheld = (d.pagesWithheld ?? 0) + 1;
      }
      d.pages = kept;
      if (d.status === 'text' && !kept.length) d.status = 'all-withheld';
    }
    const tally = {};
    for (const d of Object.values(previous.documents)) tally[d.status] = (tally[d.status] ?? 0) + 1;
    await writeFile(OUT, `${JSON.stringify({ ...previous, tally }, null, 2)}\n`);
    console.log('reprocessed', tally);
    return;
  }
  const onlyMissing = process.argv.includes('--missing');
  const eligible = archive.documents.filter((d) => d.fileType === 'pdf' && ELIGIBLE_KINDS.has(d.kind));
  const todo = eligible.filter((d) => !onlyMissing || !previous.documents[d.id] || previous.documents[d.id].status === 'error');
  const documents = { ...previous.documents };
  // Drop records for documents that are no longer eligible.
  for (const id of Object.keys(documents)) if (!eligible.some((d) => d.id === id)) delete documents[id];

  let done = 0;
  const queue = [...todo];
  async function worker() {
    for (let doc = queue.shift(); doc; doc = queue.shift()) {
      try {
        documents[doc.id] = await extract(pdfjs, doc);
      } catch (error) {
        // Keep an earlier good extraction rather than overwrite it with a failure.
        if (documents[doc.id]?.status !== 'text') documents[doc.id] = { status: 'error', error: String(error?.message ?? error).slice(0, 120), pages: [] };
      }
      done += 1;
      if (done % 10 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`);
    }
  }
  console.log(`extracting ${todo.length} of ${eligible.length} eligible PDFs`);
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const ordered = Object.fromEntries(Object.keys(documents).sort().map((id) => [id, documents[id]]));
  const tally = {};
  for (const d of Object.values(ordered)) tally[d.status] = (tally[d.status] ?? 0) + 1;
  await writeFile(
    OUT,
    `${JSON.stringify({ schemaVersion: '1.0.0', generatedAt: new Date().toISOString(), source: 'Internet Archive captures of calatagan.gov.ph (raw bytes, id_)', eligibleKinds: [...ELIGIBLE_KINDS].sort(), tally, documents: ordered }, null, 2)}\n`,
  );
  console.log(tally);
  console.log(`  → ${OUT}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
