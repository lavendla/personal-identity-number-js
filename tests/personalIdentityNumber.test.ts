import { describe, expect, test } from "vitest";
import { Country, Format, Gender, ParseFailure } from "../src/enums.js";
import { ParseException } from "../src/parseException.js";
import { forCenturyCompleteInput } from "../src/parseOptions.js";
import { PersonalIdentityNumber } from "../src/personalIdentityNumber.js";

const VALID = "190312049802";

function parse(): PersonalIdentityNumber {
  return PersonalIdentityNumber.parse(VALID, Country.Sweden, {
    referenceDate: new Date("2026-08-16T00:00:00Z"),
  });
}

describe("PersonalIdentityNumber", () => {
  test("it derives the birth date", () => {
    expect(parse().birthDate()?.toISOString().slice(0, 10)).toBe("1903-12-04");
  });

  test("it derives gender from the second-to-last digit", () => {
    expect(parse().gender()).toBe(Gender.Female);
  });

  test("it computes age against an explicit reference date", () => {
    expect(parse().ageOn(new Date("2026-08-16T00:00:00Z"))).toBe(122);
  });

  test("it renders the display format", () => {
    expect(parse().format(Format.Display)).toBe("19031204-9802");
  });

  test("it renders the short format with a plus when over a hundred", () => {
    expect(parse().format(Format.Short)).toBe("031204+9802");
  });

  test("it masks the final four characters", () => {
    expect(parse().format(Format.Masked)).toBe("19031204****");
  });

  test("it keeps the raw value out of debug output", () => {
    expect(JSON.stringify(parse())).not.toContain("9802");
  });

  test("parseForPerson accepts a personal number", () => {
    const number = PersonalIdentityNumber.parseForPerson(
      VALID,
      Country.Sweden,
      new Date("2026-08-16T00:00:00Z")
    );

    expect(number.isPerson()).toBe(true);
  });

  test("short format throws without a reference date", () => {
    const number = PersonalIdentityNumber.parse(
      "19031204-9802",
      Country.Sweden,
      forCenturyCompleteInput()
    );

    expect(() => number.format(Format.Short)).toThrow(ParseException);
  });

  test("short format accepts a reference date override at the call site", () => {
    const number = PersonalIdentityNumber.parse(
      "19031204-9802",
      Country.Sweden,
      forCenturyCompleteInput()
    );

    expect(() => number.format(Format.Short)).toThrow(ParseException);
    expect(number.format(Format.Short, new Date("2003-12-03T00:00:00Z"))).toBe(
      "031204-9802"
    );
  });

  // A test asserting that a year below one hundred parses and renders stood
  // here. The 1800 floor makes that impossible, and it had no PHP twin — a lone
  // hand-written behavioural assertion, which CLAUDE.md says belongs in a
  // fixture. Its property, that years 0-99 are not remapped to 1900-1999 (trap
  // §3.5), is now asserted in both runtimes by birthDate.test.ts and by the
  // fixture se-personal-number-year-below-hundred, which proves it from the
  // other side: a remapped year would clear the floor and parse.

  // Regression for the Short-format bug: the over-100 rule must be "has
  // turned 100" (ageOn >= 100), not a raw year subtraction. Rather than a
  // constructed number, this varies the reference date around the published
  // 19031204-9802's own hundredth birthday (2003-12-04), which exercises
  // both sides of the boundary without inventing a new number (see
  // docs/open-threads.md §3.13).
  test("short format round-trips the day before turning one hundred", () => {
    const referenceDate = new Date("2003-12-03T00:00:00Z");
    const number = PersonalIdentityNumber.parse(VALID, Country.Sweden, {
      referenceDate,
    });

    expect(number.ageOn(referenceDate)).toBe(99);

    const short = number.format(Format.Short);
    expect(short).toBe("031204-9802");

    const reparsed = PersonalIdentityNumber.parse(short, Country.Sweden, {
      referenceDate,
    });
    expect(reparsed.canonical()).toBe(VALID);
  });

  // Regression: PHP used to read the reference date in whatever timezone
  // the caller attached to it, while this runtime's Date has no timezone
  // concept and always reads the UTC calendar day of an instant — so the
  // same instant could resolve a hundred years apart between the two
  // runtimes. PHP now normalizes to UTC before comparing (see the mirrored
  // test ageOnNormalizesTheReferenceDatesTimezoneToUtc in
  // PersonalIdentityNumberTest.php), so this pins the UTC reading directly:
  // the identical instant as 2003-12-04 00:30 Europe/Stockholm (+01:00,
  // winter offset) is 2003-12-03T23:30:00Z — a calendar day before the
  // published 19031204-9802's hundredth birthday.
  test("ageOn reads the reference date's UTC calendar day", () => {
    const referenceDate = new Date("2003-12-03T23:30:00Z");
    const number = PersonalIdentityNumber.parse(VALID, Country.Sweden, {
      referenceDate,
    });

    expect(number.ageOn(referenceDate)).toBe(99);
  });

  test("short format round-trips on the day of turning one hundred", () => {
    const referenceDate = new Date("2003-12-04T00:00:00Z");
    const number = PersonalIdentityNumber.parse(VALID, Country.Sweden, {
      referenceDate,
    });

    expect(number.ageOn(referenceDate)).toBe(100);

    const short = number.format(Format.Short);
    expect(short).toBe("031204+9802");

    const reparsed = PersonalIdentityNumber.parse(short, Country.Sweden, {
      referenceDate,
    });
    expect(reparsed.canonical()).toBe(VALID);
  });

  test("detect returns the single Swedish candidate for a published number", () => {
    const candidates = PersonalIdentityNumber.detect(VALID, {
      referenceDate: new Date("2026-08-16T00:00:00Z"),
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.country()).toBe(Country.Sweden);
  });

  test("parseForOrganization rejects a personal number", () => {
    let failure: ParseFailure | undefined;

    try {
      PersonalIdentityNumber.parseForOrganization(
        VALID,
        Country.Sweden,
        new Date("2026-08-16T00:00:00Z")
      );
    } catch (exception) {
      failure =
        exception instanceof ParseException
          ? exception.getFailure()
          : undefined;
    }

    expect(failure).toBe(ParseFailure.SchemeNotAllowed);
  });

  test("equals is true for the same canonical value and country", () => {
    const options = { referenceDate: new Date("2026-08-16T00:00:00Z") };
    const first = PersonalIdentityNumber.parse(VALID, Country.Sweden, options);
    const second = PersonalIdentityNumber.parse(VALID, Country.Sweden, options);

    expect(first.equals(second)).toBe(true);
  });

  test("equals is false for a different canonical value", () => {
    const options = { referenceDate: new Date("2026-08-16T00:00:00Z") };
    const first = PersonalIdentityNumber.parse(VALID, Country.Sweden, options);
    const second = PersonalIdentityNumber.parse(
      "20190101-2391",
      Country.Sweden,
      options
    );

    expect(first.equals(second)).toBe(false);
  });
});
