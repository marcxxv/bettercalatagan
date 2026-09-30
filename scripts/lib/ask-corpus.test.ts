import { describe, expect, it } from 'vitest';
import { finalise, indexPassages, pagePassages } from './ask-corpus.mjs';

const page = `<!doctype html><html><head><title>Finances — Better Calatagan</title></head><body>
<nav><a href="/">Home</a></nav>
<main>
  <h1>Calatagan municipal finances</h1>
  <p>Every quarter the municipality files a statement with the DILG, and this page reports it.</p>
  <section id="quarters"><h2 id="quarters-title">Every quarter on file</h2>
    <p>Figures are cumulative within a calendar year, so a Q3 value already includes Q1 and Q2.</p>
    <table><thead><tr><th><button>Quarter</button></th><th>Income</th></tr></thead>
      <tbody><tr><td>Q2 CY2026</td><td>237,893,819.86</td></tr></tbody></table>
    <svg aria-hidden="true"><text>decoration</text></svg>
    <div aria-hidden="true">Hidden chart label</div>
    <script>var secret = 1;</script>
  </section>
  <section id="snapshot"><h2>By period</h2>
    <div class="panel" data-ask-label="Statement for Q1 CY2026" hidden>
      <p>For Q1 CY2026, Calatagan reported income of ₱136,484,108 and spending of ₱48,230,704.</p>
    </div>
    <form><label>Choose a period</label><select><option>Q1</option></select></form>
  </section>
</main></body></html>`;

describe('pagePassages', () => {
  const passages = pagePassages(page, '/finances');

  it('splits a page at its h2 sections, linking each to its anchor', () => {
    expect(passages.map((p) => p.url)).toEqual(['/finances', '/finances#quarters', '/finances#snapshot']);
    expect(passages[0].page).toBe('Finances');
  });

  it('reads tables as labelled rows, including sortable headers', () => {
    expect(passages[1].text).toContain('Q2 CY2026; Income: 237,893,819.86');
  });

  it('leaves out what a reader cannot see, navigation and controls', () => {
    const all = passages.map((p) => p.text).join('\n');
    for (const absent of ['decoration', 'Hidden chart label', 'secret', 'Choose a period', 'Home']) {
      expect(all).not.toContain(absent);
    }
  });

  it('keeps a labelled panel that a switcher reveals, with its label', () => {
    expect(passages[2].section).toBe('By period › Statement for Q1 CY2026');
    expect(passages[2].text.startsWith('Statement for Q1 CY2026\nFor Q1 CY2026')).toBe(true);
  });
});

describe('corpus', () => {
  it('turns sourced answers and withheld facts into passages', () => {
    const out = indexPassages([
      { t: 'Population', g: 'Answers', u: '/#population', a: '60,420 people', s: 'PSA', k: 'residents' },
      { t: 'Land area', g: 'Not published', u: '/sources#withheld', d: 'Sources disagree tenfold.' },
      { t: 'History', g: 'Pages', u: '/history', d: 'A page' },
    ]);
    expect(out[0].keywords).toBe('residents');
    expect(out.map((p) => p.text)).toEqual([
      'Population: 60,420 people. Source: PSA.',
      'Not published on Better Calatagan: Land area. Reason: Sources disagree tenfold.',
    ]);
  });

  it('gives stable ids, and a new version only when content changes', () => {
    const a = finalise([{ url: '/', page: 'P', section: 'S', text: 'one' }], { site: '', generatedAt: '' });
    const b = finalise([{ url: '/', page: 'P', section: 'S', text: 'one' }], { site: '', generatedAt: 'later' });
    const c = finalise([{ url: '/', page: 'P', section: 'S', text: 'two' }], { site: '', generatedAt: '' });
    expect(a.version).toBe(b.version);
    expect(a.chunks[0].id).toBe(c.chunks[0].id);
    expect(a.version).not.toBe(c.version);
  });
});
