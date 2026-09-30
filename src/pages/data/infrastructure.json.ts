import type { APIRoute } from 'astro';
import { dpwh, infrastructureSource } from '../../data/infrastructure';
import { envelope } from '../../lib/export';

/** DPWH contracts in and near Calatagan, with where each is placed. */
export const GET: APIRoute = () =>
  envelope({
    dataset: 'dpwh-projects',
    data: dpwh.projects,
    sources: infrastructureSource,
    notes: [
      '`scope` says where the contract’s own description places the work: "calatagan" (counted), "road" (the Nasugbu–Lian–Calatagan national road with no municipality stated) or "shared" (one contract across municipalities). Only "calatagan" is counted in totals on the site.',
      '`budget` is DPWH’s contract budget; `abc` the approved budget for the contract. Neither is audited spending.',
      '`barangays` are PSGC codes read from the description; an empty list means no barangay is named.',
      'These are national government projects implemented by DPWH, not municipal projects.',
    ],
  });
