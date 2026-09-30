import { describe, expect, it } from 'vitest';
import { figures, prose, supported, unsupported } from '../src/numbers';

const pool = figures(
  'Total income: ₱237,893,819.86. Population: 60,420. 61% came from the national government. Built in 1890. PSGC 0401008000.',
);

describe('figures', () => {
  it('reads values with their scale and precision', () => {
    const [a, b, c, d] = figures('₱237.9M, 60,420 people, 12.5%, ₱1.2 billion');
    expect(a).toMatchObject({ value: 237_900_000, unit: 100_000, percent: false, checked: true });
    expect(b).toMatchObject({ value: 60_420, unit: 1 });
    expect(c).toMatchObject({ value: 12.5, percent: true });
    expect(d).toMatchObject({ value: 1_200_000_000, unit: 100_000_000 });
  });

  it('treats trailing zeros in a grouped number as rounding, but a bare year as exact', () => {
    expect(figures('60,000')[0].unit).toBe(1000);
    expect(figures('1890')[0].unit).toBe(1);
  });

  it('does not check small whole numbers', () => {
    expect(figures('25 barangays in Q2').every((f) => !f.checked)).toBe(true);
  });
});

describe('supported', () => {
  it('accepts a figure the pool rounds to', () => {
    for (const text of ['₱237.9 million', '₱238 million', '237,893,820', '60,420', 'about 60,000', '61%', '1890']) {
      expect(unsupported(text, pool), text).toEqual([]);
    }
  });

  it('rejects a figure the pool does not state', () => {
    expect(unsupported('₱240.5 million', pool).map((f) => f.raw)).toEqual(['240.5 million']);
    expect(unsupported('60,421 people', pool)).toHaveLength(1);
    expect(unsupported('grew 7.2%', pool)).toHaveLength(1);
    expect(unsupported('founded in 1912', pool)).toHaveLength(1);
  });

  it('keeps percentages and amounts apart', () => {
    expect(supported(figures('61')[0], pool)).toBe(false);
  });

  it('ignores citation markers and link targets', () => {
    expect(unsupported('Income was ₱237.9M [12][13], see [the page](/finances#q2-2026).', pool)).toEqual([]);
    expect(prose('a [12] b')).toHaveLength('a [12] b'.length);
  });
});
