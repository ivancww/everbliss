import { incomeRateData } from "./income-rates.js";
import { officialMultiplierData } from "./official-multipliers.js";

export const BUNDLED_OFFICIAL_FALLBACK = Object.freeze({
  schemaVersion: 1,
  datasetName: "everbliss-official",
  datasetVersion: "v0.1.0",
  status: "VERIFIED_BUILT_IN_FALLBACK",
  incomeRates: incomeRateData,
  multipliers: officialMultiplierData
});

function expandIncomeRates(rows) {
  // A partial sheet cannot supply exact guaranteed rates; never interpolate them.
  return Array.isArray(rows) && rows.length === 104 ? rows : null;
}

export function normalizeOfficialDataset(data) {
  if (data?.incomeRates?.datasetContract !== "canonical-sheet-v1" || !data.multipliers) return null;
  const rates = expandIncomeRates(data.incomeRates.rates);
  if (!rates) return null;
  return { ...data, incomeRates: { ...data.incomeRates, rates } };
}

export function validateOfficialDataset(input) {
  const data = normalizeOfficialDataset(input);
  if (!data || data.schemaVersion !== 1 || typeof data.datasetVersion !== "string" || !data.datasetVersion) return false;
  const incomes = data.incomeRates?.rates;
  const scenarios = data.multipliers?.scenarios;
  if (!Array.isArray(incomes) || incomes.length !== 104 || !scenarios || typeof scenarios !== "object" || Object.keys(scenarios).length < 36) return false;
  const incomeKeys = new Set();
  for (const row of incomes) {
    if (!Number.isInteger(row.age) || !["M", "F"].includes(row.gender) || !["immediate", "deferred"].includes(row.mode)
      || ![row.guaranteedRate, row.nonGuaranteedRateFromYear8, row.totalRateFromYear8].every(Number.isFinite)
      || row.guaranteedRate <= 0 || row.nonGuaranteedRateFromYear8 < 0 || Math.abs(row.guaranteedRate + row.nonGuaranteedRateFromYear8 - row.totalRateFromYear8) > 1e-8) return false;
    const key = `${row.age}|${row.gender}|${row.mode}`;
    if (incomeKeys.has(key)) return false;
    incomeKeys.add(key);
  }
  for (const scenario of Object.values(scenarios)) {
    if (!scenario || !Number.isInteger(scenario.issueAge) || !scenario.years || typeof scenario.years !== "object") return false;
    for (const row of Object.values(scenario.years)) {
      if (!Number.isInteger(row.attainedAge) || ![row.surrenderMultiplier, row.deathMultiplier].every(Number.isFinite)) return false;
    }
    const years = Object.keys(scenario.years).map(Number).sort((a, b) => a - b);
    if (!years.length || years[0] !== 1 || years.some((year, index) => year !== index + 1)
      || scenario.years[String(years.length)]?.attainedAge !== 100) return false;
  }
  return true;
}

export function resolveLocalOfficialDataset(lastKnownGood) {
  const normalized = normalizeOfficialDataset(lastKnownGood);
  if (validateOfficialDataset(normalized)) return { dataset: normalized, source: "LAST_KNOWN_GOOD_OFFICIAL" };
  return { dataset: BUNDLED_OFFICIAL_FALLBACK, source: "VERIFIED_BUILT_IN_OFFICIAL_FALLBACK" };
}

export async function resolveOfficialDataset({ endpoint = "", fetchImpl = globalThis.fetch, loadLastKnownGood, saveLastKnownGood } = {}) {
  if (endpoint) {
    let timer = null;
    try {
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      timer = controller ? setTimeout(() => controller.abort(), 4000) : null;
      const response = await fetchImpl(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "getOfficialDataset", appId: "everbliss", schemaVersion: 1 }), signal: controller?.signal });
      if (timer) clearTimeout(timer);
      if (!response.ok) throw new Error("Official dataset request failed");
      const payload = await response.json();
      const normalized = normalizeOfficialDataset(payload.dataset);
      if (!validateOfficialDataset(normalized)) throw new Error("Official dataset schema invalid");
      await saveLastKnownGood?.(normalized);
      return { dataset: normalized, source: "VALID_CLOUD_OFFICIAL" };
    } catch { if (timer) clearTimeout(timer); /* stale/corrupt data is ignored; next layer decides */ }
  }
  const lastKnownGood = await loadLastKnownGood?.();
  const normalizedLkg = normalizeOfficialDataset(lastKnownGood);
  if (validateOfficialDataset(normalizedLkg)) return { dataset: normalizedLkg, source: "LAST_KNOWN_GOOD_OFFICIAL" };
  return { dataset: BUNDLED_OFFICIAL_FALLBACK, source: "VERIFIED_BUILT_IN_OFFICIAL_FALLBACK" };
}

export function officialDatasetUserOverrideIsIsolated(officialDataset, _userOverride) {
  return officialDataset;
}
