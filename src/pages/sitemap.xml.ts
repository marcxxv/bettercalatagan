import type { APIRoute } from 'astro';
import { documentsSource } from '../data/documents';
import { fdpSource } from '../data/fdp';
import { financialsSource } from '../data/financials';
import { HISTORY_RESEARCHED_ON } from '../data/history';
import { barangayPopulation2024 } from '../data/population';
import { PAGES } from '../lib/site';
import { barangayPages } from '../lib/barangay-pages';
import { infrastructureSource } from '../data/infrastructure';
import { competitivenessSource } from '../data/competitiveness';
import { servicesSource } from '../data/services';
import { resorts } from '../data/resorts';

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
  '/infrastructure': infrastructureSource.lastVerified,
  '/statistics': competitivenessSource.lastVerified,
  '/services': servicesSource.lastVerified,
  '/barangays': barangayPopulation2024.source.lastVerified,
  '/resorts': resorts.map((entry) => entry.lastReviewed).sort().at(-1)!,
};

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('http://localhost:4321');
  const pages = [
    ...PAGES.filter((item) => !item.href.endsWith('.json')),
    ...barangayPages.map((b) => ({ href: `/barangays/${b.slug}` })),
  ];

  const urls = pages
    .map(({ href }) => {
      const loc = new URL(href, origin).toString().replace(/\/$/, href === '/' ? '/' : '');
      const lastmod = LASTMOD[href] ?? (href.startsWith('/barangays/') ? LASTMOD['/barangays'] : undefined);
      return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
