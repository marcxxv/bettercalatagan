/**
 * A minimal, dependency-free XLSX reader.
 *
 * We only need cell values from FDP forms, which are small, plainly formatted
 * spreadsheets. Pulling in a full spreadsheet library for that would add a
 * large dependency to audit for no benefit, so this reads the parts we use:
 * the zip container, the shared string table, and each sheet's cell values.
 *
 * Deliberately NOT a general XLSX implementation. It does not evaluate
 * formulas (FDP files are delivered with cached values), and it does not
 * interpret styles beyond recognising date-formatted numbers.
 */
import { inflateRawSync } from 'node:zlib';

/** Reads a zip archive into a map of entry name to decompressed bytes. */
export function readZip(bytes) {
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 66_000; i -= 1) {
    if (bytes.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error('not a zip archive: no end-of-central-directory record');

  const entryCount = bytes.readUInt16LE(eocd + 10);
  let offset = bytes.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let n = 0; n < entryCount; n += 1) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) throw new Error('corrupt central directory');
    const method = bytes.readUInt16LE(offset + 10);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');

    // The local header repeats the name and extra field, with its own lengths.
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = bytes.subarray(dataStart, dataStart + compressedSize);

    if (method === 0) entries.set(name, Buffer.from(raw));
    else if (method === 8) entries.set(name, inflateRawSync(raw));
    else throw new Error(`unsupported compression method ${method} for ${name}`);

    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

const XML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

function decodeXml(text) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (match) => XML_ENTITIES[match]);
}

/** Shared strings table. Each <si> may hold several <t> runs. */
function parseSharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(([, body]) =>
    [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(([, run]) => decodeXml(run)).join(''),
  );
}

/** Maps sheet names to their part path, via the workbook and its rels. */
function sheetIndex(entries) {
  const workbook = entries.get('xl/workbook.xml')?.toString('utf8') ?? '';
  const rels = entries.get('xl/_rels/workbook.xml.rels')?.toString('utf8') ?? '';

  const relTargets = new Map();
  for (const [, id, target] of rels.matchAll(
    /<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g,
  )) {
    relTargets.set(id, target.replace(/^\/?xl\//, '').replace(/^\//, ''));
  }

  const sheets = [];
  for (const [, attrs] of workbook.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const name = decodeXml(attrs.match(/name="([^"]*)"/)?.[1] ?? '');
    const relId = attrs.match(/r:id="([^"]+)"/)?.[1];
    const target = relId ? relTargets.get(relId) : undefined;
    if (name && target) sheets.push({ name, path: `xl/${target}` });
  }
  return sheets;
}

/**
 * Reads one sheet into a Map of cell reference ("A1") to value.
 *
 * Numbers come back as numbers, shared and inline strings as trimmed strings,
 * booleans as booleans. Empty cells are absent rather than null, so callers can
 * distinguish "no cell" from "cell containing zero".
 */
/**
 * Walks `<c>` elements explicitly.
 *
 * A regex cannot do this safely: an attribute pattern like `[^>]*` swallows the
 * slash of a self-closing `<c .../>`, which then consumes every following cell
 * up to the next `</c>`. That silently drops real values, so we scan instead.
 */
function eachCell(xml, visit) {
  let index = 0;
  while (index < xml.length) {
    const start = xml.indexOf('<c ', index);
    if (start === -1) break;

    // Find the end of the open tag, respecting quoted attribute values.
    let cursor = start + 3;
    let inQuote = false;
    while (cursor < xml.length) {
      const char = xml[cursor];
      if (char === '"') inQuote = !inQuote;
      else if (char === '>' && !inQuote) break;
      cursor += 1;
    }
    if (cursor >= xml.length) break;

    const selfClosing = xml[cursor - 1] === '/';
    const attrs = xml.slice(start + 3, selfClosing ? cursor - 1 : cursor);

    if (selfClosing) {
      index = cursor + 1;
      continue;
    }
    const close = xml.indexOf('</c>', cursor);
    if (close === -1) break;
    visit(attrs, xml.slice(cursor + 1, close));
    index = close + 4;
  }
}

function parseSheet(xml, sharedStrings) {
  const cells = new Map();
  eachCell(xml, (attrs, body) => {
    const ref = attrs.match(/r="([A-Z]+\d+)"/)?.[1];
    if (!ref) return;
    const type = attrs.match(/t="([^"]+)"/)?.[1];

    if (type === 'inlineStr') {
      const text = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
        .map(([, run]) => decodeXml(run))
        .join('')
        .trim();
      if (text) cells.set(ref, text);
      return;
    }

    const rawValue = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1];
    if (rawValue === undefined) return;

    if (type === 's') {
      const text = (sharedStrings[Number(rawValue)] ?? '').trim();
      if (text) cells.set(ref, text);
    } else if (type === 'b') {
      cells.set(ref, rawValue === '1');
    } else if (type === 'str' || type === 'e') {
      const text = decodeXml(rawValue).trim();
      if (text) cells.set(ref, text);
    } else {
      const numeric = Number(rawValue);
      if (!Number.isNaN(numeric)) cells.set(ref, numeric);
    }
  });
  return cells;
}

/** Reads a whole workbook: `{ sheets: [{ name, cells }] }`. */
export function readWorkbook(bytes) {
  const entries = readZip(bytes);
  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml')?.toString('utf8'));
  const sheets = sheetIndex(entries).map(({ name, path }) => {
    const xml = entries.get(path)?.toString('utf8');
    return { name, cells: xml ? parseSheet(xml, sharedStrings) : new Map() };
  });
  return { sheets };
}

/** Splits "B12" into `{ column: 'B', row: 12 }`. */
export function splitRef(ref) {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) throw new Error(`bad cell reference: ${ref}`);
  return { column: match[1], row: Number(match[2]) };
}
