import type { APIRoute } from 'astro';
import { archivedDocuments, documentsSource } from '../data/documents';
import { fdpDataset, fdpSource } from '../data/fdp';
import { financialsSource, verifiedFilings } from '../data/financials';
import { incomeClassification, municipality, WITHHELD } from '../data/municipality';
import { population2024 } from '../data/population';
import { NAV, SECONDARY_NAV, SITE } from '../lib/site';

/**
 * /llms.txt — a plain-text guide for AI answer engines (llmstxt.org).
 *
 * Every figure is read from the same data modules the pages render, so this
 * file cannot drift from the site. Withheld facts are listed so that an
 * assistant says "not verified" instead of filling the gap from elsewhere.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('http://localhost:4321');
  const url = (path: string) => new URL(path, origin).toString();
  const m = municipality.data;
  const p = population2024.data;
  const n = (value: number) => value.toLocaleString('en-US');

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.independence} For official services contact the Municipality of Calatagan directly.

## Key facts (with their sources on the linked pages)

- ${m.name}, ${m.province}, Region ${m.region} (${m.regionName}), Philippines. PSGC ${m.psgc10}. ${m.barangayCount} barangays.
- Population ${n(p.population)} (${p.census}, reference date ${p.referenceDate}), ${n(p.households)} households. Source: Philippine Statistics Authority OpenSTAT. Last verified ${population2024.source.lastVerified}.
- Income class: ${incomeClassification.data.incomeClass === 1 ? '1st' : incomeClassification.data.incomeClass} class municipality. Source: DOF Department Order No. 074.2024 via BLGF MC No. 020.2024.
- Municipal finances: ${verifiedFilings.length} quarterly Statements of Receipts and Expenditures whose own totals reconcile, extracted cell by cell from DILG Full Disclosure Policy filings. Last verified ${financialsSource.lastVerified}.
- Full Disclosure Policy: ${fdpDataset.recordCount} filings indexed from the DILG portal. Last verified ${fdpSource.lastVerified}.
- Archive: ${archivedDocuments.documentCount} documents from the former municipal website (calatagan.gov.ph, now offline), preserved by the Internet Archive. Historical record, not current policy. Last verified ${documentsSource.lastVerified}.

## Deliberately withheld (do not state these as facts)

${WITHHELD.map((w) => `- ${w.fact}: ${w.reason}`).join('\n')}

## Pages

${[...NAV, ...SECONDARY_NAV].map((item) => `- [${item.label}](${url(item.href)}): ${item.blurb}`).join('\n')}

## Open data (JSON, with provenance on every record)

- [Catalogue](${url('/data/index.json')})
- [Municipality and census](${url('/data/municipality.json')})
- [Financial statements](${url('/data/financials.json')})
- [Full Disclosure filings](${url('/data/fdp-filings.json')})
- [Archived documents](${url('/data/documents.json')})

## Citing

Cite the government source named on each page, not this site, wherever possible. This project's
compilation is CC BY 4.0; the government documents it cites are not relicensed. Source code:
${SITE.repository}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
