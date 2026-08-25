# Provenance — Swedish fixtures

**No fixture in this directory may be a valid Swedish personal number unless
it is traceable to a published Skatteverket test range cited below.** A
fixture with `"outcome": "parsed"` is a claim that the digits are a genuinely
issuable number; a constructed number that happens to be checksum-valid very
likely belongs to a living person, and these packages are public. See
`docs/open-threads.md` §3.13 for the full rule and its one narrow carve-out
(a number that could never have been issued at all — currently only
Skatteverket's century `00`, which has never been assigned to anyone).

## Verified: the Skatteverket citation

**Resolved.** The corpus below is now verified against Skatteverket's own
published test-number lists, committed verbatim at
`spec/sources/skatteverket/` (see that directory's `README.md` for the
per-file cohort breakdown). They are published under **CC0 1.0** — public
domain, no copyright asserted — so redistribution here, including in the
published npm/Packagist packages, is permitted.

Skatteverket's own usage condition, from the source page, still applies to
anyone *using* the numbers to test a system (it does not narrow the CC0
license, and it does not change anything about this package, which only ever
ships them as fixtures):

> Testpersonnummer som bara får användas i testmiljön — aldrig i produktion.

Test personal numbers that may only be used in test environments — never in
production.

`tools/check-provenance.mjs` (`npm run provenance:check`, wired into the CI
`spec` job) now enforces this mechanically: every tracked file is scanned for
Luhn-valid Swedish-shaped numbers, and each one must either appear in
`spec/sources/skatteverket/*.csv` or be listed with a reason in
`spec/sources/skatteverket/allowed-exemptions.json`. See
`docs/open-threads.md` §3.15 for why this gate exists — the rule below was
followed and still failed twice, from a review path and a fix path, neither
of which a human check caught before this.

What supports the recollection below is also structural, independent of the
CSVs, and is kept for historical context:
documentary, and is recorded here so the citation can be checked quickly
once it arrives:

- **Zero gaps.** The 1903–04 series runs 1903-08-18 → 1904-01-14 as 150
  consecutive calendar dates with no missing day. The 2019 series runs
  2019-01-01 → 2019-06-11 as 162 consecutive calendar dates with no missing
  day. Random sampling does not produce that; a reserved allocation does.
- **A tiny reserved birth-number band.** Every 1903–04 entry's birth number
  is `980` or `981`; every 2019 entry's is `238` or `239`. Real issuance
  spreads across the full 000–999 (minus organization/interim carve-outs)
  band; a two-value band is the signature of a series set aside for test
  data.
- **Exact 50/50 gender alternation.** Birth number parity (which determines
  gender) alternates perfectly by date across both series.
- **All 312 entries are checksum-valid.** None of them is a MedCom-style
  "deliberately fails the checksum" test row (unlike the Danish CPR test
  range) — consistent with a personal-number test series, where the
  checksum is expected to validate.

The only citation currently on file anywhere in this project is
`swedish.identityinfo.net`, a third-party aggregator — not sufficient on its
own per the exclusion rule in the design spec (§9, "Fixture corpus
construction").

## Source ranges

**1903–04 series** (10 of the 150 available, all over 100 years old today):
`19030818-9802`, `19030906-9813`, `19030924-9811`, `19031013-9803`,
`19031101-9814`, `19031119-9814`, `19031204-9802`, `19031208-9808`,
`19031226-9806`, `19040114-9810`.

**2019 series** (10 of the 162 available, all children):
`20190101-2391`, `20190119-2391`, `20190206-2395`, `20190224-2393`,
`20190314-2394`, `20190331-2385`, `20190418-2381`, `20190506-2384`,
`20190524-2382`, `20190611-2386`.

Short forms derived from these (e.g. `19031204-9802` → `031204+9802`) are
treated as the same published data, not new numbers — no birth number or
check digit is ever recomputed from a published value.

**Coordination-number series** (samordningsnummer, day field = birth day +
60), 5 of 730 available in the 2026 file and 2 of 1498 in the 1914–2019
file: `202601612381`, `202601622380`, `202601912393` (2026 file, all
fully-specified); `191500722390`, `191711602399` (1914–2019 file, both
**deliberately** carrying a partial birth date — see "Coordination-number
gap: closed" below). Committed verbatim at
`spec/sources/skatteverket/testsamordningsnummer-2026.csv` and
`spec/sources/skatteverket/testsamordningsnummer-1914-2019.csv`, CC0 1.0,
same license and same usage condition as the personal-number series above.
The second file is named for what it contains, not for the (misleading)
"2019" in Skatteverket's own filename — see that directory's `README.md`.

## Per-file breakdown

### `personal-number.json`

| id | source |
|---|---|
| `se-personal-number-twelve-digits` | `19031204-9802`, 1903 series above |
| `se-personal-number-rejects-unexpected-character` | constructed, invalid shape — no bearer possible |
| `se-personal-number-year-below-hundred` | constructed, carve-out: century `00` was never issued (`provenanceNote` on the fixture) |

### `coordination-number.json` — gap closed

**Resolved.** Skatteverket publishes official test samordningsnummer
alongside the personal-number series: `testsamordningsnummer-2026.csv` (730
rows, all fully-specified) and `testsamordningsnummer-1914-2019.csv` (1498
rows, births 1914–2019 despite the "2019" in Skatteverket's own source
filename — see `spec/sources/skatteverket/README.md`). Both are CC0 1.0,
same license as the rest of this corpus, committed verbatim at
`spec/sources/skatteverket/`.

`Scheme::SeCoordinationNumber` is now asserted on genuinely
successfully-parsed values — `se-coordination-number-twelve-digits`,
`se-coordination-number-day-61-parses-to-first`, and
`se-coordination-number-day-91-parses-to-thirty-first` all reach
`"outcome": "parsed"` on an official number, with `birthDate` asserted so
the day − 60 subtraction is proven end to end (not just inferred from a
failure mode), plus `isPerson` and `gender` coverage.

**The corpus is additive-only** (per `CLAUDE.md`: "Never edit or delete a
fixture"). Nothing below was edited in place; two mislabeled fixtures were
renamed (same input, same outcome, corrected id only — the assertion each
one makes is unchanged) and the genuinely new behaviour was added under new
ids.

| id | official number | outcome |
|---|---|---|
| `se-coordination-number-twelve-digits` | `202601622380` (day 62) | `parsed`, `birthDate` `2026-01-02` — proves the general day − 60 subtraction |
| `se-coordination-number-day-61-parses-to-first` | `202601612381` (day 61) | `parsed`, `birthDate` `2026-01-01`, `gender` `female` |
| `se-coordination-number-day-91-parses-to-thirty-first` | `202601912393` (day 91) | `parsed`, `birthDate` `2026-01-31`, `gender` `male` |
| `se-coordination-number-scheme-not-allowed-for-valid-number` | `202601622380` (day 62) | `scheme-not-allowed` with `allowCoordinationNumber: false` — blocks a genuinely valid coordination number, added alongside the pre-existing constructed case rather than replacing it |
| `se-coordination-number-unknown-month-is-rejected` | `191500722390` (month `00`) | `impossible-date` — pins today's rejection of Skatteverket's own unknown-birth-month encoding; see `docs/open-threads.md` §1 |
| `se-coordination-number-unknown-day-is-rejected` | `191711602399` (day `60`, i.e. `00 + 60`) | `impossible-date` — pins today's rejection of Skatteverket's own unknown-birth-day encoding; see `docs/open-threads.md` §1 |

The pre-existing constructed cases are unchanged in content (input and
expected outcome), and two are renamed to describe what they actually assert
rather than what their old id claimed:

| id | derived from | expected failure | note |
|---|---|---|---|
| `se-coordination-number-checksum-mismatch` | `19031204-9802`, day 04→64 | `checksum-mismatch` | unchanged |
| `se-coordination-number-day-92-is-impossible` | `20190101-2391`, day 01→92 | `impossible-date` (day 92 − 60 = 32, no such calendar day) | unchanged |
| `se-coordination-number-scheme-not-allowed` | `19031204-9802`, day 04→64 | `scheme-not-allowed` with `allowCoordinationNumber: false` | unchanged |
| `se-coordination-number-invalid-checksum-day-61` | `20190101-2391`, day 01→61 | `checksum-mismatch` | **renamed**, was `se-coordination-number-day-61-resolves-to-first` — that name claimed the fixture proved day 61 resolves to the 1st, but the reshaped digits fail checksum before date resolution is ever reached, so it never asserted that. Same input/outcome as before; only the id was wrong. |
| `se-coordination-number-invalid-checksum-day-91` | `20190331-2385`, day 31→91 | `checksum-mismatch` | **renamed**, was `se-coordination-number-day-91-resolves-to-thirty-first` — same issue as the day-61 case above. |

The two renamed ids were the tenth instance in this project of a fixture
that looks like coverage but proves nothing (a name asserting a behaviour
its constructed, checksum-invalid input never reaches) — and the first
found inside the fixture corpus itself, rather than in code. The genuine
day-61/day-91/scheme-gate behaviour is now proven separately, under new
ids, by official numbers.

### `century-boundary.json`

| id | source |
|---|---|
| `se-century-boundary-plus-separator-over-hundred` | `19031204-9802` short form, `+` |
| `se-century-boundary-hyphen-separator-recent-century` | `20190101-2391` short form, `-` |
| `se-century-boundary-current-century-matches-reference-year` | constructed, carve-out: century `00`, reference date also inside `0000-0099` so the "date not yet reached this cycle" branch never leaves the carve-out |
| `se-century-boundary-previous-century-matches-reference-year` | constructed, carve-out: century `00`, reference year `130` chosen so the "date already passed" branch bumps back into `0000-0099` without going negative |
| `se-century-boundary-future-century-explicit` | constructed, invalid (fails on `future-birth-date` before checksum is ever checked) |
| `se-century-boundary-requires-reference-date` | `19031204-9802` short form (fails on `century-required` before checksum is checked) |
| `se-century-boundary-timezone-sensitive-reference-instant` | constructed, carve-out: century `00`/`01`, chosen so **both** possible readings of its non-UTC reference instant land inside never-issued territory (see the fixture's own `provenanceNote`). This id previously carried a real-looking 2026-anchored short form that resolved to a genuine, never-issued-but-plausible 1926 birth date — the incident that motivated `tools/check-provenance.mjs` (`docs/open-threads.md` §3.15). |

The `+`/`-` pair intentionally does **not** reuse one set of digits under two
separators the way an earlier draft of this task did — resolving
`19031204`'s own digits with a hyphen against a present-day reference date
would land on the year 2003, which is not in any published range and is a
plausible living person. The hyphen case instead uses the 2019 series'
own short form, which is safe because it resolves back to the exact
published year.

### `unicode.json`

All folded-character cases wrap the published `19031204-9802` (1903 series)
with one non-canonical character substituted for its separator — this is a
rendering of published data, not a new number, and every case still parses
to the same published canonical value. The full-width-digit case is
constructed and invalid by design (`invalid-character`, rejected before any
digit is ever evaluated as part of a number).

### `dates.json`

| id | source |
|---|---|
| `se-dates-leap-day-is-real-but-the-year-is-implausible` | constructed, carve-out: century `00`, year `0012` (a leap year: divisible by 4, not by 100). Renamed from `se-dates-leap-day-valid` when the 1800 floor turned it into a refusal — the date is still real, and that is now the point of it |
| `se-dates-leap-day-impossible-in-non-leap-year` | constructed, invalid (year 1900 — divisible by 100 but not 400, so not a leap year) |
| `se-dates-month-zero-is-impossible` | constructed, invalid |
| `se-dates-day-zero-is-impossible` | constructed, invalid |
| `se-dates-year-zero-is-impossible` | constructed, carve-out: century `00`, year `0000` exercises PHP `checkdate()`'s year floor against JavaScript's `Date`, which had none |

No published number lands on 29 February in either series (the 1903–04
series never reaches February; the 2019 series is not a leap year), so the
leap-day-valid case relies on the same century-`00` carve-out as the
year-below-hundred and century-boundary constructed cases above, rather than
on published digits.

### `partial-identity.json` — Exception 1, and why it fits here

**The `0000` birth number cannot be sourced.** No row in any of the six
Skatteverket files uses a birth number of `000` — checked with
`grep -cE '000[0-9]$'`, which returns 0 for all six — and there is no reason to
expect one, because Skatteverket does not issue it.

That is exactly what makes a constructed number permissible here, under
`CLAUDE.md`'s Exception 1: **a number the registry could never have issued at
all**, marked `source: unissuable` so the claim is visible in the data rather
than only in prose. The citation is first-party and specific:

> Födelsenumret består av tre siffror (001–999) … det innebär att det finns
> totalt 999 personnummer per födelsetid, 499 för kvinnor och 500 för män.

— **SOU 2008:60**, *Personnummer och samordningsnummer*, del 1.

Two independent properties both have to fail for a fixture here to name a living
person's number, and both do:

1. **Outside the issuable range.** `000` is not in 001–999, so no bearer can
   exist. This is the same shape of argument as the century-`00` carve-out.
2. **Luhn-invalid.** The tail `0000` is checksum-exempt by design, so
   `20240115-0000` does not satisfy Luhn either — the correct check digit for
   `240115000` is `4`. A real personnummer cannot have these digits even
   accidentally.

Property 2 is also why `tools/check-provenance.mjs` does not flag these fixtures
and they need no allowlist entry: the scanner only reports Luhn-*valid*
candidates, and none of these is one.

| id | source | why |
|---|---|---|
| `se-unknown-birth-number-parses` | unissuable | `20240115-0000` — birth number `000`, Luhn-invalid |
| `se-unknown-birth-number-has-no-gender-but-keeps-its-date` | unissuable | same digits; asserts the accessor contract rather than the parse |
| `se-unknown-birth-number-on-a-coordination-number` | unissuable | `20240175-0000` — day 15 plus the +60 offset, so both conventions at once |
| `se-unknown-birth-number-excluded-by-options` | unissuable | same digits, `allowUnknownBirthNumber: false` |
| `se-unknown-birth-number-with-any-other-check-digit-still-needs-luhn` | constructed | `20240115-0001` — invalid, so `constructed` is correct for it |

The gender being `null` for all of these is not a limitation of the fixture
schema. The parity rule applies to an issued birth number, and `000` is the
field being declared unknown, so there is no gender digit to read — reporting one
would be fabrication. The date beside it is unaffected, which is the whole rule:
each accessor is null exactly when the digits it reads carry no information.

#### The partial-date cases, and two renamed ids

These are **published Skatteverket coordination numbers** and need no exception at
all: `source: skatteverket`, digits straight from
`spec/sources/skatteverket/testsamordningsnummer-1914-2019.csv` and
`…-2026.csv`. What changed under spec `0.3.0` is what they assert.

**Two ids were renamed, and both old names are recorded here so a search for
either finds the trail.** They also moved file, from `coordination-number.json`
to `partial-identity.json`, because that is now the behaviour they describe:

| Old id | New id | Was | Is |
|---|---|---|---|
| `se-coordination-number-unknown-month-is-rejected` | `se-coordination-number-unknown-month-parses` | `impossible-date` | parses, `birthDate()` null |
| `se-coordination-number-unknown-day-is-rejected` | `se-coordination-number-unknown-day-parses` | `impossible-date` | parses, `birthDate()` null |

Renaming is a corpus change like any other and is authorised by the same version
bump that authorises the reversal. It is not cosmetic: a fixture called
`…-is-rejected` that asserts a successful parse is worse than no name at all,
because the next reader trusts the name over the assertion.

| Fixture | Number | Row | What it isolates |
|---|---|---|---|
| `…unknown-month-parses` | `191500722390` | 1914-2019 file | month `00`, day known — gender survives, canonical is complete |
| `…unknown-day-parses` | `191711602399` | 1914-2019 file | day `60`, the case the old `> 60` classifier refused outright |
| `…unknown-month-and-day-parses` | `198000602394` | row 925 | both at once, and the `-` half of the short-form separator rule |
| `…partial-date-still-resolves-its-century` | `800060-2394` | same number, century-elided | the round trip: `Format::Short`'s own output must read back to 1980, not 2080 |
| `…century-resolves-from-the-real-day-not-the-offset` | `2601612381` | 2026 file, row 2 | the century bug — see below |

The last one is worth reading before anyone tidies it. It uses a **ten-digit**
form and a reference date **inside the same month** as the birth date, and both
of those are load-bearing: the century resolver was being handed the offset day,
and `"2026-01-61" > "2026-01-15"` as a string, so it concluded the birth was in
the future and stepped back a century. Twelve-digit forms never reach the
resolver and a reference date in a different month never reaches the day
comparison, so a fixture missing either property passes against the bug. There
was no ten-digit coordination fixture in the corpus at all, which is why both
runtimes agreed on 1926-01-01 and `golden:check` stayed green.

`spec/fixtures/se/coordination-number.json` keeps its remaining nine cases,
including `…day-92-is-impossible`, which still refuses day 32 — accepting an
unknown day did not loosen the day range.

### `organization-number.json` — a different provenance rule applies

**These fixtures do not come from a published test range, because none exists.**
Sweden publishes testpersonnummer and Denmark has MedCom's list; there is no
equivalent for organization numbers. They use real organization numbers that
public bodies publish about themselves, under the narrow carve-out in
`CLAUDE.md`, and carry `source: public-organization` so the exception is visible
in the data rather than only in prose.

Three conditions have to hold together, and the third is what makes it safe
rather than merely convenient:

1. **No living bearer.** The rule exists because a valid personal identity
   number very likely belongs to a living person. An organization number
   identifies an organization.
2. **Already public.** Swedish company registration data is public by law, and
   these are numbers the bodies print on their own websites.
3. **Third digit `2` or above**, required by **4 § lagen (1974:174)** expressly
   to prevent confusion with personnummer. A personnummer's third digit is the
   first digit of its month and so is always `0` or `1`, which makes a number
   satisfying this rule *structurally incapable* of being any person's personal
   or coordination number.

| Fixture | Number | Body | Third digit |
|---|---|---|---|
| `…ten-digits-with-separator` | `202100-5448` | Skatteverket | 2 |
| `…ten-digits-without-separator` | `2021005448` | Skatteverket | 2 |
| `…already-carrying-the-prefix` | `165560360793` | canonical-form example since Plan 1 | 6 |
| `…has-no-birth-date-or-gender` | `202100-5489` | Bolagsverket | 2 |
| `…renders-the-conventional-form` | `202100-3062` | Statistiska centralbyrån | 2 |
| `…excluded-by-options` | `202100-5448` | Skatteverket | 2 |

Two fixtures in this file are **not** `public-organization`, deliberately:

- `…rejects-a-bad-check-digit` is `constructed`. It is Skatteverket's number
  with the check digit incremented, so it fails Luhn and no bearer can exist.
- `…sole-proprietorship-resolves-as-a-person` is `skatteverket`. This is the
  case the carve-out **excludes**: a sole proprietorship's organization number
  *is* its owner's personnummer, so it has a third digit of `0` or `1` and fails
  the very condition that authorises the exception. It uses a published
  Skatteverket number and reuses one already in this corpus, because the
  fixture's subject is the interpretation rather than the digits.

`…rejects-a-third-digit-below-two` is also `skatteverket`, and its name is worth
reading carefully: the value **parses**, as a personal number, which is correct.
What it pins is that the *organization* scheme refuses it. There is no separate
"third digit below 2" case to construct, because a personnummer is exactly such
a number — and constructing one would mean constructing a plausible living
person's number.

**Allowlist interaction.** Organization numbers are Luhn-valid and
Swedish-shaped, so `tools/check-provenance.mjs` flags them and each is listed in
`spec/sources/skatteverket/allowed-exemptions.json` with its body and third
digit. Note that three *forms* of the same number can each need an entry — the
ten digits, the twelve-digit canonical, and the display rendering with its
separator — because the scanner strips separators and matches whatever digits it
finds.
