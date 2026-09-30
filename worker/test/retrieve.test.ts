import { describe, expect, it } from 'vitest';
import { parseChat } from '../src/chat';
import { originAllowed } from '../src/http';
import { questionWithPassages, retrievalQuery } from '../src/prompt';
import { ftsQuery, fuse, terms } from '../src/retrieve';
import { issue, verify } from '../src/session';

describe('retrieval', () => {
  it('drops function words in English and Filipino, and glosses Filipino terms', () => {
    expect(terms('Ilan ang tao sa Balibago?')).toEqual(['tao', 'population', 'people', 'balibago']);
    expect(terms('What is the population of Calatagan?')).toEqual(['population']);
  });

  it('builds a safe FTS5 query', () => {
    expect(ftsQuery('income "2025" OR drop')).toBe('"income"* OR "2025" OR "drop"*');
    expect(ftsQuery('what is the')).toBeNull();
  });

  it('fuses rankings, favouring what both agree on', () => {
    expect(fuse([['a', 'b', 'c'], ['c', 'a', 'd']])).toEqual(['a', 'c', 'b', 'd']);
  });

  it('lets a short follow-up borrow the previous question', () => {
    const history = [
      { role: 'user' as const, content: 'What was the population in 2020?' },
      { role: 'assistant' as const, content: '58,719 [1].' },
    ];
    expect(retrievalQuery(history, 'And in 2015?')).toBe('What was the population in 2020?\nAnd in 2015?');
    expect(retrievalQuery([], 'And in 2015?')).toBe('And in 2015?');
  });

  it('numbers passages for citation', () => {
    const text = questionWithPassages('Q?', [{ id: 'x', url: '/a', page: 'P', section: 'S', text: 'T' }]);
    expect(text).toContain('[1] P — S (/a)\nT');
    expect(text.endsWith('Question: Q?')).toBe(true);
  });
});

describe('requests', () => {
  it('accepts a conversation ending with a question, and trims history to recent turns', () => {
    const messages = Array.from({ length: 13 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
    const chat = parseChat({ messages });
    expect(chat?.question).toBe('m12');
    expect(chat?.history[0].role).toBe('user');
    expect(chat?.history.length).toBeLessThanOrEqual(8);
  });

  it('rejects malformed conversations', () => {
    expect(parseChat({})).toBeNull();
    expect(parseChat({ messages: [{ role: 'system', content: 'x' }] })).toBeNull();
    expect(parseChat({ messages: [{ role: 'user', content: 'q' }, { role: 'assistant', content: 'a' }] })).toBeNull();
  });

  it('keeps a well-formed reader context and drops anything else', () => {
    const messages = [{ role: 'user', content: 'What is this document?' }];
    expect(parseChat({ messages, context: { path: '/documents/', read: 'doc-20220806072203-bp44qlta' } })?.context).toEqual({
      path: '/documents',
      read: 'doc-20220806072203-bp44qlta',
    });
    expect(parseChat({ messages, context: { path: 'https://evil.example/', read: "x' OR 1=1" } })?.context).toEqual({
      path: null,
      read: null,
    });
    expect(parseChat({ messages })?.context).toEqual({ path: null, read: null });
  });

  it('allows only listed origins, with * standing for one label run', () => {
    const allowed = 'https://bettercalatagan.vercel.app,https://bettercalatagan-*-marcxxv.vercel.app';
    expect(originAllowed('https://bettercalatagan.vercel.app', allowed)).toBe(true);
    expect(originAllowed('https://bettercalatagan-git-feat-ask-marcxxv.vercel.app', allowed)).toBe(true);
    expect(originAllowed('https://bettercalatagan-x-marcxxv.vercel.app.evil.com', allowed)).toBe(false);
    expect(originAllowed('https://evil.vercel.app', allowed)).toBe(false);
    expect(originAllowed(null, allowed)).toBe(false);
  });
});

describe('sessions', () => {
  it('verifies its own tokens and rejects tampered or expired ones', async () => {
    const { token } = await issue('secret');
    expect(await verify('secret', token)).toMatch(/^[0-9a-f-]{36}$/);
    expect(await verify('other', token)).toBeNull();
    expect(await verify('secret', `${token.slice(0, -2)}xx`)).toBeNull();
    expect(await verify('secret', token, Date.now() + 3 * 60 * 60 * 1000)).toBeNull();
    expect(await verify('secret', null)).toBeNull();
  });
});
