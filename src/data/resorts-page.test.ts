import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('../pages/resorts.astro', import.meta.url), 'utf8');

describe('resort channel presentation', () => {
  it('uses icon-only Facebook and Instagram links with explicit accessible names', () => {
    expect(page).toContain('aria-label={`${resort.name} on ${channel.label}`}');
    expect(page).toContain('src={`/icons/channels/${channel.label.toLowerCase()}.png`}');
    for (const brand of ['facebook', 'instagram']) {
      const png = readFileSync(new URL(`../../public/icons/channels/${brand}.png`, import.meta.url));
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    }
  });

  it('centers the website column label and website actions', () => {
    expect(page).toContain('class="website-heading"');
    expect(page).toContain('.website-heading { text-align: center; }');
    expect(page).toContain('.resort-row > .row-actions { justify-content: center; }');
  });
});
