# HKMC simplified comparison

Only A–D of the existing 香港年金_領取金額及百分比 Sheet tab are used. The 52 reference monthly rates are scaled proportionally from HK$1m for premiums HK$500,000–5,000,000; annual percentage is reconciled with the monthly reference. Calculations assume 12 payments per completed policy year, no termination or withdrawals, and are rounded for display. Income continues to selected attained age 100. The simplified death estimate is max(0, original premium minus cumulative income). It excludes guaranteed cash value and is not the official guaranteed benefit; the table contains the required disclosure. AIA calculations remain unchanged.

The owner must review and update the existing production GAS deployment after authorization: keep EVERBLISS_SHEET_ID and AVA_PLATFORM_ADMIN_ENDPOINT. The existing getHKAnnuityRates fix is required because the Sheet now has additional columns. The live deployment and real-device QA have not been verified. Premium scaling and rounding are model assumptions, not a personal HKMC quotation.

## AIA issue-age comparison boundary

The reference Sheet contains HKMC rates for issue ages 60–85, and all source rates are retained. The customer-facing comparison is deliberately restricted to original issue ages **60–75 inclusive**, matching the current AIA EverBliss supported issue-age range. For ages below 60 or above 75 the entire comparison entry is hidden, including when the attained age later enters the HKMC eligible range. Do not widen AIA issue-age eligibility to match HKMC.
