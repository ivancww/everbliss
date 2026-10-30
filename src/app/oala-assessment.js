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

// Preserve the logical caret across inserted thousands separators; invalid input remains invalid.
export function formatAssessmentInput(value, caret = String(value).length) {
  const original = String(value);
  if (!/^[\d,]*(?:\.\d*)?$/.test(original)) return { value: original, caret, number: null };
  const raw = original.replace(/,/g, '');
  const logical = original.slice(0, caret).replace(/,/g, '').length;
  const parts = raw.split('.');
  const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = whole + (parts.length > 1 ? '.' + parts[1] : '');
  let pos = 0, count = 0;
  while (pos < formatted.length && count < logical) { if (formatted[pos] !== ',') count++; pos++; }
  return { value: formatted, caret: pos, number: parseAssessmentAmount(raw) };
}
export function allowanceIllustration(result) {
  if (!result?.after?.within || !result.outcome) return null;
  return { annuity: result.outcome.monthly, allowance: oalaData.monthlyBenefit, total: result.outcome.monthly + oalaData.monthlyBenefit, recipients: 1 };
}

export function deleteAcrossSeparator(value, caret, direction) {
  const backward = direction === 'deleteContentBackward';
  if (!backward && direction !== 'deleteContentForward') return null;
  const comma = backward ? caret - 1 : caret;
  if (value[comma] !== ',') return null;
  const digit = backward ? comma - 1 : comma + 1;
  if (!/\d/.test(value[digit] || '')) return null;
  const next = value.slice(0, digit) + value.slice(digit + 1);
  return formatAssessmentInput(next, backward ? digit : caret);
}

// Conditional on the relevant annuity treatment being accepted by SWD.
export function idealPremiumRange(input) {
  const assets = parseAssessmentAmount(input.assets), income = parseAssessmentAmount(input.income), funds = parseAssessmentAmount(input.availableFunds), fx = Number(input.fx);
  if (assets === null || income === null || funds === null || !Number.isFinite(fx) || fx <= 0) return { available:false, reason:'INCOMPLETE' };
  const limits = input.household === 'couple' ? oalaData.couple : oalaData.single;
  if (income > limits.incomeLimit) return { available:false, reason:'INCOME' };
  const floor = Math.ceil(Math.max(0, assets - limits.assetLimit, 25000 * fx));
  const ceiling = Math.floor(Math.min(assets, funds, 4000000 * fx));
  if (floor > ceiling) return { available:false, reason: funds < floor || assets < floor ? 'FUNDS' : 'PRODUCT_LIMIT' };
  const check = premium => assessment({...input, premium});
  const first = check(floor);
  if (!first.outcome) return { available:false, reason:'SCENARIO' };
  if (!first.after.within) return { available:false, reason:'INCOME' };
  let lo = floor, hi = ceiling;
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); const r = check(mid); if (r.after?.within) lo = mid; else hi = mid - 1; }
  return { available:true, min:floor, max:lo, suggested:floor, financialMinimum:Math.max(0, assets-limits.assetLimit), conditional:true };
}
