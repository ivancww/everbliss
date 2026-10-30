# OALA ideal arrangement verification

Conditional illustration only: EverBliss-specific SWD classification is not verified. Annuity payouts count as assessable income under SWD's OALA guidance; premium treatment is assumed only for this illustration. The eventual SWD assessment also depends on residence, age, household and other conditions. See https://www.swd.gov.hk/oala/index_e.html.

The feasible interval uses the existing assessment and income engine, available funds, assessed assets and product limits. The upper limit is searched in integer HKD. An entered available-funds figure is assumed to be part of the assessable assets. One recipient is illustrated, including for couples.

The 70- and 75-year-old female immediate US$25,000 supplied illustrations, pages 7 and 8, withdrawal scenario, were checked in automated tests for surrender and death totals at years 1, 2, 5, 8, 10, 20 and final supported year. Exact anchor cases only; interpolation, deferred official PDFs and all other years require additional verification. No formula was changed.

Device QA, browser interaction, user edit and admin E2E: NOT TESTED. Existing automated checks do not establish these. Confirm manual and ideal switching, validation on asset and household changes, inputs, keyboard handling, comparison card placement, responsive overflow, navigation and PWA update before merge. Production SWD classification is BLOCKED pending authoritative confirmation.
