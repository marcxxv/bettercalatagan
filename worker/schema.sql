-- The Better Calatagan assistant's database. Safe to re-run.

-- Passages from the site's /ask/corpus.json, and a full-text index over them.
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  url TEXT NOT NULL,
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  text TEXT NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  id UNINDEXED,
  section,
  text,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Corpus version and sync times.
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Rate-limit windows. Keys hold a daily-salted hash, never an IP address.
CREATE TABLE IF NOT EXISTS rl (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset INTEGER NOT NULL
);

-- Daily totals only. No questions or answers are stored.
CREATE TABLE IF NOT EXISTS usage (
  day TEXT PRIMARY KEY,
  tokens INTEGER NOT NULL DEFAULT 0,
  requests INTEGER NOT NULL DEFAULT 0,
  withdrawn INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0
);
