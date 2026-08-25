import { expect, test } from "vitest";
import { resolveCentury } from "../src/centuryResolver.js";

const reference = new Date("2026-08-16T00:00:00Z");

test("it resolves to the most recent century not in the future", () => {
  expect(resolveCentury(87, 1, 1, false, reference)).toBe(1987);
});

test("it resolves a date earlier this year to this century", () => {
  expect(resolveCentury(26, 1, 1, false, reference)).toBe(2026);
});

test("it resolves a date later this year to the previous century", () => {
  expect(resolveCentury(26, 12, 1, false, reference)).toBe(1926);
});

test("it subtracts a further hundred years for the plus separator", () => {
  expect(resolveCentury(87, 1, 1, true, reference)).toBe(1887);
});

test("it resolves the same input differently against different reference dates", () => {
  expect(resolveCentury(70, 1, 1, false, reference)).toBe(1970);
});

test("it follows the reference date rather than the system clock", () => {
  const farFuture = new Date("2099-08-16T00:00:00Z");

  expect(resolveCentury(70, 1, 1, false, farFuture)).toBe(2070);
});
