/**
 * Barangay outlines for the map on /barangays (scripts/boundaries.mjs).
 *
 * Drawn for orientation only. PSA publishes the barangay codes but no
 * boundaries; these come from an open civic-tech dataset built from PSGC-coded
 * shapefiles. They are never used to compute an area or a density: land area
 * is withheld (municipality.ts).
 */
import { z } from 'zod';
import raw from './generated/barangay-boundaries.json' with { type: 'json' };
import { BARANGAY_BOUNDARIES } from './sources.js';
import type { DataSource } from './types/provenance.js';

const position = z.tuple([z.number().min(119).max(122), z.number().min(12).max(15)]);
const ring = z.array(position).min(4);
const featureSchema = z.object({
  type: z.literal('Feature'),
  properties: z.object({ psgc10: z.string().regex(/^04010080\d{2}$/), name: z.string().min(2) }),
  geometry: z.discriminatedUnion('type', [
    z.object({ type: z.literal('Polygon'), coordinates: z.array(ring).min(1) }),
    z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(z.array(ring).min(1)).min(1) }),
  ]),
});
const datasetSchema = z.object({
  source: z.string().url(),
  retrievedAt: z.string().datetime(),
  type: z.literal('FeatureCollection'),
  features: z.array(featureSchema).length(25),
});

export const boundaries = datasetSchema.parse(raw);
export type BoundaryFeature = z.infer<typeof featureSchema>;

const retrieved = boundaries.retrievedAt.slice(0, 10) as `${number}-${number}-${number}`;

export const boundariesSource: DataSource = {
  sources: [{ ...BARANGAY_BOUNDARIES, accessedOn: retrieved }],
  asOf: 'PSGC codes as of 31 December 2023',
  lastVerified: retrieved,
  verification: 'reported',
  status: 'current',
  tier: 2,
  expectedRefresh: 'irregular',
  isLatestKnownOfficial: false,
  caveat: 'Barangay outlines are approximate and drawn for orientation only: they are not official or surveyed boundaries.',
  methodology:
    'Outlines from an open dataset of PSGC-coded barangay shapes, matched to PSA’s 25 barangay codes for Calatagan (the pipeline refuses to write if any code is missing or extra). Coordinates are rounded to about a metre; the dataset’s area fields are dropped.',
};
