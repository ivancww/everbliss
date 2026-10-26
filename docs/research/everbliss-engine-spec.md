# EverBliss Rate + Multiplier Engine Spec

## Canonical model

Official US$25,000 proposal → rate/multiplier → issue-age interpolation → multiply by actual premium.

## Income

Immediate:
- Year 1–7: `premium × guaranteedRate`
- Year 8+: `premium × totalRateFromYear8`

Deferred:
- Year 1–5: `0`
- Year 6–7: `premium × guaranteedRate`
- Year 8+: `premium × totalRateFromYear8`

## Surrender and death

For each policy year:

- `surrenderMultiplier = officialSurrenderTotal / 25000`
- `deathMultiplier = officialDeathTotal / 25000`
- `surrenderValue = actualPremium × surrenderMultiplier`
- `deathBenefit = actualPremium × deathMultiplier`

## Missing issue ages

Interpolate same gender + same mode + same policy year + same field only. Do not derive death from surrender or surrender from income. Do not extrapolate.

## Customer UI

Use three outcome modes:

`每年領取 | 退保價值 | 身故賠償`

- Income: show `% / 年` plus annual amount and optional monthly equivalent.
- Surrender: show `x 倍本金` plus actual amount.
- Death: show `x 倍本金` plus actual amount.

Frontstage does not split GCV / terminal bonus or guaranteed death / terminal bonus.
