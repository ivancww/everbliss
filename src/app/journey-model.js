export function retirementGap(desiredMonthlySpending, existingStableIncome) {
  return Math.max(Number(desiredMonthlySpending || 0) - Number(existingStableIncome || 0), 0);
}

export function reserveSummary({ mode, totalAssets, desiredMonthlySpending, reserveAmount, reserveMonths, reserveYears, unknown = false }) {
  if (mode === "unknown" || (mode === "years" && (unknown || reserveYears === null || reserveYears === undefined || reserveYears === "" || !Number.isFinite(Number(reserveYears)) || Number(reserveYears) < 0))) return { known: false, reserve: null, available: null, displayReserve: "待定", displayAvailable: "待定" };
  const assets = Math.max(0, Number(totalAssets || 0));
  const reserve = mode === "years"
    ? Math.max(0, Number(desiredMonthlySpending || 0) * 12 * Number(reserveYears))
    : mode === "months"
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

// Legacy month-based values are converted by their units, never interpreted as years.
export function migrateLiquidityState(saved) {
  if (!saved) return {};
  if (saved.liquidReserveMode === "months") {
    const months = Number(saved.liquidReserveMonths);
    return { ...saved, liquidReserveMode: "years", liquidReserveYears: Number.isFinite(months) && months >= 0 ? months / 12 : null, liquidReserveUnknown: false };
  }
  if (saved.liquidReserveMode === "unknown") return { ...saved, liquidReserveMode: "years", liquidReserveUnknown: true, liquidReserveYears: null };
  return saved;
}

export function cumulativeScheduledIncome(schedule, policyYear) {
  const end = Math.max(0, Math.min(schedule.length, Math.floor(Number(policyYear) || 0)));
  return schedule.slice(0, end).reduce((sum, row) => sum + row.annualDisplayedIncome, 0);
}
