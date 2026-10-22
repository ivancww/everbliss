import { incomeRateData as bundledIncomeRateData } from "../data/official/income-rates.js";
import { officialMultiplierData as bundledMultiplierData } from "../data/official/official-multipliers.js";

const BASE_PREMIUM = 25000;
const MIN_PREMIUM = 25000;
const MAX_PREMIUM = 4000000;
let activeIncomeRateData = bundledIncomeRateData;
let activeMultiplierData = bundledMultiplierData;
let ratesByKey = new Map(activeIncomeRateData.rates.map(row => [`${row.age}|${row.gender}|${row.mode}`, row]));
let scenarioRows = Object.values(activeMultiplierData.scenarios);

export function setOfficialCalculationDataset(dataset) {
  if (!Array.isArray(dataset?.incomeRates?.rates) || !dataset?.multipliers?.scenarios) throw new Error("Invalid Official calculation dataset");
  activeIncomeRateData = dataset.incomeRates;
  activeMultiplierData = dataset.multipliers;
  ratesByKey = new Map(activeIncomeRateData.rates.map(row => [`${row.age}|${row.gender}|${row.mode}`, row]));
  scenarioRows = Object.values(activeMultiplierData.scenarios);
}

const key = (age, gender, mode) => `${age}|${gender}|${mode}`;
const money = value => Math.round(value + Number.EPSILON);
const cents = value => Math.round((value + Number.EPSILON) * 100) / 100;

export function getIncomeRates({ issueAge, gender, mode }) {
  if (!Number.isInteger(issueAge) || issueAge < 50 || issueAge > 75) return null;
  const row = ratesByKey.get(key(issueAge, gender, mode));
  return row ? Object.freeze({ ...row }) : null;
}

function exactScenario(issueAge, gender, mode) {
  return activeMultiplierData.scenarios[`${issueAge}${gender}_${mode}`] || null;
}

function bracketScenarios(issueAge, gender, mode) {
  const eligible = scenarioRows
    .filter(row => row.gender === gender && row.mode === mode && Object.keys(row.years).length)
    .sort((a, b) => a.issueAge - b.issueAge);
  const lower = [...eligible].reverse().find(row => row.issueAge < issueAge);
  const upper = eligible.find(row => row.issueAge > issueAge);
  return lower && upper ? [lower, upper] : null;
}

export function interpolateAgeValue({ age, lowerAge, upperAge, lowerValue, upperValue }) {
  if (!(lowerAge < age && age < upperAge) || !Number.isFinite(lowerValue) || !Number.isFinite(upperValue)) return null;
  return lowerValue + ((age - lowerAge) / (upperAge - lowerAge)) * (upperValue - lowerValue);
}

function getMultiplier({ issueAge, gender, mode, policyYear, field }) {
  if (!Number.isInteger(issueAge) || issueAge < 50 || issueAge > 75 || !Number.isInteger(policyYear) || policyYear < 1) return null;
  const targetAttainedAge = issueAge + policyYear;
  if (targetAttainedAge > 100) return null;
  const direct = exactScenario(issueAge, gender, mode);
  if (direct) {
    const value = direct.years[String(policyYear)]?.[field];
    return Number.isFinite(value) ? { value, sourceType: "OFFICIAL_PARSED", sourceAges: [issueAge], sourceFile: direct.sourceFile } : null;
  }
  const brackets = bracketScenarios(issueAge, gender, mode);
  if (!brackets) return null;
  const [lower, upper] = brackets;
  const rowAtAttainedAge = scenario => {
    const rows = Object.values(scenario.years);
    const exact = rows.find(row => row.attainedAge === targetAttainedAge);
    if (exact) return exact;
    // Proposal illustrations begin at attained age issueAge + 1. For the
    // first interpolated duration, the upper anchor can therefore have no
    // row at the requested age. Use its first displayed duration only for
    // this boundary row; all overlapping years remain attained-age aligned.
    return targetAttainedAge < rows[0]?.attainedAge ? rows[0] : null;
  };
  const lowerValue = rowAtAttainedAge(lower)?.[field];
  const upperValue = rowAtAttainedAge(upper)?.[field];
  if (!Number.isFinite(lowerValue) || !Number.isFinite(upperValue)) return null;
  const value = interpolateAgeValue({ age: issueAge, lowerAge: lower.issueAge, upperAge: upper.issueAge, lowerValue, upperValue });
  return value === null ? null : { value, sourceType: "INTERPOLATED", sourceAges: [lower.issueAge, upper.issueAge] };
}

function getSupportedMultiplierYears({ issueAge, gender, mode }) {
  const requestedYears = 100 - issueAge;
  for (let year = 1; year <= requestedYears; year++) {
    if (!getMultiplier({ issueAge, gender, mode, policyYear: year, field: "surrenderMultiplier" })
      || !getMultiplier({ issueAge, gender, mode, policyYear: year, field: "deathMultiplier" })) return year - 1;
  }
  return requestedYears;
}

export function getSurrenderMultiplier(input) {
  return getMultiplier({ ...input, field: "surrenderMultiplier" });
}

export function getDeathMultiplier(input) {
  return getMultiplier({ ...input, field: "deathMultiplier" });
}

export function calculateOutcome({ issueAge, gender, mode, premiumUsd }) {
  const income = getIncomeRates({ issueAge, gender, mode });
  if (!income) return { available: false, reason: "UNSUPPORTED_AGE_GENDER_MODE" };
  if (!Number.isFinite(premiumUsd) || premiumUsd < MIN_PREMIUM || premiumUsd > MAX_PREMIUM) {
    return { available: false, reason: "PREMIUM_OUT_OF_RANGE" };
  }
  // Align interpolated Official curves by attained age, so each supported
  // issue age reaches the same source-supported endpoint (attained age 100).
  const requestedYears = 100 - issueAge;
  const years = Math.min(requestedYears, getSupportedMultiplierYears({ issueAge, gender, mode }));
  const schedule = Array.from({ length: years }, (_, index) => {
    const policyYear = index + 1;
    const noIncome = mode === "deferred" && policyYear <= 5;
    const guaranteedRate = noIncome ? 0 : income.guaranteedRate;
    const ngRate = policyYear >= 8 ? income.nonGuaranteedRateFromYear8 : 0;
    const annualRate = noIncome ? 0 : policyYear >= 8 ? income.totalRateFromYear8 : income.guaranteedRate;
    const surrender = getSurrenderMultiplier({ issueAge, gender, mode, policyYear });
    const death = getDeathMultiplier({ issueAge, gender, mode, policyYear });
    return {
      policyYear,
      attainedAge: issueAge + policyYear,
      annualGuaranteedIncomeRate: guaranteedRate,
      annualNonGuaranteedIncomeRate: ngRate,
      annualIncomeRate: annualRate,
      annualGuaranteedIncome: money(premiumUsd * guaranteedRate),
      annualNonGuaranteedIncome: money(premiumUsd * ngRate),
      annualDisplayedIncome: money(premiumUsd * annualRate),
      surrenderMultiplier: surrender?.value ?? null,
      surrenderValue: surrender ? money(premiumUsd * surrender.value) : null,
      surrenderSourceType: surrender?.sourceType ?? "UNAVAILABLE",
      surrenderSourceAges: surrender?.sourceAges ?? null,
      deathMultiplier: death?.value ?? null,
      deathBenefit: death ? money(premiumUsd * death.value) : null,
      deathSourceType: death?.sourceType ?? "UNAVAILABLE",
      deathSourceAges: death?.sourceAges ?? null,
      incomeSourceType: income.sourceType,
      incomeSourceAges: income.sourceAges,
      premiumSourceType: premiumUsd === BASE_PREMIUM ? "OFFICIAL_BASE" : "SCALED_FROM_OFFICIAL"
    };
  });
  return {
    available: true,
    issueAge, gender, mode, premiumUsd,
    incomeSourceType: income.sourceType,
    incomeSourceAges: income.sourceAges,
    premiumSourceType: premiumUsd === BASE_PREMIUM ? "OFFICIAL_BASE" : "SCALED_FROM_OFFICIAL",
    guaranteedMonthly: cents(premiumUsd * income.guaranteedRate / 12),
    nonGuaranteedMonthly: cents(premiumUsd * income.nonGuaranteedRateFromYear8 / 12),
    displayedMonthlyTotalYear8Plus: cents(premiumUsd * income.totalRateFromYear8 / 12),
    annualGuaranteedIncome: money(premiumUsd * income.guaranteedRate),
    annualNonGuaranteedIncomeFromYear8: money(premiumUsd * income.nonGuaranteedRateFromYear8),
    healthExtraMonthly: cents(premiumUsd * income.guaranteedRate / 24),
    cumulativeYear10: schedule.slice(0, 10).reduce((sum, row) => ({
      guaranteedIncome: sum.guaranteedIncome + row.annualGuaranteedIncome,
      nonGuaranteedIncome: sum.nonGuaranteedIncome + row.annualNonGuaranteedIncome,
      displayedIncome: sum.displayedIncome + row.annualDisplayedIncome
    }), { guaranteedIncome: 0, nonGuaranteedIncome: 0, displayedIncome: 0 }),
    year1: schedule[0], year6: schedule[5], year7: schedule[6], year8: schedule[7],
    year10: schedule[9] ? {
      surrenderTotal: schedule[9].surrenderValue,
      expectedDeathBenefit: schedule[9].deathBenefit
    } : null,
    schedule,
    coverage: {
      income: true,
      surrender: schedule.every(row => row.surrenderValue !== null),
      death: schedule.every(row => row.deathBenefit !== null),
      surrenderFirstMissingYear: years < requestedYears ? years + 1 : null,
      deathFirstMissingYear: years < requestedYears ? years + 1 : null,
      sourceSupportedPolicyYears: years,
      sourceSupportedEndpointAge: issueAge + years
    }
  };
}

export const fullOutcomeDataMeta = Object.freeze({
  basePremiumUsd: BASE_PREMIUM,
  supportedPremiumUsd: Object.freeze([MIN_PREMIUM, MAX_PREMIUM]),
  supportedIssueAge: Object.freeze([50, 75]),
  parsedOfficialScenarioCount: scenarioRows.length,
  sourceType: Object.freeze(["OFFICIAL_PARSED", "OFFICIAL", "INTERPOLATED"])
});
