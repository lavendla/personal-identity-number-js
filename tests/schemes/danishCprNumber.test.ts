import { expect, test } from "vitest";
import { Gender, ParseFailure, Scheme } from "../../src/enums.js";
import type { SchemeResult } from "../../src/schemeResult.js";
import { parseDanishCprNumber } from "../../src/schemes/danishCprNumber.js";

const REFERENCE_DATE = new Date("2026-08-16T00:00:00.000Z");

/** MedCom reserved serial 9996, resolving to 1948-12-25. Even serial, so female. */
const MEDCOM_FEMALE = "251248-9996";

/** MedCom reserved serial 9995, resolving to 1990-04-01. Odd serial, so male. */
const MEDCOM_MALE = "010490-9995";

function parse(input: string): SchemeResult | ParseFailure {
  return parseDanishCprNumber(input, REFERENCE_DATE);
}

function accepted(input: string): SchemeResult {
  const result = parse(input);

  if (typeof result === "string") {
    throw new Error(`expected a SchemeResult, got ${result}`);
  }

  return result;
}

test("accepts a ten digit number with a separator", () => {
  expect(typeof parse(MEDCOM_FEMALE)).not.toBe("string");
});

test("canonicalises to ten characters without a separator", () => {
  expect(accepted(MEDCOM_FEMALE).canonical).toBe("2512489996");
});

test("resolves the scheme as cpr", () => {
  expect(accepted(MEDCOM_FEMALE).scheme).toBe(Scheme.DkCprNumber);
});

test("resolves the birth date through the century table", () => {
  expect(accepted(MEDCOM_FEMALE).birthTime?.toBirthDate()?.iso()).toBe(
    "1948-12-25"
  );
});

test("reads an even serial as female", () => {
  expect(accepted(MEDCOM_FEMALE).gender).toBe(Gender.Female);
});

test("reads an odd serial as male", () => {
  expect(accepted(MEDCOM_MALE).gender).toBe(Gender.Male);
});

test("needs no reference date", () => {
  expect(typeof parseDanishCprNumber("2512489996", null)).not.toBe("string");
});

test("rejects a serial of zero", () => {
  expect(parse("251248-0000")).toBe(ParseFailure.NotAnIdentityNumber);
});

test("rejects a date that exists in no century", () => {
  expect(parse("300248-3001")).toBe(ParseFailure.ImpossibleDate);
});

/**
 * The resolved century decides whether 29 February exists, and this is the case
 * that proves the table is consulted rather than assumed. Serial 3000 resolves
 * to 1900, which is not a leap year because it is divisible by 100 and not by
 * 400. The same date with a serial resolving to 2000 would be perfectly valid.
 * An implementation defaulting to the 2000s, or checking the date before
 * resolving the century, accepts this and is wrong.
 */
test("the resolved century decides leap day validity", () => {
  expect(parse("290200-3000")).toBe(ParseFailure.ImpossibleDate);
});

/**
 * Resolves to 2030, after the reference date. Constructed rather than sourced,
 * and safe to construct precisely because no bearer can exist yet: CPR has not
 * issued numbers for people not yet born.
 */
test("rejects a birth date after the reference date", () => {
  expect(parse("010130-5000")).toBe(ParseFailure.FutureBirthDate);
});

test("rejects a shape that is not ten digits", () => {
  expect(parse("25124899")).toBe(ParseFailure.NotAnIdentityNumber);
});
