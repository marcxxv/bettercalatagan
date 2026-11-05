/**
 * OCR for archived PDFs that are scanned images (ADR 0015).
 *
 *   NYO_API_KEY=… node scripts/document-ocr.mjs            scanned documents not yet read
 *   NYO_API_KEY=… node scripts/document-ocr.mjs --redo     read every scanned document again
 *
 * scripts/document-text.mjs records scanned PDFs as `no-text-layer`. This
 * renders each of their pages to an image (poppler's `pdftoppm`, run locally),
 * asks a vision model on the NYO API to transcribe it word for word, and
 * stores the text in document-text.json with `method: "ocr"`, so the
 * assistant's passages say it was machine-read and may contain errors. The
 * same withheld filters apply: pages naming unverified officials or carrying
 * contacts are dropped, and personal names become "[name withheld]".
 *
 * The documents are public records from the former municipal website. The
 * key is read from the environment and never written anywhere.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { pagePasses, redactNames } from './lib/withheld.mjs';

const run = promisify(execFile);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = `${ROOT}src/data/generated/archived-documents.json`;
const OUT = `${ROOT}src/data/generated/document-text.json`;
const BASE = (process.env.NYO_BASE_URL ?? 'https://llm.nyolab.ai/api/public/v1').replace(/\/$/, '');
const MODEL = process.env.OCR_MODEL ?? 'minicpm-v-4.5';
const FALLBACK = process.env.OCR_FALLBACK_MODEL ?? 'gemma-3-27b';
const MAX_PAGES = 60;
const DPI = 150;
const CONCURRENCY = 2;
const USER_AGENT = 'BetterCalatagan/0.1 (civic transparency project; +https://github.com/marcxxv/bettercalatagan)';

const PROMPT = [
  'Transcribe all the text on this scanned page of a Philippine municipal government document, exactly as written.',
  'Keep the original language (English or Filipino), spelling, numbers, dates and amounts. Keep line breaks; write table rows as lines with cells separated by " | ".',
  'Do not summarise, translate, correct or add anything. Output only the transcription.',
  'If the page has no readable text, output exactly: NO_TEXT',
].join(' ');

const rawUrl = (archiveUrl) => archiveUrl.replace(/\/web\/(\d{14})\//, '/web/$1id_/');

async function fetchBytes(url) {
  let last;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(120_000) });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      last = new Error(`HTTP ${res.status}`);
      if (res.status < 500 && res.status !== 429) break;
    } catch (error) {
      last = error;
    }
    await sleep(3_000 * 2 ** attempt);
  }
  throw last;
}

async function transcribe(png, key) {
  let last;
  for (const model of [MODEL, FALLBACK]) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await fetch(`${BASE}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(180_000),
          body: JSON.stringify({
            model,
            temperature: 0,
            max_tokens: 4000,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: PROMPT },
                  { type: 'image_url', image_url: { url: `data:image/png;base64,${png.toString('base64')}` } },
                ],
              },
            ],
          }),
        });
        if (!res.ok) {
          // Never log response bodies: they can echo the request.
          last = new Error(`${model}: HTTP ${res.status}`);
          if (res.status === 401 || res.status === 403) {
            // A wrong or placeholder key: stop the whole run instead of failing every page.
            const fatal = new Error('NYO rejected the API key (HTTP 401/403). Check NYO_API_KEY is your real key.');
            fatal.fatal = true;
            throw fatal;
          }
          if (res.status === 400 || res.status === 404) break; // model cannot take images: try the fallback
          await sleep(4_000 * 2 ** attempt);
          continue;
        }
        const body = await res.json();
        const text = String(body.choices?.[0]?.message?.content ?? '').trim();
        return { text, model };
      } catch (error) {
        if (error?.fatal) throw error;
        last = error;
        await sleep(4_000 * 2 ** attempt);
      }
    }
  }
  throw last ?? new Error('OCR failed');
}

/** Light clean-up of model output: code fences and runs of blank lines. */
const tidy = (text) =>
  text
    .replace(/^```[a-z]*\n?|```$/gim, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

async function ocrDocument(doc, key) {
  const dir = await mkdtemp(join(tmpdir(), 'bc-ocr-'));
  try {
    const pdf = join(dir, 'doc.pdf');
    await writeFile(pdf, await fetchBytes(rawUrl(doc.archiveUrl)));
    await run('pdftoppm', ['-r', String(DPI), '-png', '-l', String(MAX_PAGES), pdf, join(dir, 'p')]);
    const images = (await readdir(dir)).filter((f) => f.endsWith('.png')).sort((a, b) => Number(a.match(/(\d+)\.png$/)[1]) - Number(b.match(/(\d+)\.png$/)[1]));
    const pages = [];
    let withheld = 0;
    let blank = 0;
    let model = MODEL;
    for (const file of images) {
      const n = Number(file.match(/(\d+)\.png$/)[1]);
      const result = await transcribe(await readFile(join(dir, file)), key);
      model = result.model;
      const text = redactNames(tidy(result.text)).slice(0, 6000);
      if (!text || /^NO_TEXT$/i.test(text) || text.replace(/\s/g, '').length < 40) {
        blank += 1;
        continue;
      }
      if (!pagePasses(text)) {
        withheld += 1;
        continue;
      }
      pages.push({ page: n, text });
    }
    return {
      status: pages.length ? 'text' : withheld ? 'all-withheld' : 'no-text-layer',
      method: 'ocr',
      ocrModel: model,
      pageCount: images.length,
      extractedPages: images.length,
      pagesWithheld: withheld,
      pagesWithoutText: blank,
      pages,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function main() {
  const key = process.env.NYO_API_KEY;
  if (!key) throw new Error('Set NYO_API_KEY in the environment to run OCR.');
  await run('pdftoppm', ['-v']).catch(() => {
    throw new Error('pdftoppm (poppler) is needed: brew install poppler');
  });
  const archive = JSON.parse(await readFile(SOURCE, 'utf8'));
  const store = JSON.parse(await readFile(OUT, 'utf8'));
  const byId = new Map(archive.documents.map((d) => [d.id, d]));
  const redo = process.argv.includes('--redo');
  const todo = Object.entries(store.documents)
    .filter(([, d]) => d.status === 'no-text-layer' && (redo || d.method !== 'ocr'))
    .map(([id]) => byId.get(id))
    .filter(Boolean);
  console.log(`OCR for ${todo.length} scanned documents with ${MODEL}`);
  let done = 0;
  let aborted = null;
  const queue = [...todo];
  async function worker() {
    for (let doc = queue.shift(); doc; doc = queue.shift()) {
      try {
        store.documents[doc.id] = await ocrDocument(doc, key);
      } catch (error) {
        if (error?.fatal) {
          queue.length = 0;
          aborted = error;
          return;
        }
        console.warn(`  ${doc.id}: ${String(error?.message ?? error).slice(0, 80)}`);
      }
      done += 1;
      if (done % 10 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (aborted) {
    // Pages read before the rejection are kept only if any were stored.
    console.error(aborted.message);
    process.exitCode = 1;
    if (!Object.values(store.documents).some((d) => d.method === 'ocr')) return;
  }
  const tally = {};
  for (const d of Object.values(store.documents)) tally[d.method === 'ocr' ? `${d.status} (ocr)` : d.status] = (tally[d.method === 'ocr' ? `${d.status} (ocr)` : d.status] ?? 0) + 1;
  await writeFile(OUT, `${JSON.stringify({ ...store, tally }, null, 2)}\n`);
  console.log(tally);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
