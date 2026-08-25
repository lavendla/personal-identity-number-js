# @lavendla/personal-identity-number

Parsing, formatting and classification of personal identity numbers, starting
with Sweden. The package validates shape, checksum and calendar plausibility;
it never encrypts, hashes or stores the values it is given, and it never
reads the system clock.

This is the TypeScript half of a paired PHP/TypeScript implementation. Both
packages are generated from and tested against the same corpus, so the same
input resolves identically in both languages — see
[`lavendla/personal-identity-number`](https://packagist.org/packages/lavendla/personal-identity-number)
for the equivalent PHP API, mirrored example for example. The source
repository is private; this package is published from it.

## Status

**Not yet published to npm.** The Skatteverket citation this previously waited
on has landed — the published test datasets are committed and
`provenance:check` enforces their use mechanically in the private source
repository. What remains is the release pipeline itself. The install
instructions below describe how this package will be required once it is
released.

## What's proven where

| Claim | Proven where |
|---|---|
| This package resolves the corpus as recorded | This repository's CI |
| This package's output matches the agreed snapshot | This repository's CI |
| The two runtimes agree with each other | The private source repository |
| No unexplained real-looking number is committed anywhere | The private source repository |

The third row can't be checked here: comparing the two runtimes needs both of
them plus tooling that stays in the private source repository, so this
package instead diffs its own output against the committed snapshot
(`spec/golden.json`) that both runtimes already agreed on there.

```bash
npm install @lavendla/personal-identity-number
```

Requires Node 22+.

Licensed MIT. The test corpus under `spec/fixtures/` is Skatteverket's and
MedCom's published data and carries its own terms — see
[`ATTRIBUTION.md`](ATTRIBUTION.md).

## Quick start

```typescript
import { Country, Format, PersonalIdentityNumber } from '@lavendla/personal-identity-number'

const referenceDate = new Date('2026-08-16')

const number = PersonalIdentityNumber.parse(
  '19031204-9802',
  Country.Sweden,
  { referenceDate },
)

number.canonical()                     // '190312049802'
number.birthDate()?.toISOString().slice(0, 10) // '1903-12-04'
number.gender()                        // Gender.Female
number.isPerson()                      // true
number.format(Format.Display)          // '19031204-9802'
number.format(Format.Short)            // '031204+9802' — this bearer is over 100 at the reference date
number.format(Format.Masked)           // '19031204****'
```

### The three resolution entry points

`parse()`, `tryParse()` and `explain()` all run the same resolution; they
differ only in how they report failure.

```typescript
// Throws ParseException on failure, carrying a typed ParseFailure reason
// via getFailure().
const number = PersonalIdentityNumber.parse('19031204-9802', Country.Sweden, { referenceDate })

// Returns null on failure, discarding the reason. For guard clauses that
// don't need to know why.
const numberOrNull = PersonalIdentityNumber.tryParse('not a number', Country.Sweden, { referenceDate })
// null

// Never throws. Returns a ParseOutcome — the diagnostic and migration entry
// point, and the one every other entry point above is built from.
const outcome = PersonalIdentityNumber.explain('19031204-9802', Country.Sweden, { referenceDate })
outcome.succeeded() // true
outcome.number()    // the PersonalIdentityNumber above
outcome.failure()   // null
```

### Facades over `explain()`

```typescript
// A bare boolean, for guard clauses and form validation.
PersonalIdentityNumber.validates('19031204-9802', Country.Sweden, { referenceDate }) // true

// For search paths, where the country is what you're trying to find out —
// never for writes. Returns every interpretation, in no priority order, and
// never picks a winner.
const candidates = PersonalIdentityNumber.detect('19031204-9802', { referenceDate })
// one candidate: twelve digits cannot be a Danish CPR number

const ambiguous = detect('2601012384', { referenceDate })
// two candidates: valid as Swedish (born 2026-01-01) and as Danish (born
// 1901-01-26). See the Denmark section.

// Asserts the result is a person — throws if it resolves to an organization
// number instead.
const person = PersonalIdentityNumber.parseForPerson('19031204-9802', Country.Sweden, referenceDate)

// Asserts the result is an organization number — throws if the value resolves
// to a personal or coordination number instead.
const organization = PersonalIdentityNumber.parseForOrganization('202100-5448', Country.Sweden, referenceDate)
organization.canonical()            // '162021005448' — the 16 prefix is part of the canonical form
organization.format(Format.Display) // '202100-5448' — the form Sweden actually writes
organization.birthDate()            // null
organization.gender()               // null
organization.isPerson()             // false
```

## `Country` is the issuing registry, not residence

`Country` always identifies **the national registry that issued the
number** — never where the person lives or where an order was placed. A
Norwegian resident in Sweden has a Swedish address and a Norwegian identity
number. Pass residence instead of issuing country and you get wrong data
silently: this is exactly how 261 rows in a production system came to be
stored as Swedish when they are not.

Sweden and Denmark both have parsing logic, and that makes the responsibility
sharper rather than softer: **the two collide**, and Denmark has no checksum
to catch a Swedish number handed to it. Passing the wrong country will usually
succeed and give you a plausible, wrong birth date. See the Denmark section
below. Supplying the correct issuing country is entirely the caller's
responsibility.

Norway and Finland are **recognized but not supported**, which is a third state
worth understanding — see the section below. It is also the closest thing this
package has to a wrong-country alarm: hand a Norwegian number to Sweden and the
answer names Norway rather than shrugging.

## `referenceDate` is required, and this package never calls the system clock

`ParseOptions.referenceDate` has no default, and there is no `Date.now()`
anywhere in this package. Century inference for a ten-digit input depends on
when you ask — the same two digits resolve to a different century depending
on the date supplied — so a package that read the clock would parse the same
input differently in different years. If that resolved value is ever used as
a lookup key, the same person stops matching themselves the day the century
guess flips. Requiring the caller to supply the date, every time, is what
keeps parsing deterministic for the object's entire lifetime.

If your input is already century-complete (twelve digits) and you have no
meaningful reference date, say so explicitly rather than fabricating one:

```typescript
import { forCenturyCompleteInput } from '@lavendla/personal-identity-number'

const outcome = PersonalIdentityNumber.explain(
  '190312049802',
  Country.Sweden,
  forCenturyCompleteInput(),
)
outcome.succeeded() // true — the century was already in the input

// But a ten-digit input under the same options fails loudly instead of guessing:
const tenDigitOutcome = PersonalIdentityNumber.explain(
  '031204-9802',
  Country.Sweden,
  forCenturyCompleteInput(),
)
tenDigitOutcome.failure() // ParseFailure.CenturyRequired
```

Do not wrap `forCenturyCompleteInput()` or the options object in a helper
that defaults `referenceDate` to `new Date()`. That reintroduces the exact
drift this requirement exists to prevent.

## `ParseOptions`

```typescript
interface ParseOptions {
  readonly referenceDate: Date | null
  readonly allowCoordinationNumber?: boolean
  readonly allowOrganizationNumber?: boolean
  readonly allowUnknownBirthNumber?: boolean
}

function forCenturyCompleteInput(flags?: Omit<ParseOptions, 'referenceDate'>): ParseOptions
```

All boolean flags default to `true`: the defaults are permissive and the
caller narrows.

| Flag | Narrows out |
|---|---|
| `allowCoordinationNumber` | Coordination numbers (day + 60). Set `false` to reject them with `ParseFailure.SchemeNotAllowed` on a path that only expects ordinary personal numbers. |
| `allowOrganizationNumber` | Organization numbers. Passed by `parseForPerson()` internally. Set `false` to reject them with `ParseFailure.SchemeNotAllowed` — but read the sole-proprietorship section first, because it does not do what a reader often expects. |
| `allowUnknownBirthNumber` | The `0000` unknown-birth-number convention. Set `false` to reject it with `ParseFailure.SchemeNotAllowed` on a path that requires a fully identified person. |

```typescript
const options = { referenceDate, allowCoordinationNumber: false }
PersonalIdentityNumber.explain('140168+2396', Country.Sweden, options).failure()
// ParseFailure.SchemeNotAllowed
```

## The value object

```typescript
number.scheme(): Scheme
number.country(): Country
number.canonical(): string
number.format(format: Format, referenceDate?: Date | null): string
number.birthDate(): Date | null
number.gender(): Gender | null
number.ageOn(referenceDate: Date): number | null
number.isPerson(): boolean
number.equals(other: PersonalIdentityNumber): boolean
```

**Both nullable accessors are genuinely nullable, and for three different
reasons.** Nothing about a successful parse guarantees a birth date or a gender
exists, and the three cases are worth knowing separately because a consumer
usually cares about one of them and not the others:

| Input | `birthDate()` / `ageOn()` | `gender()` | Why |
|---|---|---|---|
| An organization number | `null` | `null` | It has no bearer at all |
| A coordination number with month `00` or day `60` | `null` | the gender | The date is partly unknown; the birth number is intact |
| A `0000` birth number | the date | `null` | The date is fully present; the field carrying gender is the one declared unknown |

The rule underneath all three, which is worth preferring over memorising the
table: **each accessor returns `null` exactly when the digits it reads carry no
information.** Reporting a gender for `0000` would be fabrication — the parity
digit is inside the field being declared unknown — and reporting `null` for its
birth date would be the mirror error, discarding a date the number states
plainly.

A partial birth date does **not** make the identity partial. `canonical()` is
complete, so matching, indexing and `equals()` are entirely unaffected, and
`succeeded()` keeps one honest meaning: this is a valid identity number. There is
deliberately no `hasCompleteBirthDate()`, no second success tier and no caveat
flag — ask the specific question you care about instead.

`ageOn()` performs all date arithmetic against UTC calendar fields and
requires an explicit reference date; like everything else in this package,
it never consults the system clock.

`equals()` compares country and canonical form.

### `format()`'s optional reference date

```typescript
number.format(format: Format, referenceDate: Date | null = null): string
```

The second parameter is consulted **only** by `Format.Short`, the one
temporally-dependent rendering. It defaults to the reference date the object
was parsed with, so the ordinary call passes nothing:

```typescript
number.format(Format.Short) // uses the reference date supplied at parse time
```

It exists for objects built via `forCenturyCompleteInput()`, which carry no
reference date at all — the call site can supply one just to render
`Short`, without the object having pretended to need one at parse time. If
neither the object nor the call site has one, rendering throws
`ParseException(ParseFailure.ReferenceDateRequired)` rather than guessing:

```typescript
const noDateObject = PersonalIdentityNumber.parse(
  '190312049802',
  Country.Sweden,
  forCenturyCompleteInput(),
)

noDateObject.format(Format.Display) // fine — no reference date involved
noDateObject.format(Format.Short)   // throws ParseException(ParseFailure.ReferenceDateRequired)
```

**There is deliberately no fallback separator.** Defaulting the `+`/`-` to
`-` when the reference date is unknown would be quietly catastrophic:
`Format.Short` is the exact inverse of the century-resolution logic used at
parse time, so rendering `19031204-9802` (over 100 years old) as
`031204-9802` and re-parsing that against a recent date reads it back as
**2003**-12-04 — a hundred-year error, silently, in exactly the over-100
population this data most often describes. A loud failure is the correct
trade.

## `Format`

| Member | SE `19031204-9802` (reference date `2026-08-16`) | SE `190101-2391` (same date) | SE organization `202100-5448` | DK `251248-9996` |
|---|---|---|---|---|
| `Canonical` | `190312049802` | `201901012391` | `162021005448` | `2512489996` |
| `Display` | `19031204-9802` | `20190101-2391` | `202100-5448` | `251248-9996` |
| `Short` | `031204+9802` — `+` because this bearer is over 100 at the reference date | `190101-2391` — `-` because this bearer is not | `202100-5448` — identical to `Display`, and needs no reference date | `251248-9996` — identical to `Display` |
| `Masked` | `19031204****` | `20190101****` | `16202100****` | `251248****` |

**An organization number's `Display` drops the `16`.** `canonical()` keeps it and
`Display` does not, which is deliberate rather than an inconsistency: `202100-5448`
is the form Sweden actually writes, prints and invoices with, and `16202100-5448`
is a form nothing publishes. Nothing is lost — the canonical form is what
applications index on, and it still carries the prefix. `Masked` keeps it too, so
a caller can use the masking helper without branching on scheme.

**Organization `Short` needs no reference date.** There is no bearer, so there is
no age, so there is nothing for the `+`/`-` to report. The same is true of Danish
numbers for a different reason, below.

**A partial birth date changes how `Short` picks its separator.** With month `00`
or day `60` there is no exact age, so the `+`/`-` is derived from the birth year
against the reference year instead. This is not cosmetic: the `+` is the only
thing carrying the century when a short form is read back, so `191500722390`
renders `150072+2390` and re-parses to 1915. Rendering `-` there would re-parse as
2015.

**Danish `Short` is Danish `Display`.** A ten-digit CPR number carries no
century, so there is nothing for `Short` to elide. It follows that
`Format.Short` **never** throws `ParseFailure.ReferenceDateRequired` for a
Danish number — the Swedish path's requirement does not apply, and a Danish
number parsed with `forCenturyCompleteInput()` renders every format without a
reference date.

**Swedish** `Display` is deliberately `YYYYMMDD-NNNN`, not the shorter
`YYMMDD-NNNN` seen
in some Swedish UIs. Callers wanting the short convention ask for `Short`.

`Masked` replaces the final four characters with `*`. **It still exposes the
full date of birth.** It is a display convenience for support contexts, not
a redaction primitive — if true redaction is ever required it will arrive as
a new `Format` member, since changing this one would be a golden-snapshot
diff and therefore a spec major version bump.

## `Scheme`

| Member | Country | Status in this release |
|---|---|---|
| `SePersonalNumber` | Sweden | Implemented |
| `SeCoordinationNumber` | Sweden | Implemented, including partial birth dates — month `00` and day `60`, both drawn from Skatteverket's published coordination-number datasets |
| `SeOrganizationNumber` | Sweden | Implemented. Validates the third-digit rule as well as Luhn, canonicalises with the `16` prefix, and yields neither a birth date nor a gender |
| `DkCprNumber` | Denmark | Implemented. **Read the Denmark section below before relying on `validates()` for it** |

**Norway and Finland have no `Scheme` member, and that is the point.** They are
recognize-only: a value matching either shape is refused by name rather than
parsed, so no `Scheme` exists for something that never produces a number. See the
recognize-only section below.

## `ParseFailure`

Carried on `ParseException` and exposed via `getFailure()`. The exception
message is the failure's reason code alone (e.g. `'checksum-mismatch'`) —
never the raw input, masked or otherwise.

| Member | Meaning |
|---|---|
| `NotAnIdentityNumber` | No scheme matched and nothing was recognized |
| `UnsupportedScheme` | Recognized as a foreign scheme, and the recognized country is available via `ParseOutcome.recognizedCountry()`. Produced for Norwegian and Finnish values |
| `CountryNotSupported` | The country **you asked for** has no scheme. Distinct from `UnsupportedScheme`, which is about the value: pass `Country.Norway` and you get this, pass a Norwegian value as Swedish and you get that |
| `ChecksumMismatch` | Shape and date are valid, the check digit is not |
| `ImpossibleDate` | The encoded date does not exist |
| `ImplausibleBirthDate` | The date exists, but the resolved birth year is before the scheme's floor of 1800. Deliberately distinct from `ImpossibleDate` — "that date does not exist" and "that date exists but nobody alive was born then" are different facts, and a consumer bucketing contaminated data needs to tell them apart |
| `FutureBirthDate` | The resolved birth date is after the reference date |
| `InvalidCharacter` | Input contains a character not in the allow table |
| `SchemeNotAllowed` | A scheme matched but was disabled by options, or by a preset such as `parseForPerson()` |
| `CenturyRequired` | Options carried no reference date, but the input has no century of its own |
| `ReferenceDateRequired` | `Format.Short` (or `ageOn()`) was asked of an object with no reference date on it and none supplied at the call site |

## Canonical forms

The canonical form is the value applications should index and match on.

| Scheme | Canonical shape | Example |
|---|---|---|
| SE personal number | 12 characters, `CCYYMMDDNNNC` | `190312049802` |
| SE coordination number | 12 characters, day retains its +60 offset | `198701612384` |
| SE organization number | 12 characters, `16` prefix | `162021005448` |
| DK CPR number | 10 characters, `DDMMYYNNNN` | `2512489996` |

`canonical()` is append-only in spirit: if its output ever changes for any
input, previously matched records unmatch. Any such change is a spec major
version bump with a documented migration path, never a patch.

## Denmark: `validates()` means less here

**Danish numbers have no checksum.** This is the single most important thing
to know before treating a Danish result the way you would treat a Swedish one.

Modulus-11 was abandoned by CPR on 1 October 2007, because modulus-11-compliant
serials ran out for certain birth-year cohorts. CPR states plainly that numbers
issued without it are fully valid — *"Personnumre uden modulus 11 er fuldt ud
gyldige personnumre"* — so enforcing modulus-11 would reject real people. It is
therefore not a Danish validity rule in either direction.

What Danish validation actually checks is the whole of it:

1. Shape — ten digits, optional `-` separator
2. Serial at least `0001`
3. The century resolves via CPR's published table
4. The resulting calendar date is real, and not after the reference date

The consequence follows directly, and callers should be told rather than left
to infer it:

> **Almost no single-digit typo in a Danish serial is caught. Most produce a
> different, equally valid number.**

Nothing in the list above is a checksum, so nothing exists to detect a typo as
a typo. The checks catch a mistyped serial only incidentally, in two narrow
cases: a serial that becomes `0000`, and a change to the *leading* digit that
moves the number into a century where the date does not exist — 29 February is
the usual way — or has not happened yet.

Every other single-digit change is accepted. Changing a non-leading digit keeps
the same century and yields another valid number, differing only in gender if
it was the last digit. Changing the leading digit usually just relocates the
birth date by a century. Sweden's Luhn check rejects roughly 90% of
single-digit errors; Denmark rejects a handful by luck.

### The practical consequence: never guess the country

A Swedish number misread as Danish will usually pass Danish validation, for
exactly the same reason. That is why `parse()` requires a `Country` and why
there is no convenience function that tries one country and falls back to the
other.

The collision is not theoretical. `2601012384` — the ten-digit short form of a
published Skatteverket test number — is a Swedish personal number born
2026-01-01 *and* a Danish CPR number born 1901-01-26. Both readings are
completely valid; they are 125 years apart, and nothing in the value
distinguishes them.

Where the country genuinely is the unknown, use `detect()`. It returns every
interpretation and never picks a winner:

```ts
const candidates = detect('2601012384', { referenceDate })
// two candidates: one SE, one DK
```

`ParseOutcome.number()` returns `null` when more than one scheme accepted the
input, so a caller cannot silently commit a person to the wrong country by
reading a single result.

## Swedish sole proprietorships: `isPerson()` is load-bearing

This is the most misunderstood behaviour in the package, and it is not a defect.

**A Swedish sole proprietorship (enskild näringsidkare) has no separate
organization number. Its organization number *is* its owner's personal number —
identical digits.** SCB says so directly, in the entry describing the `PeOrgNr`
variable of *Variabelbeskrivning för Företagsregistret*:

> För fysiska personer, enskilda näringsidkare, motsvaras PeOrgNr av
> personnumret, dvs det inleds med 19 eller 20.

*For natural persons, sole traders, PeOrgNr corresponds to the personal identity
number, i.e. it begins with 19 or 20.*

So such a value resolves as `SePersonalNumber` with `isPerson()` returning
`true`, and that is the correct answer. The distinction between a sole trader and
a private individual is **contextual, not structural**: nothing in the digits
carries it, and no `ParseOptions` setting recovers it.

Two consequences follow, and they point in opposite directions:

- **If you are matching people**, treat `isPerson()` as load-bearing. A
  successful parse does not imply a private individual, and `parseForPerson()`
  will happily accept a sole proprietorship's number — correctly, because it *is*
  a person's number.
- **If you are matching companies**, `allowOrganizationNumber: false` will not
  keep sole proprietorships out, because they never took the organization-number
  path in the first place.

Note where the safety of the organization-number carve-out comes from and why it
stops here. **4 § lagen (1974:174)** fixes an organization number's third digit at
`2` or above expressly to prevent confusion with personal numbers, and a
personnummer's third digit is the first digit of its month, so it is always `0` or
`1`. That rule is what makes company numbers structurally distinguishable — and it
is silent on exactly this case, because a sole proprietorship has no assigned
organization number for the rule to apply to.

## Partial identity: `0000` and partial coordination dates

Three shapes declare part of themselves unknown, and all three parse:

```typescript
// A 0000 birth number — the stillborn and unknown-person convention.
const unknownBearer = PersonalIdentityNumber.parse('20240115-0000', Country.Sweden, options)
unknownBearer.birthDate()?.toISOString().slice(0, 10) // '2024-01-15' — fully present
unknownBearer.ageOn(referenceDate)                    // 2
unknownBearer.gender()                                // null

// A coordination number with an unknown birth month.
const unknownMonth = PersonalIdentityNumber.parse('191500722390', Country.Sweden, options)
unknownMonth.canonical() // '191500722390' — complete, so matching is unaffected
unknownMonth.birthDate() // null
unknownMonth.gender()    // Gender.Male — the birth number is intact
```

Coordination numbers encode an unknown month as `00` and an unknown day as `00`
plus the usual `+60` offset, so the digits read `60`. Both are Skatteverket's own
convention, and they are not rare in historical data: of the 1,498 coordination
numbers in Skatteverket's published 1914–2019 dataset, 130 (8.7%) have an unknown
month and 41 (2.7%) an unknown day. That population is exactly who coordination
numbers are issued to — people without Swedish residency, whose birth
documentation is often incomplete.

`allowUnknownBirthNumber: false` rejects the `0000` case with
`ParseFailure.SchemeNotAllowed`. There is no equivalent flag for partial dates:
they are ordinary coordination numbers, and `allowCoordinationNumber: false`
already covers the path that does not want them.

**Month `00` is accepted only on a coordination number.** No published
personnummer uses it — zero rows across all four of Skatteverket's personal-number
datasets — so accepting it on an ordinary personal number would mean admitting a
shape the registry does not issue.

## The 1800 birth-year floor

A resolved birth year before **1800** fails with
`ParseFailure.ImplausibleBirthDate`, separately from `ImpossibleDate`:

```typescript
explain('001203049802', Country.Sweden, options).failure()
// ParseFailure.ImplausibleBirthDate — structurally valid, Luhn-valid, and a birth in the year 12
```

Why 1800 rather than something tighter: Sweden's personnummer system began in 1947
and assigned numbers to people then alive, so the earliest year a genuine Swedish
number can encode is around the 1840s. The floor leaves deliberate margin because
estate and probate work meets records of people who died decades ago — a 1960
death record for an 1865 birth carries a perfectly valid number. A tighter floor
would start rejecting real historical records, and that failure would read as a
package defect rather than a data-quality signal.

The check runs **after** the date is known to exist, never before: a date that
never occurred is not made plausible by being recent, and reporting the floor for
30 February would be actively misleading.

## Norway and Finland: recognized, not supported

A value matching the Norwegian or Finnish shape is refused **by name**:

```typescript
const outcome = explain('13108633528', Country.Sweden, options)
outcome.failure()           // ParseFailure.UnsupportedScheme
outcome.recognizedCountry() // Country.Norway
```

The distinction this exists to draw is *"we know what this is and do not support
it"* versus *"we have no idea what this is"*. It is reported whether or not you
named a country, because recognition is a claim about the value rather than about
which registry refused it — and telling a caller who guessed Sweden that their
value looks Norwegian is the most useful thing the package can say.

Four properties are worth knowing before relying on it:

- **Recognition is shape only.** Neither country's checksum is implemented and
  neither value's date is validated, on purpose: a scheme that recognises and
  refuses has no use for the difference between a valid foreign number and an
  invalid one. An impossible Norwegian date is still reported as Norwegian.
- **Nothing is derived.** No number is produced, so `detect()` returns an **empty
  array** for a recognized foreign value. `explain()` is the only place the
  recognition surfaces.
- **A real parse always wins.** A Finnish code whose intermediate character is `-`
  and whose control character is a digit is character-for-character a Danish CPR
  number, and since Danish numbers have no checksum, most such codes are valid
  Danish ones. They stay Danish. Measured across every written form of the
  published corpus: 11,281 of 33,807 forms match a recognize-only shape, and none
  of them reaches a caller as a recognition.
- **Naming an unsupported country is a different failure.** Passing
  `Country.Norway` yields `ParseFailure.CountryNotSupported` and no recognition —
  you already know what the value is, and the answer is about the country you
  asked for.

Finnish codes must be **uppercase**. Twenty-one of Finland's thirty-one control
characters are letters, and the allow table carries them in uppercase only; a
lowercase Finnish code resolves to `ParseFailure.InvalidCharacter`. Case folding is
deliberately absent because JavaScript's `toUpperCase` and PHP's `mb_strtoupper`
do not agree for every input, and the two runtimes disagreeing is worse than this
limitation.

## What this package does not do

It **never encrypts, hashes, or stores** the values it is given. It parses,
validates, formats and classifies a value passed to it and hands back a
plain-text canonical form; where and how that value is persisted is entirely
the caller's concern. It also never touches the system clock — every
temporal decision is driven by a reference date the caller supplies.

Sensitive-value handling within the package itself: `toJSON()` and
`util.inspect.custom` both return the masked form, so logging or
`JSON.stringify()`-ing an instance by accident does not leak the raw value.

## Limitations

Read this before relying on this package beyond what is listed above:

- **Danish validation has no checksum.** Covered in full in the Denmark
  section above, and repeated here because it is the limitation most likely
  to be missed: `validates()` returning `true` means materially less for a
  Danish number than a Swedish one.
- **`isPerson()` does not separate a sole proprietorship from a private
  individual**, because nothing in the digits does. See the sole-proprietorship
  section — this is the limitation most often mistaken for a bug.
- **Recognition of Norwegian and Finnish values is shape-only.** No checksum, no
  date validation. A value reported as Norwegian may not be a real Norwegian
  number, only a Norwegian-shaped one.
- **A lowercase Finnish code is `InvalidCharacter`, not a recognition.** The allow
  table carries Finland's letters in uppercase only and there is no case folding.
- **A partial birth date yields no birth date and no age**, while remaining a
  fully valid identity number with a complete canonical form. If your consumer
  requires a birth date, check for `null` rather than assuming a successful parse
  provides one.
- **`Format.Masked` still exposes the full date of birth.** It is a display
  convenience, not a redaction primitive.
- **Swedish interim numbers (reservnummer) are out of scope, entirely — not a
  `Scheme`, not recognize-only.** They are not issued by Skatteverket but
  assigned locally by each healthcare region, with no national format, no
  check digit, and no guarantee of national uniqueness — Region Stockholm's
  variant alone (twelve characters starting `99`, encoding the *issue* year
  rather than birth year) admits on the order of 10⁸ arbitrary strings with
  essentially no filter, against the roughly 90% rejection rate Sweden's Luhn
  check gives real personal numbers. A scheme that cannot discriminate does
  not extend coverage; it dilutes what `validates()` means everywhere else.
  Reservnummer resolve to `ParseFailure.NotAnIdentityNumber`, indistinguishable
  from malformed input — the same treatment as Great Britain.
