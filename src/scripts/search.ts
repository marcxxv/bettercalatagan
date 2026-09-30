/**
 * Client-side search over /search.json.
 *
 * Deliberately simple and deterministic: every query word must appear in an
 * entry (as a word prefix or substring), and entries are ranked by where the
 * words matched. There is no fuzzy "best guess" — a civic site should not
 * return an answer to a question it was not asked.
 */

export interface SearchEntry {
  t: string;
  g: string;
  u: string;
  d?: string;
  a?: string;
  s?: string;
  k?: string;
}

interface Indexed extends SearchEntry {
  title: string;
  hay: string;
}

let cache: Promise<Indexed[]> | null = null;

const fold = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function loadIndex(): Promise<Indexed[]> {
  if (!cache) {
    cache = fetch('/search.json')
      .then((response) => {
        if (!response.ok) throw new Error(`search index: ${response.status}`);
        return response.json() as Promise<SearchEntry[]>;
      })
      .then((entries) =>
        entries.map((entry) => ({
          ...entry,
          title: fold(entry.t),
          hay: fold([entry.t, entry.k, entry.d, entry.g, entry.a].filter(Boolean).join(' ')),
        })),
      )
      .catch((error) => {
        cache = null;
        throw error;
      });
  }
  return cache;
}

const GROUP_WEIGHT: Record<string, number> = {
  Answers: 30,
  Pages: 24,
  Barangays: 18,
  History: 10,
  'Disclosure forms': 8,
  Archive: 6,
  'Not published': 6,
  Timeline: 4,
  'Archived documents': 0,
};

export function search(index: Indexed[], query: string, limit = 12): SearchEntry[] {
  const q = fold(query.trim());
  if (!q) return [];
  const words = q
    .replace(/[?!.,’'"‘“”]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP.has(w));
  if (words.length === 0) return [];

  // Every word must match for one- and two-word queries; longer, question-like
  // queries may miss one word ("How much did the town spend in 2025?").
  const needed = words.length <= 2 ? words.length : words.length - 1;
  const scored: { entry: Indexed; score: number }[] = [];
  for (const entry of index) {
    let score = 0;
    let matched = 0;
    for (const word of words) {
      const inTitle = entry.title.indexOf(word);
      if (inTitle === 0) score += 40;
      else if (inTitle > 0) score += entry.title[inTitle - 1] === ' ' ? 28 : 14;
      else if (entry.hay.includes(word)) score += 8;
      else continue;
      matched += 1;
    }
    if (matched < needed) continue;
    score += matched * 60;
    if (entry.title === q) score += 60;
    score += GROUP_WEIGHT[entry.g] ?? 0;
    score -= Math.min(20, entry.t.length / 8);
    scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ entry }) => entry);
}

/** Words that carry no meaning in a question such as "what is the population". */
const STOP = new Set([
  'what',
  'whats',
  'is',
  'the',
  'of',
  'in',
  'a',
  'an',
  'how',
  'many',
  'much',
  'does',
  'did',
  'do',
  'calatagan',
  'calatagans',
  'which',
  'who',
  'are',
  'was',
  'to',
  'for',
  'and',
  'there',
  'when',
  'where',
  'why',
  'town',
  'municipality',
  'i',
  'can',
  'about',
  'tell',
  'me',
  'show',
  'find',
]);

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Result markup shared by the dialog and the homepage search. */
export function renderResult(entry: SearchEntry, id: string): string {
  const answer = entry.a
    ? `<span class="sr-answer">${escape(entry.a)}</span>${entry.s ? `<span class="sr-source">Source: ${escape(entry.s)}</span>` : ''}`
    : entry.d
      ? `<span class="sr-desc">${escape(entry.d)}</span>`
      : '';
  return `<li role="option" id="${id}" aria-selected="false"><a href="${escape(entry.u)}" tabindex="-1"><span class="sr-group">${escape(entry.g)}</span><span class="sr-title">${escape(entry.t)}</span>${answer}</a></li>`;
}
