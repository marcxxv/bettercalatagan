/**
 * A readable title from a filename on the former municipal website.
 *
 * WordPress stripped slashes and spaces from many uploads, so filenames run
 * words together ("OFFICE-OFTHE-MUNICIPAL-AGRICULTURE", "UlatSaBayan",
 * "Mar 272018"). This separates them and evens out stray capitals. Only
 * spacing and case change; the words are the municipality's, and the
 * original filename is kept beside the title.
 */

/** Names whose internal capitals are real, not two fused words. */
const KEEP = ['DepEd', 'OpCen', 'SumVac', 'PhilHealth', 'McDonald'];
const MONTHS = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec';

export function titleFrom(filename) {
  let t = filename
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/[-_]+/g, ' ');

  // Odd capitals inside one word: "PRocessing" → "Processing", "mAY" → "May", "bLDG" → "Bldg".
  t = t.replace(/\b[A-Za-z]+\b/g, (w) =>
    /^[A-Z]{2}[a-z]+$/.test(w) || /^[a-z][A-Z]+$/.test(w) ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w,
  );

  // Fused words: lower-case letter then a capital ("BuildingNewsroom"), except known names.
  const guard = new Map(KEEP.map((k, i) => [k, `\u0000${i}q`]));
  for (const [k, v] of guard) t = t.split(k).join(v);
  t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
  for (const [k, v] of guard) t = t.split(v).join(k);

  // "OFTHE" in capitals.
  t = t.replace(/\bOFTHE\b/g, 'OF THE');
  // A month run into its day ("Nov13") and a day run into its year ("272018").
  t = t.replace(new RegExp(`\\b(${MONTHS})(\\d)`, 'gi'), '$1 $2');
  t = t.replace(new RegExp(`\\b(${MONTHS})\\.? (\\d{1,2})(20\\d\\d)\\b`, 'gi'), '$1 $2 $3');

  return t.replace(/\s+/g, ' ').trim();
}
