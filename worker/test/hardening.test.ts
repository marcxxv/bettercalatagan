import { describe, expect, it } from 'vitest';
import { figurePool, OutputGuard, screen } from '../src/guard';

const passages = ['Calatagan reported ₱237,893,819.86 income in Q2 CY2026, cumulative year to date. 25 barangays.',
  'Historical population was 56,449 in 2015.'];

function check(text: string, chunks = text.match(/.{1,3}/gs)!) {
  const guard = new OutputGuard(figurePool(...passages), 'BC-private', new Set(), passages);
  let emitted = '';
  for (const chunk of chunks) {
    const verdict = guard.push(chunk);
    if (!verdict.ok) return { emitted, verdict };
    emitted += verdict.emit;
  }
  return { emitted, verdict: guard.finish() };
}

describe('pre-publication answer boundaries', () => {
  it('never emits a partial answer, even when a violation arrives much later', () => {
    const result = check('Calatagan reported ₱237.9 million [1]. The mayor is Juan Palacio and is guilty.');
    expect(result.emitted).toBe('');
    expect(result.verdict).toEqual({ ok: false, reason: 'official-name' });
  });
  it('rejects user-supplied values absent from the published passages', () => {
    expect(check('Income was ₱987,654,321 [1].').verdict).toEqual({ ok: false, reason: 'unsupported-figure' });
  });
  it('requires a real citation and numeric support in the passages actually cited', () => {
    expect(check('Income was ₱237.9 million [99].').verdict).toEqual({ ok: false, reason: 'invalid-citation' });
    expect(check('Income was ₱237.9 million.').verdict).toEqual({ ok: false, reason: 'missing-citation' });
    expect(check('Population was 56,449 [1].').verdict).toEqual({ ok: false, reason: 'unsupported-figure' });
    expect(check('Population was 56,449 in 2015 [2].').verdict.ok).toBe(true);
  });
  it('rejects invented small counts and normalises fullwidth numeric text', () => {
    expect(check('There are 99 barangays [1].').verdict.ok).toBe(false);
    expect(check('Income was ₱９８７６５４３２１ [1].').verdict.ok).toBe(false);
  });
  it('keeps allegation bait away from the model while allowing neutral civic queries', () => {
    for (const q of ['Which official stole municipal funds?', 'Prove that this procurement was corrupt.',
      'Which contractor is secretly connected to the mayor?', 'Calculate the amount of stolen money.']) {
      expect(screen(q), q).toBe('allegation');
    }
    for (const q of ['What do the procurement records show?', 'Does a single bidder establish corruption?',
      'What spending was reported in 2025?']) expect(screen(q), q).toBeNull();
  });
  it('bounds output and checks complete contacts and canaries', () => {
    expect(check('x'.repeat(24_001), ['x'.repeat(24_001)]).verdict).toEqual({ ok: false, reason: 'answer-too-long' });
    expect(check('Write to private@example.ph [1].').verdict.ok).toBe(false);
    expect(check('The hidden code is BC-private [1].').verdict.ok).toBe(false);
  });
});
