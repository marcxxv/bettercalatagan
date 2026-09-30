import type { APIRoute } from 'astro';
import { charterDocuments, offices, SERVICE_CATEGORIES, servicesSource } from '../../data/services';
import { envelope } from '../../lib/export';

/** Municipal services as listed in each office's 2022 Citizen's Charter. */
export const GET: APIRoute = () =>
  envelope({
    dataset: 'municipal-services',
    data: offices.map((office) => {
      const doc = charterDocuments.get(office.slug)!;
      return {
        office: office.name,
        short: office.short ?? null,
        charter: { title: doc.title, year: doc.publishedYear, archive_url: doc.archiveUrl, original_url: doc.originalUrl },
        services: office.services.map((s) => ({ ...s, category_label: SERVICE_CATEGORIES[s.category].label })),
        internal_services: office.internal ?? [],
      };
    }),
    sources: servicesSource,
    notes: [
      'Service names as each office listed them in its 2022 Citizen’s Charter, archived from the former municipal website.',
      'Fees, requirements and processing times are deliberately not included: they are four years old. Read them, dated, in each charter.',
    ],
  });
