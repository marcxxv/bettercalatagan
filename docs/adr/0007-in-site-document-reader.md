# 0007 — In-site document reader over pass-through rewrites

**Status:** Accepted · 2026-09-30

## Context

The site indexes 232 files from the former municipal website (227 PDF, 1 DOCX, 4 legacy DOC),
all preserved by the Internet Archive, and 156 DILG Full Disclosure Policy Portal filings (XLSX).
Every one used to be a link out: a reader had to leave the site, and on a phone usually had to
download a file and find an app that opens it.

Reading them in place needs the bytes in the browser. Neither origin allows that across sites:
the Archive sends no CORS headers for raw captures, and the DILG portal sends none and also omits
an intermediate TLS certificate.

## Decision

**Read in place; keep download as the secondary action.** A reader dialog
(`src/components/DocViewer.astro`, `src/scripts/viewer.ts`) opens any link that carries the
attributes from `readAttrs()` in `src/lib/viewer.ts`:

- **PDF** through PDF.js (`pdfjs-dist`, its *legacy* build for browser coverage), drawn page by
  page as it scrolls into view, with a text layer so text can be selected and found.
- **XLSX and DOCX** through `src/scripts/office.ts`: `fflate` unzips, `DOMParser` reads the XML,
  and the DOM is built with `textContent` only. Spreadsheets keep sheet tabs, merged cells, column
  widths, bold and the file's own number formats; Word files keep headings, lists, tables and
  images.
- **Legacy `.doc`** (binary Word 97) cannot be drawn in a browser without a large converter; those
  four keep a "Get file" link.

Renderers load only on first open; the reader adds ~9 KB to a page.

**Same-origin pass-through rewrites, not a backend.** `vercel.json` rewrites
`/wayback/:path*` to `https://web.archive.org/web/:path*` and `/fdp-file/:id` to the DILG
download URL. The Vite dev and preview servers mirror both (`astro.config.mjs`), supplying the
DILG intermediate certificate from `certs/` rather than disabling verification. No code runs on
the server, nothing is stored, and each read is the source's own bytes: this is configuration on
the host, consistent with [0002](0002-static-astro-no-backend.md).

Every trigger is a real link to the original, so without JavaScript, or on a modified click
(new tab), the reader never intercepts it.

## Consequences

- The site depends on the host supporting external rewrites (Vercel does). Another host needs an
  equivalent, or the reader falls back to its error state, which links to the original.
- If the DILG portal's broken certificate chain defeats the host's proxy, FDP filings fail to open
  in place; the error state offers the direct DILG link, and download still works from there.
- The reader shows sources unaltered. It is not a mirror: if the Archive or DILG removes a file,
  it stops opening here too, which is the honest outcome for a provenance-first site
  ([0001](0001-provenance-first-civic-data.md)).
