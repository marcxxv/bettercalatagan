import { describe, expect, it } from 'vitest';
import { directoryIssues, resorts } from './resorts';

describe('resort channel directory', () => {
  it('publishes four named Calatagan establishments without implying universal coverage', () => {
    expect(resorts.map((resort) => resort.name)).toEqual([
      'Anam Beach Resort',
      'Lago de Oro',
      'Nawa Wellness',
      'Valley O’Ville Family Resort',
    ]);
    expect(new Set(resorts.map((resort) => resort.id)).size).toBe(resorts.length);
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
      ...resorts[3],
      dotRecord: {
        number: 'invented', listedName: 'Valley O’Ville', rosterAsOf: '2026-09-30' as const,
        listedValidUntil: '2026-10-31' as const, url: 'https://www.valleyoville.com/' as const,
      },
    };

    expect(directoryIssues([candidate], '2026-10-03')).toContainEqual(expect.stringContaining('DOT record lacks government roster evidence'));
    expect(directoryIssues(resorts, '2026-10-03')).toEqual([]);
  });

  it('shows Valley O’Ville without a DOT row claim or an unsupported domain-ownership caveat', () => {
    const valley = resorts.find((resort) => resort.id === 'valley-o-ville');
    expect(valley).toBeDefined();
    expect(valley?.dotRecord).toBeUndefined();
    expect(valley?.reviewNote).not.toMatch(/DOT|accreditation|domain ownership/i);
    expect(valley?.evidence.map((source) => source.description).join(' ')).not.toMatch(/domain ownership/i);
    expect(valley?.affiliation).toContain('maintainer');
  });
});
