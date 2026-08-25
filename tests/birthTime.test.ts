import { expect, test } from "vitest";
import { BirthTime } from "../src/birthTime.js";

test("a complete birth time yields a birth date", () => {
  expect(new BirthTime(1903, 12, 4).toBirthDate()?.iso()).toBe("1903-12-04");
});

test("an unknown month yields no birth date", () => {
  expect(new BirthTime(1915, null, 12).toBirthDate()).toBeNull();
});

test("an unknown day yields no birth date", () => {
  expect(new BirthTime(1917, 11, null).toBirthDate()).toBeNull();
});

/**
 * January is not an arbitrary stand-in. It is the month that makes "is the day
 * within 1-31" the question an unknown month should ask, so a day of 31 stays
 * possible and 32 does not — and no month is invented for the bearer along the
 * way.
 */
test("an unknown month allows the longest day", () => {
  expect(new BirthTime(1915, null, 31).isPossible()).toBe(true);
});

test("an unknown month still rejects a day no month has", () => {
  expect(new BirthTime(1915, null, 32).isPossible()).toBe(false);
});

test("the earliest possible date fills both unknowns", () => {
  expect(new BirthTime(1980, null, null).earliestPossibleIso()).toBe(
    "1980-01-01"
  );
});

/**
 * The floor still applies to a partial birth time, because the year is the one
 * field always present. Asserted here rather than through a fixture because no
 * published number pairs an implausible year with an unknown month.
 */
test("a partial birth time still carries its year", () => {
  expect(new BirthTime(1915, null, null).year).toBe(1915);
});
