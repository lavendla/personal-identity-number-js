import { expect, test } from "vitest";
import { Gender, Scheme } from "../src/enums.js";
import type { SchemeResult } from "../src/schemeResult.js";
import { parseSwedishPersonalNumber } from "../src/schemes/swedishPersonalNumber.js";

const REFERENCE_DATE = new Date("2026-08-16T00:00:00.000Z");

/**
 * A coordination number whose stored day is 61, so the +60 offset is visible in
 * the assertion: the canonical form must keep 61 because that is what the
 * number is, while the birth date must read 1 because that is when the person
 * was born. A fixture drawn from the pool at random would usually have a stored
 * day in the twenties or thirties, where subtracting 60 or not subtracting it
 * both look plausible and the test proves nothing.
 */
const COORDINATION_NUMBER = "19160161-2383";

function accepted(input: string): SchemeResult {
  const result = parseSwedishPersonalNumber(input, REFERENCE_DATE);

  if (typeof result === "string") {
    throw new Error(`expected a SchemeResult, got ${result}`);
  }

  return result;
}

test("the scheme builds its own canonical form", () => {
  expect(accepted("19031204-9802").canonical).toBe("190312049802");
});

test("the scheme resolves its own gender", () => {
  expect(accepted("19031204-9802").gender).toBe(Gender.Female);
});

test("the scheme resolves its own birth date", () => {
  expect(accepted("19031204-9802").birthTime?.toBirthDate()?.iso()).toBe(
    "1903-12-04"
  );
});

test("a coordination number keeps the offset day in the canonical form", () => {
  expect(accepted(COORDINATION_NUMBER).canonical).toBe("191601612383");
});

test("a coordination number reports the real birth day", () => {
  expect(accepted(COORDINATION_NUMBER).birthTime?.day).toBe(1);
});

test("a coordination number carries its own scheme", () => {
  expect(accepted(COORDINATION_NUMBER).scheme).toBe(
    Scheme.SeCoordinationNumber
  );
});
