import { BirthTime } from "./birthTime.js";
import { isoDateOf } from "./dateValidator.js";

/**
 * Resolves a two-digit year to a four-digit one against a caller-supplied
 * reference date. Never consults the system clock: the same input must resolve
 * identically today, next year and in every runtime.
 */
export function resolveCentury(
  twoDigitYear: number,
  month: number | null,
  day: number | null,
  bornOverCenturyAgo: boolean,
  referenceDate: Date
): number {
  const referenceYear = referenceDate.getUTCFullYear();
  let candidate = Math.floor(referenceYear / 100) * 100 + twoDigitYear;

  if (isAfterReference(candidate, month, day, referenceDate)) {
    candidate -= 100;
  }

  return bornOverCenturyAgo ? candidate - 100 : candidate;
}

/**
 * The earliest date the digits allow, never the digits as written.
 *
 * A coordination number's day carries the +60 offset, and as a string
 * "2026-01-61" is greater than every real day in the same month — so passing the
 * offset day made any coordination number whose year and month matched the
 * reference date's resolve a century early. Measured: `2601612381`, a published
 * Skatteverket number for 1 January 2026, resolved to 1926-01-01 against a
 * reference date of 2026-01-15 and correctly against 2026-08-16. Both runtimes
 * shared the algorithm and so agreed on the wrong answer, and no fixture used a
 * ten-digit coordination number, so golden:check was green throughout.
 *
 * The nullable month and day are the partial-identity case, and they need the
 * same rule for a different reason: with the month unknown there is no date to
 * compare, and the earliest one the digits allow is the only candidate that
 * cannot wrongly push a real bearer back a century.
 */
function isAfterReference(
  year: number,
  month: number | null,
  day: number | null,
  referenceDate: Date
): boolean {
  return (
    new BirthTime(year, month, day).earliestPossibleIso() >
    isoDateOf(referenceDate)
  );
}
