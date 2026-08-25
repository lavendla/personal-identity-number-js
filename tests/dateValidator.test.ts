import { expect, test } from "vitest";
import { isRealDate } from "../src/dateValidator.js";

test("it accepts a leap day in a leap year", () => {
  expect(isRealDate(2024, 2, 29)).toBe(true);
});

test("it rejects a leap day in a non-leap year", () => {
  expect(isRealDate(2023, 2, 29)).toBe(false);
});

test("it rejects month zero", () => {
  expect(isRealDate(1987, 0, 1)).toBe(false);
});

// Regression: `Date.UTC(year, …)` remaps years 0-99 to 1900-1999, which used
// to make year 12 evaluate as 1912 here.
test("it treats a year below one hundred as itself, not as 19xx", () => {
  expect(isRealDate(12, 3, 4)).toBe(true);
});

// Regression: PHP's checkdate() rejects year 0 (it accepts only 1-32767),
// but JavaScript's Date has no such floor and used to accept it here,
// diverging on `000001011238`-shaped input.
test("it rejects year zero", () => {
  expect(isRealDate(0, 1, 1)).toBe(false);
});
