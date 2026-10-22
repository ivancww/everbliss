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

The EverBliss income and outcome records include product, gender, issue age, accumulation mode, single premium, source type, source reference, and policy-year values. Income has verified US$25,000 anchors across ages 50–75; exact age values are `OFFICIAL` and bracketed values are `INTERPOLATED` with source ages retained. The outcome multiplier dataset has 36 `OFFICIAL_PARSED` proposal curves across exact ages 50, 52, 55, 57, 60, 65, 67, 70, and 75 where available. Every new annual row includes its source file and withdrawal-table page references for surrender and death. Missing issue ages interpolate same-gender, same-mode, same-policy-year, same-field values only while both Official curves contain that year. The schedule ends at that shared endpoint. Premium scaling is tagged `SCALED_FROM_OFFICIAL`; no outcome value is inferred from income rates.

## OALA source metadata

The OALA dataset includes effective date, verification date, age, single/couple income and asset limits, monthly benefit, treatment of annuity premium/payout/surrender value, source titles, and official SWD URLs.

## Future Admin domains

Product terms; official age/proposal anchors; Government/OALA data; HK Annuity comparison data; feature/service content; system information. Domains remain read-only until an authenticated AVA Studio connector and persisted-write evidence are implemented.
