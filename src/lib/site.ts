/**
 * Site-wide identity and navigation.
 *
 * Kept in one place so the header, footer, sitemap and structured data can
 * never disagree about what the site is called or what it contains.
 */

export const SITE = {
  name: 'Better Calatagan',
  shortDescription: 'An independent civic guide to Calatagan, Batangas',
  description:
    'An independent civic guide to Calatagan, Batangas: population and barangays, municipal finances, Full Disclosure filings, history and archived documents — every figure traced to its government source.',
  locale: 'en_PH',
  repository: 'https://github.com/marcxxv/bettercalatagan',
  independence:
    'Better Calatagan is an independent civic project. It is not affiliated with, endorsed by, or operated by the Municipality of Calatagan or any government agency.',
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** One line shown in the mobile menu and on the homepage. */
  blurb: string;
}

/**
 * Primary navigation, ordered by what a newcomer most often wants first.
 *
 * URLs are stable (/transparency and /documents predate these labels); the
 * labels were chosen for someone who knows nothing about the project:
 * "Disclosures" matches how the statutory filings are known, and "Archive"
 * says plainly that those documents are historical.
 */
export const NAV: readonly NavItem[] = [
  { href: '/', label: 'Overview', blurb: 'Population, barangays and the municipality at a glance' },
  { href: '/history', label: 'History', blurb: 'From 15th-century burial sites to the modern town' },
  { href: '/government', label: 'Government', blurb: 'Officials and offices — and what we cannot yet verify' },
  { href: '/finances', label: 'Finances', blurb: 'Income and spending, from the municipality’s own quarterly statements' },
  { href: '/transparency', label: 'Disclosures', blurb: 'Every Full Disclosure Policy filing, with links to DILG' },
  { href: '/documents', label: 'Archive', blurb: 'Documents saved from the municipality’s former website' },
  { href: '/sources', label: 'Sources', blurb: 'Where every figure comes from, and what is withheld' },
];

export const SECONDARY_NAV: readonly NavItem[] = [
  { href: '/about', label: 'About', blurb: 'What this project is and how it works' },
  { href: '/data/index.json', label: 'Open data', blurb: 'Machine-readable datasets with provenance' },
];

/** True when `href` is the current section. */
export function isCurrent(href: string, pathname: string): boolean {
  const path = pathname.replace(/\/$/, '') || '/';
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}
