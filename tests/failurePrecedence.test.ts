import { expect, test } from "vitest";
import { ParseFailure } from "../src/enums.js";
import { PersonalIdentityNumber } from "../src/personalIdentityNumber.js";

/**
 * The precedence table decides which refusal a caller sees when several schemes
 * reject the same value. Its comment claimed that holding it as data forces a
 * decision about each new member — it did not: the lookup falls back to last
 * place, and adding ImplausibleBirthDate ranked it silently. This is the test
 * that makes the claim true.
 */
test("every failure member has a declared precedence", () => {
  const precedence = (
    PersonalIdentityNumber as unknown as {
      failurePrecedence: Record<string, number>;
    }
  ).failurePrecedence;

  const unranked = Object.values(ParseFailure).filter(
    (failure) => !(failure in precedence)
  );

  expect(unranked).toStrictEqual([]);
});
