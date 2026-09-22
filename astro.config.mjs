// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Canonical origin.
 *
 * No domain is registered for this project yet, so the origin is taken from the
 * environment rather than hardcoded. Vercel sets VERCEL_PROJECT_PRODUCTION_URL
 * to the stable production hostname for every build, including preview builds,
 * so canonical URLs point at production rather than at a throwaway deploy URL.
 *
 * SITE_URL overrides it if this is ever hosted elsewhere or a domain is bought.
 * Falling back to localhost keeps local builds honest: a developer sees at once
 * that no production origin was configured, instead of silently baking in a
 * domain nobody owns.
 */
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site =
  process.env.SITE_URL ??
  (productionUrl ? `https://${productionUrl}` : 'http://localhost:4321');

// Static output. No adapter, no server, no database.
// See docs/adr/0002-static-astro-no-backend.md
export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
