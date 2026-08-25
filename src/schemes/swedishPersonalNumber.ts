import { BirthTime } from "../birthTime.js";
import { resolveCentury } from "../centuryResolver.js";
import { luhn } from "../checksum.js";
import { isoDateOf } from "../dateValidator.js";
import { Gender, ParseFailure, Scheme } from "../enums.js";
import {
  MINIMUM_BIRTH_YEARS,
  SE_PARTIAL_IDENTITY,
} from "../generated/specData.js";
import type { SchemeResult } from "../schemeResult.js";

const SHAPE =
  /^(?<century>[0-9]{2})?(?<year>[0-9]{2})(?<month>[0-9]{2})(?<day>[0-9]{2})(?<separator>[-+])?(?<birthNumber>[0-9]{3})(?<check>[0-9])$/;

const COORDINATION_DAY_OFFSET = 60;

/**
 * The named groups as the regex hands them over, not a tidier shape: under
 * noUncheckedIndexedAccess an absent optional group reads as undefined here and
 * as '' in PHP, and the century check below depends on that difference being
 * visible. Narrowing this to Record<string, string> makes that comparison look
 * redundant to the linter and quietly wrong to a reader.
 */
type Groups = NonNullable<RegExpExecArray["groups"]>;

export function parseSwedishPersonalNumber(
  normalized: string,
  referenceDate: Date | null,
  allowCoordinationNumber = true,
  allowUnknownBirthNumber = true
): SchemeResult | ParseFailure {
  const groups: Groups | undefined = SHAPE.exec(normalized)?.groups;

  if (!groups) {
    return ParseFailure.NotAnIdentityNumber;
  }

  const excluded = excludedByOptions(
    groups,
    allowCoordinationNumber,
    allowUnknownBirthNumber
  );

  if (excluded !== null) {
    return excluded;
  }

  // An optional group that did not participate is `undefined` here and '' in
  // PHP, so the twin file tests the same absence against a different value.
  // Comparing to null or falsiness would diverge between runtimes.
  const hasCentury = groups.century !== undefined;

  if (!hasCentury && referenceDate === null) {
    return ParseFailure.CenturyRequired;
  }

  const year = hasCentury
    ? Number(`${groups.century}${groups.year}`)
    : resolveCentury(
        Number(groups.year),
        declaredMonth(groups),
        declaredDay(groups),
        groups.separator === "+",
        referenceDate as Date
      );

  const birthTime = new BirthTime(
    year,
    declaredMonth(groups),
    declaredDay(groups)
  );

  return (
    dateRefusal(birthTime, referenceDate) ??
    checksumRefusal(groups) ??
    accept(groups, birthTime)
  );
}

/**
 * Recognition first, exclusion second: reporting SchemeNotAllowed requires
 * having recognised the number, and the caller's own option outranks every other
 * refusal in the precedence table.
 */
function excludedByOptions(
  groups: Groups,
  allowCoordinationNumber: boolean,
  allowUnknownBirthNumber: boolean
): ParseFailure | null {
  const excluded =
    (isCoordinationNumber(groups) && !allowCoordinationNumber) ||
    (declaresUnknownBirthNumber(groups) && !allowUnknownBirthNumber);

  return excluded ? ParseFailure.SchemeNotAllowed : null;
}

function dateRefusal(
  birthTime: BirthTime,
  referenceDate: Date | null
): ParseFailure | null {
  if (!birthTime.isPossible()) {
    return ParseFailure.ImpossibleDate;
  }

  // After the date exists, never before: a date that never occurred is not made
  // plausible by being recent, and reporting the floor for 30 February would be
  // actively misleading. The floor is declared in
  // spec/schemes/se/personal-number.json rather than written here, so the two
  // runtimes cannot drift on it.
  if (birthTime.year < (MINIMUM_BIRTH_YEARS["se-personal-number"] as number)) {
    return ParseFailure.ImplausibleBirthDate;
  }

  const isFuture =
    referenceDate !== null &&
    birthTime.earliestPossibleIso() > isoDateOf(referenceDate);

  return isFuture ? ParseFailure.FutureBirthDate : null;
}

function checksumRefusal(groups: Groups): ParseFailure | null {
  if (isChecksumExempt(groups)) {
    return null;
  }

  // The century is deliberately absent from the Luhn input. Skatteverket
  // computes the check digit from the birth-time as stored — the offset day
  // included — plus the birth number, and the citation for that lives in
  // spec/schemes/se/personal-number.json.
  const checkable = `${groups.year}${groups.month}${groups.day}${groups.birthNumber}`;

  return luhn(checkable) === Number(groups.check)
    ? null
    : ParseFailure.ChecksumMismatch;
}

/**
 * The unknown-birth-number convention is written as four zeros and there is
 * nothing to verify its check digit against: Skatteverket does not issue a birth
 * number of 000, so it publishes no check-digit rule for one. Luhn over
 * YYMMDD000 yields 0 for roughly one date in ten, so applying the checksum would
 * refuse the convention for most birth dates, which is the contradiction
 * docs/open-threads.md §1.4 exists to resolve.
 *
 * The exemption is this exact four-digit tail and nothing wider — a birth number
 * of 000 with any other check digit still gets the ordinary check.
 */
function isChecksumExempt(groups: Groups): boolean {
  return (
    `${groups.birthNumber}${groups.check}` ===
    SE_PARTIAL_IDENTITY.checksumExemptTail
  );
}

function accept(groups: Groups, birthTime: BirthTime): SchemeResult {
  // The day digits as written go in the canonical form and dayOf() goes in the
  // birth date: a coordination number's +60 offset is part of the number but not
  // part of the birthday. Swapping them diffs every coordination fixture in the
  // golden snapshot.
  return {
    birthTime,
    canonical: `${String(birthTime.year).padStart(4, "0")}${groups.month}${groups.day}${groups.birthNumber}${groups.check}`,
    gender: genderOf(groups),
    scheme: isCoordinationNumber(groups)
      ? Scheme.SeCoordinationNumber
      : Scheme.SePersonalNumber,
  };
}

/**
 * Null for an unknown birth number. The parity rule applies to a birth number
 * the registry issued, and 000 is outside the issuable range of 001-999 (SOU
 * 2008:60), so its third digit is not a gender digit and reporting a gender from
 * it would be fabrication. The date beside it is untouched: each accessor is null
 * exactly when the digits it reads carry no information.
 */
function genderOf(groups: Groups): Gender | null {
  if (declaresUnknownBirthNumber(groups)) {
    return null;
  }

  return Number(groups.birthNumber?.[2]) % 2 === 1
    ? Gender.Male
    : Gender.Female;
}

function declaresUnknownBirthNumber(groups: Groups): boolean {
  return groups.birthNumber === SE_PARTIAL_IDENTITY.unknownBirthNumber;
}

/**
 * At the offset, not past it. A day of exactly 60 is day 00 with the offset
 * applied — an unknown birth day — so `> 60` classified it as an ordinary
 * calendar day of 60 and refused it as an impossible date. 41 of the 1498
 * published coordination numbers in
 * spec/sources/skatteverket/testsamordningsnummer-1914-2019.csv are that shape,
 * and this package rejected every one of them.
 */
function isCoordinationNumber(groups: Groups): boolean {
  return Number(groups.day) >= COORDINATION_DAY_OFFSET;
}

/**
 * Null when the number declares the month unknown, which only a coordination
 * number can do. A month of `00` on an ordinary personal number is not a
 * declaration of anything: no published personnummer uses it — zero rows across
 * all four Skatteverket personal-number files, against 130 of 1498 in the
 * coordination file — so accepting it there would admit a shape the registry does
 * not issue and weaken what validates() means.
 */
function declaredMonth(groups: Groups): number | null {
  const declaresUnknownMonth =
    isCoordinationNumber(groups) &&
    groups.month === SE_PARTIAL_IDENTITY.unknownMonth;

  return declaresUnknownMonth ? null : Number(groups.month);
}

/**
 * Null when the number declares the day unknown. Read from the digits as written
 * rather than from the offset-removed day, because `60` is the whole marker: the
 * day is `00` and the offset is part of how a coordination number writes it.
 */
function declaredDay(groups: Groups): number | null {
  return groups.day === SE_PARTIAL_IDENTITY.unknownDayEncoded
    ? null
    : dayOf(groups);
}

function dayOf(groups: Groups): number {
  const day = Number(groups.day);

  return isCoordinationNumber(groups) ? day - COORDINATION_DAY_OFFSET : day;
}
