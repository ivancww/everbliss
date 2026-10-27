import { oalaData } from '../data/government/oala.js';
import { calculateOutcome } from '../calculations/full-outcomes.js';
import { validatePlanPremiumHkd } from './plan-input.js';

export function parseAssessmentAmount(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const text = String(value).replace(/,/g, '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) && number >= 0 && number <= Number.MAX_SAFE_INTEGER ? number : null;
}
export function assessLimits(assets, income, household) {
  if (assets === null || income === null) return null;
  const limits = household === 'couple' ? oalaData.couple : oalaData.single;
  return { assets, income, ...limits, assetDifference: limits.assetLimit - assets, incomeDifference: limits.incomeLimit - income, within: assets <= limits.assetLimit && income <= limits.incomeLimit };
}
export function assessment({household, assets, income, premium, issueAge, gender, mode, policyYear, fx}) {
  const a = parseAssessmentAmount(assets), i = parseAssessmentAmount(income), p = parseAssessmentAmount(premium);
  const before = assessLimits(a, i, household);
  if (a === null || i === null || p === null || p > a) return {before, after:null, outcome:null, reason:p !== null && a !== null && p > a ? 'PREMIUM_EXCEEDS_ASSETS' : 'INCOMPLETE', provisional:true};
  const valid = validatePlanPremiumHkd(p, fx);
  if (!valid.valid) return {before, after:null, outcome:null, reason:'PREMIUM_INVALID', provisional:true};
  const outcome = calculateOutcome({issueAge:Number(issueAge),gender,mode,premiumUsd:valid.premiumUsd});
  const row = outcome.available ? outcome.schedule.find(r => r.policyYear === Number(policyYear)) : null;
  if (!row) return {before, after:null, outcome:null, reason:'SCENARIO_UNAVAILABLE', provisional:true};
  // The financial treatment and inclusion of the displayed payout are assumptions for illustration, not a verified policy classification.
  const monthly = Math.round(row.annualDisplayedIncome / 12 * Number(fx));
  return {before, after:assessLimits(a-p, i+monthly, household), outcome:{monthly, row, schedule:outcome.schedule}, reason:null, provisional:true};
}
