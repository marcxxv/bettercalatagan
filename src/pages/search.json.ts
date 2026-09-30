import type { APIRoute } from 'astro';
import { buildSearchIndex } from '../lib/search-index';

/** The search index, loaded by the search dialog on first use. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildSearchIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
