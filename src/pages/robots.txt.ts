import type { APIRoute } from 'astro';

/** Everything is public and meant to be found, including the open data. */
export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('http://localhost:4321');
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', origin).toString()}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
