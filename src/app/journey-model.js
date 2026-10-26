export function retirementGap(desiredMonthlySpending, existingStableIncome) {
  return Math.max(Number(desiredMonthlySpending || 0) - Number(existingStableIncome || 0), 0);
}

export function reserveSummary({ mode, totalAssets, desiredMonthlySpending, reserveAmount, reserveMonths }) {
  if (mode === "unknown") return { known: false, reserve: null, available: null, displayReserve: "待定", displayAvailable: "待定" };
  const assets = Math.max(0, Number(totalAssets || 0));
  const reserve = mode === "months"
    ? Math.max(0, Number(desiredMonthlySpending || 0) * Number(reserveMonths || 0))
    : Math.max(0, Number(reserveAmount || 0));
  return { known: true, reserve, available: Math.max(0, assets - reserve), displayReserve: reserve, displayAvailable: Math.max(0, assets - reserve) };
}

export function oalaScenarioValues({ premiumHkd, outcome, policyYear, hkdPerUsd }) {
  if (!outcome?.available || !Number.isFinite(Number(premiumHkd)) || !Number.isFinite(Number(hkdPerUsd)) || Number(hkdPerUsd) <= 0) return null;
  const year = Math.max(1, Math.min(Number(policyYear) || 1, outcome.schedule.length));
  const row = outcome.schedule[year - 1];
  if (!row) return null;
  return { annuityPremium: Number(premiumHkd), annuityMonthlyIncome: Math.round((row.annualDisplayedIncome / 12) * Number(hkdPerUsd)), policyYear: year, attainedAge: row.attainedAge };
}
