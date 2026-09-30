/**
 * The site-wide search index, built at compile time from the same data the
 * pages render. Served as /search.json and loaded lazily by the search dialog.
 *
 * An entry may carry an `answer`: a one-line factual reply shown directly in
 * the results, always with the source it rests on. Answers are only written
 * from published (tier 1–2) records, so search can never say more than the
 * pages do.
 */
import { barangays } from '../data/barangays';
import { archivedDocuments, documentKinds } from '../data/documents';
import { fdpSummary } from '../data/fdp';
import { annualSeries, headline, latestFiling, sectorSpending, verifiedFilings } from '../data/financials';
import { chapters, timeline } from '../data/history';
import { incomeClassification, municipality, WITHHELD } from '../data/municipality';
import { barangayPopulation2024, population2024, populationSeries } from '../data/population';
import { KIND_LABELS } from '../data/schemas/documents';
import { formatDate, formatNumber, formatPeso, formatPesoMillions, ordinal } from './format';
import { offices, SERVICE_CATEGORIES } from '../data/services';
import { inCalatagan, totalBudget } from '../data/infrastructure';
import { latestCmci } from '../data/competitiveness';
import { holidays, hotlines, HOLIDAY_YEAR } from '../data/calendar';
import { barangayPages } from './barangay-pages';
import { dpwhTitle } from './dpwh-text';
import { PAGES } from './site';

export interface SearchEntry {
  /** Title */
  t: string;
  /** Group label shown in the results */
  g: string;
  /** URL */
  u: string;
  /** Short description */
  d?: string;
  /** A direct answer, when the entry is a fact */
  a?: string;
  /** Source attribution for the answer */
  s?: string;
  /** Extra search terms */
  k?: string;
}

const PSA = 'Philippine Statistics Authority, 2024 Census of Population';
const SRE = 'Statement of Receipts and Expenditures filed with DILG';

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  // Pages
  for (const item of PAGES) {
    entries.push({ t: item.label, g: 'Pages', u: item.href, d: item.blurb });
  }

  // Facts: population and identity
  const pop = population2024.data;
  entries.push(
    {
      t: 'Population of Calatagan',
      g: 'Answers',
      u: '/#population',
      a: `${formatNumber(pop.population)} people as of ${formatDate(pop.referenceDate)}`,
      s: PSA,
      k: 'how many people live living residents population census popcen 2024 inhabitants',
    },
    {
      t: 'Number of households',
      g: 'Answers',
      u: '/#population',
      a: `${formatNumber(pop.households)} households (${pop.census})`,
      s: PSA,
      k: 'households families homes',
    },
    {
      t: 'Number of barangays',
      g: 'Answers',
      u: '/#barangays',
      a: `${municipality.data.barangayCount} barangays`,
      s: 'PSA Philippine Standard Geographic Code',
      k: 'barangays villages how many',
    },
    {
      t: 'Income classification',
      g: 'Answers',
      u: '/#identity',
      a: `${ordinal(incomeClassification.data.incomeClass)} class municipality, effective ${formatDate(incomeClassification.data.effectiveFrom)}`,
      s: 'Bureau of Local Government Finance',
      k: 'income class classification first class 1st',
    },
    {
      t: 'PSA geographic code (PSGC)',
      g: 'Answers',
      u: '/#identity',
      a: `${municipality.data.psgc10} (10-digit) · ${municipality.data.psgc9} (9-digit)`,
      s: 'Philippine Statistics Authority',
      k: 'psgc code geographic',
    },
    {
      t: 'Province and region',
      g: 'Answers',
      u: '/#identity',
      a: `${municipality.data.province}, ${municipality.data.region} (${municipality.data.regionName})`,
      s: 'Philippine Statistics Authority',
      k: 'province region calabarzon batangas where',
    },
  );

  for (const entry of populationSeries.data) {
    entries.push({
      t: `Population in ${entry.census}`,
      g: 'Answers',
      u: '/#population',
      a: `${formatNumber(entry.population)} people (${formatDate(entry.referenceDate)})`,
      s: 'Philippine Statistics Authority',
      k: `census ${entry.referenceDate.slice(0, 4)} population`,
    });
  }

  // Barangays
  const byCode = new Map(barangayPopulation2024.data.map((row) => [row.psgc10, row]));
  for (const barangay of barangays.data) {
    const census = byCode.get(barangay.psgc10);
    entries.push({
      t: barangay.name,
      g: 'Barangays',
      u: `/barangays/${barangayPages.find((b) => b.psgc10 === barangay.psgc10)?.slug ?? ''}`,
      a: census
        ? `${formatNumber(census.totalPopulation)} people · ${formatNumber(census.households)} households (2024)`
        : undefined,
      s: census ? PSA : undefined,
      d: `PSGC ${barangay.psgc10}`,
      k: ['barangay', ...barangay.aliases].join(' '),
    });
  }

  // Finances
  if (latestFiling) {
    const h = headline(latestFiling);
    const period = `Q${latestFiling.documentPeriod.quarter} CY${latestFiling.documentPeriod.year}`;
    entries.push(
      {
        t: `Municipal income, ${period} year to date`,
        g: 'Answers',
        u: '/finances',
        a: `${formatPeso(h.income ?? 0)} reported`,
        s: SRE,
        k: 'income revenue money budget receipts',
      },
      {
        t: `Operating expenditure, ${period} year to date`,
        g: 'Answers',
        u: '/finances',
        a: `${formatPeso(h.expenditures ?? 0)} reported`,
        s: SRE,
        k: 'spending expenditure expenses spend spent',
      },
      {
        t: `National Tax Allotment, ${period} year to date`,
        g: 'Answers',
        u: '/finances',
        a: `${formatPeso(h.nationalTaxAllotment ?? 0)}`,
        s: SRE,
        k: 'nta ira national tax allotment share',
      },
    );
    const top = sectorSpending(latestFiling)[0];
    if (top) {
      entries.push({
        t: 'Largest spending sector',
        g: 'Answers',
        u: '/finances#spending',
        a: `${top.label}: ${formatPeso(top.value)} (${period} year to date)`,
        s: SRE,
        k: 'sector spending largest biggest where money goes',
      });
    }
  }
  for (const year of annualSeries()) {
    entries.push({
      t: `Finances for CY${year.year}`,
      g: 'Answers',
      u: '/finances#years',
      a: `Income ${formatPesoMillions(year.income ?? 0)} · spending ${formatPesoMillions(year.expenditures ?? 0)}`,
      s: SRE,
      k: `${year.year} annual full year budget income expenditure spend spent spending revenue`,
    });
  }
  entries.push({
    t: 'Quarterly statements on file',
    g: 'Answers',
    u: '/finances#quarters',
    a: `${verifiedFilings.length} verified quarterly statements`,
    s: SRE,
    k: 'sre quarterly statements filings',
  });

  // Disclosures
  entries.push({
    t: 'Full Disclosure Policy filings',
    g: 'Answers',
    u: '/transparency',
    a: `${formatNumber(fdpSummary.total)} filings across ${fdpSummary.forms.length} form types`,
    s: 'DILG Full Disclosure Policy Portal',
    k: 'fdp disclosure filings transparency dilg',
  });
  for (const form of fdpSummary.forms) {
    entries.push({
      t: form.label,
      g: 'Disclosure forms',
      u: `/transparency?form=${encodeURIComponent(form.slug)}#filings`,
      d: `${form.count} ${form.count === 1 ? 'filing' : 'filings'} on the DILG portal`,
      k: 'fdp disclosure form',
    });
  }

  // Archive
  for (const { kind, count } of documentKinds) {
    entries.push({
      t: KIND_LABELS[kind as keyof typeof KIND_LABELS] ?? kind,
      g: 'Archive',
      u: `/documents?kind=${encodeURIComponent(kind)}#index`,
      d: `${count} archived ${count === 1 ? 'document' : 'documents'}`,
      k: 'archive document',
    });
  }
  for (const doc of archivedDocuments.documents) {
    entries.push({
      t: doc.title,
      g: 'Archived documents',
      u: `/documents?q=${encodeURIComponent(doc.title)}#index`,
      d: `${KIND_LABELS[doc.kind]}${doc.publishedYear ? ` · ${doc.publishedYear}` : ''}`,
      k: doc.filename,
    });
  }

  // History
  for (const chapter of chapters) {
    entries.push({ t: chapter.title, g: 'History', u: `/history#${chapter.id}`, d: chapter.kicker });
  }
  for (const entry of timeline) {
    entries.push({ t: entry.event, g: 'Timeline', u: '/history#timeline', d: entry.when });
  }

  // Services, by office, as listed in the 2022 Citizen's Charters.
  for (const office of offices) {
    entries.push({
      t: office.short ? `${office.name} (${office.short})` : office.name,
      g: 'Offices',
      u: `/services#office-${office.slug}`,
      d: office.services.length ? `${office.services.length} services listed in its 2022 Citizen’s Charter` : 'Internal services only',
      k: 'office department municipal',
    });
    for (const service of office.services) {
      entries.push({
        t: service.name,
        g: 'Services',
        u: `/services#${service.category}`,
        d: `${office.name} · ${SERVICE_CATEGORIES[service.category].label} · listed in 2022`,
        k: `service ${service.category} ${office.short ?? ''}`,
      });
    }
  }

  // National infrastructure (DPWH).
  entries.push({
    t: 'DPWH projects in Calatagan',
    g: 'Answers',
    u: '/infrastructure',
    a: `${inCalatagan.length} projects, ${formatPesoMillions(totalBudget(inCalatagan))} in contract budgets`,
    s: 'DPWH, via the BetterGov.ph DPWH transparency API',
    k: 'dpwh infrastructure projects roads bridges buildings public works national',
  });
  for (const p of inCalatagan) {
    entries.push({
      t: ((d) => (d.length > 140 ? `${d.slice(0, 137)}…` : d))(dpwhTitle(p.description)),
      g: 'Projects',
      u: `/infrastructure#contract-${p.contractId}`,
      d: [p.infraYear, p.status, p.budget !== null ? formatPeso(p.budget) : null].filter(Boolean).join(' · '),
      k: `${p.contractId} ${p.contractor ?? ''} dpwh project`,
    });
  }

  // Competitiveness (DTI CMCI).
  entries.push({
    t: 'Competitiveness ranking (DTI CMCI)',
    g: 'Answers',
    u: '/statistics#competitiveness',
    a: `${ordinal(latestCmci.rank)} of ${formatNumber(latestCmci.ranked)} ${latestCmci.category.toLowerCase()} (${latestCmci.year})`,
    s: 'Department of Trade and Industry, Cities and Municipalities Competitiveness Index',
    k: 'cmci competitiveness dti rank ranking index economic dynamism resiliency',
  });

  // Holidays and hotlines.
  for (const h of holidays) {
    entries.push({
      t: h.name,
      g: 'Holidays',
      u: '/holidays',
      a: `${formatDate(h.date)}${h.kind === 'local' ? ' (Calatagan only)' : ''}`,
      s: h.proclamation,
      k: `holiday ${HOLIDAY_YEAR} ${h.kind} walang pasok`,
    });
  }
  for (const line of hotlines) {
    entries.push({
      t: line.name,
      g: 'Answers',
      u: '/hotlines',
      a: `Call ${line.number}`,
      s: line.source.name.split(' — ')[0],
      k: 'hotline emergency number call police fire ambulance complaint',
    });
  }

  // The question residents ask most, answered honestly.
  entries.push({
    t: 'Mayor and elected officials',
    g: 'Answers',
    u: '/government#officials',
    a: 'Not published here: an election result is not proof of who holds office today',
    s: 'See the Government page for why, and where to look instead',
    k: 'mayor vice mayor councilor councilors sangguniang bayan officials elected who governs incumbent',
  });

  // What is withheld, so a search for it explains the absence.
  for (const entry of WITHHELD) {
    entries.push({
      t: entry.fact,
      g: 'Not published',
      u: '/sources#withheld',
      d: entry.reason,
      k: 'withheld not published',
    });
  }

  return entries;
}
