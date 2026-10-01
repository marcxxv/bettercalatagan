import type { APIRoute } from 'astro';
import { boundaries } from '../../data/boundaries';
import { barangayPages } from '../../lib/barangay-pages';
import { labelPoint } from '../../lib/geo';

/**
 * The map's data: each barangay's outline with its census counts and DPWH
 * project count. GeoJSON, so any map tool can open it. Outlines are
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
