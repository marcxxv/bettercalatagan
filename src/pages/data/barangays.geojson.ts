import type { APIRoute } from 'astro';
import { boundaries } from '../../data/boundaries';
import { barangayPages } from '../../lib/barangay-pages';
import { labelPoint } from '../../lib/geo';
import { dpwhHeadline } from '../../lib/dpwh-text';
import { projectKind } from '../../lib/project-kind';

/**
 * The map's data: each barangay's outline with its census counts and DPWH
 * projects (kind, DPWH's own wording, status, budget, progress), so the map
 * card can list them. GeoJSON, so any map tool can open it. Outlines are
 * approximate (see /barangays).
 */
export const GET: APIRoute = () => {
  const bySlug = new Map(barangayPages.map((b) => [b.psgc10, b]));
  const features = boundaries.features.map((f) => {
    const b = bySlug.get(f.properties.psgc10)!;
    return {
      type: 'Feature',
      id: Number(f.properties.psgc10),
      properties: {
        psgc10: b.psgc10,
        name: b.name,
        slug: b.slug,
        population: b.census?.totalPopulation ?? 0,
        households: b.census?.households ?? 0,
        projects: b.projects.length,
        // Newest first; the map card shows a few and links to the full list.
        works: [...b.projects]
          .sort((x, y) => (y.infraYear ?? 0) - (x.infraYear ?? 0) || (y.budget ?? 0) - (x.budget ?? 0))
          .map((p) => ({
            id: p.contractId,
            kind: projectKind(p),
            title: dpwhHeadline(p.description).headline,
            status: p.status,
            year: p.infraYear,
            budget: p.budget,
            progress: p.progress,
          })),
        share: b.share,
        label: labelPoint(f.geometry),
      },
      geometry: f.geometry,
    };
  });
  return new Response(JSON.stringify({ type: 'FeatureCollection', features }), {
    headers: { 'Content-Type': 'application/geo+json; charset=utf-8' },
  });
};
