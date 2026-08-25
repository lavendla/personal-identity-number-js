import { BirthDate } from "./birthDate.js";
import { isoDate, isRealDate } from "./dateValidator.js";

/**
 * What a number's date digits say about the bearer's birth — Skatteverket's
 * word "födelsetid", the six digits the check digit is computed from. The year is
 * always present. The month and the day are null when the number declares them
 * unknown, which a Swedish coordination number does with a month of `00` and a
 * day of `00` written as `60`, the offset applied.
 *
 * Deliberately not the same thing as BirthDate, which is a real calendar date and
 * refuses to be anything else. A partial birth time never becomes one and
 * birthDate() reports null for it — but the year stays available, which the short
 * form's +/- separator needs even when the rest is missing. This is also why the
 * constructor does not validate: isPossible() answers that question, because a
 * scheme has to be able to hold the digits before deciding they are refused.
 *
 * Fields rather than accessor methods, mirroring BirthDate for the same reason:
 * the PHP twin carries public readonly properties and neither type is exported
 * from index.ts, so the published surface is unaffected.
 */
export class BirthTime {
  constructor(
    readonly year: number,
    readonly month: number | null,
    readonly day: number | null
  ) {}

  isComplete(): boolean {
    return this.month !== null && this.day !== null;
  }

  toBirthDate(): BirthDate | null {
    if (this.month === null || this.day === null) {
      return null;
    }

    return new BirthDate(this.year, this.month, this.day);
  }

  isPossible(): boolean {
    return isRealDate(this.year, this.earliestMonth(), this.earliestDay());
  }

  earliestPossibleIso(): string {
    return isoDate(this.year, this.earliestMonth(), this.earliestDay());
  }

  /**
   * The earliest date the digits allow: an unknown month reads as January and an
   * unknown day as the 1st. Three questions need exactly this, and each would
   * answer differently on its own.
   *
   * Century resolution asks whether the bearer could have been born in the
   * candidate century, so it must only step back when even the earliest possible
   * date is after the reference. isPossible() asks whether what is known is
   * internally consistent, and January is what makes "is the day within 1-31" the
   * right question for an unknown month, because January has 31 days. The
   * future-birth check asks whether the bearer cannot yet exist at all — for
   * which the earliest date is again the only honest candidate.
   */
  private earliestMonth(): number {
    return this.month ?? 1;
  }

  private earliestDay(): number {
    return this.day ?? 1;
  }
}
