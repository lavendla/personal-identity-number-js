// Generated from spec/. Do not edit by hand — run `npm run codegen`.

export const SPEC_VERSION = "0.3.0"

export const FOLD: Readonly<Record<string, string>> = Object.freeze({
  " ": "",
  " ": "",
  " ": "",
  " ": "",
  "–": "-",
  "—": "-",
  "−": "-"
})

export const ALLOWED: ReadonlySet<string> = new Set(["0","1","2","3","4","5","6","7","8","9","-","+","A","B","C","D","E","F","H","J","K","L","M","N","P","R","S","T","U","V","W","X","Y"])

export const FAILURES = [
  "NotAnIdentityNumber",
  "UnsupportedScheme",
  "CountryNotSupported",
  "ChecksumMismatch",
  "ImpossibleDate",
  "FutureBirthDate",
  "InvalidCharacter",
  "SchemeNotAllowed",
  "CenturyRequired",
  "ReferenceDateRequired",
  "ImplausibleBirthDate"
] as const

/**
 * Earliest plausible birth year per scheme, keyed by scheme id. A resolved year
 * below the floor fails with ImplausibleBirthDate.
 */
export const MINIMUM_BIRTH_YEARS: Readonly<Record<string, number>> = {
  "se-personal-number": 1800,
  "dk-cpr-number": 1800
}

/**
 * Shapes a recognize-only scheme matches, keyed by country code, in the order
 * they are tried. Unanchored: the scheme anchors them.
 */
export const RECOGNIZE_ONLY_SHAPES: Readonly<Record<string, string>> = {
  "NO": "[0-9]{11}",
  "FI": "[0-9]{6}[-+ABCDEFUVWXY][0-9]{3}[0-9ABCDEFHJKLMNPRSTUVWXY]"
}

/**
 * The digit strings a Swedish number uses to declare a field unknown, and the
 * one four-digit tail exempt from the checksum. Declared in
 * spec/schemes/se/personal-number.json, where each carries its reasoning.
 */
export const SE_PARTIAL_IDENTITY: Readonly<Record<string, string>> = {
  "checksumExemptTail": "0000",
  "unknownBirthNumber": "000",
  "unknownDayEncoded": "60",
  "unknownMonth": "00"
}

export interface CprCenturyRow {
  readonly centuryBase: number
  readonly serialMaximum: number
  readonly serialMinimum: number
  readonly yearMaximum: number
  readonly yearMinimum: number
}

/**
 * CPR's published century table. A serial and two-digit year matching a row
 * resolve to centuryBase + year. Total for every serial 0001-9999; a serial of
 * 0000 matches no row, which is how DDMMYY-0000 is rejected.
 */
export const DK_CENTURY_TABLE: readonly CprCenturyRow[] = [
  {
    "centuryBase": 1900,
    "serialMaximum": 3999,
    "serialMinimum": 1,
    "yearMaximum": 99,
    "yearMinimum": 0
  },
  {
    "centuryBase": 2000,
    "serialMaximum": 4999,
    "serialMinimum": 4000,
    "yearMaximum": 36,
    "yearMinimum": 0
  },
  {
    "centuryBase": 1900,
    "serialMaximum": 4999,
    "serialMinimum": 4000,
    "yearMaximum": 99,
    "yearMinimum": 37
  },
  {
    "centuryBase": 2000,
    "serialMaximum": 8999,
    "serialMinimum": 5000,
    "yearMaximum": 57,
    "yearMinimum": 0
  },
  {
    "centuryBase": 1800,
    "serialMaximum": 8999,
    "serialMinimum": 5000,
    "yearMaximum": 99,
    "yearMinimum": 58
  },
  {
    "centuryBase": 2000,
    "serialMaximum": 9999,
    "serialMinimum": 9000,
    "yearMaximum": 36,
    "yearMinimum": 0
  },
  {
    "centuryBase": 1900,
    "serialMaximum": 9999,
    "serialMinimum": 9000,
    "yearMaximum": 99,
    "yearMinimum": 37
  }
]
