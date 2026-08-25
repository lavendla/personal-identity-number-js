import { expect, test } from "vitest";
import { Country, ParseFailure, Scheme } from "../src/enums.js";
import { ParseException } from "../src/parseException.js";
import { forCenturyCompleteInput } from "../src/parseOptions.js";
import type { ParseOutcome } from "../src/parseOutcome.js";
import { PersonalIdentityNumber } from "../src/personalIdentityNumber.js";

const REFERENCE_DATE = new Date("2026-08-16T00:00:00.000Z");

/** Skatteverket's own organization number, published by Skatteverket. Third digit 2. */
const ORGANIZATION = "202100-5448";

const PERSONAL = "190312049802";

/** The same personal number with its check digit incremented. */
const BAD_CHECKSUM = "190312049803";

function explain(input: string): ParseOutcome {
  return PersonalIdentityNumber.explain(input, Country.Sweden, {
    referenceDate: REFERENCE_DATE,
  });
}

test("an organization number parses through the public api", () => {
  expect(explain(ORGANIZATION).succeeded()).toBe(true);
});

test("an organization number canonicalises with the legal person prefix", () => {
  expect(explain(ORGANIZATION).number()?.canonical()).toBe("162021005448");
});

test("an organization number is not a person", () => {
  expect(explain(ORGANIZATION).number()?.isPerson()).toBe(false);
});

test("an organization number has no birth date", () => {
  expect(explain(ORGANIZATION).number()?.birthDate()).toBeNull();
});

test("an organization number has no gender", () => {
  expect(explain(ORGANIZATION).number()?.gender()).toBeNull();
});

/**
 * An organization number encodes no birth date, so no century has to be inferred
 * and no reference date is needed — the same property Denmark has for a different
 * reason.
 */
test("an organization number needs no reference date", () => {
  const outcome = PersonalIdentityNumber.explain(
    ORGANIZATION,
    Country.Sweden,
    forCenturyCompleteInput()
  );

  expect(outcome.succeeded()).toBe(true);
});

test("excluding organization numbers reports scheme not allowed", () => {
  const outcome = PersonalIdentityNumber.explain(ORGANIZATION, Country.Sweden, {
    allowOrganizationNumber: false,
    referenceDate: REFERENCE_DATE,
  });

  expect(outcome.failure()).toBe(ParseFailure.SchemeNotAllowed);
});

/**
 * The precedence guard. Sweden now runs two schemes, and the organization scheme
 * answers NotAnIdentityNumber for a personal number's shape. If the generic
 * answer won, this would report NotAnIdentityNumber and fourteen fixture
 * assertions would go with it.
 */
test("a bad check digit still reports checksum mismatch", () => {
  expect(explain(BAD_CHECKSUM).failure()).toBe(ParseFailure.ChecksumMismatch);
});

test("parseForOrganization returns an organization number", () => {
  const number = PersonalIdentityNumber.parseForOrganization(
    ORGANIZATION,
    Country.Sweden,
    REFERENCE_DATE
  );

  expect(number.scheme()).toBe(Scheme.SeOrganizationNumber);
});

test("parseForPerson rejects an organization number", () => {
  expect(() =>
    PersonalIdentityNumber.parseForPerson(
      ORGANIZATION,
      Country.Sweden,
      REFERENCE_DATE
    )
  ).toThrow(ParseException);
});

test("parseForPerson still accepts a personal number", () => {
  const number = PersonalIdentityNumber.parseForPerson(
    PERSONAL,
    Country.Sweden,
    REFERENCE_DATE
  );

  expect(number.scheme()).toBe(Scheme.SePersonalNumber);
});
