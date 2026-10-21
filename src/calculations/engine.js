import { officialAnchors, productTerms, anchorMetadata } from "../data/official/everbliss-anchors.js";
import { oalaData } from "../data/government/oala.js";

const round2 = value => Math.round((value + Number.EPSILON) * 100) / 100;
const round0 = value => Math.round(value);

export function getAnchor({ issueAge, gender, accumulation }) {
  return officialAnchors[`${issueAge}|${gender}|${accumulation}`] || null;
}

export function calculateIncomeByPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear }) {
  const firstGuaranteedMonth = accumulation === "immediate" ? 1 : 61;
  const firstNgMonth = productTerms.nonGuaranteedStartsAtPolicyMonth;
  const yearStart = (policyYear - 1) * 12 + 1;
  const yearEnd = policyYear * 12;
  const activeGuaranteed = yearEnd >= firstGuaranteedMonth;
  const activeNg = yearEnd >= firstNgMonth;
  const guaranteedMonths = Math.max(0, yearEnd - Math.max(yearStart, firstGuaranteedMonth) + 1);
  const ngMonths = Math.max(0, yearEnd - Math.max(yearStart, firstNgMonth) + 1);
  return {
    guaranteedMonthly: activeGuaranteed ? guaranteedMonthly : 0,
    nonGuaranteedMonthly: activeNg ? nonGuaranteedMonthly : 0,
    displayedMonthlyTotal: (activeGuaranteed ? guaranteedMonthly : 0) + (activeNg ? nonGuaranteedMonthly : 0),
    annualGuaranteedIncome: round2(guaranteedMonthly * guaranteedMonths),
    annualNonGuaranteedIncome: round2(nonGuaranteedMonthly * ngMonths),
    startsGuaranteedThisYearAtMonth: activeGuaranteed ? Math.max(yearStart, firstGuaranteedMonth) : null,
    startsNonGuaranteedThisYearAtMonth: activeNg ? Math.max(yearStart, firstNgMonth) : null
  };
}

export function cumulativeIncomeThroughPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear }) {
  let guaranteedMonths = 0;
  let ngMonths = 0;
  for (let year = 1; year <= policyYear; year++) {
    const yearStart = (year - 1) * 12 + 1;
    const yearEnd = year * 12;
    guaranteedMonths += Math.max(0, yearEnd - Math.max(yearStart, accumulation === "immediate" ? 1 : 61) + 1);
    ngMonths += Math.max(0, yearEnd - Math.max(yearStart, productTerms.nonGuaranteedStartsAtPolicyMonth) + 1);
  }
  return {
    guaranteedIncome: round2(guaranteedMonths * guaranteedMonthly),
    nonGuaranteedIncome: round2(ngMonths * nonGuaranteedMonthly),
    displayedIncome: round2(guaranteedMonths * guaranteedMonthly + ngMonths * nonGuaranteedMonthly),
    guaranteedMonths,
    nonGuaranteedMonths: ngMonths
  };
}

export function calculateEverBliss({ issueAge, gender, accumulation, premiumUsd }) {
  const anchor = getAnchor({ issueAge, gender, accumulation });
  if (!anchor) return { available: false, reason: "NO_OFFICIAL_AGE_ANCHOR", requested: { issueAge, gender, accumulation }, sourceType: "UNAVAILABLE" };
  if (!Number.isFinite(premiumUsd) || premiumUsd < productTerms.premiumMin || premiumUsd > productTerms.premiumMax) {
    return { available: false, reason: "PREMIUM_OUT_OF_RANGE", sourceType: "UNAVAILABLE" };
  }
  const factor = premiumUsd / anchor.singlePremium;
  const sourceType = factor === 1 ? "OFFICIAL" : "SCALED_FROM_OFFICIAL";
  const guaranteedMonthly = round2(anchor.guaranteedAnnual / 12 * factor);
  const nonGuaranteedMonthly = round2(anchor.nonGuaranteedAnnualFromYear8 / 12 * factor);
  const year1 = calculateIncomeByPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear: 1 });
  const year6 = calculateIncomeByPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear: 6 });
  const year7 = calculateIncomeByPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear: 7 });
  const year8 = calculateIncomeByPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear: 8 });
  const cumulativeYear10 = cumulativeIncomeThroughPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear: 10 });
  const guaranteedCashValue = round0(anchor.year10.guaranteedCashValue * factor);
  const terminalBonus = round0(anchor.year10.terminalBonus * factor);
  const surrenderTotal = round0(guaranteedCashValue + terminalBonus);
  const formulaDeathValue = Math.max(guaranteedCashValue, round0(productTerms.deathBenefitPremiumFactor * premiumUsd - cumulativeYear10.guaranteedIncome));
  const guaranteedDeathBenefit = round0(anchor.year10.guaranteedDeathBenefit * factor);
  const expectedDeathBenefit = round0(guaranteedDeathBenefit + terminalBonus);
  const healthExtraMonthly = round2(guaranteedMonthly * productTerms.extraIncomeRate);
  return {
    available: true,
    sourceType,
    anchorSourceType: "OFFICIAL",
    valueSourceType: "CALCULATED",
    source: anchorMetadata,
    inputs: { issueAge, gender, accumulation, premiumUsd: round2(premiumUsd) },
    scaleFactor: factor,
    guaranteedMonthly,
    nonGuaranteedMonthly,
    displayedMonthlyTotalYear8Plus: round2(guaranteedMonthly + nonGuaranteedMonthly),
    annualGuaranteedIncome: round2(guaranteedMonthly * 12),
    annualNonGuaranteedIncomeFromYear8: round2(nonGuaranteedMonthly * 12),
    year1,
    year6,
    year7,
    year8,
    cumulativeYear10,
    year10: {
      guaranteedCashValue,
      terminalBonus,
      surrenderTotal,
      guaranteedDeathBenefit,
      expectedDeathBenefit,
      formulaDeathValue
    },
    healthExtraMonthly,
    disclosures: ["部分利益屬非保證，實際金額可能較高、較低，甚至為零。", "縮放結果並非逐份官方建議書報價。"]
  };
}

export function convertHkdToUsd(amountHkd, hkdPerUsd) {
  if (!Number.isFinite(amountHkd) || !Number.isFinite(hkdPerUsd) || hkdPerUsd <= 0) return null;
  return round2(amountHkd / hkdPerUsd);
}

export function evaluateOala({ age = 0, household, currentAssets, currentMonthlyIncome, annuityPremium, annuityMonthlyIncome, surrenderProceeds = 0 }) {
  const limits = household === "couple" ? oalaData.couple : oalaData.single;
  const remainingAssets = Math.max(0, Number(currentAssets || 0) - Number(annuityPremium || 0) + Number(surrenderProceeds || 0));
  const monthlyIncome = Number(currentMonthlyIncome || 0) + Number(annuityMonthlyIncome || 0);
  return {
    remainingAssessableAssets: remainingAssets,
    monthlyIncomeTestAmount: monthlyIncome,
    assetLimit: limits.assetLimit,
    incomeLimit: limits.incomeLimit,
    withinAssetLimit: remainingAssets <= limits.assetLimit,
    withinIncomeLimit: monthlyIncome <= limits.incomeLimit,
    ageEligible: Number(age) >= oalaData.eligibilityAge,
    sourceType: "CALCULATED",
    preliminaryOnly: true
  };
}

