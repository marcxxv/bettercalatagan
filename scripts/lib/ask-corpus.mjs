/**
 * The assistant's knowledge corpus, built from the rendered site.
 *
 * The assistant may only say what the site already says, so its knowledge is
 * taken from the built pages themselves rather than written a second time:
 * every section of every page becomes a passage with a deep link, and the
 * sourced one-line answers from the search index are added as short passages
 * of their own. The result is written to /ask/corpus.json, which the
 * assistant's Worker re-indexes whenever the site is redeployed.
 *
 * Deliberately excluded: anything the reader cannot see (aria-hidden, hidden,
 * scripts, drawings), navigation and form controls, and any element marked
 * `data-ask-skip`. An element marked `data-ask-label="…"` starts a passage of
 * its own, labelled, so a long page region (one quarter's statement, say) is
 * never split away from the words that say what it is.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { ELEMENT_NODE, TEXT_NODE, parse } from 'ultrahtml';

/** Aim for passages of this many characters: large enough to carry context, small enough to rank precisely. */
const TARGET = 1400;
const MAX = 2200;

const SKIP_TAGS = new Set([
  'script', 'style', 'svg', 'nav', 'aside', 'form', 'button', 'select', 'option', 'dialog',
  'template', 'noscript', 'input', 'textarea', 'label', 'iframe', 'canvas', 'video', 'audio',
]);
/** Sortable column headers put their label inside a button; keep it. */
const HEADER_SKIP = new Set([...SKIP_TAGS].filter((tag) => tag !== 'button'));
const BLOCK_TAGS = new Set([
  'p', 'li', 'dt', 'dd', 'figcaption', 'blockquote', 'pre', 'div', 'section', 'article', 'header',
  'footer', 'figure', 'ul', 'ol', 'dl', 'table', 'caption', 'details', 'summary', 'address', 'main',
]);
const HEADING = /^h([1-4])$/;

const decode = (text) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

const tidy = (text) => text.replace(/\s+/g, ' ').replace(/\s+([,.;:!?)])/g, '$1').replace(/\(\s+/g, '(').trim();

/**
 * Invisible to a reader, so invisible to the assistant. The one exception is a
 * `hidden` region that carries a `data-ask-label`: a panel the reader reveals
 * with a switcher (one quarter's statement) is page content, just not the
 * content shown first.
 */
const hidden = (node) => {
  const attrs = node.attributes ?? {};
  return (
    attrs['aria-hidden'] === 'true' ||
    'data-ask-skip' in attrs ||
    ('hidden' in attrs && !('data-ask-label' in attrs))
  );
};

/** Join the text of sibling nodes, spacing apart adjacent elements ("Balibago" + "PSGC …"). */
const joinChildren = (children, fn) => {
  let out = '';
  let prevElement = false;
  for (const child of children ?? []) {
    const isElement = child.type === ELEMENT_NODE;
    if (isElement && prevElement) out += ' ';
    out += fn(child);
    prevElement = isElement;
  }
  return out;
};

function textOf(node, keep = SKIP_TAGS) {
  if (node.type === TEXT_NODE) return decode(node.value);
  if (node.type !== ELEMENT_NODE || keep.has(node.name) || hidden(node)) return '';
  const inner = joinChildren(node.children, (child) => textOf(child, keep));
  return BLOCK_TAGS.has(node.name) || node.name === 'br' || node.name === 'td' || node.name === 'th' ? ` ${inner} ` : inner;
}

/** The anchor a heading can be linked to: its section's id if it has one, else its own. */
function anchorFor(heading) {
  for (let node = heading.parent; node && node.type === ELEMENT_NODE; node = node.parent) {
    if (node.attributes?.id && ['section', 'article', 'figure', 'div'].includes(node.name)) return node.attributes.id;
    if (node.name === 'main') break;
  }
  return heading.attributes?.id ?? '';
}

/**
 * Flatten a page's <main> into a stream of headings, lines and labelled
 * boundaries, in reading order.
 */
function flatten(main) {
  const events = [];
  let buffer = '';
  const flush = () => {
    const line = tidy(buffer);
    if (line) events.push({ type: 'line', text: line });
    buffer = '';
  };

  const table = (node) => {
    const rows = [];
    const collect = (n) => {
      if (n.type !== ELEMENT_NODE || hidden(n)) return;
      if (n.name === 'tr') {
        rows.push(
          n.children
            .filter((c) => c.type === ELEMENT_NODE && (c.name === 'td' || c.name === 'th') && !hidden(c))
            .map((c) => tidy(textOf(c, HEADER_SKIP))),
        );
        return;
      }
      n.children?.forEach(collect);
    };
    collect(node);
    const caption = node.children?.find((c) => c.type === ELEMENT_NODE && c.name === 'caption');
    if (caption) events.push({ type: 'line', text: tidy(textOf(caption)) });
    const [head, ...body] = rows;
    if (!head) return;
    if (!body.length) return events.push({ type: 'line', text: head.join(' | ') });
    for (const row of body) {
      events.push({
        type: 'line',
        text: row.map((cell, i) => (head[i] && i > 0 ? `${head[i]}: ${cell}` : cell)).filter(Boolean).join('; '),
      });
    }
  };

  const walk = (node) => {
    if (node.type === TEXT_NODE) {
      buffer += decode(node.value);
      return;
    }
    if (node.type !== ELEMENT_NODE || SKIP_TAGS.has(node.name) || hidden(node)) return;
    const level = HEADING.exec(node.name);
    if (level) {
      flush();
      events.push({ type: 'heading', level: Number(level[1]), text: tidy(textOf(node)), anchor: anchorFor(node) });
      return;
    }
    if (node.name === 'table') {
      flush();
      table(node);
      return;
    }
    const label = node.attributes?.['data-ask-label'];
    if (label) {
      flush();
      events.push({ type: 'boundary', label: tidy(decode(label)) });
    }
    if (node.name === 'dl') {
      flush();
      // Pair each term with its descriptions: "Total income: ₱237.9M ₱237,893,819.86".
      let term = '';
      for (const child of node.children ?? []) {
        if (child.type !== ELEMENT_NODE || hidden(child)) continue;
        const pairs = child.name === 'div' ? child.children.filter((c) => c.type === ELEMENT_NODE) : [child];
        for (const part of pairs) {
          if (hidden(part)) continue;
          if (part.name === 'dt') {
            term = tidy(textOf(part));
          } else if (part.name === 'dd') {
            const value = tidy(textOf(part));
            events.push({ type: 'line', text: term ? `${term}: ${value}` : value });
          }
        }
      }
      if (label) events.push({ type: 'boundary-end' });
      return;
    }
    const block = BLOCK_TAGS.has(node.name) || node.name === 'br';
    if (block) flush();
    let prevElement = false;
    for (const child of node.children ?? []) {
      const isElement = child.type === ELEMENT_NODE;
      if (isElement && prevElement) buffer += ' ';
      walk(child);
      prevElement = isElement;
    }
    if (block) flush();
    if (label) events.push({ type: 'boundary-end' });
  };

  walk(main);
  flush();
  return events;
}

function findMain(node) {
  if (node.type === ELEMENT_NODE && node.name === 'main') return node;
  for (const child of node.children ?? []) {
    const found = findMain(child);
    if (found) return found;
  }
  return null;
}

const titleOf = (html) => tidy(decode(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '')).replace(/\s+[—|·-]\s+Better Calatagan$/, '');

const sha = (value) => createHash('sha256').update(value).digest('hex');

/**
 * Turn one rendered page into passages.
 *
 * @param {string} html  the page's HTML
 * @param {string} path  the page's URL path, e.g. "/finances"
 */
export function pagePassages(html, path) {
  const main = findMain(parse(html));
  if (!main) return [];
  const page = titleOf(html) || path;
  const events = flatten(main);

  const passages = [];
  let trail = []; // open headings below h1: [{level, text}]
  let anchor = '';
  let label = '';
  let current = null; // { url, section, lines }

  const emit = () => {
    const body = current?.lines.join('\n').trim() ?? '';
    if (current && body.length >= 40) {
      passages.push({ url: current.url, page, section: current.section, text: label ? `${label}\n${body}` : body });
    }
    current = null;
  };
  const size = () => current?.lines.join('\n').length ?? 0;
  const add = (text) => {
    if (current && (size() + text.length > MAX || (size() > TARGET && /[.:]$/.test(current.lines.at(-1) ?? '')))) emit();
    if (!current) {
      const section = [...trail.map((h) => h.text), label].filter(Boolean).join(' › ');
      current = { url: anchor ? `${path}#${anchor}` : path, section: section || page, lines: [] };
    }
    current.lines.push(text);
  };

  for (const event of events) {
    if (event.type === 'heading') {
      if (event.level === 1) {
        emit();
        trail = [];
        anchor = '';
      } else if (event.level === 2) {
        emit();
        trail = [event];
        anchor = event.anchor || anchor;
      } else {
        // A sub-heading starts a new passage only once the current one is substantial;
        // otherwise it stays inline, so short sub-sections keep their neighbours' context.
        trail = [...trail.filter((h) => h.level < event.level), event];
        if (size() > TARGET * 0.6) emit();
        else if (current) current.lines.push(`${'#'.repeat(event.level)} ${event.text}`);
      }
    } else if (event.type === 'boundary') {
      emit();
      label = event.label;
    } else if (event.type === 'boundary-end') {
      emit();
      label = '';
    } else {
      add(event.text);
    }
  }
  emit();
  return passages;
}

/**
 * Sourced facts from the search index become short passages of their own. Their
 * search keywords ("nta ira national tax allotment") travel with them to help
 * retrieval find them; the model is never shown the keywords.
 */
export function indexPassages(entries) {
  const passages = [];
  for (const entry of entries) {
    if (entry.a) {
      passages.push({
        url: entry.u,
        page: entry.g,
        section: entry.t,
        text: `${entry.t}: ${entry.a}.${entry.s ? ` Source: ${entry.s}.` : ''}${entry.d ? ` ${entry.d}.` : ''}`,
        ...(entry.k ? { keywords: entry.k } : {}),
      });
    } else if (entry.g === 'Not published') {
      passages.push({
        url: entry.u,
        page: 'Not published',
        section: entry.t,
        text: `Not published on Better Calatagan: ${entry.t}. Reason: ${entry.d}`,
      });
    }
  }
  return passages;
}

const GENERATED = new URL('../../src/data/generated/', import.meta.url);
const peso = (n) => (typeof n === 'number' ? `₱${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : null);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SCOPE = {
  calatagan: 'located in Calatagan (counted in the site’s totals)',
  road: 'national road work passing through Calatagan (listed, not counted)',
  shared: 'a package shared with other towns (listed, not counted)',
};

/**
 * One passage per record: every archived document, DPWH contract and DILG
 * filing. Lists on the pages group records many to a passage, so a question
 * about one document found the list but not the line; a passage of its own,
 * carrying every field the site shows, lets the assistant answer about that
 * record exactly and link straight to it. Only fields the site publishes.
 */
export async function recordPassages(dir = GENERATED) {
  const load = async (name) => JSON.parse(await readFile(new URL(name, dir), 'utf8'));
  const [archive, dpwh, fdp] = await Promise.all([
    load('archived-documents.json'),
    load('dpwh-projects.json'),
    load('fdp-filings.json'),
  ]);
  const passages = [];

  for (const d of archive.documents) {
    const when = d.publishedYear ? `${d.publishedMonth ? `${MONTHS[d.publishedMonth - 1]} ` : ''}${d.publishedYear}` : 'undated';
    const lines = [
      `Archived document from the former municipal website calatagan.gov.ph: “${d.title}”.`,
      `Kind: ${d.kind.replace(/-/g, ' ')}. Published: ${when}. File: ${d.filename} (${d.fileType.toUpperCase()}${d.byteLength ? `, ${Math.round(d.byteLength / 1024)} KB` : ''}).`,
      `Captured by the Internet Archive on ${d.capturedAt}. It is a historical record, not the municipality’s current position.`,
      d.inspected
        ? `Opened and checked by a maintainer on ${d.inspected.inspectedOn}${d.inspected.pages ? ` (${d.inspected.pages} pages)` : ''}: ${d.inspected.summary}`
        : 'Not yet opened by a maintainer: it is described by its filename only, and the site does not summarise its contents.',
    ];
    passages.push({ url: `/documents?read=${d.id}`, page: 'Archived documents', section: d.title, text: lines.join('\n'), keywords: d.filename.replace(/[._-]+/g, ' ') });
  }

  for (const p of dpwh.projects) {
    if (!SCOPE[p.scope]) continue;
    const money = [
      p.budget != null && `contract budget ${peso(p.budget)}`,
      p.abc != null && `approved budget for the contract ${peso(p.abc)}`,
    ].filter(Boolean);
    const lines = [
      `DPWH contract ${p.contractId} (${p.infraYear}): ${p.description}`,
      `Status: ${p.status}${typeof p.progress === 'number' ? `, ${p.progress}% complete` : ''}.${money.length ? ` Amounts: ${money.join('; ')}.` : ''}`,
      [
        p.category && `Category: ${p.category}.`,
        p.implementingOffice && `Implementing office: ${p.implementingOffice}.`,
        p.contractor && `Contractor: ${p.contractor}.`,
        p.bidders != null && `Bidders: ${p.bidders}.`,
        p.startDate && `Start: ${p.startDate}.`,
        p.completionDate && `Completion: ${p.completionDate}.`,
        p.barangays?.length && `Barangays named: ${p.barangays.join(', ')}.`,
      ]
        .filter(Boolean)
        .join(' '),
      `Placement: ${SCOPE[p.scope]}. Source: DPWH contract records via BetterGov.ph.`,
    ];
    passages.push({ url: `/infrastructure#contract-${p.contractId}`, page: 'National infrastructure (DPWH)', section: `Contract ${p.contractId}`, text: lines.filter(Boolean).join('\n') });
  }

  for (const f of fdp.records) {
    const period = f.documentPeriod?.quarter ? `Q${f.documentPeriod.quarter} ${f.documentPeriod.year}` : `${f.documentPeriod?.year ?? ''}`;
    const lines = [
      `Full Disclosure Policy filing on the DILG portal: ${f.formLabel}, ${period}.`,
      `Availability: ${f.availability === 'available' ? 'downloadable from DILG' : f.availability === 'missing-from-source' ? 'no longer listed on the DILG portal' : f.availability}. File type: ${(f.fileType ?? '').toUpperCase()}. Filed ${f.formCadence ?? ''}.`,
      f.postingLocations?.length ? `Posted at: ${f.postingLocations.join(', ')}.` : '',
      f.formSlug === 'statement-of-receipts-and-expenditures'
        ? 'Its figures are on the Finances page, traced to the worksheet cell.'
        : 'The site links this filing but does not publish figures from it.',
    ];
    passages.push({ url: `/transparency?read=${f.id}`, page: 'Transparency (Full Disclosure Policy)', section: `${f.formLabel}, ${period}`, text: lines.filter(Boolean).join('\n') });
  }
  return passages;
}

/** Give every passage a stable id and a content hash; the corpus version is the hash of them all. */
export function finalise(passages, { site, generatedAt }) {
  const seen = new Map();
  const chunks = passages.map((p) => {
    const base = sha(`${p.url}\n${p.section}`).slice(0, 16);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const hash = sha(`${p.url}\n${p.section}\n${p.text}\n${p.keywords ?? ''}`).slice(0, 16);
    return { id: n ? `${base}-${n}` : base, ...p, hash };
  });
  const version = sha(chunks.map((c) => `${c.id}:${c.hash}`).join('\n')).slice(0, 16);
  return { version, generatedAt, site, count: chunks.length, chunks };
}

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

/** Build dist/ask/corpus.json from a finished build. */
export async function buildCorpus(distDir, { site }) {
  const passages = [];
  for (const file of (await htmlFiles(distDir)).sort()) {
    const rel = relative(distDir, file).split(sep).slice(0, -1).join('/');
    passages.push(...pagePassages(await readFile(file, 'utf8'), `/${rel}`.replace(/\/$/, '') || '/'));
  }
  const index = JSON.parse(await readFile(join(distDir, 'search.json'), 'utf8'));
  passages.push(...indexPassages(index));
  passages.push(...(await recordPassages()));
  const corpus = finalise(passages, { site, generatedAt: new Date().toISOString() });
  await mkdir(join(distDir, 'ask'), { recursive: true });
  await writeFile(join(distDir, 'ask', 'corpus.json'), JSON.stringify(corpus));
  return corpus;
}

/** Astro integration: write the corpus once the static build is complete. */
export default function askCorpus() {
  let site = '';
  return {
    name: 'ask-corpus',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site ?? '';
      },
      'astro:build:done': async ({ dir, logger }) => {
        const corpus = await buildCorpus(new URL(dir).pathname, { site });
        logger.info(`${corpus.count} passages, version ${corpus.version}`);
      },
    },
  };
}
