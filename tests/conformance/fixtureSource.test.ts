import { expect, test } from "vitest";
import { loadFixtures } from "./fixtures.js";

/**
 * `source` is documented in CLAUDE.md as a fixed vocabulary and was enforced
 * nowhere — a free string in both harnesses. That matters more than it looks:
 * `public-organization` is the marker saying a fixture relies on the
 * organization-number carve-out, so a typo would silently remove the only
 * machine-readable trace of an exception being used.
 */
const KNOWN_SOURCES = [
  "skatteverket",
  "medcom",
  "public-organization",
  "unissuable",
  "constructed",
];

const cases = loadFixtures();

test("every fixture declares a known source", () => {
  const unknown = cases
    .filter((item) => !KNOWN_SOURCES.includes(item.source))
    .map((item) => `${item.id}: ${item.source}`);

  expect(unknown).toStrictEqual([]);
});

/**
 * The carve-out is narrow and only Swedish organization numbers may claim it. A
 * Danish or personal-number fixture marked this way would be relying on
 * reasoning that does not cover it.
 */
test("only organization number fixtures claim the carve-out", () => {
  const misplaced = cases
    .filter(
      (item) =>
        item.source === "public-organization" &&
        !item.id.includes("organization-number")
    )
    .map((item) => item.id);

  expect(misplaced).toStrictEqual([]);
});

/**
 * The rule this enforces is CLAUDE.md's: a constructed number that happens to be
 * valid is exactly the disclosure risk the corpus rules exist to prevent. It was
 * prose only, and every constructed fixture happening to assert `failed` is not
 * the same thing as the next one having to.
 *
 * A constructed number that must be valid claims Exception 1 and is marked
 * `unissuable` instead, which is what makes the claim visible.
 */
test("no constructed fixture parses", () => {
  const parsing = cases
    .filter(
      (item) => item.source === "constructed" && item.outcome !== "failed"
    )
    .map((item) => item.id);

  expect(parsing).toStrictEqual([]);
});

/** Exception 1 turns on why the digits cannot have been issued, so the fixture has to say. */
test("every unissuable fixture explains itself", () => {
  const unexplained = cases
    .filter(
      (item) =>
        item.source === "unissuable" && item.provenanceNote === undefined
    )
    .map((item) => item.id);

  expect(unexplained).toStrictEqual([]);
});
