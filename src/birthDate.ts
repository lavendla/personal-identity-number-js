import { dateFromComponents, isoDate, isRealDate } from "./dateValidator.js";

/**
 * A real calendar birth date, already stripped of any encoding quirk. A Swedish
 * coordination number's +60 day offset is removed by the scheme before this is
 * built: the offset describes the number, not the person's birthday.
 *
 * Fields rather than accessor methods, deliberately. The methods-everywhere
 * rule exists so the two published surfaces can be compared by eye, and the PHP
 * BirthDate carries public readonly properties — `birthDate.year` beside
 * `$birthDate->year` is the comparison that rule protects. This type is never
 * exported from index.ts, so the published surface is unaffected.
 */
export class BirthDate {
  /**
   * The guard is not redundant with the schemes, which all validate before
   * constructing. Date construction rolls an impossible date forward instead of
   * refusing it, so an unchecked BirthDate(2024, 2, 30) answered 2024-02-30
   * from iso() and 2024-03-01 from toDate(). An invariant held only by
   * convention is one a later caller breaks silently, and a silently wrong
   * birth date is the worst thing this package can produce.
   *
   * This throw is a programming error, never a parse outcome. Callers see
   * ParseFailure members; nothing here reaches them.
   */
  constructor(
    readonly year: number,
    readonly month: number,
    readonly day: number
  ) {
    if (!isRealDate(year, month, day)) {
      throw new RangeError("BirthDate requires a real calendar date.");
    }
  }

  iso(): string {
    return isoDate(this.year, this.month, this.day);
  }

  toDate(): Date {
    return dateFromComponents(this.year, this.month, this.day);
  }
}
