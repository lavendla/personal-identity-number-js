import { expect, test } from "vitest";
import { Country, Format, Gender } from "../src/enums.js";
import { PersonalIdentityNumber } from "../src/personalIdentityNumber.js";

/**
 * The accessor contract for partial identity, in the two places the fixture
 * schema cannot express it: ageOn() takes an argument, and equals() takes another
 * number.
 *
 * The rule both sides of this test serve: each accessor is null exactly when the
 * digits it reads carry no information. A `0000` birth number therefore keeps a
 * full birth date and an age, and loses only its gender.
 */

/**
 * Unissuable digits, so no bearer can exist: SOU 2008:60 puts the birth number
 * range at 001-999. See spec/fixtures/se/partial-identity.json.
 */
const UNKNOWN_BIRTH_NUMBER = "20240115-0000";

/**
 * Published Skatteverket coordination numbers with an unknown birth month and an
 * unknown birth day. Both are over a hundred years old at the reference date,
 * which is what makes them the interesting case for the short form.
 */
const UNKNOWN_MONTH = "191500722390";

const UNKNOWN_DAY = "191711602399";

const REFERENCE_DATE = new Date("2026-08-16T00:00:00Z");

function numberFor(input: string): PersonalIdentityNumber {
  return PersonalIdentityNumber.parse(input, Country.Sweden, {
    referenceDate: REFERENCE_DATE,
  });
}

test("an unknown birth number still reports an age", () => {
  expect(numberFor(UNKNOWN_BIRTH_NUMBER).ageOn(REFERENCE_DATE)).toBe(2);
});

/**
 * The identity is complete even when a derived fact is missing, which is the
 * whole argument for accepting these numbers rather than adding a caveat tier.
 * Matching is what consumers do with them, so matching has to work.
 */
test("an unknown birth number is still equal to itself", () => {
  expect(
    numberFor(UNKNOWN_BIRTH_NUMBER).equals(numberFor("202401150000"))
  ).toBe(true);
});

test("a partial birth date has no age", () => {
  expect(numberFor(UNKNOWN_MONTH).ageOn(REFERENCE_DATE)).toBeNull();
});

test("a partial birth date keeps its gender", () => {
  expect(numberFor(UNKNOWN_MONTH).gender()).toBe(Gender.Male);
});

/**
 * The claim §1.4's whole argument rests on: a partial birth date does not make the
 * identity partial, because the canonical form is complete and matching therefore
 * works exactly as it does for any other number. Asserted through two different
 * written forms of the same number so that it is equality being tested rather than
 * string identity.
 */
test("a partial birth date is still equal to itself", () => {
  expect(numberFor(UNKNOWN_MONTH).equals(numberFor("19150072-2390"))).toBe(
    true
  );
});

/**
 * The short form has to survive being read back, and for a partial date the +/-
 * separator is the only thing carrying the century. Rendering '-' for a 1915
 * bearer would re-parse as 2015 — a silent hundred-year error in a value the
 * package itself produced.
 */
test.each([UNKNOWN_MONTH, UNKNOWN_DAY, "198000602394"])(
  "the short form of %s reads back to the same number",
  (input) => {
    const number = numberFor(input);

    expect(numberFor(number.format(Format.Short)).canonical()).toBe(
      number.canonical()
    );
  }
);
