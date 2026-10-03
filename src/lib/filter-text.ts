const fold = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/['’]/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

/** All query words must appear; punctuation, accents and word order do not matter. */
export function matchFilterText(haystack: string, query: string): boolean {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  const text = fold(haystack);
  return terms.every((term) => text.includes(term));
}
