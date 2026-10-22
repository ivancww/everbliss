# EverBliss data model

## Local stores

- IndexedDB database `ava-everbliss-local`, schema version 2 (upgrades from v1 without deleting data).
- `appState`: customer-local journey inputs, route, outcome view/year and OALA inputs.
- `userOverrides`: presentation-only local overrides, separate from journey state and Official data.
- `officialLastKnownGood`: validated last-known-good Official dataset cache, separate from User Overrides.
- Namespaced LocalStorage fallback is used only when IndexedDB is unavailable. No blanket clear/delete operation is used.

## Ownership and precedence

Calculation Official data resolves as `VALID_CLOUD_OFFICIAL → LAST_KNOWN_GOOD_OFFICIAL → VERIFIED_BUILT_IN_OFFICIAL_FALLBACK`. Presentation defaults may be overlaid by allowed `USER_OVERRIDE` fields. No User Override value is sent to GAS or stored in the Official Sheet.

User overrides cannot mutate Official records, calculation logic, product terms, Government facts, or source metadata. Live Official writes remain unavailable until the Google resources and AVA server-side proof exchange are deployed and verified.

## Product data provenance

Income Official anchors are expanded at runtime to all 104 age/gender/mode records using same-gender and same-mode interpolation. Exact anchors keep `OFFICIAL`; derived rates carry `INTERPOLATED` and source ages. The multiplier source pack has 36 `OFFICIAL_PARSED` proposal curves with annual withdrawal-scenario rows. For missing issue ages, surrender and death multipliers are interpolated independently by field, same attained age, gender, and mode. If an Official proposal begins after the requested attained age at the first duration edge, its first row is used only to complete that edge; the overlapping annual curve remains attained-age aligned. Every supported schedule ends at attained age 100. Premium scaling is `SCALED_FROM_OFFICIAL`.

## Government source metadata

OALA data stores effective date, verification date, age, single/couple income and asset limits, monthly benefit, treatment metadata, source titles, and official SWD URLs.

## Admin domains

The App-owned Admin domains are Product Config, Income Rates, Surrender Multipliers, Death Multipliers, Official Sources, and Dataset Status. The launch route requires AVA `ava-admin-session-v1` proof and a server-side exchange; URL routing alone is not authorization. The Sheet schema and GAS endpoint preparation are documented in `docs/google-sheet-gas-architecture.md`. No production deployment or write path exists yet.
