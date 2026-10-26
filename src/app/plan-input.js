import { productTerms } from "../data/official/everbliss-anchors.js";

export function validatePlanPremiumUsd(value) {
  const premiumUsd = value === "" || value === null || value === undefined ? NaN : Number(value);
  if (!Number.isFinite(premiumUsd)) return { valid: false, reason: "REQUIRED", premiumUsd: null };
  if (premiumUsd < productTerms.premiumMin || premiumUsd > productTerms.premiumMax) {
    return { valid: false, reason: "PREMIUM_OUT_OF_RANGE", premiumUsd };
  }
  return { valid: true, reason: null, premiumUsd };
}

export function restorePlanInputs(saved = {}, configuredFxRate = null) {
  const savedPremium = Number(saved.premiumUsd);
  const premiumUsd = Number.isFinite(savedPremium) && savedPremium > 0 ? savedPremium : productTerms.premiumMin;
  const savedFxRate = Number(saved.hkdPerUsd);
  const configuredRate = Number(configuredFxRate);
  const hkdPerUsd = Number.isFinite(savedFxRate) && savedFxRate > 0
    ? savedFxRate
    : Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : null;
  return { premiumUsd, hkdPerUsd };
}

export function formatOutcomeAmount(amountUsd, hkdPerUsd = null) {
  const amount = Number(amountUsd);
  const rate = Number(hkdPerUsd);
  if (!Number.isFinite(amount)) return { amount: "—", currency: "USD", fxRate: null };
  if (Number.isFinite(rate) && rate > 0) {
    return {
      amount: `HK$${new Intl.NumberFormat("zh-HK", { maximumFractionDigits: 0 }).format(Math.round(amount * rate))}`,
      currency: "HKD",
      fxRate: rate
    };
  }
  return {
    amount: `US$${new Intl.NumberFormat("zh-HK", { maximumFractionDigits: 0 }).format(Math.round(amount))}`,
    currency: "USD",
    fxRate: null
  };
}
