import type { APIRoute } from 'astro';

/**
 * Everything is public and meant to be found, including the open data.
 *
 * The reader's pass-through paths are excluded: they are the Internet
 * Archive's and DILG's own files, which those hosts already expose, and
 * crawling them here would only duplicate content and spend crawl budget.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('http://localhost:4321');
  const body = `User-agent: *\nAllow: /\nDisallow: /wayback/\nDisallow: /fdp-file/\n\nSitemap: ${new URL('/sitemap.xml', origin).toString()}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
