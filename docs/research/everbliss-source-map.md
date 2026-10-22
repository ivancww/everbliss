# EverBliss Canonical Source Map

Base premium: **US$25,000**

## Parsed official scenarios

- `55F_deferred` — `55yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–45 (45 rows)
- `55F_immediate` — `55yrs 即期 f.pdf` — OFFICIAL_PARSED — Year 1–45 (45 rows)
- `55M_immediate` — `55yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–45 (45 rows)
- `60F_deferred` — `60yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–40 (40 rows)
- `60F_immediate` — `60yrs 即期 f.pdf` — OFFICIAL_PARSED — Year 1–40 (40 rows)
- `60M_deferred` — `60yrs 延期 m.pdf` — OFFICIAL_PARSED — Year 1–40 (40 rows)
- `60M_immediate` — `60yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–40 (40 rows)
- `65F_deferred` — `65yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–35 (35 rows)
- `65F_immediate` — `65yrs 即期 f.pdf` — OFFICIAL_PARSED — Year 1–35 (35 rows)
- `65M_deferred` — `65yrs 延期 m.pdf` — OFFICIAL_PARSED — Year 1–35 (35 rows)
- `65M_immediate` — `65yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–35 (35 rows)
- `70F_deferred` — `70yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–30 (30 rows)
- `70F_immediate` — `70歲 女 即(1).pdf` — OFFICIAL_PARSED — Year 1–30 (30 rows)
- `70M_deferred` — `70yrs 延期 m.pdf` — OFFICIAL_PARSED — Year 1–30 (30 rows)
- `70M_immediate` — `70yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–30 (30 rows)
- `75F_deferred` — `75歲 女 延.pdf` — OFFICIAL_PARSED — Year 1–25 (25 rows)
- `75F_immediate` — `75歲 女 即.pdf` — OFFICIAL_PARSED — Year 1–25 (25 rows)
- `75M_deferred` — `75歲 男 延(1).pdf` — OFFICIAL_PARSED — Year 1–25 (25 rows)
- `75M_immediate` — `75yr 男 即(1).pdf` — OFFICIAL_PARSED — Year 1–25 (25 rows)

## Indexed / known official anchors not materialized in this run

- Age 50: Female/Male Immediate and Deferred exist in conversation files but their raw backing files were not downloadable in this run.
- Age 52: Female/Male Immediate and Deferred exist in conversation files but their raw backing files were not downloadable in this run.
- Age 57: Female/Male Immediate and Deferred exist in conversation files but their raw backing files were not downloadable in this run.
- Age 67: Female/Male Immediate and Deferred exist in conversation files but their raw backing files were not downloadable in this run.
- Age 55 Male Deferred: no exact raw official proposal was materialized here; income-rate table uses interpolation between surrounding official anchors where appropriate.

## Provenance rules

- `OFFICIAL_PARSED`: full yearly withdrawal-scenario table parsed directly from a materialized official proposal PDF.
- `OFFICIAL`: income rate taken from a known official proposal anchor.
- `INTERPOLATED`: value derived linearly between surrounding official issue-age anchors, same gender + same mode + same field.
- Never treat `累積每月入息（詳細說明）` as the default customer outcome. The canonical customer scenario uses `支取每月入息（詳細說明）`.
- Never extrapolate outside issue age 50–75.

## Runtime formulas

`annualIncome = actualPremium × incomeRate`

`surrenderValue = actualPremium × surrenderMultiplier(policyYear)`

`deathBenefit = actualPremium × deathMultiplier(policyYear)`

Premium range: **US$25,000–US$4,000,000**, any amount inside the range.