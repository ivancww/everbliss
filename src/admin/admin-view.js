import { ADMIN_DOMAINS } from "./admin-workflow.js";

const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
const FIELD_MAP = Object.freeze({
  product: { rows: "productConfig", id: "key", fields: ["key", "value", "effective_date"], edits: ["value", "effective_date", "verified_date", "source"] },
  income: { rows: "incomeRates", id: "record_id", fields: ["issue_age", "gender", "mode", "guaranteed_rate", "ng_rate_from_year8", "total_rate_from_year8", "source_file"], edits: ["guaranteed_rate", "ng_rate_from_year8", "total_rate_from_year8"] },
  surrender: { rows: "surrenderMultipliers", id: "record_id", fields: ["issue_age", "gender", "mode", "attained_age", "policy_year", "surrender_total_usd_25k", "surrender_multiplier", "source_file"], edits: ["surrender_total_usd_25k", "surrender_multiplier"] },
  death: { rows: "deathMultipliers", id: "record_id", fields: ["issue_age", "gender", "mode", "attained_age", "policy_year", "guaranteed_death_value_usd_25k", "terminal_bonus_usd_25k", "death_total_usd_25k", "death_multiplier", "source_file"], edits: ["guaranteed_death_value_usd_25k", "terminal_bonus_usd_25k", "death_total_usd_25k", "death_multiplier"] },
  sources: { rows: "officialSources", id: "source_id", fields: ["source_id", "filename", "issue_age", "gender", "mode", "table_type", "verified_date", "status"], edits: ["status", "notes"] },
  dataset: { rows: "datasetMeta", id: "dataset_name", fields: ["dataset_name", "dataset_version", "schema_version", "published_version", "status", "source_sha", "published_at"], edits: [] }
});

function getRecordId(domain, row) {
  const schema = FIELD_MAP[domain];
  return String(row[schema.id] ?? [row.issue_age, row.gender, row.mode, row.policy_year].filter(value => value !== undefined).join("|") ?? "");
}

export function renderAdminSurface({ activeDomain = "product", dataset = null, status = "OFFICIAL_CONNECTOR_UNAVAILABLE", draft = { changes: [] }, selectedRecordId = "", filters = {}, canPublish = false, draftError = "" } = {}) {
  const active = ADMIN_DOMAINS.find(domain => domain.id === activeDomain) || ADMIN_DOMAINS[0];
  const schema = FIELD_MAP[active.id];
  const tabs = ADMIN_DOMAINS.map(domain => `<button type="button" class="choice ${domain.id === active.id ? "selected" : ""}" data-admin-domain="${domain.id}" role="tab" aria-selected="${domain.id === active.id}">${esc(domain.label)}</button>`).join("");
  const rawRows = dataset?.[schema.rows];
  const rows = Array.isArray(rawRows) ? rawRows : rawRows ? [rawRows] : [];
  const filtered = rows.filter(row => (!filters.age || String(row.issue_age ?? row.issueAge ?? "") === String(filters.age))
    && (!filters.gender || String(row.gender ?? "") === filters.gender)
    && (!filters.mode || String(row.mode ?? "") === filters.mode)
    && (!filters.attainedAge || String(row.attained_age ?? row.attainedAge ?? "") === String(filters.attainedAge)));
  const filtersUi = ["income", "surrender", "death"].includes(active.id) ? `<div class="admin-filters"><label>Issue age<input type="number" min="50" max="75" data-admin-filter="age" value="${esc(filters.age)}"></label><label>Gender<select data-admin-filter="gender"><option value="">全部</option><option value="M" ${filters.gender === "M" ? "selected" : ""}>M</option><option value="F" ${filters.gender === "F" ? "selected" : ""}>F</option></select></label><label>Mode<select data-admin-filter="mode"><option value="">全部</option><option value="immediate" ${filters.mode === "immediate" ? "selected" : ""}>Immediate</option><option value="deferred" ${filters.mode === "deferred" ? "selected" : ""}>Deferred</option></select></label>${active.id === "income" ? "" : `<label>Attained age<input type="number" min="51" max="100" data-admin-filter="attainedAge" value="${esc(filters.attainedAge)}"></label>`}</div>` : "";
  const recordCards = filtered.slice(0, 100).map((row, index) => {
    const id = getRecordId(active.id, row);
    return `<article class="panel" data-admin-record data-age="${esc(row.issue_age ?? row.issueAge ?? "")}" data-gender="${esc(row.gender ?? "")}" data-mode="${esc(row.mode ?? "")}" data-attained-age="${esc(row.attained_age ?? row.attainedAge ?? "")}"><h3>${esc(id || `Record ${index + 1}`)}</h3><dl>${schema.fields.map(field => `<div><dt>${esc(field)}</dt><dd>${esc(row[field] ?? "—")}</dd></div>`).join("")}</dl><span class="data-status">${esc(row.source_type || row.sourceType || row.status || "OFFICIAL")}</span>${schema.edits.length ? `<button class="button secondary" type="button" data-admin-edit="${esc(id)}">編輯草稿</button>` : ""}</article>`;
  }).join("");
  const selected = rows.find(row => getRecordId(active.id, row) === selectedRecordId);
  const editForm = selected && schema.edits.length ? `<form class="panel admin-edit-form" data-admin-edit-form><h3>編輯草稿 · ${esc(selectedRecordId)}</h3>${schema.edits.map(field => `<label class="field">${esc(field)}<input data-admin-edit-field="${esc(field)}" value="${esc(selected[field] ?? "")}" ${["effective_date", "verified_date", "source", "notes", "status", "value"].includes(field) ? "type=\"text\"" : "type=\"number\" step=\"any\""}></label>`).join("")}${["income", "surrender", "death"].includes(active.id) ? `<p class="field-hint">來源提案：${esc(selected.source_file || "未指定")} · 更新前須核對 Official Source</p>` : ""}<button class="button" type="button" data-admin-draft-save="${esc(selectedRecordId)}">儲存本機草稿</button></form>` : "";
  const review = (draft?.changes || []).length ? `<section class="panel"><h3>草稿變更審核</h3>${draft.changes.map((change, index) => `<p><strong>${esc(change.domain)} · ${esc(change.recordId)} · ${esc(change.field)}</strong><br>舊值：${esc(change.oldValue)} → 新值：${esc(change.newValue)}</p>`).join("")}<button class="button" type="button" data-admin-publish ${canPublish ? "" : "disabled"}>發佈 Official Dataset</button>${draftError ? `<p class="alert">${esc(draftError)}</p>` : ""}</section>` : "";
  const list = dataset ? `${filtersUi}<p class="field-hint">顯示最多 100 筆；符合條件 ${filtered.length} 筆</p><div class="admin-record-list">${recordCards || "<p>沒有符合篩選條件的資料。</p>"}</div>` : `<div class="alert">官方連線尚未設定；此頁不會載入或編輯本機假資料。</div>`;
  const version = dataset?.datasetMeta?.dataset_version || dataset?.datasetVersion || "未連線";
  return `<section class="content-page admin-surface"><div class="journey-top"><a class="back-button" href="https://ivancww.github.io/avaplatform/?avaSurface=admin" rel="noopener">← 返回 AVA Studio</a><span class="progress-text">EverBliss · v0.1.0</span></div><div class="eyebrow">ADMIN · OFFICIAL DATA MANAGEMENT</div><h1>EverBliss 官方資料管理</h1><p class="lead">${esc(active.label)}｜管理 Official Layer；USER_OVERRIDE 不會同步到試算表。</p><nav class="admin-tabs" role="tablist" aria-label="管理資料域">${tabs}</nav><div class="panel"><div class="stat-row"><div class="stat"><small>Dataset version</small><strong>${esc(version)}</strong></div><div class="stat"><small>狀態</small><strong>${esc(status)}</strong></div><div class="stat"><small>待審變更</small><strong>${(draft?.changes || []).length}</strong></div></div><h2>${esc(active.label)}</h2>${list}${editForm}${review}</div><details class="panel"><summary>系統資訊</summary><p>AVA ava-admin-session-v1 ticket、nonce、opener proof 及 server-side exchange；URL 不授權。發佈須帶 expected dataset version，並由 GAS 以 ScriptLock、read-after-write 與 append-only audit 保護。</p></details></section>`;
}
