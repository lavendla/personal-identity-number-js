import { describe, expect, test } from "vitest";
import { normalize } from "../src/normalizer.js";

describe("folds to the expected value", () => {
  test.each([
    ["ordinary space", "870101 2384", "8701012384"],
    ["non-breaking space", "870101 2384", "8701012384"],
    ["narrow no-break space", "870101 2384", "8701012384"],
    ["en dash", "870101–2384", "870101-2384"],
    ["em dash", "870101—2384", "870101-2384"],
    ["minus sign", "870101−2384", "870101-2384"],
    ["plus separator survives", "870101+2384", "870101+2384"],
  ])("%s", (_name, raw, expected) => {
    expect(normalize(raw)).toBe(expected);
  });
});

describe("rejects characters outside the allow list", () => {
  test.each([
    ["letter o for zero", "19o3-12-04 98o2"],
    ["full width digits", "１９８７"],
    ["slash", "870101/2384"],
    // The letters Finland excludes from its control-character set, kept out of
    // the allow list for the same reason Finland keeps them out: G, I, O, Q and Z
    // are the ones a reader confuses with 6, 1, 0 and 2.
    ["letter Finland excludes, G", "870101G384"],
    ["letter Finland excludes, Z", "870101Z384"],
    // Lowercase, always. The allow list carries Finland's uppercase letters and
    // the normalizer deliberately does not fold case: PHP's mb_strtoupper and
    // JavaScript's toUpperCase disagree for some inputs, and a divergence there is
    // worse than a lowercase Finnish code being reported as InvalidCharacter.
    ["lowercase Finnish control character", "870101a384"],
    ["formerly-folded reservnummer letter, lowercase", "870101t384"],
  ])("%s", (_name, raw) => {
    expect(normalize(raw)).toBeNull();
  });
});
