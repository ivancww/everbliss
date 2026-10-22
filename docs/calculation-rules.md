# Calculation rules — v0.1.0

## Canonical rate and multiplier model

The canonical input is `docs/research/everbliss-engine-spec.md` and the bundled Canonical Data Pack v1. Income is calculated as premium × annual income rate. Surrender and death are calculated as premium × the policy-year multiplier. Base data is US$25,000; supported premium is US$25,000–US$4,000,000, inclusive, for any amount in range.

- Income rates are indexed by issue age, gender, and mode. Exact data retains `OFFICIAL`; interpolated data retains `INTERPOLATED` and its source ages.
- Parsed surrender and death multiplier curves retain `OFFICIAL_PARSED`; missing issue ages interpolate each policy year and field separately, retaining `INTERPOLATED` and both source ages.
- No extrapolation or cross-gender/cross-mode interpolation is allowed. A field/year without two valid anchors remains unavailable.
- Immediate income: Years 1–7 use the guaranteed rate; Year 8 onward uses the total expected rate.
- Deferred income: Years 1–5 are zero; Years 6–7 use the guaranteed rate; Year 8 onward uses the total expected rate.
- Annual schedules are continuous to attained age 100 for income. Multiplier values remain unavailable past the endpoint of a bracketing Official parsed table.
- HKD display uses user-entered HKD per USD; no exchange rate is embedded. Displayed amounts are rounded only for customer presentation.
- Customer outcome selector shows one active result: annual income, total surrender value, or total death benefit. Parsed total values are not split into component rows.

## Other existing product calculations

- Health extra monthly income = 50% × guaranteed monthly income, never the displayed guaranteed + non-guaranteed total.
- OALA remains a preliminary simulation: it deducts the entered annuity premium from declared assessable assets and adds surrender proceeds; annuity payment is added to monthly income. It does not confirm eligibility or guarantee treatment for a specific EverBliss policy.

## Official death-data correction

The prior death multipliers were parsed from the wrong death-total column / accumulated-income scenario. They have been replaced using the detailed `支取每月入息（詳細說明）` withdrawal tables in the 19 Official proposals listed in `docs/research/everbliss-source-map.md`. The correct death total is the table's `總額` for `保證身故價值 + 終期紅利`; cumulative withdrawn income and accumulated-income interest are excluded. `deathMultiplier = Official withdrawal-scenario death total ÷ US$25,000`. The product-owner examples for 60M Immediate Year 10 (US$20,225) and 75M Immediate Year 10 (US$15,900) reconcile to the source.

Each parsed policy-year row now retains `guaranteedDeathValue`, `terminalBonus`, source `deathTotal`, `deathMultiplier`, source table, and extraction date. Across 655 rows, 653 totals exactly equal their displayed rounded components. Two 75F Deferred source rows (Years 22 and 23) show a US$1 difference from component addition due to the proposal's whole-dollar display rounding; the Official `總額` remains authoritative for the multiplier and the exception is explicitly recorded as `deathComponentRoundingError: -1`. Maximum observed difference is US$1.

Surrender data and multipliers were left unchanged. This repair does not expand Official curve coverage: only the 19 parsed Official scenarios remain directly available, with age/year interpolation where valid bracketing curves exist; missing unbracketed fields fail closed.
