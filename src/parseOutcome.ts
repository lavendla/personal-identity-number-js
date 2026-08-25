import type { Country, ParseFailure } from "./enums.js";
import type { PersonalIdentityNumber } from "./personalIdentityNumber.js";

export class ParseOutcome {
  private constructor(
    private readonly candidateList: readonly PersonalIdentityNumber[],
    private readonly failureReason: ParseFailure | null,
    private readonly recognized: Country | null
  ) {}

  static resolved(candidates: readonly PersonalIdentityNumber[]): ParseOutcome {
    return new ParseOutcome(candidates, null, null);
  }

  static failed(
    failure: ParseFailure,
    recognizedCountry: Country | null = null
  ): ParseOutcome {
    return new ParseOutcome([], failure, recognizedCountry);
  }

  succeeded(): boolean {
    return this.failureReason === null && this.candidateList.length > 0;
  }

  /** Null when ambiguous — resolving that needs information this package does not have. */
  number(): PersonalIdentityNumber | null {
    return this.candidateList.length === 1
      ? (this.candidateList[0] ?? null)
      : null;
  }

  failure(): ParseFailure | null {
    return this.failureReason;
  }

  recognizedCountry(): Country | null {
    return this.recognized;
  }

  candidates(): readonly PersonalIdentityNumber[] {
    return this.candidateList;
  }

  isAmbiguous(): boolean {
    return this.candidateList.length > 1;
  }
}
