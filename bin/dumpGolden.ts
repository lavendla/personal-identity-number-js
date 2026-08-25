/**
 * Runs the full fixture corpus through explain() and prints a deterministic
 * JSON dump to stdout, keyed by fixture id in sorted order.
 *
 * This is one half of the golden snapshot gate (see tools/compare-golden.mjs
 * and spec/golden.json). Its PHP twin, packages/php/bin/dump-golden.php, must
 * produce byte-identical output for the same fixture corpus — that is what
 * proves the two runtimes agree.
 */

import type { Country, ParseFailure, Scheme } from "../src/index.js";
import { explain } from "../src/index.js";
import { ParseException } from "../src/parseException.js";
import type { PersonalIdentityNumber } from "../src/personalIdentityNumber.js";
import {
  type FixtureCase,
  loadFixtures,
  referenceDateFor,
} from "../tests/conformance/fixtures.js";

/** Every rendering the dump asks for, in the fixed order they are emitted. */
const GOLDEN_FORMAT_KEYS = ["canonical", "display", "masked", "short"] as const;

type GoldenValue = string | null | { readonly [key: string]: GoldenValue };

function parseOptionsFor(fixture: FixtureCase) {
  const flags = fixture.options ?? {};

  return {
    allowCoordinationNumber: flags.allowCoordinationNumber ?? true,
    allowOrganizationNumber: flags.allowOrganizationNumber ?? true,
    allowUnknownBirthNumber: flags.allowUnknownBirthNumber ?? true,
    referenceDate: referenceDateFor(fixture.referenceDate),
  };
}

function explainFixture(fixture: FixtureCase) {
  // An absent issuedBy means no country is named, so every scheme runs. That is
  // how an ambiguity fixture asks its question.
  return explain(
    fixture.input,
    (fixture.issuedBy ?? null) as Country | null,
    parseOptionsFor(fixture)
  );
}

/**
 * Renders every Format for a resolved number. `Format.Short` throws
 * ReferenceDateRequired when the number carries no reference date — that is
 * data about the fixture, not a dump failure, so it is recorded as
 * `{"error": "reference-date-required"}` in place of the rendering rather
 * than letting the dump crash or silently skipping the fixture.
 */
function renderFormats(
  number: PersonalIdentityNumber
): Record<string, GoldenValue> {
  const formats: Record<string, GoldenValue> = {};

  for (const key of GOLDEN_FORMAT_KEYS) {
    try {
      formats[key] = number.format(key);
    } catch (exception) {
      if (!(exception instanceof ParseException)) {
        throw exception;
      }

      formats[key] = { error: exception.getFailure() };
    }
  }

  return formats;
}

function dumpCase(fixture: FixtureCase): Record<string, GoldenValue> {
  const outcome = explainFixture(fixture);

  if (outcome.isAmbiguous()) {
    return {
      canonical: null,
      failure: null,
      formats: null,
      outcome: "ambiguous",
      recognizedCountry: null,
      scheme: null,
    };
  }

  const number = outcome.number();

  if (number === null) {
    // The recognized country is dumped, not merely asserted by a fixture. A
    // recognize-only scheme's whole output is this field, so leaving it out would
    // let the two runtimes disagree about which country matched while
    // golden:check stayed green — the trap docs/open-threads.md §3.17 records
    // three times over.
    return {
      canonical: null,
      failure: outcome.failure() as ParseFailure | null,
      formats: null,
      outcome: "failed",
      recognizedCountry: outcome.recognizedCountry() as Country | null,
      scheme: null,
    };
  }

  return {
    canonical: number.canonical(),
    failure: null,
    formats: renderFormats(number),
    outcome: "parsed",
    recognizedCountry: null,
    scheme: number.scheme() as Scheme,
  };
}

/**
 * A hand-rolled encoder rather than `JSON.stringify(value, null, N)`. Both
 * runtimes' pretty-printers exist to make the file readable, but their
 * default indentation and spacing conventions differ from each other and
 * from PHP's. This gate requires the PHP and TypeScript dumps to be
 * byte-identical, so both scripts implement this exact algorithm instead of
 * trusting two unrelated libraries to agree by coincidence.
 */
function encodeString(value: string): string {
  let result = '"';

  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;

    if (char === '"') {
      result += '\\"';
    } else if (char === "\\") {
      result += "\\\\";
    } else if (char === "\n") {
      result += "\\n";
    } else if (char === "\r") {
      result += "\\r";
    } else if (char === "\t") {
      result += "\\t";
    } else if (code < 0x20) {
      result += `\\u${code.toString(16).padStart(4, "0")}`;
    } else {
      result += char;
    }
  }

  return `${result}"`;
}

function encode(value: GoldenValue, level = 0): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return encodeString(value);
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return "{}";
  }

  const indent = "    ".repeat(level + 1);
  const closingIndent = "    ".repeat(level);
  const lines = entries.map(
    ([key, item]) => `${indent}${encodeString(key)}: ${encode(item, level + 1)}`
  );

  return `{\n${lines.join(",\n")}\n${closingIndent}}`;
}

// Codepoint ordering, matching PHP's sort(). localeCompare() would order by the
// runtime's locale and break the byte-identical dump the golden gate compares.
const fixtures = loadFixtures().sort((a, b) => {
  if (a.id < b.id) {
    return -1;
  }

  return a.id > b.id ? 1 : 0;
});

const golden: Record<string, GoldenValue> = {};

for (const fixture of fixtures) {
  golden[fixture.id] = dumpCase(fixture);
}

process.stdout.write(`${encode(golden)}\n`);
