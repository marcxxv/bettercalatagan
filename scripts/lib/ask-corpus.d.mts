export interface Passage {
  url: string;
  page: string;
  section: string;
  text: string;
  /** Search terms that help retrieval; never shown to the model. */
  keywords?: string;
}
export interface Corpus {
  version: string;
  generatedAt: string;
  site: string;
  count: number;
  chunks: (Passage & { id: string; hash: string })[];
}
export function pagePassages(html: string, path: string): Passage[];
export function indexPassages(
  entries: { t: string; g: string; u: string; d?: string; a?: string; s?: string; k?: string }[],
): Passage[];
export function finalise(passages: Passage[], meta: { site: string; generatedAt: string }): Corpus;
export function buildCorpus(distDir: string, options: { site: string }): Promise<Corpus>;
export default function askCorpus(): import('astro').AstroIntegration;
