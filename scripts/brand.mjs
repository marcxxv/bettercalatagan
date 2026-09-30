#!/usr/bin/env node
/**
 * Renders every raster brand asset from the vector mark and the site's own
 * fonts: favicon.ico, the Apple touch icon, web-app icons, and one Open Graph
 * share image per page (public/og/*.png, public/og.png for the home page).
 *
 * The outputs are committed, so building the site never needs a browser.
 * Re-run this only when the mark, the fonts or a page title changes:
 *
 *   npm i --no-save playwright && node scripts/brand.mjs
 *
 * Share images carry titles and taglines only — never figures — so they cannot
 * drift out of date when the data is refreshed.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('This script needs Playwright: npm i --no-save playwright');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
/** Fonts are inlined: pages set with setContent cannot load file:// URLs. */
const font = async (file) =>
  `data:font/woff2;base64,${(await readFile(join(pub, 'fonts', file))).toString('base64')}`;

const BLUE = '#1a3aa8';
const PAPER = '#fbfbfa';
const INK = '#0b1220';

const MARK = await readFile(join(pub, 'logo-mark.svg'), 'utf8');
const MARK_REV = await readFile(join(pub, 'logo-mark-reversed.svg'), 'utf8');

/**
 * The emblem mark at `size`. `tile` sets a background square (icons);
 * `bleed` fills it edge to edge for platforms that mask icons; `scale` is how
 * much of the tile the mark occupies.
 */
const mark = (size, { tile = null, bleed = false, scale = 1, reversed = false } = {}) => {
  const inner = (reversed ? MARK_REV : MARK).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const s = 384 / scale;
  const o = (s - 384) / 2;
  const bg = tile ? `<rect x="${56 - o}" y="${-8 - o}" width="${s}" height="${s}" rx="${bleed ? 0 : s * 0.2}" fill="${tile}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${56 - o} ${-8 - o} ${s} ${s}">${bg}${inner}</svg>`;
};

const fontFaces = `
  @font-face { font-family: 'Source Serif 4'; src: url('${await font('source-serif-4-latin-opsz.woff2')}') format('woff2'); font-weight: 200 900; }
  @font-face { font-family: 'Public Sans'; src: url('${await font('public-sans-latin-wght.woff2')}') format('woff2'); font-weight: 100 900; }`;

/** Faint depth contours, the same motif as the site's page headers. */
function contours(w, h) {
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  let out = '';
  for (let i = 0; i < 14; i++) {
    const base = h * 0.18 + (i / 13) * h * 1.0;
    const a1 = 10 + rand() * 22;
    const a2 = 4 + rand() * 10;
    const p1 = rand() * 6.28;
    const p2 = rand() * 6.28;
    let d = '';
    for (let x = 0; x <= w; x += 20) {
      const y = base + a1 * Math.sin((x / w) * 6.28 * 1.2 + p1) + a2 * Math.sin((x / w) * 6.28 * 3 + p2);
      d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`;
    }
    out += `<path d="${d}" fill="none" stroke="${i % 4 === 0 ? 'rgba(27,60,140,0.13)' : 'rgba(11,18,32,0.07)'}" stroke-width="${i % 4 === 0 ? 1.6 : 1.1}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" style="position:absolute;inset:0">${out}</svg>`;
}

const PAGES = [
  { file: 'og.png', eyebrow: 'Calatagan, Batangas', title: 'Every public figure, traced to its source.' },
  { file: 'og/history.png', eyebrow: 'History', title: 'Calatagan, from the record' },
  { file: 'og/government.png', eyebrow: 'Government', title: 'Who governs Calatagan — and what we can prove' },
  { file: 'og/finances.png', eyebrow: 'Finances', title: 'What the municipality reports it receives and spends' },
  { file: 'og/transparency.png', eyebrow: 'Disclosures', title: 'Every Full Disclosure Policy filing, indexed' },
  { file: 'og/documents.png', eyebrow: 'Archive', title: 'Documents from the former municipal website' },
  { file: 'og/sources.png', eyebrow: 'Sources', title: 'Where every figure comes from' },
  { file: 'og/about.png', eyebrow: 'About', title: 'An independent civic guide to Calatagan' },
  { file: 'og/data.png', eyebrow: 'Open data', title: 'Calatagan’s public record, as open data' },
];

const ogHtml = ({ eyebrow, title }) => `<!doctype html><html><head><meta charset="utf-8"><style>
  ${fontFaces}
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: ${PAPER}; font-family: 'Public Sans'; color: ${INK}; }
  .panel { position: absolute; inset: 22px; border-radius: 40px; overflow: hidden;
    background: linear-gradient(180deg, #efefec 0%, #f7f7f5 100%); }
  .inner { position: absolute; inset: 0; padding: 56px 64px; display: flex; flex-direction: column; }
  .lockup { display: flex; align-items: center; gap: 16px; font-family: 'Source Serif 4'; font-size: 34px; letter-spacing: -0.035em; }
  .eyebrow { margin-top: auto; display: flex; align-items: center; gap: 12px; font-size: 26px; font-weight: 600; color: #4a5160; }
  .eyebrow::before { content: ''; width: 12px; height: 12px; border-radius: 50%; background: ${BLUE}; }
  h1 { margin-top: 18px; font-family: 'Source Serif 4'; font-weight: 400; font-size: ${title.length > 42 ? 70 : 84}px;
    line-height: 1.02; letter-spacing: -0.04em; max-width: 900px; }
  .foot { margin-top: 34px; display: flex; justify-content: space-between; font-size: 21px; color: #4a5160; }
  .ghost { position: absolute; right: -40px; top: -30px; opacity: 0.08; }
</style></head><body><div class="panel">${contours(1156, 586)}
  <div class="ghost">${mark(430)}</div>
  <div class="inner">
    <div class="lockup">${mark(64)}Better Calatagan</div>
    <p class="eyebrow">${eyebrow}</p>
    <h1>${title}</h1>
    <div class="foot"><span>An independent civic guide · Not an official government website</span><span>Every figure, sourced</span></div>
  </div></div></body></html>`;

/** Wraps PNG images into one .ico file (PNG-compressed entries). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, data }, i) => {
    const e = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, e);
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1);
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(data.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.data)]);
}

const browser = await chromium.launch();
const page = await browser.newPage();

async function renderSvg(svg, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

// Icons
const icoEntries = [];
for (const size of [16, 32, 48]) icoEntries.push({ size, data: await renderSvg(mark(size, { tile: '#ffffff', scale: 1.08 }), size) });
await writeFile(join(pub, 'favicon.ico'), ico(icoEntries));
await writeFile(join(pub, 'apple-touch-icon.png'), await renderSvg(mark(180, { tile: '#ffffff', bleed: true, scale: 0.84 }), 180));
await writeFile(join(pub, 'icon-192.png'), await renderSvg(mark(192, { tile: '#ffffff', scale: 0.92 }), 192));
await writeFile(join(pub, 'icon-512.png'), await renderSvg(mark(512, { tile: '#ffffff', scale: 0.92 }), 512));
await writeFile(join(pub, 'icon-maskable-512.png'), await renderSvg(mark(512, { tile: '#ffffff', bleed: true, scale: 0.7 }), 512));

// Share images
await mkdir(join(pub, 'og'), { recursive: true });
await page.setViewportSize({ width: 1200, height: 630 });
for (const entry of PAGES) {
  await page.setContent(ogHtml(entry), { waitUntil: 'load' });
  await page.evaluate(() => globalThis.document.fonts.ready);
  await writeFile(join(pub, entry.file), await page.screenshot({ type: 'png' }));
  console.log('wrote', entry.file);
}

await browser.close();
// Keep the manifest's icon list honest.
JSON.parse(await readFile(join(pub, 'site.webmanifest'), 'utf8'));
console.log('done');
