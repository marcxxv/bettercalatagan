import type { APIRoute } from 'astro';
import { documentsSource } from '../data/documents';
import { fdpSource } from '../data/fdp';
import { financialsSource } from '../data/financials';
import { HISTORY_RESEARCHED_ON } from '../data/history';
import { barangayPopulation2024 } from '../data/population';
import { NAV, SECONDARY_NAV } from '../lib/site';

/**
 * Every HTML page, with `lastmod` taken from the date its content was last
 * verified — never the build date, which would claim changes that did not
 * happen. Pages without a dated source carry no `lastmod` at all.
 */
const LASTMOD: Record<string, string> = {
  '/': barangayPopulation2024.source.lastVerified,
  '/history': HISTORY_RESEARCHED_ON,
  '/finances': financialsSource.lastVerified,
  '/transparency': fdpSource.lastVerified,
  '/documents': documentsSource.lastVerified,
};

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('http://localhost:4321');
  const pages = [...NAV, ...SECONDARY_NAV].filter((item) => !item.href.endsWith('.json'));

  const urls = pages
    .map(({ href }) => {
      const loc = new URL(href, origin).toString().replace(/\/$/, href === '/' ? '/' : '');
      const lastmod = LASTMOD[href];
      return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
