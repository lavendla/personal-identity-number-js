# Provenance — Danish fixtures

Where every Danish fixture came from, and for any `constructed` case, why no
bearer can exist.

The rule, from `CLAUDE.md`: a fixture that must be **valid** comes from an
official published test range or it does not go in. Cases marked `constructed`
must be **invalid** — a constructed number that happens to be valid is exactly
the problem.

## Sources

| `source` | Meaning |
|---|---|
| `medcom` | Present in `spec/sources/medcom/test-cpr-numbers.csv`, from MedCom's published national test list |
| `constructed` | Written for this repository. Must be invalid, or carry a `provenanceNote` explaining why no bearer can exist |

Note the asymmetry with Sweden, explained in full in
[`../../sources/medcom/README.md`](../../sources/medcom/README.md): CPR's own
30,000+ test entities are **not** usable, because CPR builds test keys by the
same public rules as real numbers, so a key can coincidentally match a living
person. MedCom's reserved serials (`9995`/`9996`/`9989`/`9990`) are what this
corpus draws on.

MedCom's guarantee is that these numbers are **assigned last** — deferred, not
permanently withheld. Recorded that way here and in the source README because
overstating protection is the failure this project keeps guarding against.

## Per-file breakdown

### `cpr-number.json`

| Fixture | `source` | Note |
|---|---|---|
| `…with-separator` | `medcom` | `251248-9996`, born 1948-12-25 |
| `…without-separator` | `medcom` | Same number, canonical input |
| `…renders-short-identically-to-display` | `medcom` | Carries no `referenceDate`, asserting two things at once: Denmark needs none, and `Short` equals `Display` where Sweden's would fail |
| `…odd-serial-is-male` | `medcom` | `010490-9995`, born 1990-04-01 |
| `…post-2007-failing-modulus-eleven-is-valid` | `medcom` | `131016-9995`, born 2016. **The most important Danish fixture** |
| `…rejects-a-serial-of-zero` | `constructed` | `DDMMYY-0000` is not a CPR, so no bearer exists |
| `…rejects-the-thirtieth-of-february` | `constructed` | 30 February exists in no century |
| `…rejects-a-birth-date-after-the-reference-date` | `constructed` | Resolves to 2032; CPR has issued no numbers to the unborn |

Every `medcom` number here fails modulus-11, which is deliberate on MedCom's
part and is not a defect. See the source README.

### `century-table.json`

Five of the table's seven rows. `spec/schemes/dk/cpr-number.json` records the
table, `packages/*/tests/*CprCenturyTable*` assert its **totality**, and
`packages/*/tests/*CprCenturyResolver*` assert **all seven rows** resolve to the
right values from integer pairs. These fixtures assert the two runtimes agree
about it.

**Rows 3 and 5 have no fixture, and cannot.** They cover serials `4000-4999`
years `37-99` and `5000-8999` years `58-99`, both resolving to a past century.
Pinning either needs a number that *parses successfully*, and:

- MedCom's serials are all `9989`/`9990`/`9995`/`9996`, so the published corpus
  reaches only rows 6 and 7.
- Constructing one means constructing a **valid** Danish number, which is the
  disclosure risk the corpus rules exist to prevent.

Neither row can be pinned by an invalid number either. The leap-year trick used
for row 1 needs a two-digit year where the candidate centuries disagree about
leapness, which only `00` provides, and `00` is outside both ranges. The
future-date trick used for rows 2 and 4 needs the correct answer to be the
future one, and here it is the past one. So the gap is structural, not laziness,
and the twin resolver tests are what cover it.

Row 5 is also the row that reads like a mistake: serials `5000-8999` with years
`58-99` resolve to the **nineteenth** century, so `091175-8967` is a person born
in 1875. It is correct, and it is the row with the least fixture coverage —
worth knowing together.

Rows 1, 2 and 4 are pinned by *failures*, which is unusual enough to state:

| Row | Fixture asserts | Why the failure identifies the century |
|---|---|---|
| `0001-3999`, `00-99` → 1900 | `impossible-date` | 29 February 1900 does not exist; resolving to 2000 would have parsed |
| `4000-4999`, `00-36` → 2000 | `future-birth-date` | Resolves to 2030; resolving to 1930 would have parsed |
| `5000-8999`, `00-57` → 2000 | `future-birth-date` | Resolves to 2030; resolving to 1930 would have parsed |

### `../ambiguous/se-dk.json`

The collision that motivates the whole country-required design.

| Fixture | `source` | Note |
|---|---|---|
| `…swedish-short-form-also-parses-as-danish` | `skatteverket` | Short form of published `202601012384`. Swedish reading born 2026-01-01, Danish reading born 1901-01-26 — 125 years apart |
| `…medcom-number-also-parses-as-swedish` | `medcom` | The same collision from the Danish side, and only committable because the provenance gate now reads the MedCom corpus |
| `…naming-a-country-resolves-it` | `skatteverket` | The first fixture's digits with `issuedBy` set, paired so both outcomes sit side by side |

Both ambiguity fixtures omit `issuedBy`, which is how a fixture says "name no
country, run every scheme". They also **require** a `referenceDate`: without one
Sweden refuses to guess a century and fails with `CenturyRequired`, leaving
Denmark the only reading and nothing to be ambiguous about. The collision needs
a reference date to exist at all.

Measured scale, so nobody files this as a curiosity: **5502** Skatteverket short
forms also parse as Danish, and **5** of MedCom's 36 numbers also parse as
Swedish.
