export const MIN_PREMIUM_USD = 25000;
export const MAX_PREMIUM_USD = 4000000;

const validRate = rate => Number.isFinite(Number(rate)) && Number(rate) > 0;

export function premiumHkdToUsd(premiumHkd, hkdPerUsd) {
  const amount = Number(premiumHkd);
  if (!Number.isFinite(amount) || amount <= 0 || !validRate(hkdPerUsd)) return null;
  return amount / Number(hkdPerUsd);
}

export function validatePlanPremiumHkd(premiumHkd, hkdPerUsd) {
  const amount = Number(premiumHkd);
  if (!Number.isFinite(amount) || amount <= 0) return { valid: false, reason: "REQUIRED", premiumHkd: null, premiumUsd: null };
  if (!validRate(hkdPerUsd)) return { valid: false, reason: "FX_UNAVAILABLE", premiumHkd: amount, premiumUsd: null };
  const premiumUsd = premiumHkdToUsd(amount, hkdPerUsd);
  if (premiumUsd < MIN_PREMIUM_USD) return { valid: false, reason: "BELOW_MINIMUM", premiumHkd: amount, premiumUsd };
  if (premiumUsd > MAX_PREMIUM_USD) return { valid: false, reason: "ABOVE_MAXIMUM", premiumHkd: amount, premiumUsd };
  return { valid: true, reason: null, premiumHkd: amount, premiumUsd };
}

export function restorePlanInputs(saved = {}, hkdPerUsd) {
  const premiumHkd = Number(saved.premiumHkd);
  if (Number.isFinite(premiumHkd) && premiumHkd > 0) return { premiumHkd };
  const previousPremiumUsd = Number(saved.premiumUsd);
  if (Number.isFinite(previousPremiumUsd) && previousPremiumUsd > 0 && validRate(hkdPerUsd)) {
    return { premiumHkd: Math.round(previousPremiumUsd * Number(hkdPerUsd)) };
  }
  return { premiumHkd: validRate(hkdPerUsd) ? Math.round(MIN_PREMIUM_USD * Number(hkdPerUsd)) : null };
}

export function hkdPremiumRange(hkdPerUsd) {
  if (!validRate(hkdPerUsd)) return null;
  return { minHkd: MIN_PREMIUM_USD * Number(hkdPerUsd), maxHkd: MAX_PREMIUM_USD * Number(hkdPerUsd) };
}

export function formatOutcomeAmount(usdAmount, hkdPerUsd) {
  const amount = Number(usdAmount);
  const format = value => new Intl.NumberFormat("zh-HK", { maximumFractionDigits: 0 }).format(Math.round(value));
  if (!Number.isFinite(amount)) return { amount: "—", currency: "USD", fxRate: null };
  if (validRate(hkdPerUsd)) return { amount: `HK$${format(amount * Number(hkdPerUsd))}`, currency: "HKD", fxRate: Number(hkdPerUsd) };
  return { amount: `US$${format(amount)}`, currency: "USD", fxRate: null };
}
