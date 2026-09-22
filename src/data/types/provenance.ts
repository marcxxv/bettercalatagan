/**
 * Provenance and readiness types for Better Calatagan civic data.
 *
 * Every civic fact published by this project carries a `DataSource`. The rules
 * encoded here are enforced by `src/data/civic-data.test.ts`, not by convention.
 *
 * See docs/adr/0001-provenance-model.md for the rationale.
 */

/** ISO 8601 calendar date, e.g. "2026-09-22". */
export type IsoDate = `${number}-${number}-${number}`;

/**
 * Where a fact came from, ranked by the evidence hierarchy in CONTRIBUTING.md.
 * A lower-authority source may help *discover* evidence but must never silently
 * stand in for a higher-authority one.
 */
export type SourceAuthority =
  | 'primary-government' //  1. National or local government, issued directly
  | 'government-hosted-copy' //  2. Government-hosted copy of municipal material
  | 'government-derived-dataset' //  3. Structured dataset derived from government data
  | 'civic-tech-derivative' //  4. BetterGov and similar civic-tech derivatives
  | 'academic' //  5. Peer-reviewed or institutional research
  | 'reputable-secondary' //  6. Established news organisations
  | 'archived-official' //  7. Archive copy of a formerly official source
  | 'third-party-document-host' //  8. Scribd, Studocu and similar
  | 'social-media' //  9. Official accounts on social platforms
  | 'tertiary'; // 10. Encyclopaedias and aggregators

/**
 * How well a value has been checked.
 *
 * - `verified`   a maintainer read the value in a source at or above
 *                `government-derived-dataset`, or reconciled it against one.
 * - `reported`   an identifiable, credible source states it, but direct
 *                confirmation from the issuing authority is still pending.
 * - `unverified` recorded for triage only. Never publishable.
 */
export type VerificationStatus = 'verified' | 'reported' | 'unverified';

/**
 * What the record *is*, as distinct from how old it is.
 *
 * Deliberately not an age rule. A census can be two years old and still be the
 * latest official release; a contact number can be six months old and already
 * wrong. Age alone decides nothing here.
 */
export type RecordStatus =
  | 'current' // Describes the present and is expected to still hold
  | 'latest-official' // Most recent official release, even if its period has passed
  | 'historical' // A past period, published as history
  | 'archived' // Recovered from an archive of a source no longer online
  | 'draft' // Not yet adopted or still under review
  | 'unverified'; // Held for triage

/**
 * Publication readiness. Mirrors the tiers in SOURCES.md.
 *
 * Tiers 1 and 2 are published. Tiers 3 and 4 are retained in the repository for
 * auditability but must never reach a rendered page or a machine-readable export.
 */
export type ReadinessTier =
  | 1 // Verified, publishable as-is
  | 2 // Publishable with an explicit, displayed caveat
  | 3 // Internal only; needs more verification
  | 4; // Withheld

/** How often the issuing authority is expected to publish a new value. */
export type RefreshCadence =
  | 'quarterly'
  | 'annual'
  | 'per-census'
  | 'per-election'
  | 'per-issuance'
  | 'irregular'
  | 'none';

/** A single citation. */
export interface SourceReference {
  /** Human-readable name, e.g. "BLGF Memorandum Circular No. 020.2024". */
  name: string;
  /** The publishing body, e.g. "Bureau of Local Government Finance". */
  publisher: string;
  /** Canonical URL. Must be https. */
  url: `https://${string}`;
  /** When a maintainer last actually opened this URL. */
  accessedOn: IsoDate;
  authority: SourceAuthority;
  /** Web archive copy, where one is held. */
  archiveUrl?: `https://${string}`;
  /** Page, sheet, section or row that carries the value. */
  locator?: string;
  /** SHA-256 of the retrieved file, where the source is a file. */
  sha256?: string;
}

/** The provenance envelope attached to every civic record. */
export interface DataSource {
  sources: readonly SourceReference[];
  /**
   * The period the DATA describes. Free text because sources express it in
   * different shapes ("1 July 2024", "CY2026 Q2", "effective 1 January 2025").
   */
  asOf?: string;
  /** When a maintainer last checked this record against its sources. */
  lastVerified: IsoDate;
  verification: VerificationStatus;
  status: RecordStatus;
  tier: ReadinessTier;
  expectedRefresh: RefreshCadence;
  /**
   * True when this is the most recent official release, even if its period has
   * passed. Drives the freshness label instead of a raw age calculation.
   */
  isLatestKnownOfficial?: boolean;
  /** How the figure was produced, where that matters for interpretation. */
  methodology?: string;
  /** Required for tier 2. Displayed to the reader verbatim. */
  caveat?: string;
  /** Maintainer notes. Not rendered. */
  note?: string;
}

/** A civic record bundled with its provenance. */
export interface Sourced<T> {
  data: T;
  source: DataSource;
}

/** Tiers that may be rendered or exported. */
export const PUBLISHABLE_TIERS: readonly ReadinessTier[] = [1, 2];

export function isPublishable(source: DataSource): boolean {
  return PUBLISHABLE_TIERS.includes(source.tier);
}
