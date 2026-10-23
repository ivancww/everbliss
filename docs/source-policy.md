# Source policy

## Canonical product data

- The canonical research input for the Full Outcome Engine is Canonical Data Pack v1, retained in `docs/research/` and `src/data/official/`.
- Income rate values preserve `OFFICIAL` or `INTERPOLATED` provenance. The pack contains complete rate rows for 50–75, male/female, immediate/deferred (104 scenarios).
- Parsed proposal outcome curves retain `OFFICIAL_PARSED` provenance and source filename, age, gender, mode, base premium, and annual rows. The dataset contains 36 parsed scenarios and 1,396 year rows, including all available exact 50/52/57/67 anchors and exact 55M Deferred.
- Missing multiplier ages use surrounding same-gender, same-mode Official anchors independently per field. Matched attained ages preserve `ATTAINED_AGE_INTERPOLATED`, source attained age, and source policy years. Early rows that require equal-duration interpolation preserve `BOUNDARY_INTERPOLATED` and both source policy years. Income rate interpolation continues to use `INTERPOLATED`.
- Missing policy-year fields or unsupported brackets stay unavailable. Income data never supplies surrender/death values. No extrapolation.
- Customer default is the withdrawal/cashed income scenario identified by the source map. Do not substitute accumulated-income illustrations.
- A customer premium is scaled from the US$25,000 base. Results do not claim to be a directly generated Official proposal.
- Parsed surrender and death tables use the withdrawal/cashed-income scenario, and source table page numbers are retained for the 17 newly parsed scenarios. The existing documented US$1 component-rounding exceptions remain explicit; source displayed totals are used for multipliers.

## Government

- SWD OALA page and annuity treatment (checked 2026-10-21): https://www.swd.gov.hk/oala/index.html
- Income and asset limits: https://www.swd.gov.hk/en/pubsvc/socsecu/ssallowance/ssaec/ssaec_oala/ssaec_oala_limit/
- Monthly rate: https://www.swd.gov.hk/en/pubsvc/socsecu/ssallowance/ssa_amt/ssa_amt_all/index.html
- Current configured values are effective 2026-02-01 and were checked 2026-10-21. Update the structured dataset and metadata when SWD changes its published rules.

## Hong Kong Annuity and services

- Hong Kong Annuity comparison data are currently absent; only official HKMC source values may be added later.
- RetireSmart Health Service uses the official AIA product page and service leaflet: https://www.aia.com.hk/en/products/save/everbliss-annuity and https://www.aia.com.hk/content/dam/hk-wise/pdf/en/RetireSmart-Health-Service-leaflet-en.pdf (checked 2026-10-21). It is non-contractual and provider/fee/eligibility caveats are disclosed in the UI.
