/**
 * DPWH writes contract descriptions in capitals. Read that way, a long list
 * shouts; lower-cased, it loses its proper names. Title case keeps both: names
 * stay capitalised, short joining words drop, and acronyms, codes and Roman
 * numerals keep DPWH's own capitals. The words are DPWH's; only the case is ours.
 */

const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with', 'along', 'via', 'per', 'including']);
const KEEP = new Set([
  'CSSP', 'SIPAG', 'BIP', 'MPB', 'SHS', 'NHS', 'ES', 'FMR', 'DPWH', 'LD', 'ICT', 'PWD', 'TB', 'DEO', 'OO', 'GAA', 'KATUPARAN',
  'RC', 'RCPC', 'RHU', 'MHO', 'BHS', 'MRF', 'PCCP', 'LGU', 'DEPED', 'DOT', 'TRIP', 'CR', 'MPH', 'LP', 'SB', 'NCR', 'PPA', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
  '1ST', '2ND', '3RD', '4TH',
]);
const LOWER_SUFFIX = /^(\d+)(ST|ND|RD|TH)$/;

function word(token: string, first: boolean): string {
  const upper = token.toUpperCase();
  if (KEEP.has(upper)) return LOWER_SUFFIX.test(upper) ? upper.replace(LOWER_SUFFIX, (_, n: string, s: string) => n + s.toLowerCase()) : upper;
  if (/\d/.test(token)) return upper; // codes: K0100, B03179LZ, 24DB0061
  const lower = token.toLowerCase();
  if (!first && SMALL.has(lower)) return lower;
  // Hyphenated and slashed words: capitalise each part ("Multi-Purpose", "Water/Septage").
  return lower.replace(/(^|[-/'’(])([a-zñ])/g, (_, lead: string, c: string) => lead + c.toUpperCase());
}

export function dpwhTitle(description: string): string {
  let first = true;
  return description.replace(/[A-Za-zÑñ0-9'’]+(?:[-/][A-Za-zÑñ0-9'’]+)*/g, (token) => {
    const out = word(token, first);
    first = false;
    return out;
  }).replace(/(^|[.;:]\s+|\d\.\s+)([a-z])/g, (_, lead: string, c: string) => lead + c.toUpperCase());
}

/**
 * The part of a DPWH description that says what was built, and where.
 *
 * DPWH prefixes most descriptions with programme names ("Convergence and
 * Special Support Program - Basic Infrastructure Program (BIP) - Multi-Purpose
 * Buildings/ Facilities to Support Social Services - Construction of …"), so a
 * list of them all begins the same way. The work itself is the last
 * " - "-separated segment. Nothing is reworded; the full description is kept
 * beside it.
 */
export function dpwhHeadline(description: string): { headline: string; programme: string | null } {
  const title = dpwhTitle(description)
    // GPS coordinates DPWH appends; they stay in the full description.
    .replace(/\s*\(\s*\d{1,2}\.\d+\s*,\s*\d{2,3}\.\d+\s*\)\s*$/, '')
    // Some descriptions join programme and work with an unspaced dash.
    .replace(/-(?=(?:Construction|Rehabilitation|Concreting|Improvement|Repair|Completion|Installation|Widening)\b)/g, ' - ');
  // Split on spaced dashes only: "Multi-Purpose" and "K0100-K0101" stay whole.
  const parts = title.split(/\s+-\s*|\s*-\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return { headline: title, programme: null };
  let i = parts.length - 1;
  // A trailing kilometre range or code belongs with the segment before it.
  while (i > 0 && (parts[i].length < 12 || /^K\d/.test(parts[i]))) i -= 1;
  const headline = parts.slice(i).join(' - ');
  const programme = parts.slice(0, i).join(' - ') || null;
  return { headline, programme };
}
