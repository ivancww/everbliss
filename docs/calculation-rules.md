# Calculation rules — v0.1.0

## Canonical rate and multiplier model

The canonical input is `docs/research/everbliss-engine-spec.md` and the bundled Canonical Data Pack v1. Income is calculated as premium × annual income rate. Surrender and death are calculated as premium × the policy-year multiplier. Base data is US$25,000; supported premium is US$25,000–US$4,000,000, inclusive, for any amount in range.

- Income rates are indexed by issue age, gender, and mode. Exact data retains `OFFICIAL`; interpolated data retains `INTERPOLATED` and its source ages.
- Parsed surrender and death multiplier curves retain `OFFICIAL_PARSED`; missing issue ages interpolate each multiplier independently at the same attained age, gender, mode, and field, retaining `INTERPOLATED` and both source ages.
- No extrapolation or cross-gender/cross-mode interpolation is allowed. A field/year without two valid anchors remains unavailable.
- Immediate income: Years 1–7 use the guaranteed rate; Year 8 onward uses the total expected rate.
- Deferred income: Years 1–5 are zero; Years 6–7 use the guaranteed rate; Year 8 onward uses the total expected rate.
- All 104 age/gender/mode schedules cover policy years 1 through attained age 100. Interpolated multiplier rows align the lower and upper Official proposals by attained age (`issueAge + policyYear`). Official tables begin at attained age `issueAge + 1`; at the first duration edge where the upper anchor has no row at the requested attained age, its first illustrated row fills that edge only. This boundary handling is explicitly tested; all subsequent overlapping rows use exact attained-age matches.
- HKD display uses user-entered HKD per USD; no exchange rate is embedded. Displayed amounts are rounded only for customer presentation.
- Customer outcome selector shows one active result: annual income, total surrender value, or total death benefit. Parsed total values are not split into component rows.

## Other existing product calculations

- Health extra monthly income = 50% × guaranteed monthly income, never the displayed guaranteed + non-guaranteed total.
- OALA remains a preliminary simulation: it deducts the entered annuity premium from declared assessable assets and adds surrender proceeds; annuity payment is added to monthly income. It does not confirm eligibility or guarantee treatment for a specific EverBliss policy.

## Official death-data correction

The prior death multipliers were parsed from the wrong death-total column / accumulated-income scenario. They were replaced using the detailed `支取每月入息（詳細說明）` withdrawal tables in the 19 initial Official proposals listed in `docs/research/everbliss-source-map.md`; multiplier coverage was then completed with 17 additional Official proposals. The correct death total is the table's `總額` for `保證身故價值 + 終期紅利`; cumulative withdrawn income and accumulated-income interest are excluded. `deathMultiplier = Official withdrawal-scenario death total ÷ US$25,000`. The product-owner examples for 60M Immediate Year 10 (US$20,225) and 75M Immediate Year 10 (US$15,900) reconcile to the source.

The normalized dataset contains 36 Official parsed scenarios and 1,396 year rows. All 741 rows added in this coverage pass were extracted from the withdrawal/cashed-income detailed tables; per-row source PDF page numbers are retained for surrender and death. The new rows' surrender totals equal guaranteed cash value plus terminal bonus, and death totals equal guaranteed death value plus terminal bonus, with zero reconciliation difference. Across the full 1,396-row death dataset, 1,394 totals exactly equal their displayed rounded components. Two 75F Deferred source rows (Years 22 and 23) show a US$1 difference due to whole-dollar source rounding; the Official `總額` remains authoritative and the exception is recorded as `deathComponentRoundingError: -1`. Maximum difference is US$1.

Existing surrender data was preserved. Official parsed curves directly cover ages 50, 52, 55M Deferred, 57, 60, 65, 67, 70, and 75 wherever listed in the source map. Exact 55M Deferred data is `OFFICIAL_PARSED`. Age interpolation now matches each lower and upper proposal by attained age, not policy-year index. The 104-scenario regression verifies all income, surrender multiplier/value, and death multiplier/benefit fields are finite through attained age 100. No interpolation is performed outside ages 50–75.

## Official data service preparation

The runtime resolver validates cloud Official datasets, caches valid data separately as Last Known Good, and falls back to the bundled release snapshot on network failure or schema rejection. Runtime interpolation expands Official income anchors where necessary. A future deployed Google Sheet/GAS becomes the cloud source only after the seven-sheet schema, verifier, deployment, and data equivalence gates in `docs/google-sheet-gas-architecture.md` pass. No Sheet, GAS endpoint, or Platform write integration is configured in the current PR.
