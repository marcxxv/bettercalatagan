import type { APIRoute } from 'astro';
import { holidays, holidaysSource, HOLIDAY_YEAR } from '../../data/calendar';
import { envelope } from '../../lib/export';

/** Holidays observed in Calatagan this year, each with its proclamation. */
export const GET: APIRoute = () =>
  envelope({
    dataset: `holidays-${HOLIDAY_YEAR}`,
    data: holidays.map(({ source, ...h }) => ({ ...h, source_url: source.url })),
    sources: holidaysSource,
    notes: [
      '`kind`: "regular" holiday, "special" (non-working) day, "special-working" day, or "local" (a special day declared for Calatagan only).',
      'Local special days are declared during the year; one declared after `last_verified` is not listed.',
    ],
  });
