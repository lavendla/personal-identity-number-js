import { expect, test } from "vitest";
import { Country } from "../src/enums.js";
import type { ParseOptions } from "../src/parseOptions.js";
import { PersonalIdentityNumber } from "../src/personalIdentityNumber.js";

/**
 * Sweden and Denmark collide, and this is the shape of it.
 *
 * 2601012384 is the ten-digit short form of Skatteverket's published test
 * number 202601012384. Read as Swedish it is 260101-2384, born 2026-01-01 and
 * Luhn-valid. Read as Danish it is 260101-2384, born 1901-01-26, because DDMMYY
 * puts the day first and serial 2384 resolves to the 1900s. Both readings are
 * completely valid. They are 125 years apart.
 *
 * Denmark has no checksum to break the tie, so no amount of cleverness inside
 * this package can choose between them — which is why parse() requires a
 * country and detect() reports every interpretation instead of a best match.
 */
const AMBIGUOUS = "2601012384";

/** Fails Norway's modulus-11 check, so it has no bearer — see spec/fixtures/foreign/PROVENANCE.md. */
const NORWEGIAN = "13108633528";

const OPTIONS: ParseOptions = {
  referenceDate: new Date("2026-08-16T00:00:00.000Z"),
};

function detect() {
  return PersonalIdentityNumber.detect(AMBIGUOUS, OPTIONS);
}

function outcome() {
  return PersonalIdentityNumber.explain(AMBIGUOUS, null, OPTIONS);
}

test("detect returns one candidate per registry that accepts", () => {
  expect(detect()).toHaveLength(2);
});

test("detect names both registries", () => {
  const countries = detect()
    .map((candidate) => candidate.country())
    .sort();

  expect(countries).toStrictEqual([Country.Denmark, Country.Sweden]);
});

test("the two readings disagree about the birth date", () => {
  const birthDates = detect()
    .map((candidate) => candidate.birthDate()?.toISOString().slice(0, 10))
    .sort();

  expect(birthDates).toStrictEqual(["1901-01-26", "2026-01-01"]);
});

/**
 * The regression guard for the decision recorded in docs/decision-log.md:
 * detect() returns every interpretation and never a best match. number()
 * returning null on ambiguity is what stops a caller silently committing a
 * person to the wrong country.
 */
test("an ambiguous outcome yields no single number", () => {
  expect(outcome().number()).toBeNull();
});

test("an ambiguous outcome says so outright", () => {
  expect(outcome().isAmbiguous()).toBe(true);
});

/**
 * Decided here rather than left to fall out of the implementation, because it is
 * new public behaviour: detect() reports every interpretation that produced a
 * number, and a recognize-only scheme produces none. So a Norwegian value gives an
 * empty list, and the recognition is available only through explain(). Anything
 * else would mean inventing a PersonalIdentityNumber for a country whose numbers
 * this package cannot canonicalise, validate or derive anything from.
 */
test("detect reports no candidate for a recognized foreign number", () => {
  expect(PersonalIdentityNumber.detect(NORWEGIAN, OPTIONS)).toStrictEqual([]);
});

test("explain still reports the recognition detect cannot", () => {
  expect(
    PersonalIdentityNumber.explain(NORWEGIAN, null, OPTIONS).recognizedCountry()
  ).toBe(Country.Norway);
});
