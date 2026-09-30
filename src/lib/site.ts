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

import type { IconName } from '../components/Icon.astro';

/**
 * The assistant, configured at build time. Without an endpoint the site is
 * built exactly as before: the ask boxes are instant search, and no
 * assistant markup is rendered or code loaded.
 */
export const ASK = {
  endpoint: import.meta.env.PUBLIC_ASK_ENDPOINT?.trim().replace(/\/$/, '') || null,
  turnstileSiteKey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY?.trim() || null,
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** One line shown in the mobile menu and on the homepage. */
  blurb: string;
  icon: IconName;
}

/**
 * The site's sections, grouped the way the Better LGU portals group theirs
 * (Services · Government · Statistics · Transparency), so a resident who has
 * used one portal can find their way around this one.
 *
 * URLs are stable (/transparency and /documents predate these labels); the
 * labels were chosen for someone who knows nothing about the project:
 * "Disclosures" matches how the statutory filings are known, and "Archive"
 * says plainly that those documents are historical.
 */
export interface NavGroup {
  label: string;
  /** The group's landing page, and what it is for. */
  href: string;
  blurb: string;
  items: readonly NavItem[];
}

export const OVERVIEW: NavItem = {
  href: '/',
  label: 'Overview',
  blurb: 'Population, barangays and the municipality at a glance',
  icon: 'people',
};

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Services',
    href: '/services',
    blurb: 'What each municipal office provides, and who to call',
    items: [
      { href: '/services', label: 'Municipal services', blurb: 'Every service in the offices’ Citizen’s Charters, by topic', icon: 'layers' },
      { href: '/hotlines', label: 'Emergency hotlines', blurb: 'National hotlines set by law, and why local numbers are not listed', icon: 'alert' },
      { href: '/holidays', label: 'Holidays', blurb: 'National holidays and Calatagan’s own, by proclamation', icon: 'calendar' },
    ],
  },
  {
    label: 'Government',
    href: '/government',
    blurb: 'Offices, barangays, local legislation and history',
    items: [
      { href: '/government', label: 'Officials and offices', blurb: 'Who governs, and what we can and cannot yet verify', icon: 'landmark' },
      { href: '/barangays', label: 'Barangays', blurb: 'All 25 barangays: population, households and projects', icon: 'pin' },
      { href: '/legislation', label: 'Legislation', blurb: 'Ordinances, resolutions and executive orders on record', icon: 'book' },
      { href: '/history', label: 'History', blurb: 'From 15th-century burial sites to the modern town', icon: 'lighthouse' },
    ],
  },
  {
    label: 'Statistics',
    href: '/statistics',
    blurb: 'Population, competitiveness and the municipal economy',
    items: [
      { href: '/statistics', label: 'Statistics', blurb: 'Census, income class and DTI competitiveness in one place', icon: 'chart' },
      { href: '/finances', label: 'Finances', blurb: 'Income and spending, from the municipality’s own quarterly statements', icon: 'coins' },
    ],
  },
  {
    label: 'Transparency',
    href: '/transparency',
    blurb: 'Where public money goes, and the documents behind it',
    items: [
      { href: '/infrastructure', label: 'Infrastructure', blurb: 'Every DPWH project located in Calatagan, with budgets and status', icon: 'flag' },
      { href: '/procurement', label: 'Procurement', blurb: 'Notices of award and bidding on record', icon: 'file' },
      { href: '/transparency', label: 'Disclosures', blurb: 'Every Full Disclosure Policy filing, readable on the site', icon: 'file' },
      { href: '/documents', label: 'Archive', blurb: 'Documents saved from the municipality’s former website', icon: 'archive' },
    ],
  },
  {
    label: 'About',
    href: '/about',
    blurb: 'How this site works, and where its figures come from',
    items: [
      { href: '/about', label: 'About', blurb: 'What this project is and how it works', icon: 'info' },
      { href: '/sources', label: 'Sources', blurb: 'Where every figure comes from, and what is withheld', icon: 'shield' },
      { href: '/data', label: 'Open data', blurb: 'Machine-readable datasets with provenance', icon: 'database' },
      { href: '/accessibility', label: 'Accessibility', blurb: 'How the site is built to be usable by everyone', icon: 'eye-off' },
      { href: '/sitemap', label: 'Sitemap', blurb: 'Every page on the site', icon: 'layers' },
    ],
  },
];

/** Every page in the navigation, once each, Overview first. */
export const PAGES: readonly NavItem[] = [
  OVERVIEW,
  ...[...new Map(NAV_GROUPS.flatMap((g) => g.items).map((item) => [item.href, item])).values()],
];

/**
 * The main sections, used where the site lists itself (home page, 404):
 * everything but the About group's housekeeping pages.
 */
export const NAV: readonly NavItem[] = PAGES.filter(
  (item) => !['/about', '/data', '/accessibility', '/sitemap'].includes(item.href),
);

export const SECONDARY_NAV: readonly NavItem[] = PAGES.filter((item) =>
  ['/about', '/data', '/accessibility', '/sitemap'].includes(item.href),
);

/**
 * The wider BetterGov.ph network and national sources, listed in the footer as
 * the Better LGU portals list them.
 */
export const NETWORK_LINKS = [
  { href: 'https://bettergov.ph', label: 'BetterGov.ph' },
  { href: 'https://lgu.bettergov.ph', label: 'Better LGU directory' },
  { href: 'https://transparency.bettergov.ph', label: 'BetterGov Transparency' },
  { href: 'https://data.bettergov.ph', label: 'BetterGov Open Data' },
] as const;

export const GOVERNMENT_LINKS = [
  { href: 'https://www.foi.gov.ph', label: 'Freedom of Information' },
  { href: 'https://www.officialgazette.gov.ph', label: 'Official Gazette' },
  { href: 'https://portal.batangas.gov.ph', label: 'Province of Batangas' },
  { href: 'https://fdpp.dilg.gov.ph', label: 'DILG Full Disclosure Portal' },
  { href: 'https://openstat.psa.gov.ph', label: 'PSA OpenSTAT' },
  { href: 'https://cmci.dti.gov.ph', label: 'DTI Competitiveness Index' },
] as const;

/** True when `href` is the current section. */
export function isCurrent(href: string, pathname: string): boolean {
  const path = pathname.replace(/\/$/, '') || '/';
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}
