import { expect, test } from "vitest";
import { DK_CENTURY_TABLE } from "../src/generated/specData.js";

/**
 * The claim that CPR's century table is total — that no serial and year pair is
 * undecidable — is what makes Danish birthDate() fully determined. It was a
 * sentence in a JSON file; these assert it.
 */
function matchCount(serial: number, year: number): number {
  return DK_CENTURY_TABLE.filter(
    (row) =>
      serial >= row.serialMinimum &&
      serial <= row.serialMaximum &&
      year >= row.yearMinimum &&
      year <= row.yearMaximum
  ).length;
}

test("every valid serial and year matches exactly one row", () => {
  const ambiguous: string[] = [];

  for (let serial = 1; serial <= 9999; serial += 1) {
    for (let year = 0; year <= 99; year += 1) {
      if (matchCount(serial, year) !== 1) {
        ambiguous.push(`${serial}/${year}`);
      }
    }
  }

  expect(ambiguous).toStrictEqual([]);
});

test("serial zero matches no row", () => {
  expect(matchCount(0, 75)).toBe(0);
});
