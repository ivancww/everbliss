import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gasSource = fs.readFileSync(path.join(root, "gas/Code.gs"), "utf8");

function clone(value) {
  return value instanceof Date ? new Date(value.getTime()) : structuredClone(value);
}

class FakeRange {
  constructor(sheet, row, col, rows = 1, cols = 1) { Object.assign(this, { sheet, row, col, rows, cols }); }
  getValues() { return Array.from({ length: this.rows }, (_, r) => Array.from({ length: this.cols }, (_, c) => clone(this.sheet.cell(this.row + r, this.col + c)))); }
  setValue(value) { this.sheet.cell(this.row, this.col, clone(value)); }
  setValues(values) {
    if (this.sheet.failNextSetValues) { this.sheet.failNextSetValues = false; throw new Error(`injected ${this.sheet.name} batch failure`); }
    values.forEach((row, r) => row.forEach((value, c) => this.sheet.cell(this.row + r, this.col + c, clone(value))));
  }
  clearContent() { for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) this.sheet.cell(this.row + r, this.col + c, ""); }
}
class FakeSheet {
  constructor(name, rows) { this.name = name; this.rows = clone(rows); this.failNextSetValues = false; }
  getName() { return this.name; }
  getDataRange() { return new FakeRange(this, 1, 1, Math.max(1, this.rows.length), Math.max(1, this.getLastColumn())); }
  getLastColumn() { return Math.max(0, ...this.rows.map(row => row.length)); }
  getLastRow() { let n = this.rows.length; while (n > 0 && this.rows[n - 1].every(value => value === "" || value === null || value === undefined)) n--; return n; }
  getRange(row, col, rows = 1, cols = 1) { return new FakeRange(this, row, col, rows, cols); }
  cell(row, col, value) {
    while (this.rows.length < row) this.rows.push([]);
    while (this.rows[row - 1].length < col) this.rows[row - 1].push("");
    if (arguments.length === 3) this.rows[row - 1][col - 1] = value;
    return this.rows[row - 1][col - 1] ?? "";
  }
}

const sheetNames = {
  income: "系統_退保價值倍數", sources: "系統_官方資料來源", meta: "系統_數據版本",
  visibleMeta: "數據版本", audit: "系統_修改紀錄", visibleAudit: "修改紀錄"
};
const incomeHeaders = ["記錄編號", "投保年齡", "性別", "收入模式", "退保價值倍數", "保單年度", "當時年齡", "資料類型", "官方建議書", "建議書版本", "核實日期", "記錄版本", "更新時間"];
const sourceHeaders = ["資料來源編號", "檔案名稱", "投保年齡", "性別", "收入模式", "官方基準保費（美元）", "建議書產生器版本", "資料表類型", "擷取日期", "核實日期", "狀態", "備註"];
const metaHeaders = ["數據集名稱", "數據版本", "架構版本", "已發布版本", "狀態", "資料指紋", "更新時間", "發布時間", "發布者"];
const auditHeaders = ["時間", "管理員工作階段", "操作", "資料範圍", "記錄編號", "原值", "新值", "修改前數據版本", "修改後數據版本", "資料指紋"];
const visibleAuditHeaders = ["時間", "管理員", "資料範圍", "記錄編號", "原值", "新值"];

function createHarness({ failAt = "", failVisibleAudit = false, failMetaRestore = false, expectedVersion = "v1" } = {}) {
  const originalMeta = ["everbliss-official", "v1", "1", "v1", "已發布", "sha-old", "before-update", "", ""];
  const originalVisibleMeta = ["v1", "已發布", "before-update"];
  const sheets = new Map([
    [sheetNames.income, new FakeSheet(sheetNames.income, [incomeHeaders, ["income-60-M-immediate", 60, "男", "即期", 0.042, 0.024, 0.066, "官方數據", "60yrs 即期 m.pdf", "proposal-v1", "2026-10-26", 7, "old-record-time"]])],
    [sheetNames.sources, new FakeSheet(sheetNames.sources, [sourceHeaders, ["src-1", "60yrs 即期 m.pdf", 60, "男", "即期", 25000, "", "支取每月入息（詳細說明）", "2026-10-26", "2026-10-26", "已核實", ""]])],
    [sheetNames.meta, new FakeSheet(sheetNames.meta, [metaHeaders, originalMeta])],
    [sheetNames.visibleMeta, new FakeSheet(sheetNames.visibleMeta, [["版本", "狀態", "更新日期"], originalVisibleMeta])],
    [sheetNames.audit, new FakeSheet(sheetNames.audit, [auditHeaders])],
    [sheetNames.visibleAudit, new FakeSheet(sheetNames.visibleAudit, [visibleAuditHeaders])]
  ]);
  if (failVisibleAudit) sheets.get(sheetNames.visibleAudit).failNextSetValues = true;
  if (failMetaRestore) sheets.get(sheetNames.meta).failNextSetValues = true;
  const spreadsheet = { getSheetByName: name => sheets.get(name) || null };
  const context = {
    console, Date, Math, JSON, Object, Array, String, Number, RegExp, Error,
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => "sheet-id" }) },
    SpreadsheetApp: { openById: () => spreadsheet },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    Utilities: { formatDate: () => "", getUuid: () => "uuid" },
    UrlFetchApp: {},
    ContentService: { createTextOutput: x => x, MimeType: { JSON: "json" } }
  };
  vm.createContext(context);
  vm.runInContext(gasSource, context);
  context.computeSha_ = () => "sha-new";
  context.buildDataset_ = () => ({ published: true });
  let validations = 0;
  context.validateDataset_ = () => {
    validations++;
    if ((failAt === "before-meta" && validations === 1) || (failAt === "after-meta" && validations === 2)) throw new Error(`injected validation ${validations}`);
    return { success: true };
  };
  const change = { domain: "surrender", recordId: "income-60-M-immediate", field: "surrender_multiplier", newValue: 0.043, sourceFile: "60yrs 即期 m.pdf" };
  const session = { sessionId: "admin-session-1", subject: "admin-actor" };
  const publish = () => context.publish_({ expected_dataset_version: expectedVersion, changes: [change] }, session);
  return { context, sheets, publish, change, originalMeta, originalVisibleMeta };
}

function readRow(sheet, row = 2) { return sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0]; }
function incomeRow(h) { return readRow(h.sheets.get(sheetNames.income)); }
function hiddenAudit(h) { const sheet = h.sheets.get(sheetNames.audit); return sheet.rows.slice(1).filter(row => row.some(value => value !== "" && value !== null)); }
function visibleAudit(h) { const sheet = h.sheets.get(sheetNames.visibleAudit); return sheet.rows.slice(1).filter(row => row.some(value => value !== "" && value !== null)); }
function assertPrePublishState(h) {
  assert.deepEqual(readRow(h.sheets.get(sheetNames.meta)), h.originalMeta);
  assert.deepEqual(readRow(h.sheets.get(sheetNames.visibleMeta)), h.originalVisibleMeta);
  const row = incomeRow(h);
  assert.equal(row[4], 0.042);
  assert.equal(row[11], 7);
  assert.equal(row[12], "old-record-time");
  assert.deepEqual(hiddenAudit(h), []);
  assert.deepEqual(visibleAudit(h), []);
}

test("successful publish updates data and meta and writes old/new audit values with versions and source SHA", () => {
  const h = createHarness();
  const result = h.publish();
  assert.equal(result.status, "PUBLISHED");
  const row = incomeRow(h);
  assert.equal(row[4], 0.043);
  assert.equal(row[11], 8);
  assert.notEqual(row[12], "old-record-time");
  const meta = readRow(h.sheets.get(sheetNames.meta));
  assert.equal(meta[1], "v2"); assert.equal(meta[3], "v2"); assert.equal(meta[4], "已發布"); assert.equal(meta[5], "sha-new"); assert.equal(meta[8], "admin-actor");
  const audit = hiddenAudit(h);
  assert.equal(audit.length, 1);
  assert.deepEqual(audit[0].slice(1, 10), ["admin-session-1", "publish:surrender_multiplier", "surrender", "income-60-M-immediate", "0.042", "0.043", "v1", "v2", "sha-new"]);
  assert.equal(visibleAudit(h).length, 1);
  assert.equal(visibleAudit(h)[0][4], "0.042");
  assert.equal(visibleAudit(h)[0][5], "0.043");
});

test("failure before metadata update restores mutated data and writes no audit", () => {
  const h = createHarness({ failAt: "before-meta" });
  assert.throws(h.publish, /injected validation 1/);
  assertPrePublishState(h);
});

test("failure after metadata update restores data, complete metadata and audit destinations", () => {
  const h = createHarness({ failAt: "after-meta" });
  assert.throws(h.publish, /injected validation 2/);
  assertPrePublishState(h);
});

test("partial audit destination failure removes prior audit batch and rolls back data and metadata", () => {
  const h = createHarness({ failVisibleAudit: true });
  assert.throws(h.publish, /injected 修改紀錄 batch failure/);
  assertPrePublishState(h);
});

test("version conflict returns CONFLICT and performs zero writes", () => {
  const h = createHarness({ expectedVersion: "stale-v0" });
  const result = h.publish();
  assert.equal(result.status, "CONFLICT");
  assertPrePublishState(h);
});

test("failed rollback is surfaced as ROLLBACK_VERIFICATION_FAILED with original failure context", () => {
  const h = createHarness({ failAt: "after-meta", failMetaRestore: true });
  assert.throws(h.publish, error => {
    assert.match(error.message, /ROLLBACK_VERIFICATION_FAILED/);
    assert.match(error.message, /original=injected validation 2/);
    return true;
  });
  assert.equal(incomeRow(h)[4], 0.042);
  assert.equal(incomeRow(h)[11], 7);
  assert.deepEqual(hiddenAudit(h), []);
});

test("audit old value comes from the captured rollback snapshot, including zero values", () => {
  const h = createHarness();
  h.sheets.get(sheetNames.income).cell(2, 5, 0);
  const result = h.publish();
  assert.equal(result.status, "PUBLISHED");
  assert.equal(hiddenAudit(h)[0][5], "0");
  assert.equal(visibleAudit(h)[0][4], "0");
});
