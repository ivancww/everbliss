# Calculation rules — v0.1.0

## Canonical rate and multiplier model

The canonical input is `docs/research/everbliss-engine-spec.md` and the bundled Canonical Data Pack v1. Income is calculated as premium × annual income rate. Surrender and death are calculated as premium × the policy-year multiplier. Base data is US$25,000; supported premium is US$25,000–US$4,000,000, inclusive, for any amount in range.

- Income rates are indexed by issue age, gender, and mode. Exact data retains `OFFICIAL`; interpolated data retains `INTERPOLATED` and its source ages.
- Parsed surrender and death multiplier curves retain `OFFICIAL_PARSED`; missing issue ages interpolate each policy year and field separately, retaining `INTERPOLATED` and both source ages.
- No extrapolation or cross-gender/cross-mode interpolation is allowed. A field/year without two valid anchors remains unavailable.
- Immediate income: Years 1–7 use the guaranteed rate; Year 8 onward uses the total expected rate.
- Deferred income: Years 1–5 are zero; Years 6–7 use the guaranteed rate; Year 8 onward uses the total expected rate.
- Income schedules cover policy years through attained age 100. Multiplier schedules include every policy year supported by the exact Official table or by both surrounding same-gender/same-mode Official curves. For an interpolated issue age, the schedule stops when either bracketing curve ends; no unsupported tail is presented as a result.
- HKD display uses user-entered HKD per USD; no exchange rate is embedded. Displayed amounts are rounded only for customer presentation.
- Customer outcome selector shows one active result: annual income, total surrender value, or total death benefit. Parsed total values are not split into component rows.

## Other existing product calculations

- Health extra monthly income = 50% × guaranteed monthly income, never the displayed guaranteed + non-guaranteed total.
- OALA remains a preliminary simulation: it deducts the entered annuity premium from declared assessable assets and adds surrender proceeds; annuity payment is added to monthly income. It does not confirm eligibility or guarantee treatment for a specific EverBliss policy.

## Official death-data correction

The prior death multipliers were parsed from the wrong death-total column / accumulated-income scenario. They were replaced using the detailed `支取每月入息（詳細說明）` withdrawal tables in the 19 initial Official proposals listed in `docs/research/everbliss-source-map.md`; multiplier coverage was then completed with 17 additional Official proposals. The correct death total is the table's `總額` for `保證身故價值 + 終期紅利`; cumulative withdrawn income and accumulated-income interest are excluded. `deathMultiplier = Official withdrawal-scenario death total ÷ US$25,000`. The product-owner examples for 60M Immediate Year 10 (US$20,225) and 75M Immediate Year 10 (US$15,900) reconcile to the source.

The normalized dataset contains 36 Official parsed scenarios and 1,396 year rows. All 741 rows added in this coverage pass were extracted from the withdrawal/cashed-income detailed tables; per-row source PDF page numbers are retained for surrender and death. The new rows' surrender totals equal guaranteed cash value plus terminal bonus, and death totals equal guaranteed death value plus terminal bonus, with zero reconciliation difference. Across the full 1,396-row death dataset, 1,394 totals exactly equal their displayed rounded components. Two 75F Deferred source rows (Years 22 and 23) show a US$1 difference due to whole-dollar source rounding; the Official `總額` remains authoritative and the exception is recorded as `deathComponentRoundingError: -1`. Maximum difference is US$1.

Existing surrender data was preserved. Official parsed curves now directly cover ages 50, 52, 55M Deferred, 57, 60, 65, 67, 70, and 75 wherever listed in the source map. Exact 55M Deferred data is available and used as `OFFICIAL_PARSED`. All 104 age/gender/mode scenarios resolve both surrender and death through the full overlapping source-supported policy-year range. Interpolated ages can end before attained age 100 because a bracketing proposal may end earlier at that same policy year; years outside the valid overlap remain fail-closed.
