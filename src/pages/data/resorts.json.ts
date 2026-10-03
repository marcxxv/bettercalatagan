import type { APIRoute } from 'astro';
import { directoryIssues, resorts } from '../../data/resorts';
import { API_VERSION, LICENSE } from '../../lib/export';

export const GET: APIRoute = () => {
  const today = new Date().toISOString().slice(0, 10) as `${number}-${number}-${number}`;
  const issues = directoryIssues(resorts, today);
  if (issues.length) throw new Error(`Resort directory evidence check failed:\n${issues.join('\n')}`);

  const body = {
    data: { resorts },
    meta: {
      api_version: API_VERSION,
      dataset: 'resort-channels',
      last_reviewed: resorts.map((entry) => entry.lastReviewed).sort().at(-1),
      evidence_model: 'tourism channels — separate from civic-data verification tiers',
      disclaimer: 'A dated directory of resort-published links, not a booking guarantee or a live accreditation check. Confirm a reservation and payment details independently. Absence from this directory is not evidence of fraud.',
      license: LICENSE,
    },
  };
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
    },
  });
};
