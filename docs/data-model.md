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

The EverBliss anchor records include product, gender, issue age, accumulation mode, single premium, source type, source reference, and policy-year values where supplied. The correction request supplied a verified US$25,000 annual income schedule for ages 50, 52, 55, 57, 60, 65, 67, and 70 for applicable gender/mode combinations. Original proposal PDFs/reference IDs remain unattached and are disclosed in metadata. Exact age values are `OFFICIAL`; bracketed income values are `INTERPOLATED` with the two source ages retained. Premium scaling is separately tagged `SCALED_FROM_OFFICIAL`. Unsupported combinations fail closed. Year-10 cash value, terminal bonus, surrender, and death values remain available only for the exact age-50 anchors that include those fields; income interpolation cannot produce them.

## OALA source metadata

The OALA dataset includes effective date, verification date, age, single/couple income and asset limits, monthly benefit, treatment of annuity premium/payout/surrender value, source titles, and official SWD URLs.

## Future Admin domains

Product terms; official age/proposal anchors; Government/OALA data; HK Annuity comparison data; feature/service content; system information. Domains remain read-only until an authenticated AVA Studio connector and persisted-write evidence are implemented.
