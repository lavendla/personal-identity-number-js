import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import { SPEC_VERSION } from "../src/generated/specData.js";

test("it reports the version from the spec directory", () => {
  const expected = readFileSync(
    resolve(import.meta.dirname, "../spec/VERSION"),
    "utf8"
  ).trim();

  expect(SPEC_VERSION).toBe(expected);
});
