/**
 * Numeric grounding: every figure in an answer must be one the site states.
 *
 * A language model that paraphrases "₱237,893,819.86" as "₱237.9 million" is
 * fine; one that writes "₱240 million", adds two quarters together, or recalls
 * a population from training data is not. So each figure the answer writes is
 * read together with the precision it was written at, and accepted only if a
 * figure in the passages (or the question) rounds to it.
 *
 * Small whole numbers (under 100: "25 barangays", "Q2", "8 members") are not
 * checked; they are too common to police and too small to mislead.
 */

export interface Figure {
  /** Value, with any scale word applied ("₱1.2 million" → 1_200_000). */
  value: number;
  /** Half of this is the rounding tolerance implied by how the figure was written. */
  unit: number;
  percent: boolean;
  /** Whether the figure is significant enough to check. */
  checked: boolean;
  raw: string;
  start: number;
  end: number;
}

const SCALES: Record<string, number> = {
  thousand: 1e3,
  libo: 1e3,
  k: 1e3,
  million: 1e6,
  milyon: 1e6,
  mn: 1e6,
  m: 1e6,
  billion: 1e9,
  bilyon: 1e9,
  bn: 1e9,
  b: 1e9,
};

const NUMBER =
  /(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?:\s?(%|percent\b|porsiyento\b|thousand\b|libo\b|million\b|milyon\b|billion\b|bilyon\b|mn\b|bn\b|[kmb](?![a-z])))?/gi;

/**
 * Blank out what is not prose (citation markers, link targets, code), keeping
 * every other character at its offset so positions still line up.
 */
export function prose(text: string): string {
  const blank = (m: string) => ' '.repeat(m.length);
  return text
    .replace(/\]\([^)]*\)/g, blank)
    .replace(/\[\d+(?:\s*[,–-]\s*\d+)*\]/g, blank)
    .replace(/`[^`]*`/g, blank);
}

export function figures(text: string): Figure[] {
  const out: Figure[] = [];
  for (const match of text.matchAll(NUMBER)) {
    const [raw, whole, decimals = '', suffix = ''] = match;
    // A digit run glued to a longer token ("0401008000", "CY2026") is still read, as written.
    const suffixKey = suffix.toLowerCase();
    const percent = suffixKey === '%' || suffixKey === 'percent' || suffixKey === 'porsiyento';
    const scale = percent ? 1 : (SCALES[suffixKey] ?? 1);
    const digits = whole.replace(/,/g, '');
    const base = Number(`${digits}${decimals ? `.${decimals}` : ''}`);
    if (!Number.isFinite(base)) continue;

    let unit: number;
    if (decimals) unit = 10 ** -decimals.length;
    else if (whole.includes(',') || scale > 1) {
      // "60,000" (whole thousands) or "60 thousand" is a rounded figure; "60,420",
      // "2024" and "207" are exact.
      const trailing = /0*$/.exec(digits)?.[0].length ?? 0;
      unit = whole.includes(',') && trailing >= 3 ? 1000 : 1;
    } else unit = 1;

    const value = base * scale;
    out.push({
      value,
      unit: unit * scale,
      percent,
      checked: percent || Boolean(decimals) || value >= 100,
      raw: raw.trim(),
      start: match.index ?? 0,
      end: (match.index ?? 0) + raw.length,
    });
  }
  return out;
}

/** True if some figure in the pool, rounded to the answer's precision, equals it. */
export function supported(figure: Figure, pool: readonly Figure[]): boolean {
  const tolerance = figure.unit / 2 + Math.abs(figure.value) * 1e-9;
  return pool.some((known) => known.percent === figure.percent && Math.abs(known.value - figure.value) <= tolerance);
}

/** Figures in `answer` that no figure in `pool` supports. */
export function unsupported(answer: string, pool: readonly Figure[], until = Infinity): Figure[] {
  return figures(prose(answer)).filter((f) => f.checked && f.start < until && !supported(f, pool));
}
