# Source policy

## Canonical product data

- The canonical research input for the Full Outcome Engine is Canonical Data Pack v1, retained in `docs/research/` and `src/data/official/`.
- Income rate values preserve `OFFICIAL` or `INTERPOLATED` provenance. The pack contains complete rate rows for 50–75, male/female, immediate/deferred (104 scenarios).
- Parsed proposal outcome curves retain `OFFICIAL_PARSED` provenance and source filename, age, gender, mode, base premium, and annual rows. The pack contains 19 parsed scenarios and 655 year rows.
- Missing age values interpolate only between surrounding same-gender, same-mode official anchors, independently per policy year and per multiplier. They preserve `INTERPOLATED` plus source ages.
- Missing policy-year fields or unsupported brackets stay unavailable. Income data never supplies surrender/death values. No extrapolation.
- Customer default is the withdrawal/cashed income scenario identified by the source map. Do not substitute accumulated-income illustrations.
- A customer premium is scaled from the US$25,000 base. Results do not claim to be a directly generated Official proposal.
- Earlier task examples for selected death benefits differ from the attached parsed multiplier JSON; `docs/calculation-rules.md` records representative discrepancies. The canonical pack is used pending source-owner reconciliation.

## Government

- SWD OALA page and annuity treatment (checked 2026-10-21): https://www.swd.gov.hk/oala/index.html
- Income and asset limits: https://www.swd.gov.hk/en/pubsvc/socsecu/ssallowance/ssaec/ssaec_oala/ssaec_oala_limit/
- Monthly rate: https://www.swd.gov.hk/en/pubsvc/socsecu/ssallowance/ssa_amt/ssa_amt_all/index.html
- Current configured values are effective 2026-02-01 and were checked 2026-10-21. Update the structured dataset and metadata when SWD changes its published rules.

## Hong Kong Annuity and services

- Hong Kong Annuity comparison data are currently absent; only official HKMC source values may be added later.
- RetireSmart Health Service uses the official AIA product page and service leaflet: https://www.aia.com.hk/en/products/save/everbliss-annuity and https://www.aia.com.hk/content/dam/hk-wise/pdf/en/RetireSmart-Health-Service-leaflet-en.pdf (checked 2026-10-21). It is non-contractual and provider/fee/eligibility caveats are disclosed in the UI.
