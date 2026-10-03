import { describe, expect, it } from 'vitest';
import { directoryIssues, resorts } from './resorts';

describe('resort channel directory', () => {
  it('includes the additional resorts backed by the dated DOT roster and an accessible website', () => {
    expect(resorts.map((resort) => resort.name)).toEqual([
      'Anam Beach Resort',
      'Aquaria Water Park',
      'Lago de Oro',
      'Nawa Wellness',
      'PlayaLolita Beach Resort',
      'Valley O’Ville Family Resort',
    ]);
    expect(new Set(resorts.map((resort) => resort.id)).size).toBe(resorts.length);
  });

  it('attributes Aquaria’s channels only to Aquaria and keeps the combined DOT name in dated evidence', () => {
    const aquaria = resorts.find((resort) => resort.id === 'aquaria-crusoe');
    const playa = resorts.find((resort) => resort.id === 'playalolita');
    expect(aquaria?.website).toBe('https://aquaria.landcolifestyleventures.com/');
    expect(aquaria?.dotRecord).toMatchObject({ number: 'DOT-R4A-RES-02043-2024', listedName: 'AQUARIA WATER PARK & CRUSOE CABINS', rosterAsOf: '2026-09-30', listedValidUntil: '2026-10-31' });
    expect(aquaria?.channels.map((channel) => channel.linkedFrom)).toEqual([
      'https://aquaria.landcolifestyleventures.com/',
      'https://aquaria.landcolifestyleventures.com/',
    ]);
    expect(playa?.website).toBe('https://www.playalolitaresort.com/en/');
    expect(playa?.dotRecord).toMatchObject({ number: 'DOT-R4A-RES-03116-2026', rosterAsOf: '2026-09-30', listedValidUntil: '2026-10-31' });
    expect(playa?.channels).toEqual([]);
  });

  it('rejects stale review dates, duplicate channels and evidence from an unrelated site', () => {
    const candidate = {
      ...resorts[0],
      lastReviewed: '2026-10-04' as const,
      channels: [
        ...resorts[0].channels,
        { label: 'Instagram' as const, url: 'https://www.instagram.com/pretender/' as const, linkedFrom: 'https://scam.example/contact/' as const },
      ],
    };

    expect(directoryIssues([candidate], '2026-10-03')).toEqual(expect.arrayContaining([
      expect.stringContaining('reviewed in the future'),
      expect.stringContaining('duplicate Instagram'),
      expect.stringContaining('outside the listed website'),
    ]));
  });

  it('requires the exact cited page for each channel, not another page on the same origin', () => {
    const valid = resorts[0];
    const uncited = {
      ...valid,
      channels: [
        { ...valid.channels[0], linkedFrom: 'https://anambeachresort.com/uncited-page/' as const },
      ],
    };

    expect(directoryIssues([valid], '2026-10-03')).toEqual([]);
    expect(directoryIssues([uncited], '2026-10-03')).toContainEqual(
      expect.stringContaining('channel proof has no listed source'),
    );
  });

  it('keeps DOT claims separate from operator-owned sources', () => {
    const candidate = {
      ...resorts.find((resort) => resort.id === 'valley-o-ville')!,
      dotRecord: {
        number: 'invented', listedName: 'Valley O’Ville', rosterAsOf: '2026-09-30' as const,
        listedValidUntil: '2026-10-31' as const, url: 'https://www.valleyoville.com/' as const,
      },
    };

    expect(directoryIssues([candidate], '2026-10-03')).toContainEqual(expect.stringContaining('DOT record lacks government roster evidence'));
    expect(directoryIssues(resorts, '2026-10-03')).toEqual([]);
  });

  it('shows Valley O’Ville without unrelated stay conditions or owner-identifying notes', () => {
    const valley = resorts.find((resort) => resort.id === 'valley-o-ville');
    expect(valley).toBeDefined();
    expect(valley?.dotRecord).toBeUndefined();
    expect(valley && 'reviewNote' in valley).toBe(false);
    expect(valley?.evidence.map((source) => source.description).join(' ')).not.toMatch(/domain ownership/i);
    expect(valley && 'affiliation' in valley).toBe(false);
  });

  it('keeps row-level warnings in the cited evidence instead of separate notes', () => {
    expect(resorts.every((resort) => !('reviewNote' in resort))).toBe(true);
    expect(resorts.find((resort) => resort.id === 'anam-beach-resort')?.evidence.map((source) => source.description).join(' ')).toContain('conflicting Facebook');
    expect(resorts.find((resort) => resort.id === 'aquaria-crusoe')?.evidence.map((source) => source.description).join(' ')).toContain('Crusoe Cabins');
  });
});
