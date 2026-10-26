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
  if (!Array.isArray(rows) || rows.length < 8) return null;
  const key = row => `${row.age}|${row.gender}|${row.mode}`;
  const byKey = new Map();
  for (const row of rows) {
    if (!Number.isInteger(Number(row.age)) || Number(row.age) < 50 || Number(row.age) > 75 || !["M", "F"].includes(row.gender) || !["immediate", "deferred"].includes(row.mode)
      || ![row.guaranteedRate, row.nonGuaranteedRateFromYear8, row.totalRateFromYear8].every(Number.isFinite) || byKey.has(key(row))) return null;
    byKey.set(key(row), row);
  }
  const expanded = [];
  for (const gender of ["M", "F"]) for (const mode of ["immediate", "deferred"]) {
    const anchors = [...byKey.values()].filter(row => row.gender === gender && row.mode === mode && row.sourceType !== "INTERPOLATED").sort((a, b) => Number(a.age) - Number(b.age));
    if (anchors.length < 2 || Number(anchors[0].age) > 50 || Number(anchors.at(-1).age) < 75) return null;
    for (let age = 50; age <= 75; age++) {
      const exact = byKey.get(`${age}|${gender}|${mode}`);
      if (exact) { expanded.push(exact); continue; }
      const lower = [...anchors].reverse().find(row => Number(row.age) < age);
      const upper = anchors.find(row => Number(row.age) > age);
      if (!lower || !upper) return null;
      const ratio = (age - Number(lower.age)) / (Number(upper.age) - Number(lower.age));
      expanded.push({ age, gender, mode, guaranteedRate: lower.guaranteedRate + ratio * (upper.guaranteedRate - lower.guaranteedRate), nonGuaranteedRateFromYear8: lower.nonGuaranteedRateFromYear8 + ratio * (upper.nonGuaranteedRateFromYear8 - lower.nonGuaranteedRateFromYear8), totalRateFromYear8: lower.totalRateFromYear8 + ratio * (upper.totalRateFromYear8 - lower.totalRateFromYear8), sourceType: "INTERPOLATED", sourceAges: [Number(lower.age), Number(upper.age)] });
    }
  }
  return expanded;
}

export function normalizeOfficialDataset(data) {
  if (!data?.incomeRates || !data.multipliers) return null;
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
      || ![row.guaranteedRate, row.nonGuaranteedRateFromYear8, row.totalRateFromYear8].every(Number.isFinite)) return false;
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
