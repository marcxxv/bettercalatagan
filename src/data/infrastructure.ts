/**
 * National infrastructure projects in Calatagan, from DPWH's own contract
 * records.
 *
 * The pipeline (`scripts/dpwh.mjs`) reads available contract records through BetterGov.ph's open mirror of that publication and keeps
 * a contract only when its own description places the work in Calatagan,
 * Batangas. Work on the Nasugbu–Lian–Calatagan national road whose description
 * gives kilometre posts but no municipality is kept apart, and so is the odd
 * package that bundles Calatagan with another town: neither is counted in
 * Calatagan's totals, because neither can honestly be attributed to it.
 *
 * Tier 2: DPWH is the author of every value, but this project reads it through
 * a civic-tech mirror rather than DPWH's own site, and the location rule is
 * ours. The caveat says both.
 */
import raw from './generated/dpwh-projects.json' with { type: 'json' };
import { dpwhDatasetSchema, type DpwhProject } from './schemas/dpwh.js';
import { DPWH_BETTERGOV_API, DPWH_TRANSPARENCY_BETTERGOV } from './sources.js';
import type { DataSource } from './types/provenance.js';

export const dpwh = dpwhDatasetSchema.parse(raw);
export type { DpwhProject };

const retrieved = dpwh.retrievedAt.slice(0, 10) as `${number}-${number}-${number}`;

export const inCalatagan = dpwh.projects.filter((p) => p.scope === 'calatagan');
export const onNationalRoad = dpwh.projects.filter((p) => p.scope === 'road');
export const sharedPackages = dpwh.projects.filter((p) => p.scope === 'shared');

const years = inCalatagan.map((p) => p.infraYear).filter((y): y is number => y !== null);

export const infrastructureSource: DataSource = {
  sources: [
    { ...DPWH_BETTERGOV_API, accessedOn: retrieved },
    { ...DPWH_TRANSPARENCY_BETTERGOV, accessedOn: retrieved },
  ],
  asOf: `DPWH infrastructure years ${Math.min(...years)}–${Math.max(...years)}`,
  lastVerified: '2026-09-30', // Maintainer review date; retrieval never advances this.
  verification: 'reported',
  status: 'current',
  tier: 2,
  expectedRefresh: 'quarterly',
  methodology:
    'The pipeline searches the available BetterGov.ph DPWH API records for Calatagan, then keeps a project in the municipal count only if its description places the work in Calatagan, Batangas. Contracts on the Nasugbu–Lian–Calatagan national road that give kilometre posts but no municipality, and packages that bundle Calatagan with another municipality, are listed separately and not counted. Barangays are read from the description. The rule is tested against real descriptions (scripts/lib/dpwh-location.test.ts).',
  caveat:
    'These are records attributed to DPWH, accessed through BetterGov.ph’s derivative API; completeness and fidelity to the primary register have not been established. Amounts are contract budgets, not audited spending, and progress is as recorded at retrieval. A project is counted in Calatagan only when its description says so; ambiguous or unavailable records may be missed.',
  note: 'These are national government projects implemented by DPWH (mostly its Batangas 1st District Engineering Office), not projects of the municipal government.',
};

/** Sum of DPWH's published contract budgets, where a budget is given. */
export const totalBudget = (projects: readonly DpwhProject[]) =>
  projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);

export const statusCounts = (projects: readonly DpwhProject[]) => {
  const counts = new Map<string, number>();
  for (const p of projects) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

/** Calatagan projects by DPWH infrastructure year, newest first. */
export const byYear = (() => {
  const map = new Map<number, DpwhProject[]>();
  for (const p of inCalatagan) {
    if (p.infraYear === null) continue;
    map.set(p.infraYear, [...(map.get(p.infraYear) ?? []), p]);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, projects]) => ({
      year,
      projects,
      budget: totalBudget(projects),
      /** Projects still for procurement carry no budget yet; they are counted, not summed. */
      budgeted: projects.filter((p) => p.budget !== null).length,
    }));
})();

/** Projects DPWH describes as being in a given barangay. */
export const projectsInBarangay = (psgc10: string) => inCalatagan.filter((p) => p.barangays.includes(psgc10));

export const categories = [...new Set(inCalatagan.map((p) => p.category ?? 'Other'))].sort();
