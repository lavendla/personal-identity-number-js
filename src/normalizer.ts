import { ALLOWED, FOLD } from "./generated/specData.js";

/**
 * Folds known character variants and rejects anything outside the allow list.
 * Returns null when a character is not allowed — deleting unexpected
 * characters would turn one person's number into another's.
 */
export function normalize(raw: string): string | null {
  let normalized = "";

  for (const character of raw) {
    const folded = FOLD[character] ?? character;

    if (folded === "") {
      continue;
    }
    if (!ALLOWED.has(folded)) {
      return null;
    }

    normalized += folded;
  }

  return normalized;
}
