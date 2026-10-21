# EverBliss data model

## Local stores

- IndexedDB database `ava-everbliss-local`, schema version 1.
- `appState`: one customer-local journey record, including current page, inputs, FX entry, and OALA inputs.
- `userOverrides`: presentation-only local overrides, separated from journey data and Official data.
- A namespaced LocalStorage fallback is used only where IndexedDB is unavailable. No blanket clear/delete operation is used.

## Ownership and precedence

1. `BUILT_IN_DEFAULT`: journey copy and App configuration defaults.
2. `OFFICIAL`: product terms, source-backed proposal anchors, SWD limits/payment values, and source metadata.
3. `USER_OVERRIDE`: allowed personal presentation settings, rendered over built-in copy where permitted.

User overrides cannot mutate Official records, calculation logic, protected product terms, Government facts, or source metadata. There is no production Official Write path in v0.1.0.

## Product data provenance fields

The EverBliss anchor records include product, gender, issue age, accumulation mode, single premium, policy year, source type, source reference, verified date, and notes. The four 50-year-old US$25,000 proposal values were supplied in the product-owner task and marked `OFFICIAL`; the exact source PDF/reference identifier is explicitly pending because the files were not attached to the repository. Results distinguish `OFFICIAL` anchors, `SCALED_FROM_OFFICIAL` premium-scaling scenarios, `INTERPOLATED` values (not currently produced), and `CALCULATED` outputs.

## OALA source metadata

The OALA dataset includes effective date, verification date, age, single/couple income and asset limits, monthly benefit, treatment of annuity premium/payout/surrender value, source titles, and official SWD URLs.

## Future Admin domains

Product terms; official age/proposal anchors; Government/OALA data; HK Annuity comparison data; feature/service content; system information. Domains remain read-only until an authenticated AVA Studio connector and persisted-write evidence are implemented.
