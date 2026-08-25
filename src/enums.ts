/**
 * The national registry that issued a number — never where a person lives.
 *
 * These disagree for foreign nationals: a Norwegian resident in Sweden has a
 * Swedish address and a Norwegian identity number. Using a residence country
 * here produces wrong data silently.
 */
export const Country = {
  Sweden: "SE",
  Denmark: "DK",
  Norway: "NO",
  Finland: "FI",
} as const;
export type Country = (typeof Country)[keyof typeof Country];

export const Scheme = {
  SePersonalNumber: "se-personal-number",
  SeCoordinationNumber: "se-coordination-number",
  SeOrganizationNumber: "se-organization-number",
  DkCprNumber: "dk-cpr-number",
} as const;
export type Scheme = (typeof Scheme)[keyof typeof Scheme];

export const ParseFailure = {
  NotAnIdentityNumber: "not-an-identity-number",
  UnsupportedScheme: "unsupported-scheme",
  CountryNotSupported: "country-not-supported",
  ChecksumMismatch: "checksum-mismatch",
  ImpossibleDate: "impossible-date",
  FutureBirthDate: "future-birth-date",
  InvalidCharacter: "invalid-character",
  SchemeNotAllowed: "scheme-not-allowed",
  CenturyRequired: "century-required",
  ReferenceDateRequired: "reference-date-required",
  /**
   * Structurally valid, but the resolved birth year is before the scheme's
   * declared floor. Deliberately distinct from ImpossibleDate: "that date does
   * not exist" and "that date exists but nobody alive was born then" are
   * different information, and a consumer bucketing contaminated data needs to
   * tell them apart.
   */
  ImplausibleBirthDate: "implausible-birth-date",
} as const;
export type ParseFailure = (typeof ParseFailure)[keyof typeof ParseFailure];

/**
 * What the registries encode, which is binary. Not a statement about anything
 * else — consumers needing a richer model should carry their own alongside it.
 */
export const Gender = { Male: "male", Female: "female" } as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const Format = {
  Canonical: "canonical",
  Display: "display",
  Short: "short",
  Masked: "masked",
} as const;
export type Format = (typeof Format)[keyof typeof Format];

export function schemeCountry(scheme: Scheme): Country {
  return scheme === Scheme.DkCprNumber ? Country.Denmark : Country.Sweden;
}

export function schemeIsPerson(scheme: Scheme): boolean {
  return scheme !== Scheme.SeOrganizationNumber;
}

/**
 * How many leading characters Format.Display drops from the canonical form.
 *
 * Only organization numbers drop any. Their `16` is a legal-person marker rather
 * than data about the entity, and the form Swedish organization numbers are
 * actually written in — `202100-5448` — does not show it. Nothing is lost:
 * canonical() still carries it, and that is the value applications index on.
 */
export function schemeDisplayElision(scheme: Scheme): number {
  return scheme === Scheme.SeOrganizationNumber ? 2 : 0;
}

/**
 * Whether Format.Short elides a century, which is the only reason it ever needs
 * a reference date: the `+`/`-` separator reports whether the bearer has turned
 * 100 at that date.
 *
 * True only for Sweden's personal and coordination numbers. Denmark's ten-digit
 * form carries no century, and an organization number has no bearer and no age —
 * so for both, Short is Display and no reference date is required. An earlier
 * version asked schemeCarriesCentury(), which answered true for organization
 * numbers because their `16` occupies the same two positions, and made
 * Format.Short throw ReferenceDateRequired for a value that has no age.
 */
export function schemeShortFormElidesCentury(scheme: Scheme): boolean {
  return (
    scheme === Scheme.SePersonalNumber || scheme === Scheme.SeCoordinationNumber
  );
}

export function schemeDisplaySplit(scheme: Scheme): number {
  switch (scheme) {
    case Scheme.SePersonalNumber:
    case Scheme.SeCoordinationNumber:
      return 8;
    case Scheme.SeOrganizationNumber:
    case Scheme.DkCprNumber:
      return 6;
  }
}
