/**
 * Small geometry helpers for the barangay map. Plain arithmetic on
 * longitude/latitude: the map is for orientation, never for measurement.
 */
type Ring = [number, number][];
type Geometry = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };

const polygons = (g: Geometry): Ring[][] => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);

/** Signed area and centroid of one ring (shoelace), in degrees. */
function ringCentroid(ring: Ring) {
  let a = 0;
  let x = 0;
  let y = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    a += f;
    x += (ring[j][0] + ring[i][0]) * f;
    y += (ring[j][1] + ring[i][1]) * f;
  }
  return { area: Math.abs(a / 2), point: a ? ([x / (3 * a), y / (3 * a)] as [number, number]) : ring[0] };
}

/** Where to put a barangay's name: the centroid of its largest outer ring. */
export function labelPoint(g: Geometry): [number, number] {
  const best = polygons(g)
    .map((p) => ringCentroid(p[0]))
    .sort((a, b) => b.area - a.area)[0];
  return [Math.round(best.point[0] * 1e5) / 1e5, Math.round(best.point[1] * 1e5) / 1e5];
}

/** Every outline as an SVG path in a width-by-? box, north up, lengths true at this latitude. */
export function projectToSvg(features: { properties: { psgc10: string }; geometry: Geometry }[], width = 1000) {
  const all = features.flatMap((f) => polygons(f.geometry).flat(2) as unknown as [number, number][]);
  const lons = all.map((p) => p[0]);
  const lats = all.map((p) => p[1]);
  const [minLon, maxLon, minLat, maxLat] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const scale = width / ((maxLon - minLon) * k);
  const height = Math.round((maxLat - minLat) * scale);
  const xy = ([lon, lat]: [number, number]) => `${((lon - minLon) * k * scale).toFixed(1)} ${((maxLat - lat) * scale).toFixed(1)}`;
  const paths = features.map((f) => ({
    psgc10: f.properties.psgc10,
    d: polygons(f.geometry)
      .map((poly) => poly.map((ring) => `M${ring.map(xy).join('L')}Z`).join(''))
      .join(''),
    label: xy(labelPoint(f.geometry)).split(' ').map(Number) as [number, number],
  }));
  return { width, height, paths };
}
