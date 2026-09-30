/**
 * Renders Office Open XML files (XLSX, DOCX) as HTML for the document reader.
 *
 * Both formats are zip archives of XML. fflate unzips them; the browser's own
 * DOMParser reads the XML. This covers what the files on this site use —
 * the DILG filings (spreadsheets with merged headers and peso figures) and
 * archived municipal forms — without shipping a full office suite.
 *
 * Everything is built with DOM APIs and textContent, never innerHTML, so text
 * inside a file cannot inject markup into the page.
 */
import { unzipSync } from 'fflate';

type Files = Record<string, Uint8Array>;

const decoder = new TextDecoder();

function unzip(bytes: Uint8Array): Files {
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('Not an Office Open XML file');
  return unzipSync(bytes);
}

function xml(files: Files, path: string): Document | null {
  const file = files[path];
  if (!file) return null;
  return new DOMParser().parseFromString(decoder.decode(file), 'application/xml');
}

/** Elements by local name, whatever namespace prefix the producer chose. */
const all = (root: Document | Element, name: string) => Array.from(root.getElementsByTagNameNS('*', name));
const first = (root: Document | Element, name: string) => root.getElementsByTagNameNS('*', name)[0] ?? null;
const kids = (el: Element, name?: string) => Array.from(el.children).filter((c) => !name || c.localName === name);
/** An attribute by local name (w:val, r:id, …). */
function attr(el: Element | null, name: string): string | null {
  if (!el) return null;
  for (const a of Array.from(el.attributes)) if (a.localName === name) return a.value;
  return null;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function rels(files: Files, path: string): Map<string, string> {
  const doc = xml(files, path);
  const map = new Map<string, string>();
  if (doc) for (const r of all(doc, 'Relationship')) map.set(attr(r, 'Id') ?? '', attr(r, 'Target') ?? '');
  return map;
}

function resolvePath(base: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/').slice(0, -1);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

/* ------------------------------------------------------------------ XLSX */

export interface Sheet {
  name: string;
  render: () => HTMLElement;
}

interface CellStyle {
  fmt: string;
  bold: boolean;
  italic: boolean;
  align: string | null;
  wrap: boolean;
}

const BUILTIN_FORMATS: Record<number, string> = {
  0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 9: '0%', 10: '0.00%',
  11: '0.00E+00', 14: 'mm-dd-yy', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 22: 'm/d/yy h:mm',
  37: '#,##0 ;(#,##0)', 38: '#,##0 ;[Red](#,##0)', 39: '#,##0.00;(#,##0.00)', 40: '#,##0.00;[Red](#,##0.00)',
  41: '#,##0', 42: '#,##0', 43: '#,##0.00', 44: '#,##0.00', 49: '@',
};

function readStyles(files: Files): CellStyle[] {
  const doc = xml(files, 'xl/styles.xml');
  if (!doc) return [];
  const custom = new Map<number, string>();
  for (const f of all(doc, 'numFmt')) custom.set(Number(attr(f, 'numFmtId')), attr(f, 'formatCode') ?? 'General');
  const fontsEl = first(doc, 'fonts');
  const fonts = fontsEl
    ? kids(fontsEl, 'font').map((f) => ({ bold: !!kids(f, 'b').length, italic: !!kids(f, 'i').length }))
    : [];
  const xfsEl = first(doc, 'cellXfs');
  if (!xfsEl) return [];
  return kids(xfsEl, 'xf').map((xf) => {
    const id = Number(attr(xf, 'numFmtId') ?? 0);
    const font = fonts[Number(attr(xf, 'fontId') ?? 0)];
    const alignment = kids(xf, 'alignment')[0] ?? null;
    return {
      fmt: custom.get(id) ?? BUILTIN_FORMATS[id] ?? 'General',
      bold: font?.bold ?? false,
      italic: font?.italic ?? false,
      align: attr(alignment, 'horizontal'),
      wrap: attr(alignment, 'wrapText') === '1',
    };
  });
}

function sharedStrings(files: Files): string[] {
  const doc = xml(files, 'xl/sharedStrings.xml');
  if (!doc) return [];
  return all(doc, 'si').map((si) =>
    all(si, 't')
      .filter((t) => t.parentElement?.localName !== 'rPh') // skip phonetic hints
      .map((t) => t.textContent ?? '')
      .join(''),
  );
}

const isDateFormat = (fmt: string) => {
  const bare = fmt.replace(/"[^"]*"|\[[^\]]*\]|\\./g, '');
  return /[dy]/i.test(bare) || /m{3,}/i.test(bare) || /h+:mm/i.test(bare);
};

/** Formats a number the way the cell's number format asks, near enough to read. */
export function formatCell(value: number, fmt: string): string {
  if (!fmt || fmt === 'General' || fmt === '@') {
    return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
  }
  if (isDateFormat(fmt)) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  const sections = fmt.split(';');
  const section = (value < 0 && sections[1]) || sections[0];
  const bare = section.replace(/"[^"]*"|\[[^\]]*\]|\\.|_.|\*./g, '');
  const percent = bare.includes('%');
  const n = Math.abs(percent ? value * 100 : value);
  const decimals = (bare.split('.')[1]?.match(/[0#]/g) ?? []).length;
  const grouped = bare.includes(',');
  let text = n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  });
  if (/^[#,]*$/.test(bare.split('.')[0] ?? '') && text === '0' && !bare.includes('0')) text = '';
  if (percent) text += '%';
  if (value < 0) text = sections[1] && section.includes('(') ? `(${text})` : `-${text}`;
  return text;
}

const colIndex = (letters: string) => [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const colName = (index: number) => {
  let name = '';
  for (let n = index; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
};
function ref(a1: string) {
  const m = a1.match(/^([A-Z]+)(\d+)$/);
  return m ? { col: colIndex(m[1]), row: Number(m[2]) } : null;
}

/** Hard ceiling so a stray formatted cell at XFD1048576 cannot freeze a phone. */
const MAX_ROWS = 3000;
const MAX_COLS = 80;

function renderSheet(doc: Document, strings: string[], styles: CellStyle[]): HTMLElement {
  interface Cell { text: string; numeric: boolean; style?: CellStyle }
  const grid = new Map<number, Map<number, Cell>>();
  const hiddenRows = new Set<number>();
  const rowHeights = new Map<number, number>();
  let maxRow = 0;
  let maxCol = 0;

  for (const row of all(doc, 'row')) {
    const r = Number(attr(row, 'r'));
    if (!r || r > MAX_ROWS) continue;
    if (attr(row, 'hidden') === '1') hiddenRows.add(r);
    const ht = Number(attr(row, 'ht'));
    if (ht && attr(row, 'customHeight') === '1') rowHeights.set(r, ht);
    let nextCol = 1;
    for (const c of kids(row, 'c')) {
      const pos = ref(attr(c, 'r') ?? '') ?? { row: r, col: nextCol };
      nextCol = pos.col + 1;
      if (pos.col > MAX_COLS) continue;
      const type = attr(c, 't');
      const style = styles[Number(attr(c, 's') ?? 0)];
      const v = kids(c, 'v')[0]?.textContent ?? null;
      let text = '';
      let numeric = false;
      if (type === 's' && v !== null) text = strings[Number(v)] ?? '';
      else if (type === 'inlineStr') text = all(c, 't').map((t) => t.textContent).join('');
      else if (type === 'b') text = v === '1' ? 'TRUE' : 'FALSE';
      else if (type === 'str' || type === 'e') text = v ?? '';
      else if (v !== null && v !== '') {
        const n = Number(v);
        numeric = Number.isFinite(n);
        text = numeric ? formatCell(n, style?.fmt ?? 'General') : v;
      }
      if (!text && !style?.bold) continue;
      if (!grid.has(pos.row)) grid.set(pos.row, new Map());
      grid.get(pos.row)!.set(pos.col, { text, numeric, style });
      if (text) {
        maxRow = Math.max(maxRow, pos.row);
        maxCol = Math.max(maxCol, pos.col);
      }
    }
  }

  // Merged ranges: the top-left cell spans, the rest are skipped.
  const spans = new Map<string, { rows: number; cols: number }>();
  const covered = new Set<string>();
  for (const m of all(doc, 'mergeCell')) {
    const [a, b] = (attr(m, 'ref') ?? '').split(':');
    const s = ref(a ?? '');
    const e = ref(b ?? '');
    if (!s || !e) continue;
    spans.set(`${s.row}:${s.col}`, { rows: e.row - s.row + 1, cols: e.col - s.col + 1 });
    for (let r = s.row; r <= e.row; r++)
      for (let c = s.col; c <= e.col; c++) if (r !== s.row || c !== s.col) covered.add(`${r}:${c}`);
  }

  const widths = new Map<number, number>();
  const hiddenCols = new Set<number>();
  for (const col of all(doc, 'col')) {
    const min = Number(attr(col, 'min'));
    const max = Math.min(Number(attr(col, 'max')), MAX_COLS);
    for (let i = min; i <= max; i++) {
      if (attr(col, 'hidden') === '1') hiddenCols.add(i);
      const w = Number(attr(col, 'width'));
      if (w) widths.set(i, w);
    }
  }

  const wrap = el('div', 'xl-wrap');
  if (!maxRow) {
    wrap.append(el('p', 'xl-empty', 'This sheet is empty.'));
    return wrap;
  }

  const table = el('table', 'xl');
  const colgroup = el('colgroup');
  colgroup.append(el('col', 'xl-rh'));
  for (let c = 1; c <= maxCol; c++) {
    if (hiddenCols.has(c)) continue;
    const col = el('col');
    col.style.width = `${Math.round(Math.min(widths.get(c) ?? 9, 80) * 7 + 10)}px`;
    colgroup.append(col);
  }
  table.append(colgroup);

  const head = el('thead');
  const hr = el('tr');
  const corner = el('th', 'xl-corner');
  corner.append(el('span', 'visually-hidden', 'Row'));
  hr.append(corner);
  for (let c = 1; c <= maxCol; c++) if (!hiddenCols.has(c)) hr.append(el('th', undefined, colName(c)));
  head.append(hr);
  table.append(head);

  const body = el('tbody');
  for (let r = 1; r <= maxRow; r++) {
    if (hiddenRows.has(r)) continue;
    const tr = el('tr');
    const height = rowHeights.get(r);
    if (height) tr.style.height = `${Math.round(height * 1.33)}px`;
    tr.append(el('th', undefined, String(r)));
    const row = grid.get(r);
    for (let c = 1; c <= maxCol; c++) {
      if (hiddenCols.has(c) || covered.has(`${r}:${c}`)) continue;
      const cell = row?.get(c);
      const td = el('td', undefined, cell?.text ?? '');
      const span = spans.get(`${r}:${c}`);
      if (span) {
        if (span.rows > 1) td.rowSpan = Math.min(span.rows, maxRow - r + 1);
        if (span.cols > 1) td.colSpan = Math.min(span.cols, maxCol - c + 1);
      }
      if (cell) {
        const s = cell.style;
        if (cell.numeric) td.classList.add('n');
        if (s?.bold) td.classList.add('b');
        if (s?.italic) td.classList.add('i');
        if (s?.wrap || span) td.classList.add('w');
        if (s?.align && s.align !== 'general') td.dataset.align = s.align;
      }
      tr.append(td);
    }
    body.append(tr);
  }
  table.append(body);
  wrap.append(table);
  return wrap;
}

export function readXlsx(bytes: Uint8Array): Sheet[] {
  const files = unzip(bytes);
  const workbook = xml(files, 'xl/workbook.xml');
  if (!workbook) throw new Error('No workbook in this file');
  const links = rels(files, 'xl/_rels/workbook.xml.rels');
  const strings = sharedStrings(files);
  const styles = readStyles(files);
  return all(workbook, 'sheet')
    .filter((s) => (attr(s, 'state') ?? 'visible') === 'visible')
    .map((s) => {
      const path = resolvePath('xl/workbook.xml', links.get(attr(s, 'id') ?? '') ?? '');
      return {
        name: attr(s, 'name') ?? 'Sheet',
        render: () => {
          const doc = xml(files, path);
          return doc ? renderSheet(doc, strings, styles) : el('p', 'xl-empty', 'This sheet could not be read.');
        },
      };
    });
}

/* ------------------------------------------------------------------ DOCX */

const HEADING = /^(heading|title|subtitle)\s*(\d)?$/i;

export function readDocx(bytes: Uint8Array): HTMLElement {
  const files = unzip(bytes);
  const doc = xml(files, 'word/document.xml');
  const body = doc && first(doc, 'body');
  if (!body) throw new Error('No document body in this file');
  const links = rels(files, 'word/_rels/document.xml.rels');
  const styleNames = new Map<string, string>();
  const stylesDoc = xml(files, 'word/styles.xml');
  if (stylesDoc)
    for (const s of all(stylesDoc, 'style')) styleNames.set(attr(s, 'styleId') ?? '', attr(first(s, 'name'), 'val') ?? '');

  const imageUrl = (rid: string | null) => {
    const target = rid && links.get(rid);
    const data = target && files[resolvePath('word/document.xml', target)];
    if (!data) return null;
    const ext = target.split('.').pop()?.toLowerCase();
    const type = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
    if (!/^(png|gif|jpe?g|svg)$/.test(ext ?? '')) return null;
    return URL.createObjectURL(new Blob([data.slice().buffer as ArrayBuffer], { type }));
  };

  function runs(p: Element, into: HTMLElement) {
    for (const node of Array.from(p.children)) {
      if (node.localName === 'hyperlink' || node.localName === 'ins' || node.localName === 'smartTag' || node.localName === 'sdtContent') {
        runs(node, into);
        continue;
      }
      if (node.localName === 'sdt') {
        const content = first(node, 'sdtContent');
        if (content) runs(content, into);
        continue;
      }
      if (node.localName !== 'r') continue;
      const rPr = kids(node, 'rPr')[0];
      const on = (name: string) => {
        const flag = rPr && kids(rPr, name)[0];
        return !!flag && attr(flag, 'val') !== '0' && attr(flag, 'val') !== 'false';
      };
      let target: HTMLElement = into;
      if (on('b')) target = target.appendChild(el('strong'));
      if (on('i')) target = target.appendChild(el('em'));
      const u = rPr && kids(rPr, 'u')[0];
      if (u && attr(u, 'val') !== 'none') target = target.appendChild(el('u'));
      for (const part of Array.from(node.children)) {
        if (part.localName === 't') target.append(part.textContent ?? '');
        else if (part.localName === 'tab') target.append(' ');
        else if (part.localName === 'br' || part.localName === 'cr') target.append(el('br'));
        else if (part.localName === 'drawing' || part.localName === 'pict') {
          const blip = first(part, 'blip') ?? first(part, 'imagedata');
          const src = imageUrl(attr(blip, 'embed') ?? attr(blip, 'id'));
          if (src) {
            const img = el('img');
            img.src = src;
            img.alt = attr(first(part, 'docPr'), 'descr') ?? '';
            img.loading = 'lazy';
            const extent = first(part, 'extent');
            const cx = Number(attr(extent, 'cx'));
            if (cx) img.style.width = `${Math.round(cx / 9525)}px`;
            target.append(img);
          }
        }
      }
    }
  }

  function paragraph(p: Element): HTMLElement {
    const pPr = kids(p, 'pPr')[0];
    const styleId = attr(pPr && kids(pPr, 'pStyle')[0], 'val') ?? '';
    const styleName = styleNames.get(styleId) ?? styleId;
    const heading = styleName.match(HEADING);
    const listed = !!(pPr && kids(pPr, 'numPr').length) || /^list (bullet|number|paragraph)/i.test(styleName);
    let node: HTMLElement;
    if (heading) {
      const level = heading[1].toLowerCase() === 'title' ? 1 : heading[1].toLowerCase() === 'subtitle' ? 2 : Math.min(Number(heading[2] ?? 2) + 1, 6);
      node = el(`h${level}` as 'h2');
    } else node = el('p');
    if (listed) node.classList.add('li');
    const jc = attr(pPr && kids(pPr, 'jc')[0], 'val');
    if (jc === 'center' || jc === 'right' || jc === 'both') node.dataset.align = jc === 'both' ? 'justify' : jc;
    runs(p, node);
    if (!node.textContent?.trim() && !node.querySelector('img')) node.classList.add('blank');
    return node;
  }

  function table(tbl: Element): HTMLElement {
    const table = el('table', 'dx-table');
    for (const tr of kids(tbl, 'tr')) {
      const row = el('tr');
      for (const tc of kids(tr, 'tc')) {
        const tcPr = kids(tc, 'tcPr')[0];
        const vMerge = tcPr && kids(tcPr, 'vMerge')[0];
        if (vMerge && attr(vMerge, 'val') !== 'restart') {
          // Continuation of a vertical merge: keep the grid, leave it blank.
          row.append(el('td', 'cont'));
          continue;
        }
        const td = el('td');
        const span = Number(attr(tcPr && kids(tcPr, 'gridSpan')[0], 'val'));
        if (span > 1) td.colSpan = span;
        block(tc, td);
        row.append(td);
      }
      table.append(row);
    }
    const wrap = el('div', 'dx-table-wrap');
    wrap.append(table);
    return wrap;
  }

  function block(container: Element, into: HTMLElement) {
    for (const child of Array.from(container.children)) {
      if (child.localName === 'p') into.append(paragraph(child));
      else if (child.localName === 'tbl') into.append(table(child));
      else if (child.localName === 'sdt') {
        const content = first(child, 'sdtContent');
        if (content) block(content, into);
      }
    }
  }

  const page = el('article', 'dx-page');
  block(body, page);
  return page;
}
