import { DK_CENTURY_TABLE } from "./generated/specData.js";

/**
 * Denmark's century is looked up, not inferred: CPR publishes a table crossing
 * the two-digit year with the serial, and it is total for every serial from
 * 0001 up.
 *
 * There is deliberately no reference date parameter, unlike resolveCentury for
 * Sweden. The same input resolves identically whenever it is asked, and a date
 * this function did not use would invite the assumption that it did.
 *
 * Returns null only for a serial outside 0001-9999, which is not a CPR.
 */
export function resolveCprCentury(
  twoDigitYear: number,
  serial: number
): number | null {
  for (const row of DK_CENTURY_TABLE) {
    if (
      serial >= row.serialMinimum &&
      serial <= row.serialMaximum &&
      twoDigitYear >= row.yearMinimum &&
      twoDigitYear <= row.yearMaximum
    ) {
      return row.centuryBase + twoDigitYear;
    }
  }

  return null;
}
