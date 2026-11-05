/**
 * What kind of work a DPWH contract is, read from DPWH's own words.
 *
 * DPWH's `category` is sometimes a work type ("Flood Control and Drainage")
 * and sometimes only a funding line ("GAA 2025 SSP"), so a list filtered by
 * it mixes the two. This reads the category first and, when it names no work
 * type, the description. It is a reading aid for grouping and icons, not a
 * DPWH classification: the original category is always shown beside it.
 */
import { dpwhHeadline } from './dpwh-text';

export type ProjectKind = 'flood' | 'water' | 'bridge' | 'road' | 'building' | 'other';

export const KIND_LABELS: Record<ProjectKind, string> = {
  flood: 'Flood control and drainage',
  water: 'Water and sanitation',
  bridge: 'Bridges',
  road: 'Roads',
  building: 'Buildings and facilities',
  other: 'Other works',
};

const RULES: [ProjectKind, RegExp][] = [
  ['flood', /\bFLOOD|DRAINAGE|SEAWALL|SEA WALL|REVETMENT|\bDIKES?\b|SLOPE PROTECTION|RETAINING WALL|HYDRAULIC|\bCANAL|WATERWAY/i],
  ['water', /WATER (?:SUPPLY|SYSTEM|PROVISION)|SEPTAGE|SEWERAGE|RAINWATER|POTABLE|SANITATION/i],
  ['bridge', /\bBRIDGES?\b|\bBRS?\b/i],
  ['road', /\bROADS?\b|\bRDS?\b|PAVEMENT|PCCP|ASPHALT|STREET|HIGHWAY|FARM-TO-MARKET|\bFMR\b/i],
  ['building', /BUILDING|\bBLDGS?\b|FACILIT|SCHOOL|CLASSROOM|\bHALL\b|CENTER|CENTRE|COVERED COURT|GYMNASIUM|HEALTH|MARKET|EVACUATION|STATION/i],
];

/** The kind whose keyword appears first: "road including drainage" is a road. */
function earliest(text: string): ProjectKind | null {
  let best: { kind: ProjectKind; at: number } | null = null;
  for (const [kind, re] of RULES) {
    const at = text.search(re);
    if (at >= 0 && (!best || at < best.at)) best = { kind, at };
  }
  return best?.kind ?? null;
}

/**
 * Reads the work itself first (the last segment of the description, after the
 * programme names), then DPWH's category, then the whole description.
 */
export function projectKind(p: { category: string | null; description: string }): ProjectKind {
  const work = dpwhHeadline(p.description).headline;
  return earliest(work) ?? (p.category ? earliest(p.category) : null) ?? earliest(p.description) ?? 'other';
}

/** Icon names (components/Icon.astro) for each kind. */
export const KIND_ICONS = {
  flood: 'waves',
  water: 'droplet',
  bridge: 'bridge',
  road: 'road',
  building: 'building',
  other: 'flag',
} as const satisfies Record<ProjectKind, string>;
