/**
 * Hybrid retrieval: full-text (BM25 over D1 FTS5) and meaning (bge-m3 vectors
 * in Vectorize), fused by reciprocal rank.
 *
 * Full text finds exact names — a barangay, a form, a year — that an
 * embedding blurs; the embedding finds a passage asked about in other words,
 * or in Filipino. Neither alone is as good as both.
 */
import { embed, type Chunk } from './corpus';
import type { Env } from './env';

export type Passage = Omit<Chunk, 'hash' | 'keywords'>;


const STOP = new Set(
  (
    'a an and are as at be by can could did do does for from had has have how i in is it its me my of on or ' +
    'show tell that the their there this to was were what whats when where which who why will with would you your ' +
    'about calatagan town municipality municipal please give list know ' +
    // Filipino / Taglish function words
    'ang ng nang mga sa si ni kay ano anu ilan sino saan kailan paano bakit po ba na at ay para yung iyong yun ' +
    'ito iyan iyon dito diyan doon ko mo niya namin natin nila kung pa lang din rin may meron wala nga naman ' +
    'kasi ho daw raw kaya pero lamang tungkol'
  ).split(' '),
);

/** Filipino words mapped to the English the site is written in, for full-text search. */
const GLOSS: Record<string, string> = {
  populasyon: 'population',
  tao: 'population people',
  residente: 'population residents',
  pamilya: 'households',
  sambahayan: 'households',
  kabahayan: 'households',
  kita: 'income',
  kinita: 'income',
  gastos: 'expenditure spending',
  gastusin: 'expenditure spending',
  ginastos: 'expenditure spending',
  badyet: 'budget',
  pondo: 'fund funds',
  buwis: 'tax',
  kasaysayan: 'history',
  parola: 'lighthouse',
  alkalde: 'mayor',
  punongbayan: 'mayor',
  konsehal: 'councilor sangguniang',
  lupa: 'land area',
  sukat: 'land area',
  klase: 'class classification',
  dokumento: 'documents',
  halalan: 'election',
  nta: 'national tax allotment',
  ira: 'national tax allotment internal revenue allotment',
  sre: 'statement receipts expenditures',
  fdp: 'full disclosure policy',
  taon: 'year',
};

export function terms(query: string): string[] {
  const words = query
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .match(/[\p{L}\p{N}]+/gu) ?? [];
  const out = new Set<string>();
  for (const word of words) {
    if (STOP.has(word) || (word.length < 2 && !/\d/.test(word))) continue;
    out.add(word);
    for (const gloss of GLOSS[word]?.split(' ') ?? []) out.add(gloss);
  }
  return [...out].slice(0, 16);
}

/** An FTS5 query: any term, prefix-matched when long enough to be a stem. */
export function ftsQuery(query: string): string | null {
  const t = terms(query);
  if (!t.length) return null;
  return t.map((w) => (w.length >= 4 && !/^\d+$/.test(w) ? `"${w}"*` : `"${w}"`)).join(' OR ');
}

/** Reciprocal rank fusion of ranked id lists. */
export function fuse(lists: string[][], k = 60): string[] {
  const score = new Map<string, number>();
  for (const list of lists) {
    list.forEach((id, rank) => score.set(id, (score.get(id) ?? 0) + 1 / (k + rank + 1)));
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

async function lexical(env: Env, query: string, limit: number): Promise<string[]> {
  const match = ftsQuery(query);
  if (!match) return [];
  const { results } = await env.DB.prepare(
    `SELECT id FROM chunks_fts WHERE chunks_fts MATCH ?1 ORDER BY bm25(chunks_fts, 0.0, 2.5, 1.0) LIMIT ?2`,
  )
    .bind(match, limit)
    .all<{ id: string }>();
  return results.map((r) => r.id);
}

async function semantic(env: Env, query: string, limit: number): Promise<string[]> {
  const [vector] = await embed(env, [query]);
  const { matches } = await env.VECTORS.query(vector, { topK: limit });
  return matches.filter((m) => m.score > 0.35).map((m) => m.id);
}

/**
 * The passages most relevant to `query`, best first, within a character budget.
 * Either half failing degrades to the other rather than failing the answer.
 */
export async function retrieve(env: Env, query: string, { k = 8, budget = 11_000 } = {}): Promise<Passage[]> {
  const [lex, sem] = await Promise.all([
    lexical(env, query, 24).catch((e) => (console.warn('lexical retrieval failed', e), [] as string[])),
    semantic(env, query, 24).catch((e) => (console.warn('semantic retrieval failed', e), [] as string[])),
  ]);
  const ids = fuse([lex, sem]).slice(0, k * 3);
  if (!ids.length) return [];
  const { results } = await env.DB.prepare(
    `SELECT id, url, page, section, text FROM chunks WHERE id IN (${ids.map((_, i) => `?${i + 1}`).join(',')})`,
  )
    .bind(...ids)
    .all<Passage>();
  const byId = new Map(results.map((r) => [r.id, r]));

  // At most two passages from any one section, so a long list (every filing of
  // one form, say) cannot crowd out the passage that actually answers.
  const out: Passage[] = [];
  const perSection = new Map<string, number>();
  let used = 0;
  for (const id of ids) {
    const passage = byId.get(id);
    if (!passage || out.length >= k) continue;
    const key = `${passage.url}|${passage.section}`;
    if ((perSection.get(key) ?? 0) >= 2) continue;
    if (used + passage.text.length > budget && out.length >= 3) break;
    perSection.set(key, (perSection.get(key) ?? 0) + 1);
    out.push(passage);
    used += passage.text.length;
  }
  return out;
}

/** Where the reader is: the page they asked from, and the document open in the reader, if any. */
export interface ReaderContext {
  path: string | null;
  read: string | null;
}

export interface Focus {
  /** Passages about what the reader is looking at, most specific first. */
  passages: Passage[];
  /** A plain description for the model, built from the corpus, never from the request. */
  note: string | null;
}

/**
 * The passages for what the reader has in front of them. Paths and ids come
 * from the request, so they are only ever used as bound query parameters,
 * and the words shown to the model are the corpus's own titles.
 */
export async function focus(env: Env, ctx: ReaderContext, query: string): Promise<Focus> {
  const passages: Passage[] = [];
  let page: string | null = null;
  let doc: string | null = null;
  if (ctx.read) {
    const row = await env.DB.prepare('SELECT id, url, page, section, text FROM chunks WHERE url LIKE ?1 LIMIT 1')
      .bind(`%?read=${ctx.read}`)
      .first<Passage>();
    if (row) {
      passages.push(row);
      doc = row.section;
    }
  }
  if (ctx.path) {
    const match = ftsQuery(query);
    const on = `(c.url = ?1 OR c.url LIKE ?2)`;
    const { results } = match
      ? await env.DB.prepare(
          `SELECT c.id, c.url, c.page, c.section, c.text FROM chunks_fts f JOIN chunks c ON c.id = f.id
           WHERE chunks_fts MATCH ?3 AND ${on} ORDER BY bm25(chunks_fts, 0.0, 2.5, 1.0) LIMIT 3`,
        )
          .bind(ctx.path, `${ctx.path}#%`, match)
          .all<Passage>()
      : { results: [] as Passage[] };
    // Nothing on the page matched the words: its opening passage still says what the page is.
    const rows = results.length
      ? results
      : (
          await env.DB.prepare(`SELECT c.id, c.url, c.page, c.section, c.text FROM chunks c WHERE ${on} LIMIT 1`)
            .bind(ctx.path, `${ctx.path}#%`)
            .all<Passage>()
        ).results;
    passages.push(...rows);
    page = rows[0]?.page ?? null;
  }
  const note = page || doc
    ? `The reader asked this from ${page ? `the page “${page}”` : 'the site'}${doc ? `, with the document “${doc}” open` : ''}. “This page”, “this document”, “here” and similar words refer to that.`
    : null;
  return { passages, note };
}

/** Merge focus passages into the retrieved ones: focus first, no duplicates, at most `k`. */
export function withFocus(focused: readonly Passage[], retrieved: readonly Passage[], k = 10): Passage[] {
  const seen = new Set<string>();
  const out: Passage[] = [];
  for (const p of [...focused, ...retrieved]) {
    if (seen.has(p.id) || out.length >= k) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}
