import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('search result motion', () => {
  it('reveals list and barangay results through the shared motion helper', () => {
    expect(source('../scripts/filter.ts')).toContain('revealFilteredResults(list)');
    expect(source('../scripts/barangays.ts')).toMatch(/revealFilteredResults\(tbody!?\)/);
  });

  it('keeps every search animation off when reduced motion is requested', () => {
    expect(source('../scripts/reveal.ts')).toContain("prefers-reduced-motion: reduce");
    expect(source('../components/SearchDialog.astro')).toContain('prefers-reduced-motion: no-preference');
    expect(source('../components/SearchDialog.astro')).toContain('search-row-in');
  });
});
