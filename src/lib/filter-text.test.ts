import { describe, expect, it } from 'vitest';
import { matchFilterText } from './filter-text';

describe('filter text matching', () => {
  it('matches words in any order without case or accent sensitivity', () => {
    expect(matchFilterText('Café Anam in Balibago', 'BALIBAGO cafe')).toBe(true);
  });

  it('handles punctuation in resort names and identifiers', () => {
    expect(matchFilterText('Valley O’Ville Family Resort', 'oville')).toBe(true);
    expect(matchFilterText('DPWH-23-001', 'DPWH 001')).toBe(true);
  });

  it('leaves the full list visible for an empty query and rejects unrelated words', () => {
    expect(matchFilterText('Nawa Wellness', '  ')).toBe(true);
    expect(matchFilterText('Nawa Wellness', 'Anam')).toBe(false);
  });
});
