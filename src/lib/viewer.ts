/**
 * Links for the in-site document reader (components/DocViewer.astro).
 *
 * The reader fetches files through same-origin paths that the host rewrites
 * to the original source (vercel.json; the dev server proxies the same
 * paths). Nothing is stored on this site: the bytes come straight from the
 * Internet Archive or the DILG portal on each read.
 */

/** File types the reader can render. Legacy .doc cannot be drawn in a browser. */
export type ReadableType = 'pdf' | 'xlsx' | 'docx';

export const isReadable = (fileType: string): fileType is ReadableType =>
  fileType === 'pdf' || fileType === 'xlsx' || fileType === 'docx';

/**
 * The raw-bytes path for a Wayback capture: `id_` asks the Archive for the
 * file exactly as captured, without its toolbar or rewritten links.
 */
export function readerSrc(archiveUrl: string): string | null {
  const match = archiveUrl.match(/^https:\/\/web\.archive\.org\/web\/(\d{14})\/(.+)$/);
  return match ? `/wayback/${match[1]}id_/${match[2]}` : null;
}

/** The same-origin path for a DILG Full Disclosure Policy Portal filing. */
export const fdpSrc = (fdppId: number): string => `/fdp-file/${fdppId}`;

interface ReadOptions {
  /** Same-origin path the reader fetches. */
  src: string;
  type: ReadableType;
  title: string;
  /** One line under the title: publisher, period, size. */
  meta?: string;
  /** The original source page, offered as the fallback and "open original". */
  original: string;
  /** Stable id for a shareable ?read= link. */
  id: string;
  filename?: string;
  /** Who serves the bytes, for loading and error copy. */
  source: 'the Internet Archive' | 'the DILG portal';
}

/** Data attributes that turn any link into a reader trigger. */
export function readAttrs(o: ReadOptions): Record<string, string> {
  return {
    'data-read': o.src,
    'data-type': o.type,
    'data-title': o.title,
    'data-meta': o.meta ?? '',
    'data-original': o.original,
    'data-id': o.id,
    'data-filename': o.filename ?? '',
    'data-source': o.source,
  };
}

const sizeLabel = (bytes: number | null | undefined) => {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Reader attributes for a document from the former municipal website, or null if it cannot be drawn. */
export function archiveReadAttrs(doc: {
  id: string;
  archiveUrl: string;
  fileType: string;
  title: string;
  filename: string;
  publishedYear: number | null;
  byteLength: number | null;
}): Record<string, string> | null {
  const src = readerSrc(doc.archiveUrl);
  if (!src || !isReadable(doc.fileType)) return null;
  return readAttrs({
    src,
    type: doc.fileType,
    title: doc.title,
    meta: ['Former municipal website', doc.publishedYear, doc.fileType.toUpperCase(), sizeLabel(doc.byteLength)]
      .filter(Boolean)
      .join(' · '),
    original: doc.archiveUrl,
    id: doc.id,
    filename: doc.filename,
    source: 'the Internet Archive',
  });
}

/** Reader attributes for a DILG Full Disclosure Policy Portal filing, or null if it is not retrievable. */
export function fdpReadAttrs(
  filing: {
    id: string;
    fdppId: number;
    fileType: string | null;
    formLabel: string;
    downloadUrl: string;
    byteLength?: number | null;
    availability: string;
  },
  period: string,
): Record<string, string> | null {
  if (filing.availability !== 'available' || !filing.fileType || !isReadable(filing.fileType)) return null;
  return readAttrs({
    src: fdpSrc(filing.fdppId),
    type: filing.fileType,
    title: `${filing.formLabel}, ${period}`,
    meta: ['DILG Full Disclosure Policy Portal', filing.fileType.toUpperCase(), sizeLabel(filing.byteLength)]
      .filter(Boolean)
      .join(' · '),
    original: filing.downloadUrl,
    id: filing.id,
    filename: `calatagan-${filing.id.replace(/^fdp-/, '')}.${filing.fileType}`,
    source: 'the DILG portal',
  });
}
