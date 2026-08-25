import type { BirthTime } from "./birthTime.js";
import type { Gender, Scheme } from "./enums.js";

/**
 * Everything a scheme knows about a number it has accepted. Derived data is
 * computed here, by the scheme that understands the digit layout, rather than
 * re-derived downstream by slicing a canonical form whose shape differs between
 * countries — ten characters for Denmark, twelve for Sweden.
 *
 * A scheme with no birth time or no gender to offer passes null. That is how
 * organization numbers arrive without adding a branch to any accessor.
 *
 * The birth time is a BirthTime rather than a BirthDate because a Swedish
 * coordination number can declare its month or day unknown. Those are two
 * different absences and the value object has to be able to tell them apart: an
 * organization number has no birth time at all, while a partial coordination
 * number has one whose year is known and whose date cannot be formed.
 *
 * An interface rather than a class: a scheme returns either one of these or a
 * ParseFailure, and the existing code discriminates that union with
 * `typeof parsed === "string"`. A runtime class would add a second, redundant
 * way to ask the same question.
 */
export interface SchemeResult {
  readonly birthTime: BirthTime | null;
  readonly canonical: string;
  readonly gender: Gender | null;
  readonly scheme: Scheme;
}
