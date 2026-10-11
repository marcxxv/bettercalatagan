/**
 * What the assistant must never say, checked in code rather than left to the
 * model's good behaviour.
 *
 * Input: questions are screened for attempts to extract or override the
 * instructions, and two kinds of question are answered deterministically
 * without the model at all (who holds office, and emergencies).
 *
 * Output: `OutputGuard` buffers the complete model answer and validates it
 * before release. On a violation only a fixed fallback is shown.
 */
import { figures, unsupported, type Figure } from './numbers';

/**
 * Surnames of officials whose incumbency this project has not verified. Must
 * match the list in .github/workflows/ci.yml ("Check no unverified officials
 * are named"); a test enforces it.
 */
export const UNVERIFIED_OFFICIALS = ['Puno', 'Zarraga', 'Palacio', 'Pantoja', 'Ancheta', 'Anzaldo'] as const;

/**
 * Values the site deliberately withholds. Must match the list in
 * .github/workflows/ci.yml ("Check withheld data did not leak").
 */
export const WITHHELD_VALUES = ['419-0150', 'mayorsoffice1011', '@gmail.com', '@yahoo.com', '64,234', '14,267'] as const;

export const MAX_QUESTION = 600;

export type Intent = 'officials' | 'emergency' | 'injection' | 'allegation' | 'empty' | 'too-long';

const OFFICIAL_NAME = new RegExp(`\\b(${UNVERIFIED_OFFICIALS.join('|')})\\b`, 'i');

const INJECTION = [
  /\b(ignore|disregard|forget|override)\b.{0,40}\b(instruction|instructions|rules|prompt|above|previous|prior)\b/i,
  /\b(system|developer|hidden|initial)\s+(prompt|message|instructions?)\b/i,
  /\b(reveal|show|print|repeat|output|leak)\b.{0,30}\b(prompt|instructions?|rules|configuration|canary)\b/i,
  /\b(jailbreak|dan mode|developer mode|god mode)\b/i,
  /\byou are (now|no longer)\b/i,
  /<\/?(system|assistant|instructions?)>/i,
];

const WHO = /\b(who|whos|who's|sino|sinu|name|names|pangalan|list)\b/i;
const OFFICE =
  /\b(mayor|vice[\s-]?mayor|alkalde|punong[\s-]?bayan|councilors?|councillors?|konsehal|kagawad|sangguniang|sb members?|captain|kapitan|punong[\s-]?barangay|chairman|governor|gobernador|congress(wo)?man|representative|officials?|opisyal|incumbent|nanunungkulan)\b/i;
const EMERGENCY =
  /\b(emergency|emerhensiya|emergensiya|sunog|fire|ambulance|ambulansya|police|pulis|saklolo|drowning|nalulunod|accident|aksidente|rescue)\b/i;

/** Classify a question that needs a fixed answer instead of the model's. */
export function screen(question: string): Intent | null {
  const text = question.trim();
  if (!text) return 'empty';
  if (text.length > MAX_QUESTION) return 'too-long';
  if (INJECTION.some((re) => re.test(text))) return 'injection';
  // Decline requests to manufacture accusations, while keeping neutral record queries open.
  if (/\b(stole|stolen|embezzled|secretly connected|nagnakaw|ninakaw)\b/i.test(text) ||
      /\b(prove|name|identify|which|sino)\b.{0,80}\b(corrupt|corruption|kurakot)\b/i.test(text)) return 'allegation';
  if (EMERGENCY.test(text) && !/\b(budget|spend|spent|fund|funds|pondo|gastos|how much|magkano)\b/i.test(text)) {
    return 'emergency';
  }
  if ((WHO.test(text) && OFFICE.test(text)) || OFFICIAL_NAME.test(text)) return 'officials';
  return null;
}

/** The fixed answers, in the reader's language where it is clearly Filipino. */
export function fixedAnswer(intent: Intent, filipino: boolean): { text: string; url?: string } {
  switch (intent) {
    case 'allegation':
      return {
        text: filipino
          ? 'Hindi sapat ang badyet, bilang ng bidder o nawawalang tala para magparatang ng pagnanakaw o katiwalian. Maaari kong ipaliwanag ang mga iniulat na halaga at limitasyon ng mga tala; hindi ako gagawa ng paratang tungkol sa isang tao o kompanya.'
          : 'A budget, bidder count or missing record does not establish theft, corruption or a secret relationship. I can explain reported figures and the limits of the records; I cannot manufacture an allegation about a person or company.',
        url: '/procurement',
      };
    case 'officials':
      return {
        text: filipino
          ? 'Hindi inilalathala ng BetterCalatagan kung sino ang kasalukuyang nanunungkulan. **Ang resulta ng halalan ay hindi patunay kung sino ang nasa puwesto ngayon**, at wala pang pangunahing talaan (COMELEC o DILG) na makukumpirma ito. Nasa pahina ng Pamahalaan ang buong paliwanag at kung saan maaaring magtanong.'
          : 'BetterCalatagan does not publish who currently holds office. **An election result is not proof of who is in office today**, and no primary record (COMELEC or DILG) is yet available to confirm it. The Government page explains why, and where to ask instead.',
        url: '/government#officials',
      };
    case 'emergency':
      // Numbers must match src/data/calendar.ts (localHotlines); a test checks it.
      return {
        text: filipino
          ? 'Kung may emerhensiya, **tumawag sa 911**, ang pambansang emergency hotline. Sa Calatagan, ang **MDRRMO** ay nasa **0909 456 5818** o **(043) 419 7510**. Nasa pahina ng Hotlines ang PNP, BFP, RHU, Coast Guard at iba pa.'
          : 'In an emergency, **call 911**, the national emergency hotline. In Calatagan, the **MDRRMO** is on **0909 456 5818** or **(043) 419 7510**. The Hotlines page lists the police, fire, health, Coast Guard and other local numbers.',
        url: '/hotlines',
      };
    case 'too-long':
      return { text: `Please keep your question under ${MAX_QUESTION} characters.` };
    case 'empty':
      return { text: 'Ask a question about Calatagan’s public record.' };
    default:
      return {
        text: filipino
          ? 'Tanong lang tungkol sa pampublikong talaan ng Calatagan ang masasagot ko.'
          : 'I can only answer questions about Calatagan’s public record on this site.',
      };
  }
}

const FILIPINO = /\b(ang|ng|mga|sa|ano|ilan|sino|saan|kailan|paano|bakit|po|ba|magkano|yung|kasi|naman|ito|dito)\b/gi;

/** A rough test for a question written (at least partly) in Filipino. */
export function looksFilipino(text: string): boolean {
  return (text.match(FILIPINO)?.length ?? 0) >= 2;
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONES = [
  /(?:\+?63|\b0)\s?9\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g, // mobile number
  /\(\s?0?\d{2,3}\s?\)\s?\d{3}[\s-]?\d{4}/g, // landline with area code
];
const digitsOf = (text: string) => text.replace(/\D/g, '').replace(/^63/, '0');

/** Every phone number written in `text`, as bare digits (for matching answers to passages). */
export function phoneNumbers(text: string): Set<string> {
  const out = new Set<string>();
  for (const re of PHONES) for (const m of text.matchAll(re)) out.add(digitsOf(m[0]));
  return out;
}

export type Verdict = { ok: true; emit: string } | { ok: false; reason: string };

/**
 * Buffers a bounded complete answer. No model text is emitted until all checks pass.
 * A value occurring in a cited passage is a numeric match, not proof of semantic entailment.
 */
export class OutputGuard {
  private text = '';
  private released = '';

  constructor(
    private readonly pool: readonly Figure[],
    private readonly canary: string,
    /** Phone numbers the site itself publishes (hotlines); any other number is withdrawn. */
    private readonly publishedPhones: ReadonlySet<string> = new Set(),
    private readonly passageTexts?: readonly string[],
  ) {}

  push(delta: string): Verdict {
    this.text = normaliseCitations((this.text + delta).normalize('NFKC'));
    if (this.text.length > 24_000) return { ok: false, reason: 'answer-too-long' };
    return { ok: true, emit: '' };
  }

  finish(): Verdict {
    this.text = this.text.trimEnd();
    const reason = this.violation();
    if (reason) return { ok: false, reason };
    this.released = this.text;
    return { ok: true, emit: this.text };
  }

  get output(): string {
    return this.released;
  }

  private violation(): string | null {
    const head = this.text;
    if (this.canary && head.includes(this.canary)) return 'canary';
    if (OFFICIAL_NAME.test(head)) return 'official-name';
    for (const value of WITHHELD_VALUES) if (head.includes(value)) return 'withheld-value';
    if (EMAIL.test(head)) return 'contact-detail';
    for (const number of phoneNumbers(head)) if (!this.publishedPhones.has(number)) return 'contact-detail';
    if (/\b(?:stole|embezzled|secretly connected|nagnakaw|ninakaw)\b/i.test(head) ||
        /\b(?:is|was|are|were)\s+(?:a\s+)?(?:corrupt|thief|crook)\b/i.test(head)) return 'unsupported-allegation';
    let pool = this.pool;
    if (this.passageTexts) {
      const cites = [...head.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
      if (cites.some((n) => !Number.isSafeInteger(n) || n < 1 || n > this.passageTexts!.length)) return 'invalid-citation';
      if (!cites.length) return 'missing-citation';
      pool = figurePool(...[...new Set(cites)].map((n) => this.passageTexts![n - 1]));
    }
    const bad = unsupported(head, pool);
    if (bad.length) return 'unsupported-figure';
    return null;
  }
}

/**
 * Some models cite in their own house style ("【3†L4-L9】", "[^3]", "(3)").
 * Rewrite them to the site's "[3]" so the reader sees one convention.
 */
export function normaliseCitations(text: string): string {
  return text
    .replace(/【\s*(\d+)(?:†[^】]*)?】/g, '[$1]')
    .replace(/\[\^(\d+)\]/g, '[$1]')
    .replace(/\[(\d+)\s*,\s*(\d+)\]/g, '[$1][$2]');
}

/** The pool of figures an answer may use: published passages only. */
export function figurePool(...texts: string[]): Figure[] {
  return texts.flatMap((t) => figures(t));
}
