import { expect, test } from "vitest";
import { Country, ParseFailure, Scheme } from "../src/enums.js";
import type { ParseOutcome } from "../src/parseOutcome.js";
import { PersonalIdentityNumber } from "../src/personalIdentityNumber.js";

const REFERENCE_DATE = new Date("2026-08-16T00:00:00.000Z");

/** MedCom reserved serial, resolving to 1948-12-25. */
const DANISH = "251248-9996";

const SWEDISH = "190312049802";

function explain(input: string, issuedBy: Country | null): ParseOutcome {
  return PersonalIdentityNumber.explain(input, issuedBy, {
    referenceDate: REFERENCE_DATE,
  });
}

test("parses a danish number when denmark is named", () => {
  expect(explain(DANISH, Country.Denmark).succeeded()).toBe(true);
});

test("resolves a danish number to the cpr scheme", () => {
  expect(explain(DANISH, Country.Denmark).number()?.scheme()).toBe(
    Scheme.DkCprNumber
  );
});

test("keeps the danish canonical form at ten characters", () => {
  expect(explain(DANISH, Country.Denmark).number()?.canonical()).toBe(
    "2512489996"
  );
});

test("still parses a swedish number when sweden is named", () => {
  expect(explain(SWEDISH, Country.Sweden).number()?.canonical()).toBe(SWEDISH);
});

test("refuses a country with no scheme", () => {
  expect(explain(DANISH, Country.Norway).failure()).toBe(
    ParseFailure.CountryNotSupported
  );
});

/**
 * With one country named only that country's scheme runs, so its reason is the
 * answer. Reporting a generic rejection here would lose the single most useful
 * thing Swedish validation knows, and there are fixtures pinning it.
 */
test("reports the scheme's own failure when one country is named", () => {
  expect(explain("190312049803", Country.Sweden).failure()).toBe(
    ParseFailure.ChecksumMismatch
  );
});

/**
 * With no country named, several schemes ran and all refused. No single
 * scheme's complaint answers "what is this?", so the summary is the honest
 * reply rather than whichever scheme happened to be consulted first.
 */
test("reports a generic failure when no country is named", () => {
  expect(explain("190312049803", null).failure()).toBe(
    ParseFailure.NotAnIdentityNumber
  );
});
