import { expect, test } from "vitest";
import {
  Scheme,
  schemeDisplayElision,
  schemeDisplaySplit,
  schemeShortFormElidesCentury,
} from "../src/enums.js";

/**
 * How a canonical form is shaped is a property of the scheme, not of the value
 * object holding it. Asserted here across every member so a scheme added later
 * cannot quietly inherit Sweden's twelve-digit assumptions.
 */
test.each([
  [Scheme.SePersonalNumber, 8],
  [Scheme.SeCoordinationNumber, 8],
  [Scheme.SeOrganizationNumber, 6],
  [Scheme.DkCprNumber, 6],
])("%s splits its display form after %i characters", (scheme, expected) => {
  expect(schemeDisplaySplit(scheme)).toBe(expected);
});

test.each([
  [Scheme.SePersonalNumber, true],
  [Scheme.SeCoordinationNumber, true],
  [Scheme.SeOrganizationNumber, false],
  [Scheme.DkCprNumber, false],
])("%s elides a century in its short form: %s", (scheme, expected) => {
  expect(schemeShortFormElidesCentury(scheme)).toBe(expected);
});

test.each([
  [Scheme.SePersonalNumber, 0],
  [Scheme.SeCoordinationNumber, 0],
  [Scheme.SeOrganizationNumber, 2],
  [Scheme.DkCprNumber, 0],
])("%s drops %i leading characters in its display form", (scheme, expected) => {
  expect(schemeDisplayElision(scheme)).toBe(expected);
});
