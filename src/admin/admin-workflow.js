export const ADMIN_DOMAINS = Object.freeze([
  { id: "product", label: "產品設定", sheet: "ProductConfig" },
  { id: "income", label: "Income Rates", sheet: "IncomeRates" },
  { id: "surrender", label: "退保乘數", sheet: "SurrenderMultipliers" },
  { id: "death", label: "身故乘數", sheet: "DeathMultipliers" },
  { id: "sources", label: "官方來源", sheet: "OfficialSources" },
  { id: "dataset", label: "Dataset 狀態", sheet: "DatasetMeta" }
]);

const EDITABLE_FIELDS = Object.freeze({
  product: ["value", "effective_date", "verified_date", "source"],
  income: ["guaranteed_rate", "ng_rate_from_year8", "total_rate_from_year8"],
  surrender: ["surrender_total_usd_25k", "surrender_multiplier"],
  death: ["guaranteed_death_value_usd_25k", "terminal_bonus_usd_25k", "death_total_usd_25k", "death_multiplier"],
  sources: ["status", "notes"]
});

export function createAdminDraft(dataset) {
  return { baseVersion: dataset?.datasetVersion || null, changes: [], state: "DRAFT" };
}

export function addAdminDraftChange(draft, change) {
  if (!ADMIN_DOMAINS.some(domain => domain.id === change.domain)) throw new Error("Unknown Admin domain");
  if (!change.recordId || !change.field || !EDITABLE_FIELDS[change.domain]?.includes(change.field)) throw new Error("Field is not editable in this Admin domain");
  if (["income", "surrender", "death"].includes(change.domain) && !change.sourceFile) throw new Error("A source proposal is required for Official data edits");
  return { ...draft, changes: [...draft.changes, { ...change }], state: "DRAFT" };
}

export function validateAdminDraft(draft) {
  const errors = [];
  if (!draft?.baseVersion) errors.push("Official dataset version is missing");
  if (!Array.isArray(draft?.changes) || !draft.changes.length) errors.push("No changes to validate");
  for (const change of draft?.changes || []) {
    if (!ADMIN_DOMAINS.some(domain => domain.id === change.domain)) errors.push(`Unknown domain: ${change.domain}`);
    if (!change.recordId || !EDITABLE_FIELDS[change.domain]?.includes(change.field)) errors.push(`Protected or incomplete change: ${change.recordId || "unknown"}`);
    if (["income", "surrender", "death"].includes(change.domain) && !change.sourceFile) errors.push(`Official proposal reference required: ${change.recordId}`);
  }
  return { valid: errors.length === 0, errors, affectedScenarios: [...new Set((draft?.changes || []).map(item => item.scenarioId).filter(Boolean))] };
}

export async function publishAdminDraft({ draft, session, connector }) {
  const validation = validateAdminDraft(draft);
  if (!session?.authorized || Date.parse(session.expiresAt) <= Date.now()) return { status: "DENIED", validation };
  if (!validation.valid) return { status: "INVALID", validation };
  if (typeof connector !== "function") return { status: "BLOCKED", reason: "OFFICIAL_CONNECTOR_UNAVAILABLE", validation };
  return connector({ action: "publishDataset", appId: "everbliss", expected_dataset_version: draft.baseVersion, changes: draft.changes, session: session.session });
}
