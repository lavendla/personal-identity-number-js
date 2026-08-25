import { expect, test } from "vitest";
import { Country } from "../../src/enums.js";
import { recognizeForeignNumber } from "../../src/schemes/recognizeOnly.js";

/**
 * Every number here fails its own country's checksum on purpose — see
 * spec/fixtures/foreign/PROVENANCE.md. Recognition is shape-matching, so an
 * invalid number is recognized exactly as a valid one would be, which is what lets
 * these tests exist at all without naming a real person's number.
 */

test("recognizes eleven digits as Norwegian", () => {
  expect(recognizeForeignNumber("13108633528")).toBe(Country.Norway);
});

test("recognizes an intermediate character as Finnish", () => {
  expect(recognizeForeignNumber("131052-308U")).toBe(Country.Finland);
});

/**
 * The two shapes must not overlap, because the function returns the first match.
 * Finland's seventh character is an intermediate character and Norway's is a
 * digit, so nothing can satisfy both — but the answer would depend on spec
 * ordering if that ever stopped being true, and this is the test that would
 * notice.
 */
test("eleven digits are never Finnish", () => {
  expect(recognizeForeignNumber("13108633528")).not.toBe(Country.Finland);
});

test("recognizes nothing in a Swedish canonical form", () => {
  expect(recognizeForeignNumber("190312049802")).toBeNull();
});

/**
 * The Finnish shape is ten characters with a separator, which is also the Swedish
 * and Danish short form. Recognition says so, and the dispatcher is what keeps
 * that from mattering: a parse outranks a recognition. Measured across the
 * published corpus, 11,281 written forms match a recognize-only shape and none of
 * them reaches a caller as a recognition.
 */
test("recognizes a shape that Sweden also claims", () => {
  expect(recognizeForeignNumber("031204-9802")).toBe(Country.Finland);
});

test("recognizes nothing when the length is wrong", () => {
  expect(recognizeForeignNumber("1310863352")).toBeNull();
});
