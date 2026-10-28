# Hong Kong Annuity comparison — EverBliss Sheet

## Corrected product-owner data location

The source of truth is the EXISTING private [AVA - EverBliss Google Sheet](https://docs.google.com/spreadsheets/d/1BwXsIQ8bTxGo-91vgaackwQwYJBEHn8f_eL4hXjhY3k/edit), spreadsheet ID `1BwXsIQ8bTxGo-91vgaackwQwYJBEHn8f_eL4hXjhY3k`.

New tab: `香港年金_領取金額及百分比` (range `A1:D53`), verified by readback 2026-10-27. The 52 data rows cover issue ages 60–85, male/female.

Columns, and ONLY columns requested by the product owner:
1. `投保年齡` (issue age)
2. `性別` (男/女)
3. `每月領取金額（每HK$1,000,000）`
4. `每年領取百分比（%）` = monthly amount × 12 ÷ 1,000,000 × 100

The percent is a **simple annual payout-to-premium ratio**, NOT IRR, investment yield or guaranteed annual return. The figures are from an HKMC reference-only example, not verified current quotations. Source: https://www.hkmca.hk/eng/files/LAS60_Example_of_Guaranteed_Monthly_Annuity_Payment_Table_Eng.pdf. Do not scale to arbitrary premiums without independently verifying the official calculation rules.

## Scope correction

Do NOT create or require `HK_Annuity_Rules`, `HK_Annuity_Values`, `HK_Annuity_Sources` or separate HKMC Google Sheet tabs in the EverBliss workbook. Do not add guarantee-period, surrender, death, verification or source columns to the product-owner's four-column tab. Keep necessary provenance/validation in this repository documentation and transport contract instead.

The previously created separate staging workbook is obsolete and is NOT the app data source. It has not been deleted.

## Integration gate

The new tab is populated and verified, but **the application is NOT yet connected to it**. Do not embed private Sheet credentials or expose the workbook. The current EverBliss GAS adapter does not yet expose this tab through an approved, tested read-only endpoint.

Implement the app-side read contract through the existing authorized EverBliss GAS transport, after verifying the GAS source and obtaining any necessary deployment approval. Read and validate the exact four-column table; require 52 unique age/sex rows, supported age range, positive finite amounts, and mathematically consistent percentages. Handle missing/unverified data without fabricating figures.

The Journey comparison must reuse the existing total capital, age, sex and selected year. The government side may show the reference monthly amount/ratio only with a clear reference-example qualification, and must not imply verified current rates or arbitrary-premium quotes. Unsupported surrender/death amounts remain `暫無官方數據`.

PR #12 remains open; no merge or deployment before a real end-to-end read and comparison QA.
