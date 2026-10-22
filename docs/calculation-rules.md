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

## Canonical source validation caveat

The attached Canonical Data Pack's parsed death multipliers do not agree with examples supplied in earlier task instructions. For example, age 60 male immediate Year 10 is parsed as death total US$34,633 (1.38532×), while earlier instructions gave US$20,225 (0.809×). Age 75 male immediate Year 10 is parsed as US$34,281 (1.37124×), while earlier instructions gave US$15,900. This build uses the explicitly designated canonical pack as the runtime source and preserves the parsed values; the discrepancy requires product-owner/source confirmation before customer release.
