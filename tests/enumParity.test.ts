import { expect, test } from "vitest";
import { ParseFailure } from "../src/enums.js";
import { FAILURES } from "../src/generated/specData.js";

test("ParseFailure matches the spec error codes", () => {
  expect(Object.keys(ParseFailure)).toEqual([...FAILURES]);
});
