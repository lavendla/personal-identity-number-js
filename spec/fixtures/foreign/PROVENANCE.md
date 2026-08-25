# Provenance — recognize-only foreign fixtures

Norway and Finland are **recognized, not supported**: a value that matches their
shape resolves to `ParseFailure::UnsupportedScheme` with
`ParseOutcome::recognizedCountry()` set, and no number is ever produced. Every
fixture here therefore asserts a failure, which changes what provenance has to
prove but does not remove the obligation.

## Why a constructed foreign number is permissible here

`CLAUDE.md`'s rule is about **valid** numbers: a randomly generated valid
personal identity number very likely belongs to a living person. A recognize-only
fixture never needs to be valid — recognition is shape-matching, and this package
implements neither country's checksum on purpose.

So every constructed fixture here is built to **fail its own country's national
checksum**. That is the substantive claim, and it is stronger than "we made it
up": a number that fails Norway's modulus-11 or Finland's modulus-31 control
character cannot have been issued by that registry, so it has no bearer, while
still being shape-recognisable — which is exactly what the fixture needs to be.

The checksums were computed to make each number invalid, not assumed. The Finnish
algorithm was verified against DVV's own published example first: `131052-308T`,
whose control character the same code independently reproduces as `T`. An
algorithm that reproduces a published example is one whose "this is invalid"
answers can be trusted.

| Fixture | Number | Why it has no bearer |
|---|---|---|
| `no-…-is-recognized-not-supported` | `13108633528` | Norway's check digits for `131086335` are `27`; this ends `28` |
| `no-…-is-recognized-without-a-country-named` | `13108633528` | Same digits, no `issuedBy` |
| `no-…-recognition-ignores-the-date` | `31139912300` | Day 31 of month 13 **and** wrong check digits (`311399123` requires `09`) |
| `no-…-with-a-separator-is-not-recognized` | `131086-33559` | Not a Norwegian shape at all — eleven digits, no separator |
| `fi-…-is-recognized-not-supported` | `131052-308U` | Control character for `131052308` is `T` |
| `fi-…-recognizes-the-2000s-marker` | `010101A123P` | Control character for `010101123` is `N` |
| `fi-…-recognizes-a-marker-added-in-2023` | `150375Y246D` | Control character for `150375246` is `C` |
| `fi-…-in-lowercase-is-an-invalid-character` | `131052-308u` | Same invalid code, lowercase |
| `fi-…-is-recognized-when-nothing-parses-it` | `010490-998T` | Control character for `010490998` is `9` |

One fixture here is **not** constructed:
`fi-personal-identity-code-loses-to-a-real-danish-parse` uses `010490-9989`,
a published MedCom test number, marked `medcom`. It has to be a real, valid
Danish number, because what it pins is that a parse outranks a recognition — a
constructed invalid number could not demonstrate that.

## The collision that made that fixture necessary

**A Finnish code whose intermediate character is `-` and whose control character
happens to be a digit is character-for-character a Danish CPR number.** Not
occasionally: the Danish display form `DDMMYY-SSSS` and the Finnish
`ddmmyy-zzzQ` are the same eleven characters when `Q` is a digit, and since
modulus-11 is not a Danish validity rule, most such codes parse as valid Danish
numbers.

The package resolves this by ordering rather than by guessing: a candidate always
outranks a recognition, so `010490-9989` stays Danish and the recognition is
never consulted. `010490-998T` is the same six digits with a letter control
character, which no Danish shape can match, and it is recognized as Finnish. The
two fixtures exist as a pair because either alone would leave the boundary
between them untested.

## Why the Swedish provenance gate is silent here

`tools/check-provenance.mjs` reports nothing for any number in this file, and
that was established by construction rather than by observing a green run — the
reasoning is recorded in that file's own comment. In short: Norway's eleven
digits cannot match a ten- or twelve-digit pattern past the digit-boundary
lookarounds, and Finland's letters break every pattern that requires four digits
after a separator. The all-digit Finnish forms that *do* match are the ones
identical to Danish CPR numbers, which the Danish corpus already covers.

**This is not evidence that these fixtures have provenance.** It means the gate
was never asked about them. Their provenance is the table above.

Both `2512480000` and `251248-0000` in `spec/fixtures/dk/cpr-number.json` do
match the ten-digit pattern and are silent for the other reason: they fail
Sweden's Luhn check (`251248000` requires a final `1`), so the scanner does not
report them.
