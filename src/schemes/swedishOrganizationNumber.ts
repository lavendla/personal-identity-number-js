import { luhn } from "../checksum.js";
import { ParseFailure, Scheme } from "../enums.js";
import type { SchemeResult } from "../schemeResult.js";

const SHAPE =
  /^(?<prefix>16)?(?<body>[0-9]{6})(?<separator>-)?(?<tail>[0-9]{4})$/;

/**
 * No reference date: an organization number encodes no birth date, so nothing
 * temporal applies. It does take allowOrganizationNumber, because reporting
 * SchemeNotAllowed requires having recognised the number first — a scheme the
 * dispatcher skipped could only ever produce NotAnIdentityNumber, handing the
 * caller "unrecognised" for their own option.
 */
export function parseSwedishOrganizationNumber(
  normalized: string,
  allowOrganizationNumber = true
): SchemeResult | ParseFailure {
  const groups = SHAPE.exec(normalized)?.groups;

  if (!groups) {
    return ParseFailure.NotAnIdentityNumber;
  }

  const tenDigits = `${groups.body}${groups.tail}`;

  // Before the checksum, deliberately. A personnummer's third digit is the first
  // digit of its month and so is 0 or 1; 4 § lagen (1974:174) fixes an
  // organization number's at 2 or above expressly to keep the two apart. A
  // Luhn-valid personnummer must be refused here for being the wrong kind of
  // thing, not for a checksum it actually passes.
  if (Number(tenDigits[2]) < 2) {
    return ParseFailure.NotAnIdentityNumber;
  }

  // Recognition first, exclusion second.
  if (!allowOrganizationNumber) {
    return ParseFailure.SchemeNotAllowed;
  }

  // Luhn runs over the ten digits, never the 16 prefix — the same trap as the
  // Swedish personal number, whose century is likewise absent from its input.
  if (luhn(tenDigits.slice(0, 9)) !== Number(tenDigits[9])) {
    return ParseFailure.ChecksumMismatch;
  }

  // Null for both derived fields: an organization number has no birth date and no
  // gender. This is the case the SchemeResult refactor was built for, so it needs
  // no change to the value object.
  return {
    birthTime: null,
    canonical: `16${tenDigits}`,
    gender: null,
    scheme: Scheme.SeOrganizationNumber,
  };
}
