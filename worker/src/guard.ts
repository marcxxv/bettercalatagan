/**
 * What the assistant must never say, checked in code rather than left to the
 * model's good behaviour.
 *
 * Input: questions are screened for attempts to extract or override the
 * instructions, and two kinds of question are answered deterministically
 * without the model at all (who holds office, and emergencies).
 *
 * Output: the model's text is streamed through `OutputGuard`, which holds back
 * the last few words until they are complete and checks everything before it
 * is released. On a violation the answer is withdrawn and replaced, rather
 * than shown with a warning.
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
export const WITHHELD_VALUES = ['(043)', 'mayorsoffice1011', '@gmail.com', '@yahoo.com', '64,234', '14,267'] as const;

export const MAX_QUESTION = 600;

export type Intent = 'officials' | 'emergency' | 'injection' | 'empty' | 'too-long';

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
  /\b(emergency|emerhensiya|emergensiya|sunog|fire|ambulance|ambulansya|police|pulis|saklolo|drowning|nalulunod|accident|aksidente|hotline|rescue)\b/i;

/** Classify a question that needs a fixed answer instead of the model's. */
export function screen(question: string): Intent | null {
  const text = question.trim();
  if (!text) return 'empty';
  if (text.length > MAX_QUESTION) return 'too-long';
  if (INJECTION.some((re) => re.test(text))) return 'injection';
  if (EMERGENCY.test(text) && !/\b(budget|spend|spent|fund|funds|pondo|gastos|how much|magkano)\b/i.test(text)) {
    return 'emergency';
  }
  if ((WHO.test(text) && OFFICE.test(text)) || OFFICIAL_NAME.test(text)) return 'officials';
  return null;
}

/** The fixed answers, in the reader's language where it is clearly Filipino. */
export function fixedAnswer(intent: Intent, filipino: boolean): { text: string; url?: string } {
  switch (intent) {
    case 'officials':
      return {
        text: filipino
          ? 'Hindi inilalathala ng Better Calatagan kung sino ang kasalukuyang nanunungkulan. **Ang resulta ng halalan ay hindi patunay kung sino ang nasa puwesto ngayon**, at wala pang pangunahing talaan (COMELEC o DILG) na makukumpirma ito. Nasa pahina ng Pamahalaan ang buong paliwanag at kung saan maaaring magtanong.'
          : 'Better Calatagan does not publish who currently holds office. **An election result is not proof of who is in office today**, and no primary record (COMELEC or DILG) is yet available to confirm it. The Government page explains why, and where to ask instead.',
        url: '/government#officials',
      };
    case 'emergency':
      return {
        text: filipino
          ? 'Kung may emerhensiya, **tumawag sa 911**, ang pambansang emergency hotline ng Pilipinas. Hindi naglalathala ang site na ito ng mga lokal na hotline dahil hindi pa ito makumpirma mula sa kasalukuyang pinagmulan.'
          : 'In an emergency, **call 911**, the Philippines’ national emergency hotline. This site does not publish local hotlines, because it cannot yet confirm them from a current source.',
        url: '/government#contacts',
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

const CONTACT = [
  /[\w.+-]+@[\w-]+\.[\w.]+/, // e-mail address
  /(?:\+?63|\b0)\s?9\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/, // mobile number
  /\(\s?0?\d{2,3}\s?\)\s?\d{3}[\s-]?\d{4}/, // landline with area code
];

export type Verdict = { ok: true; emit: string } | { ok: false; reason: string };

/**
 * Checks streamed text before it reaches the reader.
 *
 * The last two words (and any figure whose scale word may still be arriving,
 * as in "₱237.9 | million") are held back, so a figure or a name is only
 * released once it can be checked whole.
 */
export class OutputGuard {
  private text = '';
  private released = 0;

  constructor(
    private readonly pool: readonly Figure[],
    private readonly canary: string,
  ) {}

  push(delta: string): Verdict {
    this.text = normaliseCitations(this.text + delta);
    const cut = this.boundary();
    if (cut <= this.released) return { ok: true, emit: '' };
    return this.release(cut);
  }

  finish(): Verdict {
    this.text = this.text.trimEnd();
    return this.release(this.text.length, true);
  }

  get output(): string {
    return this.text.slice(0, this.released);
  }

  private release(cut: number, final = false): Verdict {
    const reason = this.violation(cut, final);
    if (reason) return { ok: false, reason };
    const emit = this.text.slice(this.released, cut);
    this.released = cut;
    return { ok: true, emit };
  }

  /** Where it is safe to release up to: before the last two words, and never straight after a number. */
  private boundary(): number {
    const text = this.text;
    let cut = text.length;
    for (let words = 0; words < 2 && cut > 0; words++) {
      const head = text.slice(0, cut);
      const lastSpace = head.search(/\s\S*\s*$/);
      cut = lastSpace < 0 ? 0 : lastSpace;
    }
    while (cut > this.released) {
      const head = text.slice(0, cut);
      const token = /\S*$/.exec(head)?.[0] ?? '';
      if (!/\d/.test(token)) break;
      cut -= token.length;
      cut = head.slice(0, cut).trimEnd().length;
    }
    return cut;
  }

  private violation(cut: number, final: boolean): string | null {
    const head = this.text.slice(0, cut);
    if (this.canary && head.includes(this.canary)) return 'canary';
    if (OFFICIAL_NAME.test(head)) return 'official-name';
    for (const value of WITHHELD_VALUES) if (head.includes(value)) return 'withheld-value';
    if (CONTACT.some((re) => re.test(head))) return 'contact-detail';
    // Figures are read from the whole text so scale words after the cut are seen.
    const bad = unsupported(this.text, this.pool, final ? Infinity : cut);
    if (bad.length) return `unsupported-figure:${bad.map((f) => f.raw).join(',')}`;
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

/** The pool of figures an answer may use: everything in the passages, the conversation and today's date. */
export function figurePool(...texts: string[]): Figure[] {
  return texts.flatMap((t) => figures(t));
}
