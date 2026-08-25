import { expect, test } from "vitest";
import { BirthDate } from "../src/birthDate.js";

test("renders iso with zero padding", () => {
  expect(new BirthDate(1875, 11, 9).iso()).toBe("1875-11-09");
});

test("converts to a utc date", () => {
  expect(new BirthDate(1875, 11, 9).toDate().toISOString()).toBe(
    "1875-11-09T00:00:00.000Z"
  );
});

/**
 * The JavaScript half of the trap in open-threads §3.5: Date.UTC remaps years
 * 0-99 to 1900-1999 and PHP's checkdate does not. dateFromComponents avoids it
 * with setUTCFullYear, and this asserts BirthDate goes through that helper.
 */
test("keeps years below one hundred intact", () => {
  expect(new BirthDate(12, 3, 4).toDate().getUTCFullYear()).toBe(12);
});

test("exposes its components as fields, mirroring the PHP value object", () => {
  expect(new BirthDate(1875, 11, 9).day).toBe(9);
});

/**
 * Date construction rolls an impossible date forward rather than refusing it,
 * so an unchecked BirthDate(2024, 2, 30) reported 2024-02-30 from iso() and
 * 2024-03-01 from toDate() — an object disagreeing with itself. Both schemes
 * validate before constructing, but an invariant held only by convention is one
 * a later caller silently breaks.
 */
test("refuses a date that does not exist", () => {
  expect(() => new BirthDate(2024, 2, 30)).toThrow(RangeError);
});

test("accepts a leap day in a leap year", () => {
  expect(new BirthDate(2024, 2, 29).iso()).toBe("2024-02-29");
});
