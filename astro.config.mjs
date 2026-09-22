// @ts-check
import { defineConfig } from 'astro/config';

// Static output. No adapter, no server, no database.
// See docs/adr/0002-static-astro-no-backend.md
export default defineConfig({
  site: 'https://bettercalatagan.org',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
