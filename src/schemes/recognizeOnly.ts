import { Country } from "../enums.js";
import { RECOGNIZE_ONLY_SHAPES } from "../generated/specData.js";

/**
 * One function for every country this package recognises without supporting,
 * because recognition is shape-matching and nothing else. Norway and Finland
 * differ only in the shape they match, and a shape lives in spec/, so there is
 * nothing left to give each country its own module for.
 *
 * Shape only, deliberately. Neither country's checksum is implemented: a scheme
 * that recognises and refuses has no use for the difference between a valid
 * foreign number and an invalid one, and implementing a checksum is the first
 * step toward accidentally supporting the country. A caller learns what the value
 * looks like, never anything about a bearer.
 *
 * Returns the country whose shape matched, or null — deliberately not a
 * SchemeResult. A recognize-only scheme never produces a number, and giving it a
 * real scheme's return type would invite a caller, or a later maintainer wiring it
 * into the registry, to treat a recognition as a parse.
 */
export function recognizeForeignNumber(normalized: string): Country | null {
  for (const [countryCode, pattern] of Object.entries(RECOGNIZE_ONLY_SHAPES)) {
    // Anchored here rather than in the spec, so a fragment cannot become a
    // substring match in one runtime and a whole-string match in the other. The
    // twin file anchors the same way.
    if (new RegExp(`^${pattern}$`).test(normalized)) {
      return countryOf(countryCode);
    }
  }

  return null;
}

/**
 * Checked rather than cast, mirroring PHP's `Country::from()`, which throws on a
 * code the enum does not have. A cast would make the two runtimes disagree about
 * a spec file that named a country the enums do not carry: PHP would refuse and
 * TypeScript would hand the caller a string that only claims to be a Country.
 */
function countryOf(countryCode: string): Country {
  const known = Object.values(Country).find((value) => value === countryCode);

  if (known === undefined) {
    throw new RangeError(
      `spec/schemes declares a recognize-only country the Country enum does not have: ${countryCode}`
    );
  }

  return known;
}
