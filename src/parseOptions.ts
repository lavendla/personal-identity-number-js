export interface ParseOptions {
  readonly allowCoordinationNumber?: boolean;
  readonly allowOrganizationNumber?: boolean;
  readonly allowUnknownBirthNumber?: boolean;
  readonly referenceDate: Date | null;
}

export interface ResolvedParseOptions {
  readonly allowCoordinationNumber: boolean;
  readonly allowOrganizationNumber: boolean;
  readonly allowUnknownBirthNumber: boolean;
  readonly referenceDate: Date | null;
}

/** Defaults are permissive; the caller narrows. Mirrors ParseOptions in PHP. */
export function resolveParseOptions(
  options: ParseOptions
): ResolvedParseOptions {
  return {
    allowCoordinationNumber: options.allowCoordinationNumber ?? true,
    allowOrganizationNumber: options.allowOrganizationNumber ?? true,
    allowUnknownBirthNumber: options.allowUnknownBirthNumber ?? true,
    referenceDate: options.referenceDate,
  };
}

/**
 * For input already carrying an explicit century, where no reference date is
 * meaningful. Parsing century-incomplete input with these options fails with
 * ParseFailure.CenturyRequired rather than guessing.
 */
export function forCenturyCompleteInput(
  flags: Omit<ParseOptions, "referenceDate"> = {}
): ParseOptions {
  return { ...flags, referenceDate: null };
}
