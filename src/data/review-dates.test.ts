import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('human review dates remain separate from automated retrieval', () => {
  for (const module of ['fdp', 'documents', 'financials', 'population', 'infrastructure', 'competitiveness', 'poverty', 'boundaries']) {
    it(`${module} never derives a review date from generated data`, () => {
      const text = readFileSync(new URL(`./${module}.ts`, import.meta.url), 'utf8');
      const dates = [...text.matchAll(/lastVerified:\s*([^,\n]+)/g)].map((m) => m[1]);
      expect(dates.length).toBeGreaterThan(0);
      for (const date of dates) expect(date).toMatch(/^'\d{4}-\d{2}-\d{2}'$/);
    });
  }
});
