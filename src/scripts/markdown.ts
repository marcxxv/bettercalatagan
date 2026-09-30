/**
 * A small, safe Markdown renderer for the assistant's answers.
 *
 * It understands only what the assistant is told to write — paragraphs,
 * bullet and numbered lists, simple tables, bold, italics, short headings and
 * citation markers — and escapes everything else. Links are allowed only to
 * this site or to https addresses; raw HTML is never passed through.
 */

export interface CitationTarget {
  n: number;
  url: string;
  label: string;
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const safeHref = (href: string) => /^(\/(?!\/)|https:\/\/)/.test(href);

function inline(text: string, cite: (n: number) => CitationTarget | undefined): string {
  let out = escape(text);
  // Links: [label](href), only to safe targets. Checked on the escaped text, so quotes cannot break out.
  out = out.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (whole, label: string, href: string) => {
    const raw = href.replace(/&amp;/g, '&');
    return safeHref(raw) ? `<a href="${href}">${label}</a>` : label;
  });
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
  out = out.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
  // Citations: [3] → a numbered link to the passage's page; unknown numbers are dropped.
  out = out.replace(/\s?\[(\d{1,2})\]/g, (_, n: string) => {
    const target = cite(Number(n));
    return target
      ? `<a class="cite" href="${escape(target.url)}" title="${escape(target.label)}" aria-label="Source ${target.n}: ${escape(target.label)}">${target.n}</a>`
      : '';
  });
  return out;
}

const TABLE_RULE = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;
const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

/** Render Markdown to HTML. `cite` resolves a citation number to its source, if there is one. */
export function renderMarkdown(source: string, cite: (n: number) => CitationTarget | undefined = () => undefined): string {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = /^\s{0,3}(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length <= 3 ? 3 : 4;
      html.push(`<h${level}>${inline(heading[2].replace(/#+\s*$/, ''), cite)}</h${level}>`);
      i += 1;
      continue;
    }

    // Table: a header row, a rule row, then body rows.
    if (line.includes('|') && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1].trim())) {
      const head = cells(line);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) body.push(cells(lines[i++]));
      html.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c, cite)}</th>`).join('')}</tr></thead><tbody>${body
          .map((r) => `<tr>${head.map((_, j) => `<td>${inline(r[j] ?? '', cite)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
      );
      continue;
    }

    const bullet = /^\s*[-*•]\s+(.*)$/;
    const numbered = /^\s*\d{1,3}[.)]\s+(.*)$/;
    const listType = bullet.test(line) ? 'ul' : numbered.test(line) ? 'ol' : null;
    if (listType) {
      const pattern = listType === 'ul' ? bullet : numbered;
      const items: string[] = [];
      while (i < lines.length) {
        const match = pattern.exec(lines[i]);
        if (match) items.push(match[1]);
        else if (lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && items.length) items[items.length - 1] += ` ${lines[i].trim()}`;
        else if (!lines[i].trim() && pattern.test(lines[i + 1] ?? '')) {
          i += 1;
          continue;
        } else break;
        i += 1;
      }
      html.push(`<${listType}>${items.map((item) => `<li>${inline(item, cite)}</li>`).join('')}</${listType}>`);
      continue;
    }

    // Paragraph: consecutive lines that start nothing else.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s{0,3}#{1,6}\s/.test(lines[i]) &&
      !bullet.test(lines[i]) &&
      !numbered.test(lines[i]) &&
      !(lines[i].includes('|') && TABLE_RULE.test((lines[i + 1] ?? '').trim()))
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    html.push(`<p>${inline(para.join(' '), cite)}</p>`);
  }
  return html.join('');
}

/** Plain text for copying: markers renumbered as the reader sees them, with their pages as footnotes. */
export function plainText(
  source: string,
  cite: (n: number) => CitationTarget | undefined,
  origin: string,
): string {
  const used = new Map<number, CitationTarget>();
  const body = source
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s?\[(\d{1,2})\]/g, (_, n: string) => {
      const target = cite(Number(n));
      if (!target) return '';
      used.set(target.n, target);
      return ` [${target.n}]`;
    })
    .trim();
  const notes = [...used.values()]
    .sort((a, b) => a.n - b.n)
    .map((t) => `[${t.n}] ${t.label}: ${new URL(t.url, origin).toString()}`);
  return notes.length ? `${body}\n\n${notes.join('\n')}` : body;
}
