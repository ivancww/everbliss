# Source policy

## Product

- Product structure, issue-age range, income start timing, health benefit, recipient transfer, advance income, death-benefit wording, and service qualifications: AIA Hong Kong product page: https://www.aia.com.hk/en/products/save/everbliss-annuity
- US$25,000 annual income anchors for ages 50/52/55/57/60/65/67/70 as applicable: product-owner supplied as verified proposal inputs in the PR #1 final correction request dated 2026-10-21. The original proposal PDFs/reference IDs were not attached; this provenance limit remains explicit in data metadata.
- Age interpolation is linear and limited to two surrounding anchors for the same gender, accumulation mode, benefit type, and policy-year dimension. No extrapolation. Interpolated values are never labeled Official.
- Year-10 cash value, terminal bonus, surrender, and death-benefit values are currently provided only for age 50. Do not infer these from income data.
- Do not fill missing ages, policy years, exchange rates, benefits, or product values with estimates and call them Official.

## Government

- SWD OALA page and annuity treatment (checked 2026-10-21): https://www.swd.gov.hk/oala/index.html
- Income and asset limits: https://www.swd.gov.hk/en/pubsvc/socsecu/ssallowance/ssaec/ssaec_oala/ssaec_oala_limit/
- Monthly rate: https://www.swd.gov.hk/en/pubsvc/socsecu/ssallowance/ssa_amt/ssa_amt_all/index.html
- Current configured values are effective 2026-02-01 and were checked 2026-10-21. Update the structured dataset and metadata when SWD changes its published rules.

## Hong Kong Annuity and services

- Hong Kong Annuity comparison data are currently absent; only official HKMC source values may be added later.
- RetireSmart Health Service uses the official AIA product page and service leaflet: https://www.aia.com.hk/en/products/save/everbliss-annuity and https://www.aia.com.hk/content/dam/hk-wise/pdf/en/RetireSmart-Health-Service-leaflet-en.pdf (checked 2026-10-21). It is non-contractual and non-guaranteed, supplied by an independent third party, with possible customer-paid extra/ancillary services. AIA may amend, suspend, terminate, or change service terms. Do not infer additional services or fees.
