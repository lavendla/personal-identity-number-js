import type { ParseFailure } from "./enums.js";

export class ParseException extends Error {
  constructor(private readonly reason: ParseFailure) {
    super(reason);
    this.name = "ParseException";
  }

  getFailure(): ParseFailure {
    return this.reason;
  }
}
