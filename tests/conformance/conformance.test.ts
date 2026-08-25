import { describe, expect, test } from "vitest";
import type { Country } from "../../src/enums.js";
import { Format } from "../../src/enums.js";
import { explain } from "../../src/index.js";
import { loadFixtures, referenceDateFor } from "./fixtures.js";

const cases = loadFixtures();

function outcomeFor(item: (typeof cases)[number]) {
  // An absent issuedBy means no country is named, so every scheme runs. That is
  // how an ambiguity fixture asks its question — the collision is a property of
  // asking without a country, not of the value.
  return explain(item.input, (item.issuedBy ?? null) as Country | null, {
    ...item.options,
    referenceDate: referenceDateFor(item.referenceDate),
  });
}

/**
 * Three states, not two. succeeded() is true for an ambiguous outcome — failure
 * is null and there are candidates — so comparing it against
 * `outcome === "parsed"` reported an ambiguity fixture as a failure of the
 * wrong kind. Naming all three makes the fixture's outcome field mean exactly
 * one thing.
 */
function outcomeStateOf(item: (typeof cases)[number]): string {
  const outcome = outcomeFor(item);

  if (outcome.isAmbiguous()) {
    return "ambiguous";
  }

  return outcome.succeeded() ? "parsed" : "failed";
}

describe.each(cases.map((item) => [item.id, item] as const))(
  "%s",
  (_id, item) => {
    test("outcome matches", () => {
      expect(outcomeStateOf(item)).toBe(item.outcome);
    });

    test.runIf(item.canonical !== undefined)("canonical matches", () => {
      expect(outcomeFor(item).number()?.canonical()).toBe(item.canonical);
    });

    test.runIf(item.scheme !== undefined)("scheme matches", () => {
      expect(outcomeFor(item).number()?.scheme()).toBe(item.scheme);
    });

    test.runIf(item.failure !== undefined)("failure matches", () => {
      expect(outcomeFor(item).failure()).toBe(item.failure);
    });

    /**
     * Asserted with the same both-sides normalisation as birthDate: a fixture
     * saying "no country was recognized" has to mean the same thing in both
     * runtimes, and undefined is not null.
     */
    test.runIf(item.recognizedCountry !== undefined)(
      "recognized country matches",
      () => {
        expect(outcomeFor(item).recognizedCountry() ?? null).toBe(
          item.recognizedCountry ?? null
        );
      }
    );

    test.runIf(item.birthDate !== undefined)("birth date matches", () => {
      // Optional chaining yields undefined where the fixture says null, so both
      // sides are normalised: a fixture asserting "this accessor is null" has to
      // mean the same thing in both runtimes.
      expect(
        outcomeFor(item).number()?.birthDate()?.toISOString().slice(0, 10) ??
          null
      ).toBe(item.birthDate ?? null);
    });

    test.runIf(item.gender !== undefined)("gender matches", () => {
      expect(outcomeFor(item).number()?.gender() ?? null).toBe(
        item.gender ?? null
      );
    });

    test.runIf(item.formats !== undefined)("formats match", () => {
      const number = outcomeFor(item).number();

      for (const value of Object.values(Format)) {
        const expected = item.formats?.[value];

        if (expected === undefined) {
          continue;
        }

        expect(number?.format(value)).toBe(expected);
      }
    });

    test.runIf(item.isPerson !== undefined)("isPerson matches", () => {
      expect(outcomeFor(item).number()?.isPerson()).toBe(item.isPerson);
    });
  }
);
