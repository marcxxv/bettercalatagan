/**
 * Keeping the assistant's index in step with the published site.
 *
 * The site's build writes /ask/corpus.json. On a schedule (and on demand)
 * the Worker fetches it, and if its version has changed, embeds only the
 * passages that are new or different, removes the ones that are gone, and
 * records the new version. A corpus that has suddenly lost most of its
 * passages is treated as a broken build and ignored.
 */
import type { Env } from './env';

export interface Chunk {
  id: string;
  hash: string;
  url: string;
  page: string;
  section: string;
  text: string;
  /** Search terms that help retrieval find the passage; never shown to the model. */
  keywords?: string;
}

interface Corpus {
  version: string;
  generatedAt: string;
  count: number;
  chunks: Chunk[];
}

export interface SyncResult {
  version: string;
  changed: boolean;
  added: number;
  updated: number;
  removed: number;
  total: number;
}

const EMBED_BATCH = 50;

/** The text a passage is embedded as: where it sits, then what it says. */
export const embeddingText = (c: Pick<Chunk, 'page' | 'section' | 'text' | 'keywords'>) =>
  `${c.page} — ${c.section}\n${c.text}${c.keywords ? `\n${c.keywords}` : ''}`.slice(0, 6000);

export async function embed(env: Env, texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const result = (await env.AI.run(env.EMBEDDING_MODEL as keyof AiModels, {
      text: texts.slice(i, i + EMBED_BATCH),
    } as never)) as { data?: number[][] };
    if (!result.data || result.data.length !== Math.min(EMBED_BATCH, texts.length - i)) {
      throw new Error('embedding: unexpected response');
    }
    out.push(...result.data);
  }
  return out;
}

function valid(value: unknown): value is Corpus {
  const c = value as Corpus;
  return (
    typeof c?.version === 'string' &&
    Array.isArray(c.chunks) &&
    c.chunks.every(
      (x) =>
        typeof x.id === 'string' &&
        typeof x.hash === 'string' &&
        typeof x.url === 'string' &&
        x.url.startsWith('/') &&
        typeof x.text === 'string',
    )
  );
}

export async function meta(env: Env, key: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT value FROM meta WHERE key = ?1').bind(key).first<{ value: string }>();
  return row?.value ?? null;
}

const setMeta = (env: Env, key: string, value: string) =>
  env.DB.prepare('INSERT INTO meta (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2').bind(
    key,
    value,
  );

export async function sync(env: Env, { force = false } = {}): Promise<SyncResult> {
  const res = await fetch(new URL('/ask/corpus.json', env.SITE_URL), {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 0 },
  });
  if (!res.ok) throw new Error(`corpus: ${res.status}`);
  const corpus: unknown = await res.json();
  if (!valid(corpus)) throw new Error('corpus: malformed');

  const now = new Date().toISOString();
  const current = await meta(env, 'corpus_version');
  const existing = new Map(
    (await env.DB.prepare('SELECT id, hash FROM chunks').all<{ id: string; hash: string }>()).results.map((r) => [
      r.id,
      r.hash,
    ]),
  );

  if (current === corpus.version && !force) {
    await setMeta(env, 'checked_at', now).run();
    return { version: corpus.version, changed: false, added: 0, updated: 0, removed: 0, total: existing.size };
  }
  if (existing.size > 20 && corpus.chunks.length < existing.size / 2 && !force) {
    throw new Error(`corpus: refusing to drop from ${existing.size} to ${corpus.chunks.length} passages`);
  }

  const incoming = new Map(corpus.chunks.map((c) => [c.id, c]));
  const changed = corpus.chunks.filter((c) => existing.get(c.id) !== c.hash || force);
  const removed = [...existing.keys()].filter((id) => !incoming.has(id));

  // Vectors first: a passage is only written to D1 once it can be found by meaning too.
  const vectors = await embed(env, changed.map(embeddingText));
  for (let i = 0; i < changed.length; i += 500) {
    await env.VECTORS.upsert(
      changed.slice(i, i + 500).map((c, j) => ({ id: c.id, values: vectors[i + j], metadata: { url: c.url } })),
    );
  }

  const upsert = env.DB.prepare(
    `INSERT INTO chunks (id, hash, url, page, section, text) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT(id) DO UPDATE SET hash = ?2, url = ?3, page = ?4, section = ?5, text = ?6`,
  );
  const dropFts = env.DB.prepare('DELETE FROM chunks_fts WHERE id = ?1');
  const addFts = env.DB.prepare('INSERT INTO chunks_fts (id, section, text) VALUES (?1, ?2, ?3)');
  const drop = env.DB.prepare('DELETE FROM chunks WHERE id = ?1');

  const statements: D1PreparedStatement[] = [];
  for (const c of changed) {
    statements.push(
      upsert.bind(c.id, c.hash, c.url, c.page, c.section, c.text),
      dropFts.bind(c.id),
      addFts.bind(c.id, [c.page, c.section, c.keywords].filter(Boolean).join(' '), c.text),
    );
  }
  for (const id of removed) statements.push(drop.bind(id), dropFts.bind(id));
  for (let i = 0; i < statements.length; i += 90) await env.DB.batch(statements.slice(i, i + 90));
  if (removed.length) {
    for (let i = 0; i < removed.length; i += 500) await env.VECTORS.deleteByIds(removed.slice(i, i + 500));
  }

  await env.DB.batch([
    setMeta(env, 'corpus_version', corpus.version),
    setMeta(env, 'synced_at', now),
    setMeta(env, 'checked_at', now),
    setMeta(env, 'corpus_generated_at', corpus.generatedAt),
  ]);

  const added = changed.filter((c) => !existing.has(c.id)).length;
  return {
    version: corpus.version,
    changed: true,
    added,
    updated: changed.length - added,
    removed: removed.length,
    total: incoming.size,
  };
}
