/**
 * DPWH writes contract descriptions in capitals. Read that way, a long list
 * shouts; lower-cased, it loses its proper names. Title case keeps both: names
 * stay capitalised, short joining words drop, and acronyms, codes and Roman
 * numerals keep DPWH's own capitals. The words are DPWH's; only the case is ours.
 */

const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with', 'along', 'via', 'per', 'including']);
const KEEP = new Set([
  'CSSP', 'SIPAG', 'BIP', 'MPB', 'SHS', 'NHS', 'ES', 'FMR', 'DPWH', 'LD', 'ICT', 'PWD', 'TB', 'DEO', 'OO', 'GAA', 'KATUPARAN',
  'RC', 'RCPC', 'PCCP', 'LGU', 'DEPED', 'DOT', 'TRIP', 'CR', 'MPH', 'LP', 'SB', 'NCR', 'PPA', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
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
