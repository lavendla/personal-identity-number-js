export { Country, Format, Gender, ParseFailure, Scheme } from "./enums.js";
export { SPEC_VERSION } from "./generated/specData.js";
export { ParseException } from "./parseException.js";
export type { ParseOptions } from "./parseOptions.js";
export { forCenturyCompleteInput } from "./parseOptions.js";
export { ParseOutcome } from "./parseOutcome.js";
export { PersonalIdentityNumber } from "./personalIdentityNumber.js";

import { PersonalIdentityNumber } from "./personalIdentityNumber.js";

// Safe to detach from the class: every static method addresses
// PersonalIdentityNumber by name rather than through `this`.
export const {
  parse,
  tryParse,
  validates,
  explain,
  detect,
  parseForPerson,
  parseForOrganization,
} = PersonalIdentityNumber;
