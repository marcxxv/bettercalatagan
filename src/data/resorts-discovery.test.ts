import { expect, it } from 'vitest';
import { GET as index } from '../pages/data/index.json';
import { GET as llms } from '../pages/llms.txt';
import { buildSearchIndex } from '../lib/search-index';
import { GET as sitemap } from '../pages/sitemap.xml';

const context = { site: new URL('https://bettercalatagan.org/') };

it('makes the resort directory discoverable without assigning a civic-data tier', async () => {
  const manifest = await (await index(context as Parameters<typeof index>[0])).json();
  const listing = manifest.data.datasets.find((entry: { id: string }) => entry.id === 'resort-channels');
  expect(listing?.url).toBe('https://bettercalatagan.org/data/resorts.json');
  expect(listing?.readiness_tier).toBeUndefined();
  expect(listing?.evidence_model).toContain('tourism');

  const llmsText = await (await llms(context as Parameters<typeof llms>[0])).text();
  expect(llmsText).toContain('/data/resorts.json');
  expect(llmsText).toContain('not a booking guarantee');

  const urls = await (await sitemap(context as Parameters<typeof sitemap>[0])).text();
  expect(urls).toContain('https://bettercalatagan.org/resorts');
  expect(buildSearchIndex().some((entry) => entry.u === '/resorts#valley-o-ville')).toBe(true);
});
