/**
 * The interactive barangay map (components/BarangayMap.astro).
 *
 * Loads only when the map is about to scroll into view: MapLibre (bundled
 * with the site, not from a CDN), then the basemap from OpenFreeMap and
 * elevation from the public AWS Terrain Tiles. Until then, and if WebGL is
 * unavailable, the server-rendered SVG map stays in place.
 *
 * Barangays are raised by the chosen measure and shaded on one ramp of the
 * site's accent colour. Hover shows a tooltip; click selects, frames the
 * barangay and shows a card linking to its profile. Rows in the list on the
 * page (`[data-psgc]`) and the map highlight each other.
 */
import type { ExpressionSpecification, Map as MapLibreMap, MapGeoJSONFeature, StyleSpecification } from 'maplibre-gl';

type Metric = 'population' | 'households' | 'projects';
interface Props {
  psgc10: string;
  name: string;
  slug: string;
  population: number;
  households: number;
  projects: number;
  share: number | null;
  label: [number, number];
}

const LABELS: Record<Metric, string> = {
  population: 'Population, 2024',
  households: 'Households, 2024',
  projects: 'DPWH projects named',
};
/** Tallest barangay, in metres of extrusion: tall enough to read, not a skyline. */
const PEAK = 650;
const HOME = { center: [120.645, 13.855] as [number, number], zoom: 11, pitch: 52, bearing: -18 };

const root = document.querySelector<HTMLElement>('[data-bgy-map]');
/** Set once the map exists; until then a "show on map" click is remembered in `pending`. */
let api: { select: (id: string) => void } | null = null;
let pending: string | null = null;
let webgl = true;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = new Intl.NumberFormat('en-PH');

/** A token as an rgb() string MapLibre accepts, whatever colour syntax the CSS used. */
function token(expr: string): string {
  const probe = document.createElement('span');
  probe.style.color = expr;
  probe.style.display = 'none';
  root!.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  const srgb = value.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
  if (srgb) {
    const [r, g, b] = srgb.slice(1, 4).map((n) => Math.round(Number(n) * 255));
    return srgb[4] ? `rgba(${r}, ${g}, ${b}, ${srgb[4]})` : `rgb(${r}, ${g}, ${b})`;
  }
  return value;
}

function palette() {
  return {
    bg: token('var(--c-bg-alt)'),
    land: token('var(--c-bg-alt)'),
    green: token('color-mix(in srgb, var(--c-ok) 10%, var(--c-bg-alt))'),
    water: token('color-mix(in srgb, var(--c-accent) 22%, var(--c-bg-alt))'),
    road: token('color-mix(in srgb, var(--c-ink) 18%, var(--c-bg))'),
    line: token('var(--c-surface)'),
    ink: token('var(--c-ink)'),
    halo: token('var(--c-surface)'),
    low: token('color-mix(in srgb, var(--c-accent) 14%, var(--c-surface))'),
    high: token('var(--c-accent)'),
    hover: token('var(--c-clay)'),
    shadow: token('var(--c-ink)'),
  };
}

function style(p: ReturnType<typeof palette>): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
      dem: {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 14,
        attribution: 'Terrain: Mapzen, AWS Terrain Tiles',
      },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': p.land } },
      { id: 'land', type: 'fill', source: 'omt', 'source-layer': 'landcover', paint: { 'fill-color': p.green, 'fill-opacity': 0.7 } },
      {
        id: 'earth',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landuse',
        paint: { 'fill-color': p.land, 'fill-opacity': 0.5 },
      },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': p.water } },
      {
        id: 'hillshade',
        type: 'hillshade',
        source: 'dem',
        paint: { 'hillshade-shadow-color': p.shadow, 'hillshade-exaggeration': 0.25, 'hillshade-highlight-color': p.halo },
      },
      {
        id: 'roads',
        type: 'line',
        source: 'omt',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor']]],
        paint: {
          'line-color': p.road,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 15, ['match', ['get', 'class'], ['primary', 'trunk', 'secondary'], 3, 1.2]],
        },
      },
    ],
  };
}

async function start() {
  if (!root) return;
  const canvas = root.querySelector<HTMLElement>('[data-map-canvas]')!;
  const status = root.querySelector<HTMLElement>('[data-map-status]')!;
  const tip = root.querySelector<HTMLElement>('[data-map-tip]')!;
  const card = root.querySelector<HTMLElement>('[data-map-card]')!;
  const say = (text: string | null) => {
    status.hidden = !text;
    status.textContent = text ?? '';
  };

  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) {
    webgl = false; // the SVG map stays, and "show on map" links go to the profile
    return;
  }

  say('Loading the map…');
  const [maplibregl, data, worker] = await Promise.all([
    import('maplibre-gl'),
    fetch(root.dataset.src!).then((r) => r.json() as Promise<GeoJSON.FeatureCollection<GeoJSON.Geometry, Props>>),
    // MapLibre's worker, bundled by Vite into one same-origin file.
    import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ]);
  maplibregl.setWorkerUrl(worker.default);

  const maxOf = (m: Metric) => Math.max(1, ...data.features.map((f) => f.properties[m]));
  const labels: GeoJSON.FeatureCollection<GeoJSON.Point, Props> = {
    type: 'FeatureCollection',
    features: data.features.map((f) => ({ type: 'Feature', properties: f.properties, geometry: { type: 'Point', coordinates: f.properties.label } })),
  };
  let metric: Metric = 'population';
  let threeD = true;
  let p = palette();

  const map: MapLibreMap = new maplibregl.Map({
    container: canvas,
    style: style(p),
    center: HOME.center,
    zoom: HOME.zoom - 0.6,
    pitch: reduced ? HOME.pitch : 0,
    bearing: reduced ? HOME.bearing : 0,
    maxPitch: 70,
    minZoom: 9,
    maxZoom: 16,
    maxBounds: [
      [120.35, 13.6],
      [120.95, 14.15],
    ],
    attributionControl: false,
    cooperativeGestures: matchMedia('(pointer: coarse)').matches,
  });
  map.addControl(
    new maplibregl.AttributionControl({
      compact: true,
      customAttribution:
        '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · Barangay outlines approximate (<a href="/barangays#map-sources">sources</a>)',
    }),
  );

  const height = (): ExpressionSpecification | number =>
    threeD ? ['*', ['/', ['get', metric], maxOf(metric)], PEAK] : 0;
  const shade = (): ExpressionSpecification => [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    p.hover,
    ['boolean', ['feature-state', 'selected'], false],
    p.hover,
    ['interpolate', ['linear'], ['/', ['get', metric], maxOf(metric)], 0, p.low, 1, p.high],
  ];

  function addOverlay() {
    if (map.getSource('bgy')) return;
    map.addSource('bgy', { type: 'geojson', data, promoteId: 'psgc10' });
    map.addSource('bgy-labels', { type: 'geojson', data: labels });
    map.addLayer({
      id: 'bgy-fill',
      type: 'fill-extrusion',
      source: 'bgy',
      paint: {
        'fill-extrusion-color': shade(),
        'fill-extrusion-height': height(),
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.88,
        'fill-extrusion-vertical-gradient': true,
      },
    });
    map.addLayer({ id: 'bgy-line', type: 'line', source: 'bgy', paint: { 'line-color': p.line, 'line-width': 1.2 } });
    map.addLayer({
      id: 'bgy-names',
      type: 'symbol',
      source: 'bgy-labels',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 14, 14],
        'text-allow-overlap': false,
        'text-padding': 4,
      },
      paint: { 'text-color': p.ink, 'text-halo-color': p.halo, 'text-halo-width': 1.6 },
    });
    if (threeD) map.setTerrain({ source: 'dem', exaggeration: 1.4 });
  }

  function repaint() {
    map.setPaintProperty('bgy-fill', 'fill-extrusion-color', shade());
    map.setPaintProperty('bgy-fill', 'fill-extrusion-height', height());
    root!.querySelector('[data-legend-label]')!.textContent = LABELS[metric];
    root!.querySelector('[data-legend-max]')!.textContent = fmt.format(maxOf(metric));
  }

  map.on('load', () => {
    addOverlay();
    repaint();
    root.classList.add('ready');
    for (const el of root.querySelectorAll<HTMLElement>('[data-map-ui]')) el.hidden = false;
    say(null);
    if (!reduced && !root.dataset.focus) map.easeTo({ ...HOME, duration: 2200, essential: false });
  });
  map.on('error', (e) => {
    // Tiles can fail one by one without breaking the map; only a failure before load matters.
    if (!map.loaded()) say('The map could not load. The outline map above still works.');
    console.warn('map', e.error?.message ?? e);
  });

  /* ---------- Hover, selection and the list on the page ---------- */
  let hovered: string | null = null;
  let selected: string | null = null;
  const rows = () => document.querySelectorAll<HTMLElement>('[data-psgc]:not(.bmap *)');

  const setHover = (id: string | null) => {
    if (hovered === id) return;
    if (hovered) map.setFeatureState({ source: 'bgy', id: hovered }, { hover: false });
    hovered = id;
    if (id) map.setFeatureState({ source: 'bgy', id }, { hover: true });
    for (const row of rows()) row.classList.toggle('is-mapped', row.dataset.psgc === id);
  };

  const describe = (f: Props) =>
    `<strong>${f.name}</strong><span>${fmt.format(f.population)} people · ${fmt.format(f.households)} households · ${f.projects} DPWH ${f.projects === 1 ? 'project' : 'projects'}</span>`;

  const frame = (id: string) => {
    const f = data.features.find((x) => x.properties.psgc10 === id);
    if (!f) return;
    const coords = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : (f.geometry as GeoJSON.MultiPolygon).coordinates).flat(2);
    const bounds = coords.reduce(
      (b, c) => b.extend(c as [number, number]),
      new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]),
    );
    map.fitBounds(bounds, { padding: { top: 90, bottom: 120, left: 80, right: 340 }, maxZoom: 12.6, pitch: threeD ? 48 : 0, duration: reduced ? 0 : 1200 });
  };

  const select = (id: string | null, { fly = true } = {}) => {
    if (selected) map.setFeatureState({ source: 'bgy', id: selected }, { selected: false });
    selected = id;
    if (!id) {
      card.hidden = true;
      return;
    }
    map.setFeatureState({ source: 'bgy', id }, { selected: true });
    const f = data.features.find((x) => x.properties.psgc10 === id)!.properties;
    const share = f.share === null ? '—' : f.share < 0.005 ? '<0.5%' : `${(f.share * 100).toFixed(1)}%`;
    card.innerHTML = '';
    const close = Object.assign(document.createElement('button'), { type: 'button', className: 'c-close', textContent: '×' });
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => select(null));
    const name = Object.assign(document.createElement('p'), { className: 'c-name', textContent: f.name });
    const dl = document.createElement('dl');
    for (const [k, v] of [
      ['People', fmt.format(f.population)],
      ['Of the town', share],
      ['Projects', String(f.projects)],
    ]) {
      const div = document.createElement('div');
      div.append(Object.assign(document.createElement('dt'), { textContent: k }), Object.assign(document.createElement('dd'), { textContent: v }));
      dl.append(div);
    }
    const link = Object.assign(document.createElement('a'), { href: `/barangays/${f.slug}`, className: 'link-arrow', textContent: 'Open the barangay profile' });
    // On a barangay's own profile, its card needs no link back to the page you are on.
    card.append(close, name, dl);
    if (id !== root!.dataset.focus) card.append(link);
    card.hidden = false;
    if (fly) frame(id);
  };

  map.on('mousemove', 'bgy-fill', (e) => {
    const f = e.features?.[0] as MapGeoJSONFeature | undefined;
    if (!f) return;
    map.getCanvas().style.cursor = 'pointer';
    setHover(String(f.properties.psgc10));
    tip.innerHTML = describe(f.properties as Props);
    const { x, y } = e.point;
    const w = root.clientWidth;
    tip.style.setProperty('--x', `${Math.min(x + 14, w - tip.offsetWidth - 8)}px`);
    tip.style.setProperty('--y', `${y + 14}px`);
    tip.hidden = false;
  });
  map.on('mouseleave', 'bgy-fill', () => {
    map.getCanvas().style.cursor = '';
    setHover(null);
    tip.hidden = true;
  });
  map.on('click', 'bgy-fill', (e) => {
    const id = String(e.features?.[0]?.properties.psgc10 ?? '');
    if (id) select(id);
  });

  for (const row of rows()) {
    row.addEventListener('mouseenter', () => map.loaded() && setHover(row.dataset.psgc!));
    row.addEventListener('mouseleave', () => map.loaded() && setHover(null));
  }
  api = { select: (id) => select(id) };
  // A profile page opens the map on its own barangay, selected, without the intro sweep.
  if (root!.dataset.focus && !pending) pending = root!.dataset.focus;
  if (pending) {
    const id = pending;
    pending = null;
    if (map.loaded()) select(id);
    else map.once('load', () => select(id));
  }

  /* ---------- Controls ---------- */
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-metric]')) {
    button.addEventListener('click', () => {
      metric = button.dataset.metric as Metric;
      for (const b of root.querySelectorAll('[data-metric]')) b.setAttribute('aria-checked', String(b === button));
      repaint();
    });
  }
  const toggle3d = root.querySelector<HTMLButtonElement>('[data-map-3d]')!;
  toggle3d.addEventListener('click', () => {
    threeD = !threeD;
    toggle3d.setAttribute('aria-pressed', String(threeD));
    map.setTerrain(threeD ? { source: 'dem', exaggeration: 1.4 } : null);
    repaint();
    map.easeTo({ pitch: threeD ? HOME.pitch : 0, bearing: threeD ? HOME.bearing : 0, duration: reduced ? 0 : 800 });
  });
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-map-zoom]')) {
    button.addEventListener('click', () => map.zoomTo(map.getZoom() + Number(button.dataset.mapZoom), { duration: reduced ? 0 : 300 }));
  }
  root.querySelector('[data-map-reset]')!.addEventListener('click', () => {
    select(null);
    map.easeTo({ ...HOME, pitch: threeD ? HOME.pitch : 0, bearing: threeD ? HOME.bearing : 0, duration: reduced ? 0 : 1000 });
  });

  /* ---------- Theme ---------- */
  const retheme = () => {
    p = palette();
    const keepSelected = selected;
    map.setStyle(style(p));
    map.once('styledata', () => {
      addOverlay();
      repaint();
      if (keepSelected) select(keepSelected, { fly: false });
    });
  };
  new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', retheme);

  // Keep the canvas sized to its frame (the page layout can change under it).
  new ResizeObserver(() => map.resize()).observe(canvas);
}

if (root) {
  // "Show on map" in the list: scroll to the map and select the barangay there,
  // even if the map is still loading. Without WebGL it stays a profile link.
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-show-on-map]')) {
    link.addEventListener('click', (event) => {
      if (!webgl) return;
      event.preventDefault();
      const id = link.closest<HTMLElement>('[data-psgc]')!.dataset.psgc!;
      root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      if (api) api.select(id);
      else pending = id;
    });
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        start().catch((error) => console.warn('map failed', error));
      }
    },
    { rootMargin: '300px' },
  );
  io.observe(root);
}
