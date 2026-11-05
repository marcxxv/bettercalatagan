/**
 * The withheld lists for build-time text (archived document text, ADR 0015).
 *
 * Must equal worker/src/guard.ts and the CI greps; scripts/lib/withheld.test.ts
 * fails if they drift. A page of text passes only if it carries none of them,
 * and no telephone number or e-mail address (office contacts are withheld too).
 */
export const UNVERIFIED_OFFICIALS = ['Puno', 'Zarraga', 'Palacio', 'Pantoja', 'Ancheta', 'Anzaldo'];
export const WITHHELD_VALUES = ['419-0150', 'mayorsoffice1011', '@gmail.com', '@yahoo.com', '64,234', '14,267'];

const OFFICIAL = new RegExp(`\\b(${UNVERIFIED_OFFICIALS.join('|')})\\b`, 'i');
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONES = [
  /(?:\+?63|\b0)\s?9\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/, // mobile
  /\(\s?0?\d{2,3}\s?\)\s?\d{3}[\s-]?\d{4}/, // landline with area code
  /\b\d{3}[\s-]\d{4}\b/, // local landline (e.g. the municipal hall's)
];

/**
 * PDFs sometimes store a name with stray spaces ("P alacio"), so surnames are
 * also looked for in the text with its spaces removed. "Puno" must not match
 * "Punong" (as in Punong Barangay).
 */
const OFFICIAL_COLLAPSED = new RegExp(UNVERIFIED_OFFICIALS.map((n) => (n === 'Puno' ? 'puno(?!ng)' : n.toLowerCase())).join('|'));

export function pagePasses(text) {
  if (OFFICIAL.test(text) || EMAIL.test(text)) return false;
  if (OFFICIAL_COLLAPSED.test(text.replace(/\s+/g, '').toLowerCase())) return false;
  if (WITHHELD_VALUES.some((v) => text.includes(v))) return false;
  return !PHONES.some((re) => re.test(text));
}

/**
 * Personal names in archived text become "[name withheld]": a name after an
 * honorific ("Hon. Juan Z. Cruz"), and any name written with a middle initial
 * ("Juan Z. Cruz", "JUAN Z. CRUZ", "Cruz, Juan Z."), the usual Philippine form.
 * Organisations and places, written without a middle initial, are kept. This
 * errs towards removing a name: the site names no officials (AGENTS.md §1).
 */
const W = "[A-ZÑ][A-Za-zÑñ'’-]+";
/** A surname, with the particles Philippine surnames often carry ("dela Cruz", "DELOS REYES"). */
const SUR = `(?:(?:DELA|DELOS|DEL|DE|SAN|STA|Dela|Delos|Del|De|San|Sta|dela|delos|del|de)\\.?\\s+)?${W}(?:-${W})?`;
const SUFFIX = '(?:,?\\s+(?:Jr|Sr|JR|SR|III|II|IV)\\.?)?';
const NAME_PATTERNS = [
  // After an honorific: up to two given names, an optional initial, the surname.
  new RegExp(`\\b(?:Hon|HON|Atty|ATTY|Engr|ENGR|Dr|DR)\\.?\\s+(?:${W}\\s+){0,2}(?:[A-Z]\\.\\s*)?${SUR}${SUFFIX}`, 'g'),
  // Given name(s), middle initial, surname.
  new RegExp(`\\b${W}(?:\\s+${W})?\\s+[A-Z]\\.\\s*${SUR}${SUFFIX}`, 'g'),
  // After an office title in title case, up to the next comma or line break,
  // even when the PDF spaced the letters out ("Mayor S ophia G . P alacio, MD").
  /\b(?:Mayor|Vice[- ]Mayor|Councilor|Kagawad|Kapitan|Kap\.)\s+[A-Z](?:[\w’'.-]|[ ](?=[\w.])){1,40}(?=,|\n|$)/g,
  // Surname, given name(s) and initial.
  new RegExp(`\\b${W},\\s+${W}(?:\\s+${W})?\\s+[A-Z]\\.(?=\\s|$|,)`, 'g'),
];
export function redactNames(text) {
  let out = text;
  for (const re of NAME_PATTERNS) out = out.replace(re, '[name withheld]');
  return out.replace(/(\[name withheld\]\s*){2,}/g, '[name withheld] ');
}
