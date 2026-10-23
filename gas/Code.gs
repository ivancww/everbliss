/** EverBliss app-owned GAS adapter. Production use requires Script Properties:
 * EVERBLISS_SHEET_ID and verified AVA Platform proof verifier configuration.
 * This source intentionally has no fabricated production resource IDs.
 */
const EB = Object.freeze({
  APP_ID: 'everbliss',
  BASE_PREMIUM: 25000,
  SCHEMA_VERSION: '1.0.0',
  TABS: {
    ProductConfig: ['key','value','value_type','effective_date','verified_date','source','record_version','updated_at'],
    IncomeRates: ['record_id','issue_age','gender','mode','guaranteed_rate','ng_rate_from_year8','total_rate_from_year8','source_type','source_file','source_version','verified_date','record_version','updated_at'],
    SurrenderMultipliers: ['record_id','issue_age','gender','mode','policy_year','attained_age','surrender_total_usd_25k','surrender_multiplier','source_type','source_file','source_version','verified_date','record_version','updated_at'],
    DeathMultipliers: ['record_id','issue_age','gender','mode','policy_year','attained_age','guaranteed_death_value_usd_25k','terminal_bonus_usd_25k','death_total_usd_25k','death_multiplier','source_type','source_file','source_version','verified_date','record_version','updated_at'],
    OfficialSources: ['source_id','filename','issue_age','gender','mode','base_premium_usd','proposal_generator_version','table_type','extraction_date','verified_date','status','notes'],
    DatasetMeta: ['dataset_name','dataset_version','schema_version','published_version','status','source_sha','updated_at','published_at','published_by'],
    AuditLog: ['timestamp','admin_session_id','operation','domain','record_id','old_value','new_value','dataset_version_before','dataset_version_after','source_sha']
  }
});

function doGet(e) {
  try { return json_(publicAction_(String(e && e.parameter && e.parameter.action || 'getOfficialDataset'))); }
  catch (error) { return json_({ success: false, error: safeError_(error) }); }
}

function doPost(e) {
  try {
    const body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (body.appId && body.appId !== EB.APP_ID) throw new Error('APP_ID_MISMATCH');
    if (['getOfficialDataset','getProductConfig','getIncomeRates','getSurrenderMultipliers','getDeathMultipliers','getDatasetMeta'].includes(body.action)) return json_(publicAction_(body.action));
    if (body.action === 'exchangeAdminProof') return json_(exchangeAdminProof_(body));
    return json_(adminAction_(body));
  } catch (error) { return json_({ success: false, error: safeError_(error) }); }
}

function publicAction_(action) {
  const data = readDataset_();
  if (action === 'getProductConfig') return { success: true, productConfig: data.productConfig };
  if (action === 'getIncomeRates') return { success: true, incomeRates: data.incomeRates };
  if (action === 'getSurrenderMultipliers') return { success: true, surrenderMultipliers: data.surrenderMultipliers };
  if (action === 'getDeathMultipliers') return { success: true, deathMultipliers: data.deathMultipliers };
  if (action === 'getDatasetMeta') return { success: true, datasetMeta: data.datasetMeta };
  if (action === 'getOfficialDataset') return { success: true, dataset: toRuntimeDataset_(data) };
  throw new Error('ACTION_NOT_ALLOWED');
}

function readDataset_() {
  const ss = spreadsheet_();
  const result = {};
  Object.keys(EB.TABS).forEach(name => { result[name] = records_(ss.getSheetByName(name), EB.TABS[name]); });
  const meta = result.DatasetMeta.find(row => row.dataset_name === 'everbliss-official');
  if (!meta || !meta.dataset_version || meta.status !== 'PUBLISHED') throw new Error('OFFICIAL_DATASET_NOT_PUBLISHED');
  return { productConfig: result.ProductConfig, incomeRates: result.IncomeRates, surrenderMultipliers: result.SurrenderMultipliers, deathMultipliers: result.DeathMultipliers, officialSources: result.OfficialSources, datasetMeta: meta };
}

function toRuntimeDataset_(data) {
  const scenarios = {};
  data.surrenderMultipliers.forEach(row => {
    const key = scenarioKey_(row.issue_age, row.gender, row.mode);
    const scenario = scenarios[key] || (scenarios[key] = { issueAge: Number(row.issue_age), gender: String(row.gender), mode: String(row.mode), sourceType: 'OFFICIAL_PARSED', sourceFile: row.source_file, years: {} });
    const year = String(row.policy_year);
    scenario.years[year] = scenario.years[year] || { attainedAge: Number(row.attained_age) };
    scenario.years[year].surrenderMultiplier = Number(row.surrender_multiplier);
  });
  data.deathMultipliers.forEach(row => {
    const key = scenarioKey_(row.issue_age, row.gender, row.mode);
    const scenario = scenarios[key] || (scenarios[key] = { issueAge: Number(row.issue_age), gender: String(row.gender), mode: String(row.mode), sourceType: 'OFFICIAL_PARSED', sourceFile: row.source_file, years: {} });
    const year = String(row.policy_year);
    scenario.years[year] = scenario.years[year] || { attainedAge: Number(row.attained_age) };
    Object.assign(scenario.years[year], { deathMultiplier: Number(row.death_multiplier), deathTotal: Number(row.death_total_usd_25k), guaranteedDeathValue: Number(row.guaranteed_death_value_usd_25k), terminalBonus: Number(row.terminal_bonus_usd_25k) });
  });
  const meta = data.datasetMeta;
  return { schemaVersion: 1, datasetName: 'everbliss-official', datasetVersion: String(meta.dataset_version), status: 'PUBLISHED', incomeRates: { schemaVersion: EB.SCHEMA_VERSION, basePremiumUsd: EB.BASE_PREMIUM, rates: data.incomeRates.map(row => ({ age: Number(row.issue_age), gender: String(row.gender), mode: String(row.mode), guaranteedRate: Number(row.guaranteed_rate), nonGuaranteedRateFromYear8: Number(row.ng_rate_from_year8), totalRateFromYear8: Number(row.total_rate_from_year8), sourceType: String(row.source_type), sourceFile: String(row.source_file) })) }, multipliers: { schemaVersion: EB.SCHEMA_VERSION, basePremiumUsd: EB.BASE_PREMIUM, scenarios: scenarios } };
}

function exchangeAdminProof_(body) {
  if (body.contract !== 'ava-admin-session-v1' || body.appId !== EB.APP_ID || !body.launchTicket || !body.launchNonce || !body.browserProof || !body.expiresAt) throw new Error('ADMIN_PROOF_INVALID');
  // Deliberately fail closed until the exact AVA Platform server-side verifier
  // contract is configured and verified against the live Mother service.
  const verifier = globalThis.verifyAvaAdminProofWithPlatform_;
  if (typeof verifier !== 'function') throw new Error('AVA_PLATFORM_ADMIN_VERIFIER_NOT_CONFIGURED');
  const lock = LockService.getScriptLock(); if (!lock.tryLock(10000)) throw new Error('ADMIN_PROOF_LOCK_BUSY');
  try {
    const cache = CacheService.getScriptCache(); const ticketHash = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(body.launchTicket)));
    if (cache.get('used-ticket:' + ticketHash)) throw new Error('ADMIN_TICKET_REPLAYED');
    const verified = verifier(body);
    if (!verified || verified.appId !== EB.APP_ID || verified.authorized !== true || new Date(verified.expiresAt).getTime() <= Date.now()) throw new Error('ADMIN_PROOF_DENIED');
    cache.put('used-ticket:' + ticketHash, '1', Math.max(60, Math.min(1800, Math.ceil((new Date(verified.expiresAt).getTime() - Date.now()) / 1000))));
    const sessionId = Utilities.getUuid(); const sessionTtl = Math.max(1, Math.min(1800, Math.ceil((new Date(verified.expiresAt).getTime() - Date.now()) / 1000)));
    cache.put('admin:' + sessionId, JSON.stringify({ appId: EB.APP_ID, sessionId: sessionId, expiresAt: verified.expiresAt }), sessionTtl);
    return { success: true, appId: EB.APP_ID, adminAuthorized: true, expiresAt: verified.expiresAt, session: sessionId };
  } finally { lock.releaseLock(); }
}

function adminAction_(body) {
  const allowed = ['getAdminOfficialDataset','upsertIncomeRate','upsertSurrenderMultiplier','upsertDeathMultiplier','upsertProductConfig','publishDataset'];
  if (!allowed.includes(body.action)) throw new Error('ACTION_NOT_ALLOWED');
  const session = CacheService.getScriptCache().get('admin:' + String(body.session || ''));
  if (!session) throw new Error('ADMIN_SESSION_REQUIRED');
  const admin = JSON.parse(session);
  if (admin.appId !== EB.APP_ID || new Date(admin.expiresAt).getTime() <= Date.now()) throw new Error('ADMIN_SESSION_EXPIRED');
  if (body.action === 'getAdminOfficialDataset') return { success: true, dataset: readDataset_() };
  return withScriptLock_(function () { return writeDraftOrPublish_(body, admin); });
}

function writeDraftOrPublish_(body, admin) {
  const ss = spreadsheet_();
  const metaSheet = ss.getSheetByName('DatasetMeta');
  const meta = records_(metaSheet, EB.TABS.DatasetMeta).find(row => row.dataset_name === 'everbliss-official');
  if (!meta || String(body.expected_dataset_version) !== String(meta.dataset_version)) return { success: false, status: 'CONFLICT', currentDatasetVersion: meta && meta.dataset_version };
  if (body.action !== 'publishDataset') throw new Error('DRAFT_WRITE_PATH_NOT_CONFIGURED');
  if (!Array.isArray(body.changes) || !body.changes.length) throw new Error('EMPTY_CHANGESET');
  const changes = body.changes;
  const before = String(meta.dataset_version);
  const after = incrementVersion_(before);
  try {
    validateChanges_(ss, changes);
    changes.forEach(change => applyChange_(ss, change, admin));
    setMeta_(metaSheet, meta, { dataset_version: after, updated_at: new Date().toISOString(), published_version: after, published_at: new Date().toISOString(), published_by: admin.appId, source_sha: computeSourceSha_(ss) });
    const reread = readDataset_();
    validateOfficialDatasetForPublish_(reread);
    if (String(reread.datasetMeta.dataset_version) !== after) throw new Error('READ_AFTER_WRITE_FAILED');
    audit_(ss, changes, before, after, admin);
    return { success: true, status: 'PUBLISHED', datasetVersion: after, dataset: reread };
  } catch (error) {
    changes.slice().reverse().forEach(change => { if (Object.prototype.hasOwnProperty.call(change, '_oldValue')) restoreChange_(ss, change); });
    setMeta_(metaSheet, meta, { dataset_version: meta.dataset_version, updated_at: meta.updated_at, published_version: meta.published_version, published_at: meta.published_at, published_by: meta.published_by });
    throw error;
  }
}

function validateChanges_(ss, changes) {
  const tableByDomain = { product: 'ProductConfig', income: 'IncomeRates', surrender: 'SurrenderMultipliers', death: 'DeathMultipliers', sources: 'OfficialSources' };
  const fieldAllowlist = { product: ['value','effective_date','verified_date','source'], income: ['guaranteed_rate','ng_rate_from_year8','total_rate_from_year8'], surrender: ['surrender_total_usd_25k','surrender_multiplier'], death: ['guaranteed_death_value_usd_25k','terminal_bonus_usd_25k','death_total_usd_25k','death_multiplier'], sources: ['status','notes'] };
  const verifiedSources = records_(ss.getSheetByName('OfficialSources'), EB.TABS.OfficialSources).filter(row => String(row.status).toUpperCase() === 'VERIFIED');
  changes.forEach(change => {
    const tab = tableByDomain[change.domain];
    if (!tab || !change.recordId || !change.field || ['record_id','record_version','updated_at'].includes(change.field)) throw new Error('FIELD_NOT_ALLOWED');
    if (!fieldAllowlist[change.domain].includes(change.field)) throw new Error('FIELD_NOT_ALLOWED');
    if (['income','surrender','death'].includes(change.domain)) {
      if (!change.sourceFile) throw new Error('OFFICIAL_SOURCE_REQUIRED');
      const source = verifiedSources.find(row => String(row.filename) === String(change.sourceFile));
      if (!source || !String(source.table_type).includes('支取每月入息（詳細說明）')) throw new Error('OFFICIAL_SOURCE_NOT_VERIFIED');
    }
    if (change.domain === 'income' && (!Number.isFinite(Number(change.newValue)) || Number(change.newValue) < 0 || Number(change.newValue) > 1)) throw new Error('INCOME_RATE_INVALID');
    if (change.domain === 'surrender' && (!Number.isFinite(Number(change.newValue)) || Number(change.newValue) < 0)) throw new Error('SURRENDER_VALUE_INVALID');
    if (change.domain === 'death' && (!Number.isFinite(Number(change.newValue)) || Number(change.newValue) < 0)) throw new Error('DEATH_VALUE_INVALID');
  });
}

function validateOfficialDatasetForPublish_(data) {
  const runtime = toRuntimeDataset_(data);
  const groups = {};
  data.incomeRates.forEach(row => { const key = String(row.gender) + '|' + String(row.mode); (groups[key] || (groups[key] = [])).push(Number(row.issue_age)); });
  ['M|immediate','M|deferred','F|immediate','F|deferred'].forEach(key => {
    const ages = groups[key] || [];
    if (!ages.includes(50) || !ages.includes(75) || new Set(ages).size !== ages.length) throw new Error('INCOME_ANCHOR_COVERAGE_INVALID');
  });
  if (Object.keys(runtime.multipliers.scenarios).length < 36) throw new Error('MULTIPLIER_ANCHOR_COVERAGE_INVALID');
  Object.keys(runtime.multipliers.scenarios).forEach(key => {
    const scenario = runtime.multipliers.scenarios[key]; const count = 100 - Number(scenario.issueAge);
    for (let year = 1; year <= count; year++) {
      const row = scenario.years[String(year)];
      if (!row || !Number.isFinite(row.surrenderMultiplier) || !Number.isFinite(row.deathMultiplier) || row.attainedAge !== Number(scenario.issueAge) + year) throw new Error('MULTIPLIER_ANNUAL_CURVE_INVALID:' + key + ':' + year);
    }
  });
  data.deathMultipliers.forEach(row => {
    if (Math.abs(Number(row.death_total_usd_25k) - Number(row.guaranteed_death_value_usd_25k) - Number(row.terminal_bonus_usd_25k)) > 1) throw new Error('DEATH_COMPONENT_RECONCILIATION_FAILED');
    if (Math.abs(Number(row.death_multiplier) - Number(row.death_total_usd_25k) / EB.BASE_PREMIUM) > 1e-9) throw new Error('DEATH_MULTIPLIER_RECONCILIATION_FAILED');
  });
  data.surrenderMultipliers.forEach(row => {
    if (Math.abs(Number(row.surrender_multiplier) - Number(row.surrender_total_usd_25k) / EB.BASE_PREMIUM) > 1e-9) throw new Error('SURRENDER_MULTIPLIER_RECONCILIATION_FAILED');
  });
}

function applyChange_(ss, change, admin) {
  const tab = ({ product:'ProductConfig', income:'IncomeRates', surrender:'SurrenderMultipliers', death:'DeathMultipliers', sources:'OfficialSources' })[change.domain];
  const sheet = ss.getSheetByName(tab); const headers = EB.TABS[tab];
  const rows = sheet.getDataRange().getValues(); const idColumn = headers.indexOf(tab === 'ProductConfig' ? 'key' : tab === 'OfficialSources' ? 'source_id' : 'record_id');
  const rowIndex = rows.findIndex((row, index) => index > 0 && String(row[idColumn]) === String(change.recordId));
  if (rowIndex < 1) throw new Error('RECORD_NOT_FOUND');
  const fieldIndex = headers.indexOf(change.field); if (fieldIndex < 0) throw new Error('FIELD_NOT_ALLOWED');
  const oldValue = rows[rowIndex][fieldIndex]; const versionColumn = headers.indexOf('record_version'); const updatedColumn = headers.indexOf('updated_at');
  change._oldValue = oldValue; change._oldRecordVersion = versionColumn >= 0 ? rows[rowIndex][versionColumn] : null; change._oldUpdatedAt = updatedColumn >= 0 ? rows[rowIndex][updatedColumn] : null; change._sheetName = tab; change._actor = admin.appId;
  if (versionColumn >= 0) sheet.getRange(rowIndex + 1, versionColumn + 1).setValue(Number(rows[rowIndex][versionColumn] || 0) + 1);
  sheet.getRange(rowIndex + 1, fieldIndex + 1).setValue(change.newValue);
  if (updatedColumn >= 0) sheet.getRange(rowIndex + 1, updatedColumn + 1).setValue(new Date().toISOString());
}

function restoreChange_(ss, change) {
  const tab = change._sheetName; const sheet = ss.getSheetByName(tab); const headers = EB.TABS[tab]; const rows = sheet.getDataRange().getValues();
  const idField = tab === 'ProductConfig' ? 'key' : tab === 'OfficialSources' ? 'source_id' : 'record_id'; const idColumn = headers.indexOf(idField);
  const rowIndex = rows.findIndex((row, index) => index > 0 && String(row[idColumn]) === String(change.recordId)); if (rowIndex < 1) throw new Error('ROLLBACK_RECORD_NOT_FOUND');
  sheet.getRange(rowIndex + 1, headers.indexOf(change.field) + 1).setValue(change._oldValue);
  const versionColumn = headers.indexOf('record_version'); if (versionColumn >= 0) sheet.getRange(rowIndex + 1, versionColumn + 1).setValue(change._oldRecordVersion);
  const updatedColumn = headers.indexOf('updated_at'); if (updatedColumn >= 0) sheet.getRange(rowIndex + 1, updatedColumn + 1).setValue(change._oldUpdatedAt);
}

function audit_(ss, changes, before, after, admin) {
  const sheet = ss.getSheetByName('AuditLog'); const sourceSha = records_(ss.getSheetByName('DatasetMeta'), EB.TABS.DatasetMeta).find(row => row.dataset_name === 'everbliss-official').source_sha;
  changes.forEach(change => sheet.appendRow([new Date().toISOString(), admin.sessionId || 'server-session', 'publish', change.domain, change.recordId, String(change._oldValue), String(change.newValue), before, after, sourceSha]));
}

function initializeEverBlissSchema() {
  const ss = spreadsheet_();
  Object.keys(EB.TABS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) sheet.appendRow(EB.TABS[name]);
    else if (sheet.getRange(1, 1, 1, EB.TABS[name].length).getValues()[0].join('|') !== EB.TABS[name].join('|')) throw new Error('EXISTING_TAB_SCHEMA_MISMATCH:' + name);
  });
  return { success: true, spreadsheetId: ss.getId(), tabs: Object.keys(EB.TABS) };
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('EVERBLISS_SHEET_ID');
  if (!id) throw new Error('EVERBLISS_SHEET_ID_NOT_CONFIGURED');
  return SpreadsheetApp.openById(id);
}
function records_(sheet, headers) {
  if (!sheet) throw new Error('OFFICIAL_TAB_MISSING');
  const values = sheet.getDataRange().getValues();
  if (!values.length || headers.some((header, index) => values[0][index] !== header)) throw new Error('OFFICIAL_SCHEMA_INVALID');
  return values.slice(1).filter(row => row.some(value => value !== '')).map(row => headers.reduce((out, header, index) => { out[header] = row[index]; return out; }, {}));
}
function withScriptLock_(action) { const lock = LockService.getScriptLock(); if (!lock.tryLock(10000)) throw new Error('WRITE_LOCK_BUSY'); try { return action(); } finally { lock.releaseLock(); } }
function setMeta_(sheet, current, updates) { const rows = sheet.getDataRange().getValues(); const headers = EB.TABS.DatasetMeta; const index = rows.findIndex((row, i) => i > 0 && row[headers.indexOf('dataset_name')] === current.dataset_name); Object.keys(updates).forEach(key => sheet.getRange(index + 1, headers.indexOf(key) + 1).setValue(updates[key])); }
function scenarioKey_(age, gender, mode) { return String(age) + String(gender) + '_' + String(mode); }
function incrementVersion_(version) { const parts = String(version).split('.').map(Number); if (parts.length !== 3 || parts.some(Number.isNaN)) throw new Error('DATASET_VERSION_INVALID'); parts[2] += 1; return parts.join('.'); }
function computeSourceSha_(ss) { const payload = ['ProductConfig','IncomeRates','SurrenderMultipliers','DeathMultipliers','OfficialSources'].map(name => records_(ss.getSheetByName(name), EB.TABS[name])); const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(payload)); return bytes.map(value => ('0' + ((value + 256) % 256).toString(16)).slice(-2)).join(''); }
function safeError_(error) { return String(error && error.message || 'INTERNAL_ERROR').slice(0, 160); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
