/**
 * `Date.UTC(year, …)` remaps years 0–99 to 1900–1999, so it cannot be used
 * directly to construct a date from a parsed year. `setUTCFullYear` does not
 * carry that remapping — it sets the year exactly as given — so every date
 * built from parsed components must go through it instead.
 */
export function dateFromComponents(
  year: number,
  month: number,
  day: number
): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);

  return date;
}

/**
 * PHP's `checkdate()` rejects year 0 (it accepts only 1-32767); JavaScript's
 * `Date` has no such floor, so year 0 must be rejected explicitly here to
 * keep the two runtimes agreeing on `000001011238`-shaped input.
 */
export function isRealDate(year: number, month: number, day: number): boolean {
  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const date = dateFromComponents(year, month, day);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Zero-padded Y-m-d. Both sides of any comparison use this, so lexical order
 * equals chronological order and no timezone is ever involved.
 */
export function isoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The reference date rendered with the same rule, for comparison. */
export function isoDateOf(date: Date): string {
  return isoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}
