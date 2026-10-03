import { describe, expect, it } from 'vitest';
import { GET } from '../pages/data/resorts.json';

const request = { site: new URL('https://bettercalatagan.org/') };

describe('resort-channel export', () => {
  it('exports the same resort evidence as the page without claiming civic-data verification', async () => {
    const response = await GET(request as Parameters<typeof GET>[0]);
    const body = await response.json();
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(body.data.resorts).toHaveLength(6);
    expect(body.data.resorts.find((entry: { id: string }) => entry.id === 'valley-o-ville').dotRecord).toBeUndefined();
    expect(body.meta.disclaimer).toContain('not a booking guarantee');
  });
});
