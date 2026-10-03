import type { IsoDate } from './types/provenance';

/**
 * Tourism-channel evidence is intentionally separate from civic-data verification.
 * A resort-operated website can establish which links it publishes, but cannot
 * establish DOT accreditation. A dated government roster can establish what it
 * listed on that date, but does not guarantee that a future booking is safe.
 */
export interface ResortChannel {
  label: 'Facebook' | 'Instagram' | 'TikTok' | 'Airbnb';
  url: `https://${string}`;
  /** Page on the resort website where the link was checked. */
  linkedFrom: `https://${string}`;
}

export interface ResortEvidence {
  label: string;
  url: `https://${string}`;
  description: string;
}

export interface ResortEntry {
  id: string;
  name: string;
  locality: string;
  website: `https://${string}`;
  channels: readonly ResortChannel[];
  evidence: readonly ResortEvidence[];
  /** A historical snapshot of what the DOT roster said, never a live badge. */
  dotRecord?: {
    number: string;
    listedName: string;
    rosterAsOf: IsoDate;
    listedValidUntil: IsoDate;
    url: `https://${string}`;
  };
  reviewNote?: string;
  lastReviewed: IsoDate;
}

export const DOT_CALABARZON_ROSTER =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtGgUSobqikBmsWRU-Lhe0wfH5ttk8jiT-bs44K7p7_7eSOJWxkffKMSRaqIbIm7-PL9TJh7Ky1J72/pubhtml/sheet?headers=false&gid=1809562489';

/** Curated, alphabetical; absence from this small list is not a warning about a resort. */
export const resorts: readonly ResortEntry[] = [
  {
    id: 'anam-beach-resort',
    name: 'Anam Beach Resort',
    locality: 'Balibago, Calatagan',
    website: 'https://anambeachresort.com/',
    channels: [
      { label: 'Instagram', url: 'https://www.instagram.com/anambeachresortofficial/', linkedFrom: 'https://anambeachresort.com/contact-us/' },
      { label: 'TikTok', url: 'https://www.tiktok.com/@anambeachresortofficial', linkedFrom: 'https://anambeachresort.com/contact-us/' },
    ],
    evidence: [
      { label: 'DOT CALABARZON resort roster', url: DOT_CALABARZON_ROSTER, description: 'Names Anam Beach Resort in Calatagan and links this website; roster dated September 30, 2026.' },
      { label: 'Resort contact page', url: 'https://anambeachresort.com/contact-us/', description: 'Links the Instagram and TikTok accounts shown here.' },
    ],
    dotRecord: { number: 'DOT-R4A-RES-03126-2026', listedName: 'ANAM BEACH RESORT', rosterAsOf: '2026-09-30', listedValidUntil: '2026-10-31', url: DOT_CALABARZON_ROSTER },
    reviewNote: 'Facebook link withheld: the resort website links two different Facebook profiles from its contact section and footer. Confirm the right page directly with the resort.',
    lastReviewed: '2026-10-03',
  },
  {
    id: 'aquaria-crusoe',
    name: 'Aquaria Water Park',
    locality: 'Sta. Ana, Calatagan',
    website: 'https://aquaria.landcolifestyleventures.com/',
    channels: [
      { label: 'Facebook', url: 'https://www.facebook.com/aquariawaterpark', linkedFrom: 'https://aquaria.landcolifestyleventures.com/' },
      { label: 'Instagram', url: 'https://www.instagram.com/aquariawaterpark/', linkedFrom: 'https://aquaria.landcolifestyleventures.com/' },
    ],
    evidence: [
      { label: 'DOT CALABARZON resort roster', url: DOT_CALABARZON_ROSTER, description: 'Lists Aquaria Water Park & Crusoe Cabins in Sta. Ana, Calatagan, with a different, currently inaccessible legacy group website; roster dated September 30, 2026.' },
      { label: 'Aquaria website', url: 'https://aquaria.landcolifestyleventures.com/', description: 'Names Aquaria Water Park in Calatagan and links the Facebook and Instagram accounts shown here. Its Crusoe Cabins link is a separate site, not checked here.' },
    ],
    dotRecord: { number: 'DOT-R4A-RES-02043-2024', listedName: 'AQUARIA WATER PARK & CRUSOE CABINS', rosterAsOf: '2026-09-30', listedValidUntil: '2026-10-31', url: DOT_CALABARZON_ROSTER },
    reviewNote: 'The DOT roster groups Aquaria with Crusoe Cabins; this entry links only Aquaria’s site and channels. No separate Crusoe website or booking flow was checked.',
    lastReviewed: '2026-10-03',
  },
  {
    id: 'lago-de-oro',
    name: 'Lago de Oro',
    locality: 'Calatagan',
    website: 'https://lago-de-oro.com/',
    channels: [
      { label: 'Facebook', url: 'https://web.facebook.com/lagodeoro/', linkedFrom: 'https://lago-de-oro.com/' },
      { label: 'Instagram', url: 'https://www.instagram.com/lagodeoro_official/', linkedFrom: 'https://lago-de-oro.com/' },
    ],
    evidence: [
      { label: 'DOT CALABARZON resort roster', url: DOT_CALABARZON_ROSTER, description: 'Names Lago de Oro in Calatagan and links its website; roster dated September 30, 2026.' },
      { label: 'Resort website', url: 'https://lago-de-oro.com/', description: 'Links the Facebook and Instagram accounts shown here.' },
    ],
    dotRecord: { number: 'DOT-R4A-RES-00583-2022', listedName: 'LAGO DE ORO', rosterAsOf: '2026-09-30', listedValidUntil: '2026-10-31', url: DOT_CALABARZON_ROSTER },
    reviewNote: 'The DOT roster lists validity through October 31, 2026, but the resort website still displays an older October 31, 2025 expiry. Ask DOT for current status; neither date verifies a booking channel.',
    lastReviewed: '2026-10-03',
  },
  {
    id: 'nawa-wellness',
    name: 'Nawa Wellness',
    locality: 'Calatagan',
    website: 'https://nawawellness.com/',
    channels: [
      { label: 'Facebook', url: 'https://www.facebook.com/nawawellness', linkedFrom: 'https://nawawellness.com/' },
      { label: 'Instagram', url: 'https://www.instagram.com/nawawellness/', linkedFrom: 'https://nawawellness.com/' },
    ],
    evidence: [
      { label: 'DOT CALABARZON resort roster', url: DOT_CALABARZON_ROSTER, description: 'Names Nawa Wellness Resorts in Calatagan and links this website; roster dated September 30, 2026.' },
      { label: 'Resort website', url: 'https://nawawellness.com/', description: 'Links the Facebook and Instagram accounts shown here.' },
    ],
    dotRecord: { number: 'DOT-R4A-RES-02847-2026', listedName: 'NAWA WELLNESS RESORTS', rosterAsOf: '2026-09-30', listedValidUntil: '2026-10-31', url: DOT_CALABARZON_ROSTER },
    lastReviewed: '2026-10-03',
  },
  {
    id: 'playalolita',
    name: 'PlayaLolita Beach Resort',
    locality: 'Bagong Silang, Calatagan',
    website: 'https://www.playalolitaresort.com/en/',
    channels: [],
    evidence: [
      { label: 'DOT CALABARZON resort roster', url: DOT_CALABARZON_ROSTER, description: 'Lists PlayaLolita Beach Resort in Bagong Silang, Calatagan, with address and phone number but no website; roster dated September 30, 2026.' },
      { label: 'Resort contact page', url: 'https://www.playalolitaresort.com/en/contactus', description: 'Names PlayaLolita Beach Resort and matches the DOT roster’s lot numbers and phone number. No resort-published social link was confirmed.' },
    ],
    dotRecord: { number: 'DOT-R4A-RES-03116-2026', listedName: 'PLAYALOLITA BEACH RESORT', rosterAsOf: '2026-09-30', listedValidUntil: '2026-10-31', url: DOT_CALABARZON_ROSTER },
    lastReviewed: '2026-10-03',
  },
  {
    id: 'valley-o-ville',
    name: 'Valley O’Ville Family Resort',
    locality: 'Carretunan, Calatagan',
    website: 'https://www.valleyoville.com/',
    channels: [
      { label: 'Facebook', url: 'https://www.facebook.com/ValleyOVille/', linkedFrom: 'https://www.valleyoville.com/' },
      { label: 'Instagram', url: 'https://www.instagram.com/valleyoville', linkedFrom: 'https://www.valleyoville.com/' },
      { label: 'TikTok', url: 'https://www.tiktok.com/@valleyoville', linkedFrom: 'https://www.valleyoville.com/' },
      { label: 'Airbnb', url: 'https://www.airbnb.com/h/valleyoville', linkedFrom: 'https://www.valleyoville.com/' },
    ],
    evidence: [
      { label: 'Resort website', url: 'https://www.valleyoville.com/', description: 'Names the resort, states its Carretunan locality and links the channels shown here.' },
      { label: 'Airbnb listing', url: 'https://www.airbnb.com/rooms/1059337092910163675', description: 'Separately hosted listing corroborates the resort name and Calatagan locality.' },
    ],
    lastReviewed: '2026-10-03',
  },
];

/** Fail the build instead of silently publishing a malformed or unsupported link. */
export function directoryIssues(entries: readonly ResortEntry[], today: IsoDate): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const resort of entries) {
    if (ids.has(resort.id)) issues.push(`${resort.id}: duplicate ID`);
    ids.add(resort.id);
    if (!resort.locality.includes('Calatagan')) issues.push(`${resort.id}: locality not established in Calatagan`);
    if (!Number.isFinite(Date.parse(resort.lastReviewed)) || resort.lastReviewed > today) {
      issues.push(`${resort.id}: reviewed in the future or on an invalid date`);
    }
    if (resort.evidence.length < 2 || !resort.evidence.some((source) => new URL(source.url).origin !== new URL(resort.website).origin)) {
      issues.push(`${resort.id}: missing separate corroborating evidence`);
    }
    const seen = new Set<string>();
    for (const channel of resort.channels) {
      if (seen.has(channel.label)) issues.push(`${resort.id}: duplicate ${channel.label} channel`);
      seen.add(channel.label);
      if (new URL(channel.linkedFrom).origin !== new URL(resort.website).origin) {
        issues.push(`${resort.id}: channel proof outside the listed website`);
      }
      if (!resort.evidence.some((source) => source.url === channel.linkedFrom)) {
        issues.push(`${resort.id}: channel proof has no listed source`);
      }
    }
    if (resort.dotRecord && (
      resort.dotRecord.url !== DOT_CALABARZON_ROSTER ||
      !resort.evidence.some((source) => source.url === resort.dotRecord?.url) ||
      resort.dotRecord.rosterAsOf > resort.lastReviewed ||
      resort.dotRecord.listedValidUntil < resort.dotRecord.rosterAsOf
    )) {
      issues.push(`${resort.id}: DOT record lacks government roster evidence or has inconsistent dates`);
    }
  }
  return issues;
}
