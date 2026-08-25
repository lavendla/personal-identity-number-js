import { expect, test } from "vitest";
import { luhn } from "../src/checksum.js";

test("it computes the expected check digit", () => {
  expect(luhn("870101238")).toBe(0);
});

test("it computes zero when the sum is already a multiple of ten", () => {
  expect(luhn("000000000")).toBe(0);
});
