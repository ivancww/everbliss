// Product-owner supplied the verified proposal schedule in the PR #1
// correction request. Original proposal PDFs/reference IDs were not attached.
export const anchorMetadata = Object.freeze({
  product: "AIA 優悅年金保險計劃 (EverBliss Annuity Insurance Plan)",
  sourceType: "OFFICIAL",
  sourceRef: "Owner-provided verified Official proposal schedule, PR #1 final correction request (2026-10-21); original PDF/reference IDs not attached",
  verifiedDate: null,
  verificationStatus: "OWNER_SUPPLIED_VERIFIED_INPUT",
  currency: "USD",
  premium: 25000,
  policyYear: 10
});
export const dataSourceTypes = Object.freeze(["OFFICIAL", "SCALED_FROM_OFFICIAL", "INTERPOLATED", "CALCULATED"]);

export const officialAnchors = Object.freeze({
  "50|F|immediate": Object.freeze({ gender: "F", accumulation: "immediate", issueAge: 50, singlePremium: 25000, guaranteedAnnual: 891, nonGuaranteedAnnualFromYear8: 540, sourceType: "OFFICIAL", year10: { guaranteedCashValue: 11006, terminalBonus: 4550, surrenderTotal: 15556, guaranteedDeathBenefit: 17340, expectedDeathBenefit: 21890 } }),
  "52|F|immediate": Object.freeze({ gender: "F", accumulation: "immediate", issueAge: 52, singlePremium: 25000, guaranteedAnnual: 909, nonGuaranteedAnnualFromYear8: 549, sourceType: "OFFICIAL" }),
  "55|F|immediate": Object.freeze({ gender: "F", accumulation: "immediate", issueAge: 55, singlePremium: 25000, guaranteedAnnual: 942, nonGuaranteedAnnualFromYear8: 561, sourceType: "OFFICIAL" }),
  "57|F|immediate": Object.freeze({ gender: "F", accumulation: "immediate", issueAge: 57, singlePremium: 25000, guaranteedAnnual: 963, nonGuaranteedAnnualFromYear8: 567, sourceType: "OFFICIAL" }),
  "60|F|immediate": Object.freeze({ gender: "F", accumulation: "immediate", issueAge: 60, singlePremium: 25000, guaranteedAnnual: 993, nonGuaranteedAnnualFromYear8: 579, sourceType: "OFFICIAL" }),
  "65|F|immediate": Object.freeze({ gender: "F", accumulation: "immediate", issueAge: 65, singlePremium: 25000, guaranteedAnnual: 1074, nonGuaranteedAnnualFromYear8: 639, sourceType: "OFFICIAL" }),
  "50|M|immediate": Object.freeze({ gender: "M", accumulation: "immediate", issueAge: 50, singlePremium: 25000, guaranteedAnnual: 930, nonGuaranteedAnnualFromYear8: 549, sourceType: "OFFICIAL", year10: { guaranteedCashValue: 10739, terminalBonus: 4325, surrenderTotal: 15064, guaranteedDeathBenefit: 16950, expectedDeathBenefit: 21275 } }),
  "52|M|immediate": Object.freeze({ gender: "M", accumulation: "immediate", issueAge: 52, singlePremium: 25000, guaranteedAnnual: 954, nonGuaranteedAnnualFromYear8: 561, sourceType: "OFFICIAL" }),
  "55|M|immediate": Object.freeze({ gender: "M", accumulation: "immediate", issueAge: 55, singlePremium: 25000, guaranteedAnnual: 990, nonGuaranteedAnnualFromYear8: 576, sourceType: "OFFICIAL" }),
  "57|M|immediate": Object.freeze({ gender: "M", accumulation: "immediate", issueAge: 57, singlePremium: 25000, guaranteedAnnual: 1014, nonGuaranteedAnnualFromYear8: 585, sourceType: "OFFICIAL" }),
  "60|M|immediate": Object.freeze({ gender: "M", accumulation: "immediate", issueAge: 60, singlePremium: 25000, guaranteedAnnual: 1050, nonGuaranteedAnnualFromYear8: 600, sourceType: "OFFICIAL" }),
  "65|M|immediate": Object.freeze({ gender: "M", accumulation: "immediate", issueAge: 65, singlePremium: 25000, guaranteedAnnual: 1143, nonGuaranteedAnnualFromYear8: 663, sourceType: "OFFICIAL" }),
  "67|M|immediate": Object.freeze({ gender: "M", accumulation: "immediate", issueAge: 67, singlePremium: 25000, guaranteedAnnual: 1185, nonGuaranteedAnnualFromYear8: 678, sourceType: "OFFICIAL" }),
  "70|M|immediate": Object.freeze({ gender: "M", accumulation: "immediate", issueAge: 70, singlePremium: 25000, guaranteedAnnual: 1251, nonGuaranteedAnnualFromYear8: 702, sourceType: "OFFICIAL" }),
  "50|F|deferred": Object.freeze({ gender: "F", accumulation: "deferred", issueAge: 50, singlePremium: 25000, guaranteedAnnual: 1092, nonGuaranteedAnnualFromYear8: 654, sourceType: "OFFICIAL", year10: { guaranteedCashValue: 13369, terminalBonus: 5800, surrenderTotal: 19169, guaranteedDeathBenefit: 20790, expectedDeathBenefit: 26590 } }),
  "52|F|deferred": Object.freeze({ gender: "F", accumulation: "deferred", issueAge: 52, singlePremium: 25000, guaranteedAnnual: 1125, nonGuaranteedAnnualFromYear8: 669, sourceType: "OFFICIAL" }),
  "55|F|deferred": Object.freeze({ gender: "F", accumulation: "deferred", issueAge: 55, singlePremium: 25000, guaranteedAnnual: 1173, nonGuaranteedAnnualFromYear8: 693, sourceType: "OFFICIAL" }),
  "60|F|deferred": Object.freeze({ gender: "F", accumulation: "deferred", issueAge: 60, singlePremium: 25000, guaranteedAnnual: 1254, nonGuaranteedAnnualFromYear8: 729, sourceType: "OFFICIAL" }),
  "65|F|deferred": Object.freeze({ gender: "F", accumulation: "deferred", issueAge: 65, singlePremium: 25000, guaranteedAnnual: 1365, nonGuaranteedAnnualFromYear8: 789, sourceType: "OFFICIAL" }),
  "70|F|deferred": Object.freeze({ gender: "F", accumulation: "deferred", issueAge: 70, singlePremium: 25000, guaranteedAnnual: 1500, nonGuaranteedAnnualFromYear8: 846, sourceType: "OFFICIAL" }),
  "50|M|deferred": Object.freeze({ gender: "M", accumulation: "deferred", issueAge: 50, singlePremium: 25000, guaranteedAnnual: 1149, nonGuaranteedAnnualFromYear8: 663, sourceType: "OFFICIAL", year10: { guaranteedCashValue: 13212, terminalBonus: 5575, surrenderTotal: 18787, guaranteedDeathBenefit: 20505, expectedDeathBenefit: 26080 } }),
  "52|M|deferred": Object.freeze({ gender: "M", accumulation: "deferred", issueAge: 52, singlePremium: 25000, guaranteedAnnual: 1188, nonGuaranteedAnnualFromYear8: 681, sourceType: "OFFICIAL" }),
  "57|M|deferred": Object.freeze({ gender: "M", accumulation: "deferred", issueAge: 57, singlePremium: 25000, guaranteedAnnual: 1284, nonGuaranteedAnnualFromYear8: 726, sourceType: "OFFICIAL" }),
  "60|M|deferred": Object.freeze({ gender: "M", accumulation: "deferred", issueAge: 60, singlePremium: 25000, guaranteedAnnual: 1341, nonGuaranteedAnnualFromYear8: 750, sourceType: "OFFICIAL" }),
  "65|M|deferred": Object.freeze({ gender: "M", accumulation: "deferred", issueAge: 65, singlePremium: 25000, guaranteedAnnual: 1476, nonGuaranteedAnnualFromYear8: 813, sourceType: "OFFICIAL" }),
  "70|M|deferred": Object.freeze({ gender: "M", accumulation: "deferred", issueAge: 70, singlePremium: 25000, guaranteedAnnual: 1659, nonGuaranteedAnnualFromYear8: 876, sourceType: "OFFICIAL" })
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
