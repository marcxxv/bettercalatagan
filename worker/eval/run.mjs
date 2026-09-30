#!/usr/bin/env node
/**
 * Ask the assistant every question in cases.json and check each answer.
 *
 *   node eval/run.mjs                          # local Worker on :8787, origin http://localhost:4321
 *   node eval/run.mjs --url https://… --origin https://bettercalatagan.vercel.app
 *   node eval/run.mjs --only officials         # one category
 *   node eval/run.mjs --ask "How many barangays?"
 *
 * A case passes when every `include` pattern appears (case-insensitive
 * regular expressions), no `exclude` pattern does, and `withdrawn` matches
 * whether the guard withdrew the answer. Needs a Worker without Turnstile, or
 * a Turnstile test secret.
 */
import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = flag('url', 'http://localhost:8787').replace(/\/$/, '');
const origin = flag('origin', 'http://localhost:4321');
const only = flag('only');
const single = flag('ask');
const verbose = args.includes('--verbose') || Boolean(single);

async function session() {
  const res = await fetch(`${base}/session`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' }),
  });
  if (!res.ok) throw new Error(`session: ${res.status} ${await res.text()}`);
  return (await res.json()).token;
}

export async function ask(token, messages) {
  const started = Date.now();
  const res = await fetch(`${base}/chat`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) return { error: `${res.status} ${await res.text()}`, text: '', sources: [], ms: Date.now() - started };
  let text = '';
  let sources = [];
  let withdrawn = false;
  let first = 0;
  let grounded = null;
  const body = await res.text();
  for (const line of body.split('\n')) {
    if (!line.trim()) continue;
    const event = JSON.parse(line);
    if (event.t === 'sources') sources = event.items;
    else if (event.t === 'delta') {
      first ||= Date.now() - started;
      text += event.text;
    } else if (event.t === 'reset') {
      withdrawn = true;
      text = '';
    } else if (event.t === 'done') grounded = event.grounded;
    else if (event.t === 'error') return { error: event.message, text, sources, ms: Date.now() - started };
  }
  return { text, sources, withdrawn, grounded, ms: Date.now() - started, firstMs: first };
}

// Patterns are case-insensitive unless they start with (?-i), for checks such as a capitalised name.
const test = (pattern, text) =>
  pattern.startsWith('(?-i)') ? new RegExp(pattern.slice(5)).test(text) : new RegExp(pattern, 'i').test(text);

async function main() {
  if (single) {
    const r = await ask(await session(), [{ role: 'user', content: single }]);
    console.log(r.text, '\n');
    console.log(r.sources.map((s) => `[${s.n}] ${s.page} — ${s.section} ${s.url}`).join('\n'));
    console.log(`\n${r.withdrawn ? 'WITHDRAWN · ' : ''}${r.ms} ms (first text ${r.firstMs} ms)`);
    return;
  }
  const cases = JSON.parse(await readFile(new URL('./cases.json', import.meta.url), 'utf8')).filter(
    (c) => !only || c.category === only,
  );
  let passed = 0;
  const failures = [];
  const times = [];
  for (const c of cases) {
    // Space requests out so the Worker's own per-minute limit is not what is being tested.
    const messages = [...(c.history ?? []), { role: 'user', content: c.question }];
    // A fresh session per case, as a new visitor would have.
    let r = await ask(await session(), messages);
    if (r.error?.startsWith('429')) {
      await new Promise((resolve) => setTimeout(resolve, 60_000));
      r = await ask(await session(), messages);
    }
    times.push(r.ms);
    const problems = [];
    if (r.error) problems.push(`error: ${r.error}`);
    for (const p of c.include ?? []) if (!test(p, r.text)) problems.push(`missing /${p}/`);
    for (const p of c.exclude ?? []) if (test(p, r.text)) problems.push(`contains /${p}/`);
    if (c.withdrawn !== undefined && c.withdrawn !== r.withdrawn) problems.push(`withdrawn=${r.withdrawn}`);
    if (c.cites && !/\[\d+\]/.test(r.text) && !r.withdrawn) problems.push('no citation');
    const ok = problems.length === 0;
    if (ok) passed += 1;
    else failures.push({ c, r, problems });
    console.log(`${ok ? 'PASS' : 'FAIL'}  [${c.category}] ${c.question}  (${r.ms} ms)`);
    if (!ok || verbose) {
      for (const p of problems) console.log(`      ${p}`);
      console.log(`      ${r.text.replace(/\n/g, '\n      ')}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 7_000));
  }
  times.sort((a, b) => a - b);
  console.log(
    `\n${passed}/${cases.length} passed · median ${times[times.length >> 1]} ms · p90 ${times[Math.floor(times.length * 0.9)]} ms`,
  );
  process.exitCode = failures.length ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
