import { officialAnchors, productTerms, anchorMetadata } from "../data/official/everbliss-anchors.js";
import { oalaData } from "../data/government/oala.js";

const round2 = value => Math.round((value + Number.EPSILON) * 100) / 100;
const round0 = value => Math.round(value);

export function getAnchor({ issueAge, gender, accumulation }) {
  const exact = officialAnchors[`${issueAge}|${gender}|${accumulation}`];
  if (exact) return exact;
  if (!Number.isInteger(issueAge)) return null;
  const anchors = Object.values(officialAnchors)
    .filter(item => item.gender === gender && item.accumulation === accumulation)
    .sort((a, b) => a.issueAge - b.issueAge);
  const lower = [...anchors].reverse().find(item => item.issueAge < issueAge);
  const upper = anchors.find(item => item.issueAge > issueAge);
  if (!lower || !upper) return null;
  const ratio = (issueAge - lower.issueAge) / (upper.issueAge - lower.issueAge);
  const interpolate = key => round2(lower[key] + (upper[key] - lower[key]) * ratio);
  return Object.freeze({
    gender, accumulation, issueAge, singlePremium: lower.singlePremium,
    guaranteedAnnual: interpolate("guaranteedAnnual"),
    nonGuaranteedAnnualFromYear8: interpolate("nonGuaranteedAnnualFromYear8"),
    sourceType: "INTERPOLATED", sourceAges: [lower.issueAge, upper.issueAge]
  });
}
export function cashflowPresentation(calc, accumulation, hkdPerUsd) {
  if (!calc?.available || !Number.isFinite(Number(hkdPerUsd)) || Number(hkdPerUsd) <= 0) return null;
  const rate = Number(hkdPerUsd);
  const immediate = accumulation === "immediate";
  return Object.freeze({
    heroLabel: immediate ? "現在開始每月退休現金流" : "第6年開始每月退休現金流",
    heroUsd: calc.guaranteedMonthly,
    heroHkd: round0(calc.guaranteedMonthly * rate),
    firstFiveYearsNoIncome: !immediate,
    year8Usd: calc.displayedMonthlyTotalYear8Plus,
    year8Hkd: round0(calc.displayedMonthlyTotalYear8Plus * rate),
    healthExtraUsd: calc.healthExtraMonthly,
    healthExtraHkd: round0(calc.healthExtraMonthly * rate),
    fxRate: rate,
    ageSourceType: calc.ageSourceType
  });
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
  const ageSourceType = anchor.sourceType || "OFFICIAL";
  const premiumSourceType = factor === 1 ? "OFFICIAL" : "SCALED_FROM_OFFICIAL";
  const sourceType = ageSourceType === "INTERPOLATED" ? "INTERPOLATED" : premiumSourceType;
  const guaranteedMonthly = round2(anchor.guaranteedAnnual / 12 * factor);
  const nonGuaranteedMonthly = round2(anchor.nonGuaranteedAnnualFromYear8 / 12 * factor);
  const year1 = calculateIncomeByPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear: 1 });
  const year6 = calculateIncomeByPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear: 6 });
  const year7 = calculateIncomeByPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear: 7 });
  const year8 = calculateIncomeByPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear: 8 });
  const cumulativeYear10 = cumulativeIncomeThroughPolicyYear({ guaranteedMonthly, nonGuaranteedMonthly, accumulation, policyYear: 10 });
  const year10 = anchor.year10 ? (() => {
    const guaranteedCashValue = round0(anchor.year10.guaranteedCashValue * factor);
    const terminalBonus = round0(anchor.year10.terminalBonus * factor);
    const surrenderTotal = round0(guaranteedCashValue + terminalBonus);
    const formulaDeathValue = Math.max(guaranteedCashValue, round0(productTerms.deathBenefitPremiumFactor * premiumUsd - cumulativeYear10.guaranteedIncome));
    const guaranteedDeathBenefit = round0(anchor.year10.guaranteedDeathBenefit * factor);
    return { guaranteedCashValue, terminalBonus, surrenderTotal, guaranteedDeathBenefit, expectedDeathBenefit: round0(guaranteedDeathBenefit + terminalBonus), formulaDeathValue };
  })() : null;
  const healthExtraMonthly = round2(guaranteedMonthly * productTerms.extraIncomeRate);
  return {
    available: true,
    sourceType,
    ageSourceType,
    ageSourceAges: anchor.sourceAges || [issueAge],
    premiumSourceType,
    anchorSourceType: ageSourceType,
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
    year10,
    healthExtraMonthly,
    disclosures: ["部分利益屬非保證，實際金額可能較高、較低，甚至為零。", "非官方年齡錨點間的收入數值為線性插值；保費縮放結果並非逐份官方建議書報價。"]
  };
}

export function convertHkdToUsd(amountHkd, hkdPerUsd) {
  if (!Number.isFinite(amountHkd) || !Number.isFinite(hkdPerUsd) || hkdPerUsd <= 0) return null;
  return round2(amountHkd / hkdPerUsd);
}

export function evaluateOala({ age = 0, household, currentAssets, currentMonthlyIncome, annuityPremium, annuityMonthlyIncome, surrenderProceeds = 0 }) {
  const limits = household === "couple" ? oalaData.couple : oalaData.single;
  const assetInputs = [currentAssets, annuityPremium ?? 0, surrenderProceeds ?? 0].map(Number);
  const assetSimulationValid = assetInputs.every(value => Number.isFinite(value) && value >= 0) && assetInputs[1] <= assetInputs[0];
  const remainingAssets = assetSimulationValid ? assetInputs[0] - assetInputs[1] + assetInputs[2] : null;
  const incomeInputs = [currentMonthlyIncome, annuityMonthlyIncome].map(Number);
  const incomeSimulationValid = incomeInputs.every(value => Number.isFinite(value) && value >= 0);
  const monthlyIncome = incomeSimulationValid ? incomeInputs[0] + incomeInputs[1] : null;
  return {
    remainingAssessableAssets: remainingAssets,
    monthlyIncomeTestAmount: monthlyIncome,
    assetLimit: limits.assetLimit,
    incomeLimit: limits.incomeLimit,
    withinAssetLimit: remainingAssets === null ? null : remainingAssets <= limits.assetLimit,
    withinIncomeLimit: monthlyIncome === null ? null : monthlyIncome <= limits.incomeLimit,
    assetSimulationValid,
    incomeSimulationValid,
    ageEligible: Number(age) >= oalaData.eligibilityAge,
    sourceType: "CALCULATED",
    preliminaryOnly: true,
    governmentConfirmed: false
  };
}
