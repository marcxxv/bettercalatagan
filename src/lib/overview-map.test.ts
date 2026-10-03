import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const overview = readFileSync(new URL('../pages/index.astro', import.meta.url), 'utf8');

describe('overview barangay map', () => {
  it('reuses the interactive barangay map in a native disclosure beside the 25-barangay list', () => {
    expect(overview).toContain("import BarangayMap from '../components/BarangayMap.astro'");
    expect(overview).toMatch(/<details[^>]*class="overview-map"[^>]*>[\s\S]*?<summary>[\s\S]*?<BarangayMap \/>[\s\S]*?<\/details>/);
  });
});
