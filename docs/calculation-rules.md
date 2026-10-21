# Calculation rules — v0.1.0

- Age anchor selection is exact by issue age, gender, and accumulation mode. No match returns `NO_OFFICIAL_AGE_ANCHOR`.
- Accepted product issue age follows official product information; the customer planning input is restricted to the 50–70 target context.
- USD premium must be within US$25,000–US$4,000,000. For values above/below the verified anchor, the calculation source is `SCALED_FROM_OFFICIAL`; otherwise it is `OFFICIAL`.
- Guaranteed monthly income = official guaranteed annual income ÷ 12 × premium factor.
- Non-guaranteed monthly income = official Year-8 NG annual income ÷ 12 × premium factor. It is zero in Year 1–7 and begins at policy month 85.
- Immediate guarantee begins at month 1; deferred guarantee begins at month 61.
- Year-10 cumulative displayed income counts guaranteed and potential NG only for months in which those components have started.
- Health extra monthly income = 50% × guaranteed monthly income, never the displayed guaranteed + NG total.
- Year-10 surrender total = guaranteed cash value + terminal bonus.
- Guaranteed death value follows the task-provided rule: higher of guaranteed cash value and 105% of single premium less cumulative guaranteed income paid. Expected total adds the scaled official terminal bonus. Unrecovered advance income and other contract adjustments are outside the current scenario because they are not inputs.
- HKD/USD conversion = HKD amount ÷ user-entered HKD-per-USD rate. No default rate exists.
- The OALA calculator subtracts the intended annuity premium from the entered assessable assets and adds stated surrender proceeds; it adds the annuity payment to monthly assessable income. It is a simplified preliminary scenario and omits other eligibility conditions and individualized SWD determinations.
