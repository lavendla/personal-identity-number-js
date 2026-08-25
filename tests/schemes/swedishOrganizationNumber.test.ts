import { expect, test } from "vitest";
import { ParseFailure, Scheme } from "../../src/enums.js";
import type { SchemeResult } from "../../src/schemeResult.js";
import { parseSwedishOrganizationNumber } from "../../src/schemes/swedishOrganizationNumber.js";

/** Skatteverket's own organization number, published by Skatteverket. Third digit 2. */
const AGENCY = "2021005448";

/** Already twelve digits with the 16 legal-person prefix. Third digit of the body is 6. */
const PREFIXED = "165560360793";

/**
 * A published Skatteverket personal number. Its third digit is 0, because that
 * digit is the first digit of the month, which is exactly why 4 § lagen
 * (1974:174) fixes an organization number's at 2 or above.
 */
const PERSONAL_NUMBER = "0001019801";

function parse(input: string): SchemeResult | ParseFailure {
  return parseSwedishOrganizationNumber(input);
}

function accepted(input: string): SchemeResult {
  const result = parse(input);

  if (typeof result === "string") {
    throw new Error(`expected a SchemeResult, got ${result}`);
  }

  return result;
}

test("accepts a ten digit number", () => {
  expect(typeof parse(AGENCY)).not.toBe("string");
});

test("accepts a separator", () => {
  expect(accepted("202100-5448").canonical).toBe("162021005448");
});

test("adds the legal person prefix to the canonical form", () => {
  expect(accepted(AGENCY).canonical).toBe("162021005448");
});

test("leaves an already prefixed number unchanged", () => {
  expect(accepted(PREFIXED).canonical).toBe(PREFIXED);
});

test("resolves the scheme as organization number", () => {
  expect(accepted(AGENCY).scheme).toBe(Scheme.SeOrganizationNumber);
});

test("has no birth time", () => {
  expect(accepted(AGENCY).birthTime).toBeNull();
});

test("has no gender", () => {
  expect(accepted(AGENCY).gender).toBeNull();
});

/**
 * The case that proves the third-digit rule does work rather than decorating the
 * scheme file. There is no separate "third digit below 2" case to write: a
 * personnummer *is* such a number.
 */
test("rejects a personal number on the third digit rule", () => {
  expect(parse(PERSONAL_NUMBER)).toBe(ParseFailure.NotAnIdentityNumber);
});

test("rejects a bad check digit", () => {
  expect(parse("2021005449")).toBe(ParseFailure.ChecksumMismatch);
});

/**
 * Recognition first, exclusion second. A scheme that never ran could not say
 * this, and the caller would get NotAnIdentityNumber for their own option.
 */
test("reports scheme not allowed when organization numbers are excluded", () => {
  expect(parseSwedishOrganizationNumber(AGENCY, false)).toBe(
    ParseFailure.SchemeNotAllowed
  );
});

test("rejects a shape that is neither ten nor twelve digits", () => {
  expect(parse("20210054")).toBe(ParseFailure.NotAnIdentityNumber);
});
