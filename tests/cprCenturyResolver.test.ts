import { expect, test } from "vitest";
import { resolveCprCentury } from "../src/cprCenturyResolver.js";

/**
 * One case per row of CPR's published table.
 *
 * The 58-99 rows are the counterintuitive ones and are why this test exists:
 * serials 5000-8999 for those years are reserved for nineteenth century
 * births, so a serial of 8967 with year 75 is a person born in 1875, not 1975.
 * The design's own worked example uses exactly that. Anyone "correcting" these
 * to the intuitive answer has broken the table.
 */
test.each([
  [75, 3000, 1975],
  [36, 4500, 2036],
  [37, 4500, 1937],
  [57, 6000, 2057],
  [58, 6000, 1858],
  [75, 8967, 1875],
  [36, 9500, 2036],
  [37, 9500, 1937],
])(
  "resolves year %i with serial %i to %i",
  (twoDigitYear, serial, expected) => {
    expect(resolveCprCentury(twoDigitYear, serial)).toBe(expected);
  }
);

test("serial zero resolves to nothing", () => {
  expect(resolveCprCentury(75, 0)).toBeNull();
});
