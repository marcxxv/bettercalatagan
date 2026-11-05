# 0015 — Archived document text for the assistant, and asking beside the reader

**Status:** Accepted · 2026-11-05 · Amends [0008](0008-grounded-assistant.md).

## Context

Readers open archived municipal PDFs in the reader and want to ask about what a document
says. The assistant's knowledge (ADR 0008) was the built pages plus one passage per archived
document describing its title, date and file: it could say what a document *is*, never what
it *says*. Sending the open PDF's text from the browser was rejected: the guard checks
figures only against published passages (ADR 0013), and client-supplied text is neither
published nor trustworthy.

## Decision

- **A pipeline extracts the text layer** of eligible archived PDFs
  (`scripts/document-text.mjs`, `npm run documents:text`) into
  `src/data/generated/document-text.json`. Nothing is reworded. Scanned pages without a text
  layer are recorded as such; `scripts/document-ocr.mjs` then reads them with a vision model on the
  NYO API (amended 2026-11-05), marked `method: "ocr"` and labelled as machine-read in every passage.
- **Withheld means withheld.** A page containing a withheld value, an unverified official's
  surname, a telephone number or an e-mail address is dropped whole; the count is recorded.
  The lists live in `scripts/lib/withheld.mjs` and a test keeps them equal to the guard's.
  Personnel files and unclassified documents are not extracted (they can name private
  individuals).
- **The text becomes published passages** in `/ask/corpus.json` — one per page, split when
  long — deep-linked as `/documents?read=<id>#page=<n>`. The guard therefore works unchanged:
  figures must still round from cited, published passages. Related documents are found by the
  same hybrid retrieval as everything else.
- **Reader focus** (`worker/src/retrieve.ts` `focus`): with `?read=<id>`, the open document's
  best-matching pages (or its opening pages) come first.
- **Whole-document questions** (`WHOLE_DOCUMENT` in `retrieve.ts`: summarise, explain, what is this,
  layman, like a child, *buod*, *ipaliwanag*…) take the document's pages in order within about 28,000
  characters, sampled evenly when longer (`spread`). Explanations may use general knowledge of terms and
  processes, never of Calatagan facts or figures.
- **Interface:** the reader's "Ask about this document" docks the one site conversation in a
  sidebar beside the document (a bottom sheet on narrow screens); suggestions follow the document's kind (`data-kind`); hiding it keeps the
  conversation, and closing the reader returns it to its panel. A citation of the open
  document turns the reader to that page.

## Consequences

- `/ask/corpus.json` grows by the extracted text; the Worker re-indexes it over several runs
  (at most 320 passages a run).
- Answers can quote historical documents, including the 2022 charters' fees and processing times that
  the pages themselves deliberately do not restate. Every document passage says it is a dated historical
  record whose fees, requirements and times may have changed, and to confirm with the office.
- A document whose pages were all withheld or scanned can only be described, not quoted.
