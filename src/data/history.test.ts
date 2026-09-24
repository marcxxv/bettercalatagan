import { describe, expect, it } from 'vitest';

import {
  chapters,
  citationById,
  citationNumbers,
  citations,
  orderedCitations,
  timeline,
  unverified,
} from './history.js';
import { incomeClassification } from './municipality.js';
import { psaPopulation } from './population.js';
import { PRIMARY_GRADE_KINDS, type Claim } from './schemas/history.js';

const primaryGrade = new Set<string>(PRIMARY_GRADE_KINDS);

const allClaims: Pick<Claim, 'text' | 'cite' | 'status' | 'attribution'>[] = [
  ...chapters.flatMap((c) => c.claims),
  ...timeline.map((t) => ({ text: t.event, cite: t.cite, status: t.status, attribution: t.attribution })),
];

describe('citations', () => {
  it('have unique ids', () => {
    expect(new Set(citations.map((c) => c.id)).size).toBe(citations.length);
  });

  it('are all used somewhere on the page', () => {
    for (const c of citations) expect(citationNumbers.has(c.id), c.id).toBe(true);
  });

  it('are numbered 1..n in order of first use', () => {
    expect([...citationNumbers.values()]).toEqual(orderedCitations.map((_, i) => i + 1));
  });
});

describe('claims', () => {
  it('cite only citations that exist', () => {
    const cited = [...allClaims.flatMap((c) => c.cite), ...unverified.flatMap((u) => u.foundIn)];
    for (const id of cited) expect(citationById.has(id), id).toBe(true);
  });

  it('are documented only on a primary-grade source or two independent agreeing sources', () => {
    for (const claim of allClaims.filter((c) => c.status === 'documented')) {
      const kinds = claim.cite.map((id) => citationById.get(id)!.kind);
      const ok = kinds.some((k) => primaryGrade.has(k)) || new Set(claim.cite).size >= 2;
      expect(ok, claim.text).toBe(true);
    }
  });

  it('attribute every claim that rests on a lesser source', () => {
    for (const claim of allClaims.filter((c) => c.status === 'attributed')) {
      expect(claim.attribution, claim.text).toBeTruthy();
      expect(claim.cite.every((id) => !primaryGrade.has(citationById.get(id)!.kind)), claim.text).toBe(true);
    }
  });

  it('describe a disagreement with more than one source', () => {
    for (const claim of allClaims.filter((c) => c.status === 'disputed')) {
      expect(claim.cite.length, claim.text).toBeGreaterThanOrEqual(2);
    }
  });

  it('never repeat superlatives or dates we could not support', () => {
    const text = allClaims.map((c) => c.text).join(' ').toLowerCase();
    expect(text).not.toMatch(/oldest/);
    expect(text).not.toMatch(/founded in 1912/);
    expect(text).not.toMatch(/national cultural treasure/);
    expect(text).not.toMatch(/505/);
  });
});

describe('timeline', () => {
  it('is in chronological order', () => {
    const years = timeline.map((t) => t.sortYear);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });
});

describe('agreement with the civic data', () => {
  const today = chapters.find((c) => c.id === 'today')!.claims.map((c) => c.text).join(' ');

  it('uses the published PSA total and barangay count', () => {
    expect(today).toContain(psaPopulation.municipality.totalPopulation.toLocaleString('en-US'));
    expect(today).toContain(`${psaPopulation.barangays.length} barangays`);
  });

  it('uses the published income class and effective date', () => {
    expect(incomeClassification.data.incomeClass).toBe(1);
    expect(incomeClassification.data.effectiveFrom).toBe('2025-01-01');
    expect(today).toContain('first class');
    expect(today).toContain('1 January 2025');
  });
});
