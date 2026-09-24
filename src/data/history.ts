/**
 * The history of Calatagan, as far as the documents take it.
 *
 * Researched September 2026. Every claim cites its sources and says how well it
 * is supported (see schemas/history.ts). Where a claim rests on one
 * non-primary source it is published with that attribution; where scholars
 * disagree the disagreement is described; and claims we met but could not
 * verify are listed separately rather than woven into the narrative.
 *
 * Deliberately NOT repeated here, although they circulate:
 *  - that the Calatagan Pot is "the oldest" Philippine artefact bearing
 *    writing (a superlative we could not support);
 *  - any settled translation of the pot's inscription;
 *  - that Calatagan was "founded" in 1912 (the record shows a restoration);
 *  - the name of the man who first surveyed Cape Santiago, which the marker
 *    and other accounts spell differently.
 */
import {
  chapterSchema,
  citationSchema,
  timelineEntrySchema,
  unverifiedSchema,
  type Chapter,
  type Citation,
  type TimelineEntry,
  type Unverified,
} from './schemas/history.js';

const ACCESSED = '2026-09-24' as const;

const citationList: Citation[] = [
  {
    id: 'fox-1959',
    short: 'Fox (1959)',
    title: 'The Calatagan Excavations: Two 15th Century Burial Sites in Batangas, Philippines',
    publisher: 'Philippine Studies 7(3), Ateneo de Manila University',
    year: 1959,
    url: 'https://archium.ateneo.edu/phstudies/vol7/iss3/13/',
    doi: '10.13185/2244-1638.3148',
    kind: 'peer-reviewed',
    accessedOn: ACCESSED,
    note: 'Bibliographic details confirmed through Crossref and Solheim (1985). The article text itself was not retrievable to this project.',
  },
  {
    id: 'solheim-1985',
    short: 'Solheim (1985)',
    title: 'Robert B. Fox, 1918–1985',
    publisher: 'Asian Perspectives 26(1), University of Hawai‘i Press',
    year: 1985,
    url: 'https://scholarspace.manoa.hawaii.edu/server/api/core/bitstreams/b4fb1300-5e7d-4e6e-88d4-b9c1c314669c/content',
    locator: 'Bibliography of Robert B. Fox, entries for 1959, 1961 and 1982',
    kind: 'peer-reviewed',
    accessedOn: ACCESSED,
  },
  {
    id: 'mijares-jagoon',
    short: 'Mijares & Jagoon',
    title: 'Finds and Analysis of Five Archaeological Pottery Sites in the Philippines',
    publisher: 'SPAFA Journal 6(1), SEAMEO Regional Centre for Archaeology and Fine Arts',
    year: null,
    url: 'https://spafajournal.org/index.php/spafa1991journal/article/download/272/267',
    locator: 'Section "Calatagan Pottery"',
    kind: 'peer-reviewed',
    accessedOn: ACCESSED,
  },
  {
    id: 'barretto-tesoro-2003',
    short: 'Barretto-Tesoro (2003)',
    title: 'Burial Goods in the Philippines: An Attempt to Quantify Prestige Values',
    publisher: 'Southeast Asian Studies 41(3), Kyoto University',
    year: 2003,
    url: 'https://www.jstage.jst.go.jp/article/tak/41/3/41_KJ00000434305/_pdf',
    locator: 'Section 7, "Pulong Bakaw, Calatagan"',
    kind: 'peer-reviewed',
    accessedOn: ACCESSED,
  },
  {
    id: 'ncca-2010',
    short: 'NCCA (2010)',
    title: 'In Focus: The Mystery of the Ancient Inscription (an article on the Calatagan Pot), by Rolando O. Borrinaga',
    publisher: 'National Commission for Culture and the Arts',
    year: 2010,
    url: 'https://ncca.gov.ph/about-culture-and-arts/in-focus/the-mystery-of-the-ancient-inscription-an-article-on-the-calatagan-pot/',
    locator: 'Published 22 September 2010',
    kind: 'government-publication',
    accessedOn: ACCESSED,
  },
  {
    id: 'borrinaga-2010',
    short: 'Borrinaga (2010)',
    title: 'The Calatagan Pot: A National Treasure with Bisayan Inscription',
    publisher:
      'Paper presented at the Philippine National Historical Society 31st National Conference on Local and National History',
    year: 2010,
    url: 'https://heritage.elizaga.net/explorations/borrinaga/calatagan-pot.pdf',
    locator: 'Section reviewing earlier attempts at decipherment',
    kind: 'secondary',
    accessedOn: ACCESSED,
  },
  {
    id: 'guillermo-paluga-2011',
    short: 'Guillermo & Paluga (2011)',
    title: 'Barang king banga: A Visayan language reading of the Calatagan pot inscription (CPI)',
    publisher: 'Journal of Southeast Asian Studies 42(1): 121–159, Cambridge University Press',
    year: 2011,
    url: 'https://doi.org/10.1017/s0022463410000561',
    doi: '10.1017/s0022463410000561',
    kind: 'peer-reviewed',
    accessedOn: ACCESSED,
    note: 'Bibliographic details confirmed through Crossref. The article is paywalled; its argument is cited here only as a proposed reading.',
  },
  {
    id: 'sastron-1895',
    short: 'Sastrón (1895)',
    title: 'Filipinas: pequeños estudios. Batangas y su provincia',
    publisher: 'Manuel Sastrón; Malabon: Asilo de Huérfanos (digitised by the Internet Archive)',
    year: 1895,
    url: 'https://archive.org/details/filipinaspequeo02sastgoog',
    locator: 'Entry "Calatagan", and the general sections on agriculture and on the province’s pueblos',
    kind: 'primary-document',
    accessedOn: ACCESSED,
  },
  {
    id: 'act-958',
    short: 'Act No. 958 (1903)',
    title:
      'Act No. 958: An Act Reducing the Twenty-Two Municipalities of the Province of Batangas to Sixteen',
    publisher: 'Philippine Commission (text via the Supreme Court E-Library)',
    year: 1903,
    url: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/28/13299',
    locator: 'Section 2; enacted 23 October 1903',
    kind: 'government-record',
    accessedOn: ACCESSED,
  },
  {
    id: 'eo-78-english',
    short: 'Executive Order No. 78 (1911), English text',
    title: 'Executive Order No. 78 Separating Calatagan from the Municipality of Balayan',
    publisher:
      'Batangas History, Culture and Folklore, reproducing Executive Orders Nos. 1–86 (1911)',
    year: 2018,
    url: 'https://www.batangashistory.date/2018/12/executive-order78.html',
    kind: 'secondary',
    accessedOn: ACCESSED,
    note: 'A reproduction. The original printed volume sits behind bot protection at the digital libraries that hold it.',
  },
  {
    id: 'municipal-history-2022',
    short: 'Municipality of Calatagan website (2022)',
    title: 'History — Municipal Government of Calatagan',
    publisher: 'Municipal Government of Calatagan (archived by the Internet Archive, 13 July 2022)',
    year: 2022,
    url: 'https://web.archive.org/web/20220713195951/https://calatagan.gov.ph/history/',
    locator: 'Includes a Spanish text of Executive Order No. 78, credited to the Gaceta Oficial',
    kind: 'archived-official',
    accessedOn: ACCESSED,
  },
  {
    id: 'sc-1965-ayala',
    short: 'Republic v. Ayala y Cía. (1965)',
    title: 'Republic of the Philippines v. Ayala y Cía., et al., G.R. No. L-20950',
    publisher: 'Supreme Court of the Philippines (text via LawPhil)',
    year: 1965,
    url: 'https://lawphil.net/judjuris/juri1965/may1965/gr_l-20950_1965.html',
    locator: 'Decided 31 May 1965',
    kind: 'government-record',
    accessedOn: ACCESSED,
  },
  {
    id: 'nhcp-marker-2018',
    short: 'NHCP marker (2018)',
    title: 'Parola ng Cape Santiago — historical marker',
    publisher:
      'National Historical Commission of the Philippines; read from a photograph by Ervin Malicdem (CC BY-SA 4.0), taken 15 April 2018',
    year: 2018,
    url: 'https://commons.wikimedia.org/wiki/File:Cape_Santiago_Lighthouse_Historical_Marker.jpg',
    kind: 'photograph',
    accessedOn: ACCESSED,
  },
  {
    id: 'psa-openstat-2024',
    short: 'PSA (2024)',
    title: '2024 Census of Population, CALABARZON by barangay',
    publisher: 'Philippine Statistics Authority, OpenSTAT',
    year: 2024,
    url: 'https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A/PO_2024/0041A6DTPH3.px',
    kind: 'government-record',
    accessedOn: ACCESSED,
  },
  {
    id: 'blgf-2024',
    short: 'BLGF MC No. 020.2024',
    title: 'BLGF Memorandum Circular No. 020.2024, Annex A',
    publisher: 'Bureau of Local Government Finance, Department of Finance',
    year: 2024,
    url: 'https://blgf.gov.ph/wp-content/uploads/2024/12/04.-BLGF-MC-No.-020.2024.pdf',
    locator: 'Annex A, page 13 of 32',
    kind: 'government-record',
    accessedOn: ACCESSED,
  },
];

const chapterList: Chapter[] = [
  {
    id: 'before',
    kicker: 'Before the municipality',
    title: 'Burials, pottery and a trading coast',
    claims: [
      {
        text: 'In 1958 a National Museum team led by the anthropologist Robert B. Fox excavated burial grounds at two sites in Calatagan, Kay Tomas and Pulong Bakaw. Fox published the results the following year as two fifteenth-century burial sites.',
        cite: ['fox-1959', 'solheim-1985', 'mijares-jagoon'],
        status: 'documented',
      },
      {
        text: 'At Pulong Bakaw alone, 207 graves were excavated. They date to the late fourteenth and early-to-mid fifteenth centuries, and held Siamese, Sawankhalok and Annamese wares — pottery made in mainland Southeast Asia — alongside earthenware made locally.',
        cite: ['barretto-tesoro-2003'],
        status: 'documented',
      },
      {
        text: 'A later study of Philippine burial goods treats the Calatagan excavations as the clearest record of trade with other Southeast Asian polities before the Spanish galleon trade.',
        cite: ['barretto-tesoro-2003'],
        status: 'documented',
      },
      {
        text: 'The local earthenware was sorted by Dorothy Main, the museum’s honorary curator of ceramics, into a Kay Tomas complex, a Pulong Bakaw complex and intrusive wares. Fox and Main published a full description as a National Museum monograph in 1982.',
        cite: ['mijares-jagoon', 'solheim-1985'],
        status: 'documented',
      },
      {
        text: 'The best-known object from Calatagan was not found by the museum team. Diggers found a small earthenware pot at an archaeological site in Calatagan in 1958; it passed to the Anthropological Foundation of the Philippines, which gave it to the National Museum in 1961. It stands 12 centimetres high and has been dated to between the fourteenth and sixteenth centuries.',
        cite: ['ncca-2010', 'borrinaga-2010'],
        status: 'documented',
      },
      {
        text: 'Around the pot’s shoulder runs an inscription in a pre-Hispanic script, and scholars do not agree on what it says. Ramon Guillermo and Myfel Joseph Paluga published a Visayan-language reading in 2011; Rolando Borrinaga proposed another, and reviewed earlier attempts that reached different conclusions. We present none of them as settled.',
        cite: ['guillermo-paluga-2011', 'borrinaga-2010', 'ncca-2010'],
        status: 'disputed',
      },
    ],
  },
  {
    id: 'hacienda',
    kicker: 'Hacienda de Calatagan',
    title: 'A town that was almost entirely one estate',
    claims: [
      {
        text: 'By the late nineteenth century nearly all of Calatagan belonged to one family. Writing in 1895, the Spanish official Manuel Sastrón recorded that most of the town’s farmland and all of its forests were owned by Pedro P. Roxas, and that the Roxas house had been milling sugar there with steam machinery for more than forty years.',
        cite: ['sastron-1895'],
        status: 'documented',
      },
      {
        text: 'Sugar was the town’s only significant export, shipped from two anchorages Sastrón names as Balongbato and Calabozo. The Roxas hacienda house, he noted, rivalled the town hall as the most prominent building in the place.',
        cite: ['sastron-1895'],
        status: 'documented',
      },
      {
        text: 'How the Roxas family came to hold the land is less well documented. The municipality’s former website says Domingo Roxas acquired it from the Spanish Crown in 1829, and that in 1931 the estate passed to the brothers Jacobo and Alfonso Zobel. We have not found records that confirm either date.',
        cite: ['municipal-history-2022'],
        status: 'attributed',
        attribution: 'According to the municipality’s former website',
      },
      {
        text: 'The estate’s later history is in the court record. In 1965 the Supreme Court decided a case the Republic brought against Ayala y Cía., Alfonso Zobel and others over Hacienda Calatagan, whose title covered some 9,652 hectares. It upheld findings that land added to the hacienda’s survey plan was foreshore, beach or navigable water, and ordered that land returned to the public domain.',
        cite: ['sc-1965-ayala'],
        status: 'documented',
      },
    ],
  },
  {
    id: 'becoming',
    kicker: 'Becoming Calatagan',
    title: 'Separated from Balayan — twice',
    claims: [
      {
        text: 'Calatagan was a town before it was a municipality in the modern sense. Sastrón lists it in 1895 among the twenty-two pueblos of Batangas — the least populated, with 2,239 inhabitants — and notes that it had only just become a parish of its own, having been served until then from Balayan.',
        cite: ['sastron-1895'],
        status: 'documented',
      },
      {
        text: 'In October 1903 the Philippine Commission’s Act No. 958 cut the province’s twenty-two municipalities to sixteen. Calatagan and Tuy were folded into Balayan, with the seat of government at Balayan.',
        cite: ['act-958'],
        status: 'documented',
      },
      {
        text: 'Eight years later, inhabitants of what the order calls “the former municipality of Calatagan” petitioned to separate, promising to build a municipal building and schoolhouses and to repair the roads. Executive Order No. 78, signed by Governor-General W. Cameron Forbes on 16 December 1911, restored Calatagan to the territory it had held before Act No. 958, with effect from 1 January 1912. Its text survives in two independent reproductions, one English and one Spanish, which agree.',
        cite: ['eo-78-english', 'municipal-history-2022', 'act-958'],
        status: 'documented',
      },
      {
        text: 'This is why accounts of Calatagan’s beginnings differ. Those that say it became a municipality in 1912 are right about the present municipality, but the order itself describes a restoration of an earlier one rather than a new creation.',
        cite: ['eo-78-english', 'municipal-history-2022', 'sastron-1895'],
        status: 'documented',
      },
    ],
  },
  {
    id: 'cape-santiago',
    kicker: 'Cape Santiago',
    title: 'A light for ships bound for Manila',
    claims: [
      {
        text: 'The historical marker the National Historical Commission of the Philippines placed at Cape Santiago in 2018 records that the site was first surveyed and proposed in 1887, and that Aldecoa y Cía. built the lighthouse of brick to a design by Guillermo Brockman in 1890. It served, the marker says, as a guide for ships bound for the port of Manila.',
        cite: ['nhcp-marker-2018'],
        status: 'documented',
      },
      {
        text: 'It was in service by 1895, when Sastrón described a road to Punta Santiago, where there was a semaphore and a fourth-order lighthouse.',
        cite: ['sastron-1895'],
        status: 'documented',
      },
    ],
  },
  {
    id: 'today',
    kicker: 'Calatagan today',
    title: 'A first-class municipality of 25 barangays',
    claims: [
      {
        text: 'The 2024 census counted 60,420 people in Calatagan’s 25 barangays.',
        cite: ['psa-openstat-2024'],
        status: 'documented',
      },
      {
        text: 'In the first general income reclassification under Republic Act No. 11964, Calatagan moved from second to first class, with effect from 1 January 2025.',
        cite: ['blgf-2024'],
        status: 'documented',
      },
    ],
  },
];

const timelineList: TimelineEntry[] = [
  {
    when: 'Late 14th – mid 15th century',
    sortYear: 1375,
    event: 'Burials at Pulong Bakaw, with pottery traded from mainland Southeast Asia.',
    cite: ['barretto-tesoro-2003'],
    status: 'documented',
  },
  {
    when: '1829',
    sortYear: 1829,
    event: 'Domingo Roxas acquires the land that becomes Hacienda de Calatagan.',
    cite: ['municipal-history-2022'],
    status: 'attributed',
    attribution: 'Municipality’s former website',
  },
  {
    when: 'By the mid-1850s',
    sortYear: 1855,
    event: 'The Roxas house introduces steam-powered sugar milling in Calatagan.',
    cite: ['sastron-1895'],
    status: 'documented',
  },
  {
    when: '1887',
    sortYear: 1887,
    event: 'Cape Santiago is surveyed and proposed as a lighthouse site.',
    cite: ['nhcp-marker-2018'],
    status: 'documented',
  },
  {
    when: '1890',
    sortYear: 1890,
    event: 'The Cape Santiago lighthouse is built, of brick, by Aldecoa y Cía.',
    cite: ['nhcp-marker-2018'],
    status: 'documented',
  },
  {
    when: '1895',
    sortYear: 1895,
    event: 'Calatagan is the least populated of Batangas’s 22 pueblos, with 2,239 inhabitants.',
    cite: ['sastron-1895'],
    status: 'documented',
  },
  {
    when: '23 October 1903',
    sortYear: 1903,
    event: 'Act No. 958 merges Calatagan and Tuy into Balayan.',
    cite: ['act-958'],
    status: 'documented',
  },
  {
    when: '16 December 1911',
    sortYear: 1911,
    event: 'Executive Order No. 78 restores Calatagan as a separate municipality.',
    cite: ['eo-78-english', 'municipal-history-2022'],
    status: 'documented',
  },
  {
    when: '1 January 1912',
    sortYear: 1912,
    event: 'The separation from Balayan takes effect.',
    cite: ['eo-78-english', 'municipal-history-2022'],
    status: 'documented',
  },
  {
    when: '1931',
    sortYear: 1931,
    event: 'The hacienda passes from the Roxas family to the Zobel brothers.',
    cite: ['municipal-history-2022'],
    status: 'attributed',
    attribution: 'Municipality’s former website',
  },
  {
    when: '1958',
    sortYear: 1958,
    event: 'Robert B. Fox’s National Museum team excavates Kay Tomas and Pulong Bakaw; the Calatagan Pot is found.',
    cite: ['fox-1959', 'ncca-2010'],
    status: 'documented',
  },
  {
    when: '1961',
    sortYear: 1961,
    event: 'The Calatagan Pot is donated to the National Museum.',
    cite: ['ncca-2010'],
    status: 'documented',
  },
  {
    when: '31 May 1965',
    sortYear: 1965,
    event: 'The Supreme Court returns foreshore and sea areas claimed within Hacienda Calatagan to the public domain.',
    cite: ['sc-1965-ayala'],
    status: 'documented',
  },
  {
    when: '2018',
    sortYear: 2018,
    event: 'The National Historical Commission places a marker at the Cape Santiago lighthouse.',
    cite: ['nhcp-marker-2018'],
    status: 'documented',
  },
  {
    when: '1 July 2024',
    sortYear: 2024,
    event: 'The census counts 60,420 residents.',
    cite: ['psa-openstat-2024'],
    status: 'documented',
  },
  {
    when: '1 January 2025',
    sortYear: 2025,
    event: 'Calatagan becomes a first-class municipality.',
    cite: ['blgf-2024'],
    status: 'documented',
  },
];

const unverifiedList: Unverified[] = [
  {
    claim: 'That the name Calatagan comes from the Tagalog “latag” or “kapatagan”, words for flat, level land.',
    foundIn: ['municipal-history-2022'],
    why: 'A popular explanation, stated on the municipality’s former website. We found no documentary source for it.',
  },
  {
    claim: 'That Domingo Roxas acquired the land from the Spanish Crown in 1829.',
    foundIn: ['municipal-history-2022'],
    why: 'Consistent with Sastrón’s account of Roxas ownership by 1895, but we have not found the grant or any other primary record of it.',
  },
  {
    claim: 'That the hacienda passed to Jacobo and Alfonso Zobel in 1931, and became known as “Central Carmen”.',
    foundIn: ['municipal-history-2022'],
    why: 'The 1965 Supreme Court decision confirms Ayala y Cía. and Alfonso Zobel held the hacienda by then, but not when or how the transfer happened.',
  },
  {
    claim: 'That in 1934 the barrios of Baha and Talibayog were transferred to Calatagan from Balayan.',
    foundIn: ['municipal-history-2022'],
    why: 'We have not found the order that would have made the transfer.',
  },
  {
    claim: 'That in 1957 the Land Tenure Administration bought the hacienda lands from the Zobels and resold them to residents.',
    foundIn: ['municipal-history-2022'],
    why: 'We have not found the government record of the purchase.',
  },
  {
    claim: 'The date on which the National Museum declared the Calatagan Pot a National Cultural Treasure.',
    foundIn: ['municipal-history-2022'],
    why: 'Reported as 14 June 2010, but we did not find the declaration in a National Museum source.',
  },
];

export const citations: readonly Citation[] = citationList.map((c) => citationSchema.parse(c));
export const chapters: readonly Chapter[] = chapterList.map((c) => chapterSchema.parse(c));
export const timeline: readonly TimelineEntry[] = timelineList
  .map((t) => timelineEntrySchema.parse(t))
  .sort((a, b) => a.sortYear - b.sortYear);
export const unverified: readonly Unverified[] = unverifiedList.map((u) => unverifiedSchema.parse(u));

export const citationById = new Map(citations.map((c) => [c.id, c]));

/**
 * Citations numbered in order of first use across the chapters, so the page's
 * reference list reads top to bottom.
 */
export const citationNumbers: ReadonlyMap<string, number> = (() => {
  const order = new Map<string, number>();
  const visit = (ids: readonly string[]) => {
    for (const id of ids) if (!order.has(id)) order.set(id, order.size + 1);
  };
  for (const chapter of chapters) for (const claim of chapter.claims) visit(claim.cite);
  for (const entry of timeline) visit(entry.cite);
  for (const item of unverified) visit(item.foundIn);
  return order;
})();

export const orderedCitations: readonly Citation[] = [...citationNumbers.keys()].map(
  (id) => citationById.get(id)!,
);

export const HISTORY_RESEARCHED_ON = ACCESSED;
