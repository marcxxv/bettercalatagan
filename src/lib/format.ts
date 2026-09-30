/** Display formatting shared by every page. Formatting never changes a value. */

const integer = new Intl.NumberFormat('en-PH');
const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

export const formatNumber = (value: number) => integer.format(value);
export const formatPeso = (value: number) => peso.format(value);

/** ₱ amounts in millions, for headlines; the exact figure stays in the tables. */
export function formatPesoMillions(value: number): string {
  return `₱${(value / 1_000_000).toLocaleString('en-PH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
}

/** "2026-09-24" → "24 September 2026". Other strings pass through unchanged. */
export function formatDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** 1st, 2nd, 3rd, 11th, 12th, 13th, 21st, 321st, 340th. */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
}
