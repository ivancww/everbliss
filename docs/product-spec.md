# EverBliss product specification — v0.1.0

## Purpose and customer language

EverBliss helps a customer understand how part of retirement assets might be converted from a savings amount into ongoing monthly cashflow. The central concern is: 「擔心活得耐，但手上的現金慢慢減少。」 It is a customer conversation and scenario tool, not a generic product brochure or a recommendation engine.

## Main retirement cashflow journey

`J01 concern → J02 monthly spending and existing stable income → J03 liquidity to retain → J04 annuity concept and longevity risk → J05 start timing → J06 age, gender, capital and FX → J07 monthly cashflow and timing → J08 neutral summary`

- Ages 50–59 see future salary-replacement language; ages 60–70 see current income and sustainable cashflow language. The same journey serves both groups.
- Existing retirement benefits are treated as monthly income only when the customer has already structured them as a stable recurring payment.
- The customer chooses an amount to retain as liquidity before any amount is considered for long-term income.
- Start now means guaranteed income begins at policy month 1. Five-year deferred means guaranteed income begins at policy month 61. Potential non-guaranteed income begins at month 85 in either mode.
- The primary result shows the first actual income phase: current guaranteed monthly income for immediate mode, or Year 6 guaranteed income for deferred mode. The Year-8-and-later expected total is secondary. HKD is shown using the entered rate with USD detail and an FX caveat.
- Non-guaranteed income is separately disclosed and may be higher, lower, or zero.
- Exact supplied income anchors are used at supported ages; intermediate ages are linearly interpolated only between same-gender, same-mode official income anchors. These values are visibly distinguished from Official quotes. Surrender and death schedules use the 36 parsed Official proposal curves with per-year interpolation only within the shared curve endpoint; they do not infer benefit data from income rates.
- Premiums above US$25,000 are marked `SCALED_FROM_OFFICIAL`, not as direct proposal values.
- Customer input is HKD. No HKD/USD rate is embedded; the customer must enter a rate for conversion.

## Product feature hub

The feature hub is separate from the cashflow journey.

1. **F01 健康額外收入:** qualifying Alzheimer's disease / irreversible organic degenerative brain disorders or Parkinson's disease on/after the fifth policy anniversary; additional income is 50% of guaranteed monthly income for up to 120 months, subject to terms.
2. **F02 靈活／照顧安排:** Income Transfer Option can direct monthly income to a designated recipient for an approved period starting from the fifth anniversary. Advance Income Benefit can advance eligible guaranteed income under events and limits in AIA's current product material.
3. **F03 身故／家庭安排:** shows cumulative income and a Year-10 death-benefit example. Technical components are expandable. Terminal bonus is non-guaranteed.
4. **F04 增值服務:** RetireSmart Health Service is identified as a non-contractual, non-guaranteed service. The page summarizes verified service groups, eligibility tiers, third-party provider and possible direct fees, geographic limitations, and AIA's right to amend, suspend, or terminate service or terms.

## External support: Old Age Living Allowance

OALA is a separate Home destination. The page displays current official age, income, asset, and monthly payment information, the effective date, household treatment, annuity premium/payout/surrender treatment, a simple before/after tool, official SWD links, and a preliminary-assessment disclaimer. It never reports that the Government has confirmed eligibility.

## Optional hidden comparison: Hong Kong Annuity

The comparison capability is implemented as an App-owned page and data boundary but hidden by default (`showHongKongAnnuityComparison: false`). No HKMC rates or estimates are included until official source data is verified. It is not a Home CTA.

## Admin and User scope

Frontstage is the customer experience. `avaEntry=user` opens that same Frontstage with local editing, preview, save, and reset for the Home hero copy. These edits are stored as `USER_OVERRIDE`; calculations, product data, Government data, and source metadata are protected. `avaEntry=admin` fails closed because no AVA Studio authorization or Official Write connector is implemented. This App declares `admin: false`.
