# EverBliss Canonical Source Map

Base premium: **US$25,000**

## Official parsed scenario inventory

The runtime dataset contains **36 direct `OFFICIAL_PARSED` scenarios** and **1,396 annual rows**. Each curve uses the withdrawal/cashed-income illustration and extends through its proposal-supported attained age 100 endpoint.

- `50F_deferred` — `50yrs 延 25k f.pdf` — OFFICIAL_PARSED — Year 1–50 (50 rows)
- `50F_immediate` — `50yrs 即 25k f.pdf` — OFFICIAL_PARSED — Year 1–50 (50 rows)
- `50M_deferred` — `50yrs 延 25k m.pdf` — OFFICIAL_PARSED — Year 1–50 (50 rows)
- `50M_immediate` — `50yrs 即 25k m.pdf` — OFFICIAL_PARSED — Year 1–50 (50 rows)
- `52F_deferred` — `52yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–48 (48 rows)
- `52F_immediate` — `52yrs 即期 f.pdf` — OFFICIAL_PARSED — Year 1–48 (48 rows)
- `52M_deferred` — `52yrs 延期 m.pdf` — OFFICIAL_PARSED — Year 1–48 (48 rows)
- `52M_immediate` — `52yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–48 (48 rows)
- `55F_deferred` — `55yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–45 (45 rows)
- `55F_immediate` — `55yrs 即期 f.pdf` — OFFICIAL_PARSED — Year 1–45 (45 rows)
- `55M_deferred` — `55yrs 延期 m.pdf` — OFFICIAL_PARSED — Year 1–45 (45 rows)
- `55M_immediate` — `55yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–45 (45 rows)
- `57F_deferred` — `57yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–43 (43 rows)
- `57F_immediate` — `57yrs 即期 f.pdf` — OFFICIAL_PARSED — Year 1–43 (43 rows)
- `57M_deferred` — `57yrs 延期 m.pdf` — OFFICIAL_PARSED — Year 1–43 (43 rows)
- `57M_immediate` — `57yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–43 (43 rows)
- `60F_deferred` — `60yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–40 (40 rows)
- `60F_immediate` — `60yrs 即期 f.pdf` — OFFICIAL_PARSED — Year 1–40 (40 rows)
- `60M_deferred` — `60yrs 延期 m.pdf` — OFFICIAL_PARSED — Year 1–40 (40 rows)
- `60M_immediate` — `60yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–40 (40 rows)
- `65F_deferred` — `65yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–35 (35 rows)
- `65F_immediate` — `65yrs 即期 f.pdf` — OFFICIAL_PARSED — Year 1–35 (35 rows)
- `65M_deferred` — `65yrs 延期 m.pdf` — OFFICIAL_PARSED — Year 1–35 (35 rows)
- `65M_immediate` — `65yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–35 (35 rows)
- `67F_deferred` — `67yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–33 (33 rows)
- `67F_immediate` — `67yrs 即期 f.pdf` — OFFICIAL_PARSED — Year 1–33 (33 rows)
- `67M_deferred` — `67yrs 延期 m.pdf` — OFFICIAL_PARSED — Year 1–33 (33 rows)
- `67M_immediate` — `67yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–33 (33 rows)
- `70F_deferred` — `70yrs 延期 f.pdf` — OFFICIAL_PARSED — Year 1–30 (30 rows)
- `70F_immediate` — `70歲 女 即(1).pdf` — OFFICIAL_PARSED — Year 1–30 (30 rows)
- `70M_deferred` — `70yrs 延期 m.pdf` — OFFICIAL_PARSED — Year 1–30 (30 rows)
- `70M_immediate` — `70yrs 即期 m.pdf` — OFFICIAL_PARSED — Year 1–30 (30 rows)
- `75F_deferred` — `75歲 女 延.pdf` — OFFICIAL_PARSED — Year 1–25 (25 rows)
- `75F_immediate` — `75歲 女 即.pdf` — OFFICIAL_PARSED — Year 1–25 (25 rows)
- `75M_deferred` — `75歲 男 延(1).pdf` — OFFICIAL_PARSED — Year 1–25 (25 rows)
- `75M_immediate` — `75yr 男 即(1).pdf` — OFFICIAL_PARSED — Year 1–25 (25 rows)

## Extraction and coverage

The parsed anchors cover ages 50, 52, 55, 57, 60, 65, 67, 70, and 75 where proposal files are available, separately by gender and mode. Exact `55M_deferred` proposal `55yrs 延期 m.pdf` was found and parsed; it is not interpolated.

The 17 added proposals were parsed from `支取每月入息（詳細說明）` only. Surrender rows retain guaranteed cash value, terminal bonus, displayed surrender total, multiplier, and source page. Death rows retain guaranteed death value, terminal bonus, displayed total, multiplier, and source page. Every added component sum reconciles exactly to its displayed total (741/741 surrender rows; 741/741 death rows). No accumulated-income rows were included.

For a missing issue age, each multiplier and policy year is interpolated only between surrounding same-gender/same-mode Official anchors. No cross-gender, cross-mode, or age extrapolation is used. A calculated schedule ends at the last policy year present in both bracketing curves. For interpolated ages this can be earlier than attained age 100 because one of the proposals ends at age 100 on a different policy year. The unsupported tail is not returned as an incomplete or fabricated row.

The complete death dataset has 1,396 annual rows; 1,394 totals equal rounded death components exactly. Two 75F Deferred rows (Years 22 and 23) show component sums one USD higher than the displayed Official total due to whole-dollar source rounding. The Official total is retained for the multiplier and `deathComponentRoundingError: -1` records each exception.

## Provenance rules

- `OFFICIAL_PARSED`: direct annual outcome values extracted from an Official proposal PDF.
- `OFFICIAL`: income rate taken from a known Official proposal anchor.
- `INTERPOLATED`: value derived linearly between surrounding Official issue-age anchors, same gender + same mode + same policy year + same field; source ages are retained.
- Never treat `累積每月入息（詳細說明）` as the default customer outcome. The canonical customer scenario is `支取每月入息（詳細說明）`.
- Never extrapolate outside issue age 50–75 or outside the shared policy-year range of bracketing curves.

## Runtime formulas

`annualIncome = actualPremium × incomeRate`

`surrenderValue = actualPremium × surrenderMultiplier(policyYear)`

`deathBenefit = actualPremium × deathMultiplier(policyYear)`

Premium range: **US$25,000–US$4,000,000**, any amount in range.
