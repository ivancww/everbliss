# HKMC annuity data — connected source inventory (staging only)

## Native Google Sheet created

- Workbook: [AVA EverBliss — HK Annuity Official Data (Staging)](https://docs.google.com/spreadsheets/d/1wHtZwoqSB_Ch_zzQ2E2zkMU7t54i2RPZpF2HaFhLQNc/edit)
- Spreadsheet ID: `1wHtZwoqSB_Ch_zzQ2E2zkMU7t54i2RPZpF2HaFhLQNc`
- Created and populated on 2026-10-27; four tabs verified by readback:
  - `HK_Annuity_Rates`: 52 age/sex reference rows (ages 60–85; M/F), HK$1,000,000 reference premium, example monthly amount and guarantee months
  - `HK_Annuity_Rules`: source-linked rules and explicit missing-formula flags
  - `HK_Annuity_Values`: schema for surrender/death benefits; monetary amounts **not verified** and intentionally blank
  - `HK_Annuity_Sources`: provenance and reference-only verification status

## Source limitations

The accompanying CSV transcribes the HKMC reference example: https://www.hkmca.hk/eng/files/LAS60_Example_of_Guaranteed_Monthly_Annuity_Payment_Table_Eng.pdf. The document has no effective date and calls the values reference-only. **Do not treat these rows as current customer quotations.** Do not scale the HK$1m figures to other premiums without verifying official scaling/rounding rules. Do not extrapolate outside supported ages. Do not invent surrender or death values.

## Application integration status

**NOT CONNECTED.** Creating and populating the native Google Sheet does not authorize the GitHub Pages application to read it. The existing EverBliss GAS adapter is for EverBliss records, not an approved HKMC feed. The sheet is not a public JSON API, and its spreadsheet ID is not an authentication credential.

Before enabling comparison values:
1. Confirm an approved read-only transport, access controls and any GAS deployment authorization; do not publish a private Sheet or embed service-account credentials in browser code.
2. Implement a versioned, validated read-only data contract (rates/rules/values/sources), with explicit `verification_status`, effective date, caching and error handling.
3. Verify current HKMC rates, eligibility, premium scaling, payment timing, surrender/death formulas against current official documents.
4. Wire the comparison to existing journey inputs; never add duplicate premium/age fields.
5. Test missing, stale, unsupported and unauthorized data. Until verified, render `暫無官方數據` rather than a fabricated amount.

**PR #12 must remain open and unmerged until the product-owner-approved data transport and comparison are validated.**
