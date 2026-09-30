/**
 * One profile per barangay: census figures, where it ranks, and the national
 * projects DPWH describes as being in it. Shared by the /barangays pages and
 * the sitemap, so their URLs cannot disagree.
 */
import { barangays } from '../data/barangays';
import { projectsInBarangay, totalBudget } from '../data/infrastructure';
import { barangayPopulation2024 } from '../data/population';

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/\(pob\.\)/, 'poblacion')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const census = new Map(barangayPopulation2024.data.map((row) => [row.psgc10, row]));
const municipalTotal = barangayPopulation2024.data.reduce((sum, row) => sum + row.totalPopulation, 0);
const byPopulation = [...barangayPopulation2024.data].sort((a, b) => b.totalPopulation - a.totalPopulation);

export const barangayPages = barangays.data
  .map((barangay) => {
    const row = census.get(barangay.psgc10);
    const projects = projectsInBarangay(barangay.psgc10);
    return {
      ...barangay,
      slug: slugify(barangay.name),
      census: row ?? null,
      /** Share of the municipal population, from PSA's own counts. */
      share: row ? row.totalPopulation / municipalTotal : null,
      rank: row ? byPopulation.findIndex((r) => r.psgc10 === row.psgc10) + 1 : null,
      projects,
      projectBudget: totalBudget(projects),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));

export type BarangayPage = (typeof barangayPages)[number];
