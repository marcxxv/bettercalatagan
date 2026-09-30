/**
 * Where a DPWH project is, read from its own description.
 *
 * DPWH records carry the region and the district engineering office, not the
 * municipality, so the municipality has to be read from the contract
 * description, which DPWH writes as "…, BRGY. GULOD, CALATAGAN, BATANGAS".
 * A keyword match is not enough: "Calatagan" also names a creek in Makati, a
 * barangay in Virac, a high school in Catanduanes, and a national road that
 * runs through Nasugbu and Lian. So:
 *
 *  - `calatagan`   the description places the work in Calatagan, Batangas,
 *                  and nowhere else;
 *  - `shared`      one contract covering Calatagan and another municipality
 *                  (a multi-site package), which cannot be apportioned;
 *  - `road`        a segment of the Nasugbu–Lian–Calatagan national road whose
 *                  description gives kilometre posts but no municipality;
 *  - `elsewhere`   anything else (another province, another municipality).
 *
 * Only `calatagan` projects are counted in Calatagan's totals. The other two
 * are listed separately, as what they are.
 */

/** Batangas municipalities and cities a description might also name. */
const OTHER_PLACES = [
  'NASUGBU', 'LIAN', 'TUY', 'BALAYAN', 'CALACA', 'LEMERY', 'TAAL', 'SAN LUIS', 'AGONCILLO',
  'SAN NICOLAS', 'SANTA TERESITA', 'ALITAGTAG', 'CUENCA', 'SAN JOSE', 'BAUAN', 'MABINI',
  'TINGLOY', 'SAN PASCUAL', 'LOBO', 'ROSARIO', 'IBAAN', 'PADRE GARCIA', 'TAYSAN', 'LIPA',
  'TANAUAN', 'STO. TOMAS', 'MALVAR', 'BALETE', 'MATAASNAKAHOY', 'LAUREL', 'TALISAY, BATANGAS',
  'BATANGAS CITY', 'SAN JUAN',
];

/** The national road's own name, which mentions Calatagan wherever the road is. */
const ROAD_NAME = /NASUGBU\s*-\s*LIAN\s*-\s*CALATAGAN\s*(?:RD\.?|ROAD)(?:\s*\([A-Z0-9]+\))?/g;

const inBatangas = (project) =>
  /BATANGAS/i.test(project.location?.province ?? '') ||
  (/Region IV-A/i.test(project.location?.region ?? '') && /\bBATANGAS\b/.test(project.description));

/**
 * @param {{ description: string, location?: { province?: string, region?: string } }} project
 * @returns {'calatagan' | 'shared' | 'road' | 'elsewhere'}
 */
export function classify(project) {
  if (!inBatangas(project)) return 'elsewhere';
  const text = project.description.toUpperCase().replace(/\s+/g, ' ').trim();
  const mentionsRoad = ROAD_NAME.test(text);
  ROAD_NAME.lastIndex = 0;
  const rest = text.replace(ROAD_NAME, ' ');

  const placedInCalatagan =
    /\bCALATAGAN\s*,\s*BATANGAS\b/.test(rest) ||
    /,\s*CALATAGAN\s*(?:$|[;:])/.test(rest) ||
    /\bIN CALATAGAN\b/.test(rest);
  if (placedInCalatagan) {
    const elsewhereToo = OTHER_PLACES.some((place) =>
      new RegExp(`(?:,|;|\\bIN|\\bBRGY\\.?[^,;]*,)\\s*${place.replace(/[.]/g, '\\.')}\\b`).test(rest),
    );
    return elsewhereToo ? 'shared' : 'calatagan';
  }
  if (mentionsRoad && !OTHER_PLACES.some((place) => new RegExp(`,\\s*${place}\\s*,\\s*BATANGAS`).test(rest))) {
    return 'road';
  }
  return 'elsewhere';
}

/**
 * Spellings DPWH uses for Calatagan's barangays, mapped to PSGC codes. The
 * Poblacion barangays appear as "BRGY. 1", "POBLACION 1", "POBLACION I",
 * "POB. 1" and as lists ("BRGY. 1, 2, 3 AND 4", "POBLACION I, II, III, IV").
 */
const BARANGAY_PATTERNS = [
  ['0401008001', /\bBAGONG SILANG\b/],
  ['0401008002', /\bBAHA\b/],
  ['0401008003', /\bBALIBAGO\b/],
  ['0401008004', /\bBALITOC\b/],
  ['0401008005', /\bBIGA\b/],
  ['0401008006', /\bBUCAL\b/],
  ['0401008007', /\bCARLOSA\b/],
  ['0401008008', /\bCARRET[UO]NAN\b/],
  ['0401008009', /\bENCARNA(?:CION|TION)\b/],
  ['0401008010', /\bGULOD\b/],
  ['0401008011', /\bHUKAY\b/],
  ['0401008013', /\bLUCSUHIN\b/],
  ['0401008014', /\bLUYA\b/],
  ['0401008015', /\bPARAISO\b/],
  ['0401008020', /\bQUI?LITISAN\b/],
  ['0401008021', /\bBRGY\.? REAL\b|\bBARANGAY REAL\b/],
  ['0401008022', /\bSAMBUNGAN\b/],
  ['0401008023', /\bSANTA ANA\b|\bSTA\.? ANA\b/],
  ['0401008026', /\bTALIBAYOG\b/],
  ['0401008027', /\bTALISAY\b/],
  ['0401008028', /\bTANAGAN\b/],
];
const POBLACION_CODES = ['0401008016', '0401008017', '0401008018', '0401008019'];
const ROMAN = { I: 1, II: 2, III: 3, IV: 4 };

/** PSGC codes of the Calatagan barangays a description names, in code order. */
export function barangaysIn(description) {
  const text = description.toUpperCase().replace(/\s+/g, ' ').replace(ROAD_NAME, ' ');
  const found = new Set();
  for (const [code, pattern] of BARANGAY_PATTERNS) if (pattern.test(text)) found.add(code);

  // Poblacion: "BRGY. 1, 2, 3 AND 4", "POBLACION I, II, III, IV", "POB. 2", "BARANGAY 4".
  const lists = text.matchAll(
    /\b(?:BRGY\.?|BARANGAY|POBLACION|POB\.?)\s*((?:(?:[1-4]|IV|III|II|I)\b(?:\s*(?:,|AND|&)\s*)?)+)/g,
  );
  for (const [, list] of lists) {
    for (const token of list.split(/\s*(?:,|AND|&)\s*|\s+/)) {
      const n = ROMAN[token] ?? Number(token);
      if (n >= 1 && n <= 4) found.add(POBLACION_CODES[n - 1]);
    }
  }
  return [...found].sort();
}
