# Attribution

The MIT licence in `LICENSE` covers this package's **code**. The test corpus
under `spec/fixtures/` is not ours and carries its own terms.

## Swedish numbers — Skatteverket, CC0 1.0

The Swedish fixtures derive from Skatteverket's published test-number datasets
(*testpersonnummer* and *testsamordningsnummer*), released under **CC0 1.0** —
public domain, no copyright asserted, redistribution permitted.

Skatteverket's own usage condition travels with them, and it binds anyone
*using* the numbers to test a system rather than anyone redistributing them:

> Testpersonnummer som bara får användas i testmiljön — aldrig i produktion.

Test personal numbers, for test environments only — never in production.

## Danish numbers — MedCom

The Danish fixtures use MedCom's published test CPR numbers. MedCom assigns
these numbers **last** rather than withholding them permanently, so the
guarantee is deferral rather than impossibility.

## Constructed and unissuable fixtures

Some fixtures are constructed rather than sourced. Every one of those is either
invalid under its own country's rules, or built from a digit combination the
issuing registry cannot produce — a Swedish century of `00`, or a birth number
of `000`, which SOU 2008:60 places outside the issuable range of `001–999`. No
fixture in this corpus can be a living person's number.

Each fixture carries a `source` field and, where an exception is claimed, a
`provenanceNote` explaining it. The `PROVENANCE.md` files beside the fixtures
reference `docs/` paths that exist in the private source repository rather than
in this mirror.
