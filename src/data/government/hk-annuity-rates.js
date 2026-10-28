/** Reference-only HKMC example, delivered through the existing EverBliss GAS v4 endpoint. */
export function validateHKAnnuityRates(payload) {
  if (payload?.success !== true || payload.schemaVersion !== 1 ||
      payload.product !== "HK_ANNUITY" ||
      payload.status !== "REFERENCE_ONLY_NOT_CURRENT_VERIFIED" ||
      payload.rateBasis !== "HKD_1000000_SINGLE_PREMIUM" ||
      payload.percentageMeaning !== "ANNUAL_PAYOUT_TO_PREMIUM" ||
      payload.count !== 52 || !Array.isArray(payload.rates) || payload.rates.length !== 52) return null;
  const keys = new Set();
  for (const r of payload.rates) {
    const key = r.issueAge + "-" + r.gender;
    if (!Number.isInteger(r.issueAge) || r.issueAge < 60 || r.issueAge > 85 ||
        !["M", "F"].includes(r.gender) || r.referencePremiumHkd !== 1000000 ||
        !Number.isFinite(r.monthlyPaymentHkd) || r.monthlyPaymentHkd <= 0 ||
        !Number.isFinite(r.annualPayoutPercent) || r.annualPayoutPercent <= 0 ||
        Math.abs(r.annualPayoutPercent - r.monthlyPaymentHkd * 12 / 10000) > 0.0001 ||
        keys.has(key)) return null;
    keys.add(key);
  }
  for (let age = 60; age <= 85; age++) for (const gender of ["M", "F"]) {
    if (!keys.has(age + "-" + gender)) return null;
  }
  return payload.rates;
}

export async function fetchHKAnnuityRates(endpoint, fetchImpl = globalThis.fetch) {
  if (!endpoint) return null;
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST", headers: {"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify({action:"getHKAnnuityRates",appId:"everbliss"}),
      cache: "no-store"
    });
    if (!response.ok) return null;
    return validateHKAnnuityRates(await response.json());
  } catch { return null; }
}

export function selectHKAnnuityReference(rates, {issueAge, gender, premiumHkd}) {
  // HKMC source is a HK$1m example only. Never assume arbitrary-premium scaling.
  if (!Array.isArray(rates) || Number(premiumHkd) !== 1000000) return null;
  return rates.find(r => r.issueAge === Number(issueAge) && r.gender === gender) || null;
}
