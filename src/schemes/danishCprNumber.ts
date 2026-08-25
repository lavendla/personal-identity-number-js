import { BirthTime } from "../birthTime.js";
import { resolveCprCentury } from "../cprCenturyResolver.js";
import { isoDate, isoDateOf, isRealDate } from "../dateValidator.js";
import { Gender, ParseFailure, Scheme } from "../enums.js";
import type { SchemeResult } from "../schemeResult.js";

const SHAPE =
  /^(?<day>[0-9]{2})(?<month>[0-9]{2})(?<year>[0-9]{2})(?<separator>-)?(?<serial>[0-9]{4})$/;

/**
 * There is no checksum. Modulus-11 was abandoned by CPR in 2007 and its own
 * documentation states that numbers assigned without it are fully valid, so
 * enforcing it would reject real people. The consequence is that a single-digit
 * typo in the serial is undetectable: it silently resolves to a different
 * century rather than failing. See spec/schemes/dk/cpr-number.json.
 *
 * No allowCoordinationNumber parameter, because Denmark has no such scheme. The
 * dispatcher passes each scheme what that scheme actually uses.
 *
 * `separator` is captured and never read. An unmatched optional group is `''`
 * in PHP and `undefined` here, so the surest way to keep the runtimes agreeing
 * about it is for neither to consult it.
 */
export function parseDanishCprNumber(
  normalized: string,
  referenceDate: Date | null
): SchemeResult | ParseFailure {
  const groups = SHAPE.exec(normalized)?.groups;

  if (!groups) {
    return ParseFailure.NotAnIdentityNumber;
  }

  const serial = Number(groups.serial);
  const year = resolveCprCentury(Number(groups.year), serial);

  // A serial of 0000 falls outside every row of the published table, so the
  // lookup rejects it without a separate range check.
  if (year === null) {
    return ParseFailure.NotAnIdentityNumber;
  }

  const month = Number(groups.month);
  const day = Number(groups.day);

  // After the century lookup, never before: whether 29 February exists depends
  // on which century the serial resolved to.
  if (!isRealDate(year, month, day)) {
    return ParseFailure.ImpossibleDate;
  }

  if (
    referenceDate !== null &&
    isoDate(year, month, day) > isoDateOf(referenceDate)
  ) {
    return ParseFailure.FutureBirthDate;
  }

  return {
    birthTime: new BirthTime(year, month, day),
    canonical: `${groups.day}${groups.month}${groups.year}${groups.serial}`,
    gender: serial % 2 === 1 ? Gender.Male : Gender.Female,
    scheme: Scheme.DkCprNumber,
  };
}
