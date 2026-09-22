import type { APIRoute } from 'astro';
import { fdpDataset, fdpSource } from '../../data/fdp';
import { envelope } from '../../lib/export';

/** The DILG Full Disclosure Policy filing index. Documents, not figures. */
export const GET: APIRoute = () =>
  envelope({
    dataset: 'fdp-filings',
    data: fdpDataset.records,
    sources: fdpSource,
    notes: [
      'This is a document index. No financial figures are extracted here — see /data/financials.json.',
      '`id` is a local canonical identifier derived from form type and document period. It is stable across resubmissions.',
      '`fdppId` is the DILG portal identifier for the uploaded file. The portal reassigns it when an LGU resubmits, so it must not be used as a permanent key.',
      '`contentSha256` fingerprints the spreadsheet’s CONTENT, not the delivered bytes: the portal regenerates each file per request and stamps the clock into the archive.',
      'Filings with `availability` of "source-error" exist, but the DILG download endpoint was failing when last checked. Their metadata is retained.',
      'A filing is never deleted from this dataset by a failed fetch; it is marked "missing-from-source" instead.',
    ],
  });
