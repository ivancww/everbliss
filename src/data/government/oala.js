export const oalaData = Object.freeze({
  ruleType: "Old Age Living Allowance (OALA) means test",
  effectiveDate: "2026-02-01",
  verifiedDate: "2026-10-26",
  eligibilityAge: 65,
  single: Object.freeze({ incomeLimit: 10900, assetLimit: 415000 }),
  couple: Object.freeze({ incomeLimit: 16680, assetLimit: 630000 }),
  monthlyBenefit: 4345,
  annuityTreatment: Object.freeze({
    premiumCountedAsAsset: false,
    regularPayoutCountedAsIncome: true,
    surrenderValueCountedAsAsset: true,
    source: "SWD OALA website, eligibility and annuity treatment FAQ"
  }),
  sourceTitle: "Old Age Living Allowance — Social Welfare Department",
  sourceUrl: "https://www.swd.gov.hk/oala/index.html",
  limitsSourceUrl: "https://www.swd.gov.hk/tc/pubsvc/socsecu/ssallowance/ssaec/ssaec_oala/ssaec_oala_limit/",
  paymentSourceUrl: "https://www.swd.gov.hk/tc/pubsvc/socsecu/ssallowance/ssa_amt/ssa_amt_all/"
});
