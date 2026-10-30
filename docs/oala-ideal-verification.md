# OALA ideal arrangement verification

Conditional illustration only: EverBliss-specific SWD classification is not verified. Annuity payouts count as assessable income under SWD's OALA guidance; premium treatment is assumed only for this illustration. The eventual SWD assessment also depends on residence, age, household and other conditions. See https://www.swd.gov.hk/oala/index_e.html.

The feasible interval uses the existing assessment and income engine, available funds, assessed assets and product limits. The upper limit is searched in integer HKD. An entered available-funds figure is assumed to be part of the assessable assets. One recipient is illustrated, including for couples.

The 70- and 75-year-old female immediate US$25,000 supplied illustrations, pages 7 and 8, withdrawal scenario, were checked in automated tests for surrender and death totals at years 1, 2, 5, 8, 10, 20 and final supported year. Exact anchor cases only; interpolation, deferred official PDFs and all other years require additional verification. No formula was changed.

Device QA, browser interaction, user edit and admin E2E: NOT TESTED. Existing automated checks do not establish these. Confirm manual and ideal switching, validation on asset and household changes, inputs, keyboard handling, comparison card placement, responsive overflow, navigation and PWA update before merge. Production SWD classification is BLOCKED pending authoritative confirmation.

## PR 16 continuation

Baseline HEAD 7b444be13837221a6880ce0f4423f5487ffc1dd9. The continuation clears an accepted premium when the financial inputs, age, mode, selected year or FX change, and keeps the editable ideal draft in memory until acceptance. Existing manual premium is separate. Regression tests cover zero funds, product minimum, exact single-point interval, FX rounding, deferred start timing and interpolation provenance. Total 155 tests pass; build and git diff --check pass. Lint script is not defined.

Browser verification BLOCKED: local Playwright has no installed browser executable; cloud browser connection to localhost:4173 was refused. Desktop, iPad, Honor folded/unfolded and phone viewport interaction/screenshots are NOT TESTED. No physical device was tested. Current CSS retains two input/comparison columns above 700px and stacks at 700px or below; no Magic V5 parity claim is made. Responsive modifications require browser evidence before merge. Admin/User Edit/PWA browser regressions and manual/ideal acceptance interactions remain NOT TESTED. Full PDF-year comparisons, guaranteed-death-specific checks, deferred source PDFs and input invalidation browser tests remain incomplete. Official EverBliss classification remains BLOCKED; financial screening is conditional. Merge recommendation: NOT READY.
