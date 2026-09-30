/**
 * Municipal services, as each office listed them in its 2022 Citizen's Charter.
 *
 * Every Philippine LGU office must publish a Citizen's Charter (R.A. 11032,
 * the Ease of Doing Business Act): each service, who may avail of it, its
 * requirements, steps, fees and processing time. Calatagan's 2022 charters
 * survive only in the Internet Archive's copy of the former municipal website.
 *
 * What is published here, and what is not:
 *  - the service names each office listed, which office provides them, and who
 *    may avail of them, read from the charters themselves (text layer, checked
 *    against the page) on the date in `lastVerified`;
 *  - NOT the fees, processing times or requirements. Those are four years old
 *    and are exactly the details most likely to have changed; restating them
 *    here would present them as current. Each office links to its charter so a
 *    reader can see them in context, dated.
 *
 * Service names are the charter's own, in sentence case, with obvious typing
 * errors corrected ("Insuance" → "Issuance"). Internal services (between
 * offices, or for municipal employees) are kept separate from those for the
 * public, as the charters themselves separate them.
 */
import { archivedDocuments, WAYBACK_CALATAGAN } from './documents.js';
import type { DataSource } from './types/provenance.js';

export type ServiceCategory =
  | 'civil-registry'
  | 'business'
  | 'tax-property'
  | 'health'
  | 'social-welfare'
  | 'agriculture'
  | 'jobs'
  | 'disaster'
  | 'environment'
  | 'transport'
  | 'tourism'
  | 'government';

export const SERVICE_CATEGORIES: Record<ServiceCategory, { label: string; blurb: string }> = {
  'civil-registry': {
    label: 'Certificates and civil registry',
    blurb: 'Births, marriages and deaths, corrections, and certifications',
  },
  business: { label: 'Business and permits', blurb: 'Business permits, zoning, building and sanitary permits' },
  'tax-property': { label: 'Taxes and property', blurb: 'Real property tax, tax declarations, cedula and clearances' },
  health: { label: 'Health', blurb: 'Consultations, maternal and child care, vaccines and certificates' },
  'social-welfare': { label: 'Social welfare', blurb: 'Assistance, senior citizen and PWD IDs, relief' },
  agriculture: { label: 'Agriculture and fisheries', blurb: 'Farmer and fisherfolk registration, seeds, animal health' },
  jobs: { label: 'Jobs and employment', blurb: 'Job fairs, referrals, skills training and municipal hiring' },
  disaster: { label: 'Emergencies and disasters', blurb: 'Emergency response, ambulance and disaster response' },
  environment: { label: 'Environment and waste', blurb: 'Solid waste collection, segregation and monitoring' },
  transport: { label: 'Tricycles and transport', blurb: 'Tricycle franchises, registration and permits' },
  tourism: { label: 'Tourism', blurb: 'Help for tourism enterprises with accreditation' },
  government: { label: 'Municipal records and requests', blurb: 'Data, maps, certified copies, the Mayor’s Office' },
};

export interface Service {
  name: string;
  category: ServiceCategory;
  /** Who may avail, as the charter puts it, when it says more than "All". */
  who?: string;
  /** The charter lists it as available around the clock. */
  allHours?: boolean;
}

export interface Office {
  slug: string;
  name: string;
  /** Common short name, as used on the ground. */
  short?: string;
  /** The archived charter's document id (see archived-documents.json). */
  charter: string;
  services: Service[];
  /** Internal services: between offices, or for municipal employees. */
  internal?: string[];
}

export const offices: Office[] = [
  {
    slug: 'civil-registrar',
    name: 'Municipal Civil Registrar',
    short: 'MCR',
    charter: 'doc-20220303173509-z66llvj5',
    services: [
      { name: 'Timely registration of birth (legitimate child)', category: 'civil-registry', who: 'Parents, guardians, the attendant at birth or hospital authorities' },
      { name: 'Timely registration of birth (illegitimate child)', category: 'civil-registry', who: 'Parents, guardians, the attendant at birth or hospital authorities' },
      { name: 'Delayed registration of birth (legitimate child)', category: 'civil-registry' },
      { name: 'Delayed registration of birth (illegitimate child)', category: 'civil-registry' },
      { name: 'Certificate of foundling', category: 'civil-registry' },
      { name: 'Timely registration of death', category: 'civil-registry' },
      { name: 'Delayed registration of death', category: 'civil-registry' },
      { name: 'Application for a marriage licence', category: 'civil-registry' },
      { name: 'Timely registration of a certificate of marriage', category: 'civil-registry' },
      { name: 'Delayed registration of a certificate of marriage', category: 'civil-registry' },
      { name: 'Issuance of transcription copies of births, marriages and deaths', category: 'civil-registry', who: 'The document owner or an authorised representative' },
      { name: 'Petition for correction of a clerical error or change of first name (R.A. 9048 / R.A. 10172)', category: 'civil-registry' },
      { name: 'Registration of an approved petition for correction or change of first name (R.A. 9048)', category: 'civil-registry' },
      { name: 'Registration of a legal instrument', category: 'civil-registry' },
      { name: 'Registration of a court decree or order', category: 'civil-registry' },
      { name: 'Supplemental report of birth, death or marriage', category: 'civil-registry' },
      { name: 'Correction of registry number and geographic and statistical portion', category: 'civil-registry' },
      { name: 'PSA copies of birth, death and marriage certificates, CEMAR and CENOMAR (BREQS)', category: 'civil-registry' },
    ],
  },
  {
    slug: 'business-permits',
    name: 'Business Permit and Licensing Office',
    short: 'BPLO',
    charter: 'doc-20220302131048-pkb3g2po',
    services: [
      { name: 'Business registration (new application)', category: 'business', who: 'Business owners' },
      { name: 'Business registration (renewal)', category: 'business', who: 'Business owners' },
    ],
  },
  {
    slug: 'treasurer',
    name: 'Municipal Treasurer’s Office',
    short: 'MTO',
    charter: 'doc-20220806073210-bvm4kncj',
    services: [
      { name: 'Issuance of community tax certificate (cedula)', category: 'tax-property' },
      { name: 'Official receipts for civil registry matters', category: 'civil-registry' },
      { name: 'Payment for the sale or lease of a cemetery lot', category: 'tax-property' },
      { name: 'Payment of real property tax', category: 'tax-property' },
      { name: 'Issuance of tax clearance', category: 'tax-property' },
      { name: 'Preparation of a tax bill or letter of delinquency', category: 'tax-property' },
      { name: 'Other official receipts (police clearance, transfer, building and market fees, large cattle registration)', category: 'tax-property' },
      { name: 'Payment for the Mayor’s business permit', category: 'business' },
    ],
    internal: ['Disbursement of funds and payment of vouchers', 'Encashment of checks'],
  },
  {
    slug: 'assessor',
    name: 'Office of the Municipal Assessor',
    charter: 'doc-20220303172443-i2vy2noe',
    services: [
      { name: 'Declaration of real property for taxation, land and improvements (first time)', category: 'tax-property' },
      { name: 'Declaration of real property for taxation, buildings (first time)', category: 'tax-property' },
      { name: 'Transfer of a tax declaration (purchase, donation or other conveyance)', category: 'tax-property' },
      { name: 'Certification of property holdings or of no property', category: 'tax-property' },
      { name: 'Annotation of a mortgage', category: 'tax-property' },
      { name: 'Certified copies of assessment records', category: 'tax-property' },
      { name: 'Record certification', category: 'tax-property' },
    ],
  },
  {
    slug: 'planning',
    name: 'Municipal Planning and Development Office',
    short: 'MPDO',
    charter: 'doc-20220302131108-wxoocacr',
    services: [
      { name: 'Maps, statistics and other municipal data', category: 'government', who: 'Any interested group or individual' },
      { name: 'Locational clearance and zoning certification', category: 'business' },
    ],
  },
  {
    slug: 'engineering',
    name: 'Office of the Municipal Engineer',
    short: 'MEO',
    charter: 'doc-20220303202812-z5h2gfhb',
    services: [
      { name: 'Building permit', category: 'business' },
      { name: 'Occupancy permit', category: 'business' },
    ],
  },
  {
    slug: 'health',
    name: 'Municipal Health Office',
    short: 'RHU',
    charter: 'doc-20220304170350-jn2mbihd',
    services: [
      { name: 'Medical consultation', category: 'health' },
      { name: 'Laboratory examinations', category: 'health' },
      { name: 'Maternal and child care: prenatal care', category: 'health' },
      { name: 'Maternal and child care: postnatal care', category: 'health' },
      { name: 'Maternal and child care: newborn and child care', category: 'health' },
      { name: 'Family planning', category: 'health' },
      { name: 'Control of communicable, degenerative and emerging diseases', category: 'health' },
      { name: 'Enrolment in TB-DOTS', category: 'health' },
      { name: 'Dental consultation', category: 'health' },
      { name: 'Anti-rabies vaccine', category: 'health' },
      { name: 'Free medicine', category: 'health' },
      { name: 'Pre-marriage counselling', category: 'health' },
      { name: 'Medical certificate', category: 'health' },
      { name: 'Medical certificate for a birth certificate', category: 'civil-registry' },
      { name: 'Death certificate', category: 'civil-registry' },
      { name: 'Gender certificate', category: 'civil-registry' },
      { name: 'Medico-legal report', category: 'health' },
      { name: 'Sanitary permit', category: 'business' },
      { name: 'Disease surveillance and monitoring', category: 'health' },
      { name: 'Environmental sanitation', category: 'health' },
      { name: 'Complaints about establishments', category: 'health' },
      { name: 'COVID-19 swab testing, isolation and vaccination (as listed in 2022)', category: 'health' },
    ],
  },
  {
    slug: 'social-welfare',
    name: 'Municipal Social Welfare and Development Office',
    short: 'MSWDO',
    charter: 'doc-20220302131155-daf5ao4h',
    services: [
      { name: 'Assistance to Individuals in Crisis Situation (AICS)', category: 'social-welfare', who: 'Indigent individuals and families' },
      { name: 'Social case study report', category: 'social-welfare', who: 'Indigent clients and patients' },
      { name: 'Certificate of indigency', category: 'social-welfare', who: 'Indigent individuals and families' },
      { name: 'Person with disability (PWD) identification card', category: 'social-welfare' },
      { name: 'Pre-marriage counselling', category: 'social-welfare', who: 'Couples' },
      { name: 'Senior citizen identification card and social pension', category: 'social-welfare', who: 'Senior citizens, 60 years old and above' },
      { name: 'Disaster relief assistance', category: 'disaster', who: 'Victims of natural or man-made calamities' },
    ],
  },
  {
    slug: 'mayor',
    name: 'Office of the Mayor',
    charter: 'doc-20220302131952-i4knt3v2',
    services: [
      { name: 'Mayor’s clearance, certifications, recommendation and endorsement letters', category: 'government' },
      { name: 'Mayor’s permits, affidavits and related documents', category: 'government' },
      { name: 'Marriage certificate and scheduling of solemnisation', category: 'civil-registry' },
      { name: 'Assistance to researchers, group studies and surveys', category: 'government' },
      { name: 'Use of the covered court and conference room', category: 'government' },
      { name: 'Receiving and responding to correspondence', category: 'government' },
      { name: 'Financial and material assistance for indigent individuals and barangays', category: 'social-welfare' },
      { name: 'Appointment with the Mayor', category: 'government' },
    ],
  },
  {
    slug: 'agriculture',
    name: 'Office of the Municipal Agriculturist',
    short: 'MAO',
    charter: 'doc-20220303175635-2rbuzz23',
    services: [
      { name: 'Farmer registration', category: 'agriculture', who: 'Farmers of Calatagan' },
      { name: 'Distribution of assorted vegetable seeds', category: 'agriculture' },
      { name: 'Crop insurance', category: 'agriculture' },
      { name: 'Organisation and registration of farmers’ associations and cooperatives', category: 'agriculture' },
      { name: 'Technical assistance and monitoring for farmers', category: 'agriculture' },
      { name: 'Farmers’ training', category: 'agriculture' },
      { name: 'Fisherfolk registration', category: 'agriculture', who: 'Qualified fisherfolk of Calatagan' },
      { name: 'Fisherfolk ID', category: 'agriculture', who: 'Qualified fisherfolk of Calatagan' },
      { name: 'Municipal fishing boat registration (3 gross tonnes and below)', category: 'agriculture' },
      { name: 'Fishery permits and licences (including seaweed culture)', category: 'agriculture' },
      { name: 'Insurance for seaweed and municipal fishing boats', category: 'agriculture' },
      { name: 'Organisation of fisherfolk associations', category: 'agriculture' },
      { name: 'Technical assistance and monitoring for fisherfolk', category: 'agriculture' },
      { name: 'Distribution of fishery projects (nets, batteries, processing materials)', category: 'agriculture' },
      { name: 'Enforcement of fishery laws', category: 'agriculture' },
      { name: 'Dispersal of tilapia fingerlings', category: 'agriculture' },
      { name: 'Rabies immunisation of dogs and cats', category: 'agriculture' },
      { name: 'Disease immunisation of small and large animals', category: 'agriculture', who: 'Livestock farmers' },
      { name: 'Animal inspection certificate', category: 'agriculture' },
      { name: 'Routine veterinary services', category: 'agriculture', who: 'Livestock farmers' },
    ],
  },
  {
    slug: 'peso',
    name: 'Public Employment Service Office',
    short: 'PESO',
    charter: 'doc-20220302131144-qfdaiysk',
    services: [
      { name: 'Local recruitment activities', category: 'jobs', who: 'Local companies' },
      { name: 'Job fairs', category: 'jobs', who: 'Local companies' },
      { name: 'Walk-in applicants: referral and placement', category: 'jobs' },
      { name: 'Skills training', category: 'jobs' },
    ],
  },
  {
    slug: 'human-resource',
    name: 'Human Resource Management Office',
    short: 'HRMO',
    charter: 'doc-20220303175818-rzureaob',
    services: [{ name: 'Applying for employment with the municipality', category: 'jobs' }],
    internal: [
      'Certificate of employment',
      'Authentication of a civil service certificate of eligibility',
      'Application for leave',
      'Travel authority',
      'Service record',
    ],
  },
  {
    slug: 'disaster',
    name: 'Municipal Disaster Risk Reduction and Management Office',
    short: 'MDRRMO',
    charter: 'doc-20220302131217-5u6kqm3g',
    services: [
      { name: 'Emergency response (trauma and medical emergencies)', category: 'disaster', allHours: true },
      { name: 'Ambulance on request', category: 'disaster', allHours: true },
      { name: 'Disaster response (natural hazards)', category: 'disaster' },
      { name: 'Capacity development: training and seminars', category: 'disaster' },
    ],
  },
  {
    slug: 'environment',
    name: 'Municipal Environment and Natural Resources Office',
    short: 'MENRO',
    charter: 'doc-20220303173912-rzab7ryw',
    services: [
      { name: 'Waste segregation at source and source reduction', category: 'environment' },
      { name: 'Collection and hauling of solid waste', category: 'environment' },
      { name: 'Alternative technologies for residual and biodegradable waste', category: 'environment' },
      { name: 'Information, education and communication', category: 'environment' },
      { name: 'Evaluation and monitoring', category: 'environment', who: 'All citizens of Calatagan' },
    ],
  },
  {
    slug: 'sangguniang-bayan',
    name: 'Office of the Sangguniang Bayan',
    short: 'SB',
    charter: 'doc-20220303172847-rp2bvion',
    services: [
      { name: 'Approval of resolutions and ordinances', category: 'government' },
      { name: 'Certifications, photocopies and certified true copies of Sangguniang Bayan documents', category: 'government' },
      { name: 'Accreditation of civil society, non-government and people’s organisations', category: 'government' },
      { name: 'Tricycle franchise application', category: 'transport', who: 'Filipino citizens resident in Calatagan' },
      { name: 'Tricycle registration and permit', category: 'transport', who: 'Residents of Calatagan with a tricycle franchise' },
      { name: 'Cancellation of franchise, change of unit and other franchise certifications', category: 'transport' },
      { name: 'Registration and permit of a tricycle for private use', category: 'transport' },
    ],
  },
  {
    slug: 'tourism',
    name: 'Municipal Tourism Office',
    charter: 'doc-20220302131138-naay3irm',
    services: [
      { name: 'Assistance to primary tourism enterprises with Department of Tourism accreditation', category: 'tourism' },
      { name: 'Assistance to tourism-related establishments with the Batangas Provincial Tourism and Cultural Affairs Office', category: 'tourism' },
    ],
  },
  {
    slug: 'budget',
    name: 'Municipal Budget Office',
    charter: 'doc-20220303171844-hgmnjx6g',
    services: [],
    internal: ['Checking vouchers for available appropriation', 'Review of barangay budgets', 'Review of supporting documents'],
  },
  {
    slug: 'accountant',
    name: 'Office of the Municipal Accountant',
    charter: 'doc-20220303172817-i6ojctp6',
    services: [],
    internal: ['Processing of vouchers', 'Processing of remittances'],
  },
];

/** The archived charter document behind each office, resolved from the archive index. */
export const charterDocuments = new Map(
  offices.map((office) => {
    const doc = archivedDocuments.documents.find((d) => d.id === office.charter);
    if (!doc) throw new Error(`services.ts: charter ${office.charter} for ${office.name} is not in the archive index`);
    return [office.slug, doc] as const;
  }),
);

export const servicesSource: DataSource = {
  sources: [
    {
      ...WAYBACK_CALATAGAN,
      name: 'Citizen’s Charters of the Municipality of Calatagan (2022), as archived',
      locator: 'Eighteen office charters published on calatagan.gov.ph in March and August 2022',
      accessedOn: '2026-09-30',
    },
  ],
  asOf: '2022 (the year the charters were published)',
  lastVerified: '2026-09-30',
  verification: 'verified',
  status: 'archived',
  tier: 2,
  expectedRefresh: 'irregular',
  methodology:
    'Each office’s 2022 Citizen’s Charter was retrieved from the Internet Archive and read: the service names, the office, whether the service is for the public or internal, and who may avail were taken from the charter’s own service headings and tables. Names are given in sentence case with obvious typing errors corrected.',
  caveat:
    'These are the services the municipality listed in 2022, on a website that is now offline. Offices, services, requirements, fees and processing times may have changed since. Fees and times are deliberately not restated here: check the dated charter, and confirm at the municipal hall before you go.',
};

export const publicServiceCount = offices.reduce((n, office) => n + office.services.length, 0);
