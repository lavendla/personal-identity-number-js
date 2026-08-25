import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export interface FixtureOptions {
  allowCoordinationNumber?: boolean;
  allowOrganizationNumber?: boolean;
  allowUnknownBirthNumber?: boolean;
}

export interface FixtureCase {
  birthDate?: string;
  canonical?: string;
  failure?: string;
  formats?: Record<string, string>;
  gender?: string;
  id: string;
  input: string;
  isPerson?: boolean;
  // Optional: an absent issuedBy means no country is named and every scheme
  // runs, which is how an ambiguity fixture is expressed.
  issuedBy?: string;
  options?: FixtureOptions;
  outcome: "parsed" | "failed" | "ambiguous";
  provenanceNote?: string;
  // A recognize-only scheme's entire output. Null or absent everywhere else.
  recognizedCountry?: string | null;
  // Optional, matching FixtureLoader::optionalStringField() on the PHP side,
  // which reads it with isset() and so treats an absent key and an explicit
  // null identically. Declaring it required here made the two harnesses
  // disagree about the schema: the first fixture to omit the key crashed
  // TypeScript while PHP read it as null.
  referenceDate?: string | null;
  scheme?: string;
  source: string;
}

const FIXTURE_ROOT = resolve(import.meta.dirname, "../../spec/fixtures");

function jsonFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return jsonFiles(path);
    }

    return path.endsWith(".json") ? [path] : [];
  });
}

/**
 * Fixture reference dates are written as either a bare calendar date
 * (`2026-08-16`) or a full instant carrying its own offset
 * (`2026-01-01T00:30:00+01:00`). A bare date is read as UTC midnight; a full
 * instant is passed through untouched so its embedded offset — not this
 * function's assumption — decides the instant, exactly mirroring how PHP's
 * `DateTimeImmutable` treats a time string with its own timezone.
 */
export function referenceDateFor(
  value: string | null | undefined
): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  return new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
}

export function loadFixtures(): FixtureCase[] {
  const cases = jsonFiles(FIXTURE_ROOT)
    .sort()
    .flatMap((file) => JSON.parse(readFileSync(file, "utf8")) as FixtureCase[]);

  if (cases.length === 0) {
    throw new Error("No fixtures found — the corpus must never be empty.");
  }

  const ids = new Set<string>();
  for (const item of cases) {
    if (ids.has(item.id)) {
      throw new Error(`Duplicate fixture id: ${item.id}`);
    }
    ids.add(item.id);
  }

  return cases;
}
