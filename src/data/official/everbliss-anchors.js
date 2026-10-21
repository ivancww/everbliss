// Official proposal anchors supplied in the product-owner task. Supporting
// proposal PDF IDs were not attached; preserve that provenance gap explicitly.
export const anchorMetadata = Object.freeze({
  product: "AIA 優悅年金保險計劃 (EverBliss Annuity Insurance Plan)",
  sourceType: "OFFICIAL",
  sourceRef: "Task-provided verified Official proposal values; source PDF/reference ID pending",
  verifiedDate: null,
  verificationStatus: "OWNER_SUPPLIED_REFERENCE_PENDING",
  currency: "USD",
  premium: 25000,
  policyYear: 10
});
export const dataSourceTypes = Object.freeze(["OFFICIAL", "SCALED_FROM_OFFICIAL", "INTERPOLATED", "CALCULATED"]);

export const officialAnchors = Object.freeze({
  "50|F|immediate": Object.freeze({ gender: "F", accumulation: "immediate", issueAge: 50, singlePremium: 25000, guaranteedAnnual: 891, nonGuaranteedAnnualFromYear8: 540, year10: { guaranteedCashValue: 11006, terminalBonus: 4550, surrenderTotal: 15556, guaranteedDeathBenefit: 17340, expectedDeathBenefit: 21890 } }),
  "50|M|immediate": Object.freeze({ gender: "M", accumulation: "immediate", issueAge: 50, singlePremium: 25000, guaranteedAnnual: 930, nonGuaranteedAnnualFromYear8: 549, year10: { guaranteedCashValue: 10739, terminalBonus: 4325, surrenderTotal: 15064, guaranteedDeathBenefit: 16950, expectedDeathBenefit: 21275 } }),
  "50|F|deferred": Object.freeze({ gender: "F", accumulation: "deferred", issueAge: 50, singlePremium: 25000, guaranteedAnnual: 1092, nonGuaranteedAnnualFromYear8: 654, year10: { guaranteedCashValue: 13369, terminalBonus: 5800, surrenderTotal: 19169, guaranteedDeathBenefit: 20790, expectedDeathBenefit: 26590 } }),
  "50|M|deferred": Object.freeze({ gender: "M", accumulation: "deferred", issueAge: 50, singlePremium: 25000, guaranteedAnnual: 1149, nonGuaranteedAnnualFromYear8: 663, year10: { guaranteedCashValue: 13212, terminalBonus: 5575, surrenderTotal: 18787, guaranteedDeathBenefit: 20505, expectedDeathBenefit: 26080 } })
});

export const productTerms = Object.freeze({
  productName: "AIA 優悅年金保險計劃",
  englishName: "EverBliss Annuity Insurance Plan",
  productNature: "participating whole-life annuity insurance plan",
  currency: "USD",
  issueAgeMin: 40,
  issueAgeMax: 75,
  premiumMin: 25000,
  premiumMax: 4000000,
  accumulationYears: Object.freeze([0, 5]),
  guaranteeStartsAtPolicyMonth: Object.freeze({ immediate: 1, deferred: 61 }),
  nonGuaranteedStartsAtPolicyMonth: 85,
  extraIncomeRate: 0.5,
  extraIncomeMaxMonths: 120,
  deathBenefitPremiumFactor: 1.05
});
