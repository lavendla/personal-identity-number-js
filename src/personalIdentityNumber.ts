import type { BirthTime } from "./birthTime.js";
import {
  Country,
  Format,
  type Gender,
  ParseFailure,
  Scheme,
  schemeCountry,
  schemeDisplayElision,
  schemeDisplaySplit,
  schemeIsPerson,
  schemeShortFormElidesCentury,
} from "./enums.js";
import { normalize } from "./normalizer.js";
import { ParseException } from "./parseException.js";
import {
  type ParseOptions,
  type ResolvedParseOptions,
  resolveParseOptions,
} from "./parseOptions.js";
import { ParseOutcome } from "./parseOutcome.js";
import type { SchemeResult } from "./schemeResult.js";
import { parseDanishCprNumber } from "./schemes/danishCprNumber.js";
import { recognizeForeignNumber } from "./schemes/recognizeOnly.js";
import { parseSwedishOrganizationNumber } from "./schemes/swedishOrganizationNumber.js";
import { parseSwedishPersonalNumber } from "./schemes/swedishPersonalNumber.js";

const inspectCustom = Symbol.for("nodejs.util.inspect.custom");

export class PersonalIdentityNumber {
  private constructor(
    private readonly schemeValue: Scheme,
    private readonly canonicalValue: string,
    private readonly birth: BirthTime | null,
    private readonly genderValue: Gender | null,
    private readonly referenceDate: Date | null
  ) {}

  static parse(
    raw: string,
    issuedBy: Country,
    options: ParseOptions
  ): PersonalIdentityNumber {
    const outcome = PersonalIdentityNumber.explain(raw, issuedBy, options);
    const number = outcome.number();

    if (number === null) {
      throw new ParseException(
        outcome.failure() ?? ParseFailure.NotAnIdentityNumber
      );
    }

    return number;
  }

  static tryParse(
    raw: string,
    issuedBy: Country,
    options: ParseOptions
  ): PersonalIdentityNumber | null {
    return PersonalIdentityNumber.explain(raw, issuedBy, options).number();
  }

  static validates(
    raw: string,
    issuedBy: Country,
    options: ParseOptions
  ): boolean {
    return PersonalIdentityNumber.explain(raw, issuedBy, options).succeeded();
  }

  static explain(
    raw: string,
    issuedBy: Country | null,
    options: ParseOptions
  ): ParseOutcome {
    const resolved = resolveParseOptions(options);
    const normalized = normalize(raw);

    if (normalized === null) {
      return ParseOutcome.failed(ParseFailure.InvalidCharacter);
    }

    const countries = PersonalIdentityNumber.countriesToTry(issuedBy);

    if (countries.length === 0) {
      return ParseOutcome.failed(ParseFailure.CountryNotSupported);
    }

    return PersonalIdentityNumber.outcomeFrom(countries, normalized, resolved);
  }

  /**
   * The registry. A country joins by appearing here and in resultsFor().
   *
   * A named country narrows this to that country alone; a null country runs
   * every scheme, which is what lets detect() report a value valid under more
   * than one registry rather than picking a winner.
   */
  private static countriesToTry(issuedBy: Country | null): readonly Country[] {
    const supported: readonly Country[] = [Country.Sweden, Country.Denmark];

    if (issuedBy === null) {
      return supported;
    }

    return supported.includes(issuedBy) ? [issuedBy] : [];
  }

  /**
   * Every scheme a country has, each returning its own result. Sweden has two,
   * so a Swedish value is offered to both — and the organization scheme has to
   * run even when the caller excluded organization numbers, because reporting
   * SchemeNotAllowed requires recognising the number first.
   */
  private static resultsFor(
    country: Country,
    normalized: string,
    options: ResolvedParseOptions
  ): readonly (SchemeResult | ParseFailure)[] {
    switch (country) {
      case Country.Sweden:
        return [
          parseSwedishPersonalNumber(
            normalized,
            options.referenceDate,
            options.allowCoordinationNumber,
            options.allowUnknownBirthNumber
          ),
          parseSwedishOrganizationNumber(
            normalized,
            options.allowOrganizationNumber
          ),
        ];
      case Country.Denmark:
        return [parseDanishCprNumber(normalized, options.referenceDate)];
      case Country.Norway:
      case Country.Finland:
        return [ParseFailure.CountryNotSupported];
    }
  }

  /**
   * How specific each refusal is, lowest first. Needed because more than one
   * scheme can now refuse the same value with different reasons, and leaving the
   * answer to registry order means adding a scheme silently changes existing
   * failure codes.
   *
   * The ordering that matters: ChecksumMismatch beats ImpossibleDate, because an
   * organization-shaped value with a bad check digit makes the organization
   * scheme say ChecksumMismatch while the personal scheme says ImpossibleDate —
   * its month would be 20 or more. The third digit already established which kind
   * of number it is, so the checksum is the useful answer.
   *
   * Held as data, and failurePrecedence.test.ts asserts every ParseFailure
   * member appears here. Without that test the ?? fallback below would silently
   * rank a new member last, which is precisely what it did when
   * ImplausibleBirthDate was added.
   */
  private static readonly failurePrecedence: Readonly<
    Record<ParseFailure, number>
  > = {
    // Cannot reach the comparison today: explain() refuses malformed input
    // before any scheme runs. Ranked anyway, because the completeness test
    // demands every member be placed rather than silently defaulted, and
    // "these characters are not allowed" is the most definite refusal there is.
    "invalid-character": 0,
    "scheme-not-allowed": 1,
    "checksum-mismatch": 2,
    "impossible-date": 3,
    "future-birth-date": 3,
    "implausible-birth-date": 3,
    "century-required": 4,
    "reference-date-required": 4,
    "country-not-supported": 4,
    "unsupported-scheme": 5,
    "not-an-identity-number": 6,
  };

  private static mostSpecificFailure(
    failures: readonly ParseFailure[]
  ): ParseFailure {
    let best = failures[0] as ParseFailure;

    for (const failure of failures) {
      if (
        PersonalIdentityNumber.specificityOf(failure) <
        PersonalIdentityNumber.specificityOf(best)
      ) {
        best = failure;
      }
    }

    return best;
  }

  private static specificityOf(failure: ParseFailure): number {
    // No fallback. Typing the record by ParseFailure makes the compiler reject
    // an unranked member, mirroring what PHPStan enforces on the PHP side.
    return PersonalIdentityNumber.failurePrecedence[failure];
  }

  private static outcomeFrom(
    countries: readonly Country[],
    normalized: string,
    options: ResolvedParseOptions
  ): ParseOutcome {
    const candidates: PersonalIdentityNumber[] = [];
    const failures: ParseFailure[] = [];

    for (const country of countries) {
      for (const parsed of PersonalIdentityNumber.resultsFor(
        country,
        normalized,
        options
      )) {
        if (typeof parsed === "string") {
          failures.push(parsed);
          continue;
        }

        candidates.push(
          new PersonalIdentityNumber(
            parsed.scheme,
            parsed.canonical,
            parsed.birthTime,
            parsed.gender,
            options.referenceDate
          )
        );
      }
    }

    if (candidates.length > 0) {
      return ParseOutcome.resolved(candidates);
    }

    // Consulted only once every real scheme has refused, because a recognition is
    // not a candidate: a recognize-only scheme produces no number, so detect()
    // cannot report one and succeeded() stays false.
    //
    // That ordering is also the answer to the Denmark/Finland collision. A Finnish
    // code with a '-' and a digit control character is character-for-character a
    // Danish CPR number, and most such codes parse as valid Danish ones — so a
    // parse outranking a recognition is what keeps `131052-3085` Danish rather
    // than reclassifying it as foreign.
    const recognized = recognizeForeignNumber(normalized);

    if (recognized !== null) {
      failures.push(ParseFailure.UnsupportedScheme);
    }

    // Every scheme refused, and the answer depends on how many countries were
    // consulted — two separate decisions that must not be conflated.
    //
    // One country named: report its most specific reason. Sweden has two schemes
    // now, and the precedence table exists so that adding one cannot change the
    // failure code an existing fixture pins. A recognition takes part in that
    // comparison rather than short-circuiting it: it outranks "no idea what this
    // is" and loses to a named registry's specific refusal, which is what ranking
    // `unsupported-scheme` between them means.
    //
    // No country named: report the generic reason, however specific one scheme
    // was. With several registries consulted, "Sweden says the check digit is
    // wrong" is not an answer to "what is this?" — that is Plan 2's decision for
    // detect() and this does not reopen it. But "this is a Norwegian number" *is*
    // an answer to that question, so a recognition is reported here too. Deciding
    // otherwise would withhold the only useful thing the package knows from the
    // one caller who asked exactly that.
    if (failures.length === 0 || countries.length > 1) {
      return recognized === null
        ? ParseOutcome.failed(ParseFailure.NotAnIdentityNumber)
        : ParseOutcome.failed(ParseFailure.UnsupportedScheme, recognized);
    }

    const failure = PersonalIdentityNumber.mostSpecificFailure(failures);

    // The recognized country rides along only with UnsupportedScheme, which is the
    // contract both READMEs already document. A more specific refusal won because
    // the caller named a country and that country had a real objection; attaching
    // a foreign country to it would report two answers to one question.
    return ParseOutcome.failed(
      failure,
      failure === ParseFailure.UnsupportedScheme ? recognized : null
    );
  }

  /**
   * Every interpretation of the input, in no priority order.
   *
   * For search paths, where the country is what the caller is trying to find
   * out. Deliberately never picks a winner: a "best match" would recreate
   * inside the package the collision bug it exists to prevent.
   */
  static detect(
    raw: string,
    options: ParseOptions
  ): readonly PersonalIdentityNumber[] {
    return PersonalIdentityNumber.explain(raw, null, options).candidates();
  }

  /** Asserts the result is a person, so a company cannot enter a person-matching path. */
  static parseForPerson(
    raw: string,
    issuedBy: Country,
    referenceDate: Date
  ): PersonalIdentityNumber {
    const number = PersonalIdentityNumber.parse(raw, issuedBy, {
      allowOrganizationNumber: false,
      referenceDate,
    });

    if (!number.isPerson()) {
      throw new ParseException(ParseFailure.SchemeNotAllowed);
    }

    return number;
  }

  /** Asserts the result is an organization number, not merely a valid number. */
  static parseForOrganization(
    raw: string,
    issuedBy: Country,
    referenceDate: Date
  ): PersonalIdentityNumber {
    const number = PersonalIdentityNumber.parse(raw, issuedBy, {
      referenceDate,
    });

    if (number.scheme() !== Scheme.SeOrganizationNumber) {
      throw new ParseException(ParseFailure.SchemeNotAllowed);
    }

    return number;
  }

  scheme(): Scheme {
    return this.schemeValue;
  }

  country(): Country {
    return schemeCountry(this.schemeValue);
  }

  canonical(): string {
    return this.canonicalValue;
  }

  isPerson(): boolean {
    return schemeIsPerson(this.schemeValue);
  }

  birthDate(): Date | null {
    // Null for a partial birth time as well as for no birth time at all. The two
    // absences differ inside the package and not to a caller: either way there is
    // no date to report, which is docs/open-threads.md §1.4's decision — no
    // second success tier, no caveat flag.
    return this.birth?.toBirthDate()?.toDate() ?? null;
  }

  gender(): Gender | null {
    return this.genderValue;
  }

  ageOn(referenceDate: Date): number | null {
    const birthDate = this.birthDate();

    if (birthDate === null || birthDate > referenceDate) {
      return null;
    }

    let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDelta = referenceDate.getUTCMonth() - birthDate.getUTCMonth();

    if (
      monthDelta < 0 ||
      (monthDelta === 0 && referenceDate.getUTCDate() < birthDate.getUTCDate())
    ) {
      age -= 1;
    }

    return age;
  }

  equals(other: PersonalIdentityNumber): boolean {
    return (
      this.country() === other.country() &&
      this.canonicalValue === other.canonicalValue
    );
  }

  format(format: Format, referenceDate: Date | null = null): string {
    switch (format) {
      case Format.Canonical:
        return this.canonicalValue;
      case Format.Display:
        return this.displayForm();
      case Format.Short:
        return this.shortForm(referenceDate ?? this.referenceDate);
      case Format.Masked:
        return `${this.canonicalValue.slice(0, -4)}****`;
    }
  }

  private displayForm(): string {
    const shown = this.canonicalValue.slice(
      schemeDisplayElision(this.schemeValue)
    );
    const split = schemeDisplaySplit(this.schemeValue);

    return `${shown.slice(0, split)}-${shown.slice(split)}`;
  }

  private shortForm(referenceDate: Date | null): string {
    // No century to elide means no age to report, so the short form is the
    // display form and needs no reference date. True of Denmark, whose ten-digit
    // form carries no century, and of organization numbers, which have no bearer
    // to have an age.
    if (!schemeShortFormElidesCentury(this.schemeValue)) {
      return this.displayForm();
    }

    if (referenceDate === null) {
      throw new ParseException(ParseFailure.ReferenceDateRequired);
    }

    const separator = this.hasTurnedOneHundredOn(referenceDate) ? "+" : "-";

    return (
      this.canonicalValue.slice(2, 8) + separator + this.canonicalValue.slice(8)
    );
  }

  /**
   * Whether the bearer has turned 100 at the reference date, which is the only
   * thing Format.Short's separator reports.
   *
   * A partial birth date has no age, and `?? 0` would have rendered '-' for every
   * one of them. That is not a cosmetic loss: the '+' is what recovers the century
   * when the short form is read back, so `191500722390` would render `150072-2390`
   * and re-parse as 2015. The year is known even when the month and day are not, so
   * it answers the question on its own — a bearer born in 1915 is past 100 at any
   * 2026 reference date, whatever month they were born in.
   *
   * Complete dates keep the exact-age rule. Only the partial case falls back to the
   * year, because only there is the exact age genuinely unavailable.
   */
  private hasTurnedOneHundredOn(referenceDate: Date): boolean {
    const age = this.ageOn(referenceDate);

    if (age !== null) {
      return age >= 100;
    }

    return (
      this.birth !== null &&
      referenceDate.getUTCFullYear() - this.birth.year >= 100
    );
  }

  toJSON(): { scheme: Scheme; value: string } {
    return { scheme: this.schemeValue, value: this.format(Format.Masked) };
  }

  [inspectCustom](): string {
    return `PersonalIdentityNumber(${this.schemeValue} ${this.format(Format.Masked)})`;
  }
}
