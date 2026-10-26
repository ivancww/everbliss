import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adminExchangeFromConfiguredEndpoint } from "../src/admin/admin-auth.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gas = fs.readFileSync(path.join(root, "gas/Code.gs"), "utf8");
const schema = fs.readFileSync(path.join(root, "docs/google-sheet-gas-architecture.md"), "utf8");
const liveStatus = fs.readFileSync(path.join(root, "docs/live-integration-status.md"), "utf8");
const release = JSON.parse(fs.readFileSync(path.join(root, "release.json"), "utf8"));

test("GAS reads the production Chinese system tabs and exposes English canonical public actions", () => {
  for (const tab of ["產品設定", "系統_每年收入回報率", "系統_退保價值倍數", "系統_身故賠償倍數", "系統_官方資料來源", "系統_數據版本", "系統_修改紀錄"]) assert.ok(gas.includes(tab), `missing deployed Sheet tab ${tab}`);
  for (const action of ["health", "getOfficialDataset", "getProductConfig", "getIncomeRates", "getSurrenderMultipliers", "getDeathMultipliers", "getDatasetMeta"]) assert.ok(gas.includes(action));
  assert.match(gas, /schemaVersion:EB\.SCHEMA_VERSION/);
  assert.match(gas, /datasetName:'everbliss-official'/);
  assert.doesNotMatch(gas, /USER_OVERRIDE|userOverrides/i);
});

test("GAS Admin mutation path is fail-closed, versioned, locked and audited", () => {
  assert.match(gas, /AVA_PLATFORM_ADMIN_VERIFIER_NOT_CONFIGURED/);
  assert.match(gas, /expected_dataset_version/);
  assert.match(gas, /LockService\.getScriptLock\(\)/);
  assert.match(gas, /READ_AFTER_WRITE_FAILED/);
  assert.match(gas, /setValues\(hiddenRows\)/);
  assert.match(gas, /setValues\(visibleRows\)/);
  assert.doesNotMatch(gas, /\.appendRow\(/);
  assert.match(gas, /ROLLBACK_VERIFICATION_FAILED/);
  assert.match(gas, /publish:'\+c\.field/);
  assert.match(gas, /FIELD_NOT_ALLOWED/);
  assert.match(gas, /OFFICIAL_SOURCE_REQUIRED/);
  assert.doesNotMatch(gas, /adminPassword|localAdminPassword|queryParam.*adminAuthorized/i);
  assert.match(gas, /AVA_ADMIN_VERIFY_TOKEN/);
});

test("unprovisioned live connector remains explicit and fail-closed", async () => {
  assert.equal(release.officialEndpoint, "");
  await assert.rejects(adminExchangeFromConfiguredEndpoint("")({}), /Admin Connector is not configured/);
  assert.match(gas, /EVERBLISS_SHEET_ID_NOT_CONFIGURED/);
  assert.match(gas, /AVA_PLATFORM_ADMIN_VERIFIER_NOT_CONFIGURED/);
  assert.match(gas, /EVERBLISS_SHEET_ID/);
  assert.match(liveStatus, /AVA - EverBliss/);
  assert.match(liveStatus, /Canonical Data Pack v1/);
  assert.match(liveStatus, /36 income anchors, 36 multiplier scenarios/);
  assert.match(liveStatus, /AVA_ADMIN_VERIFY_URL/);
  assert.match(liveStatus, /BROWSER QA PENDING/);
});

test("Pages build injects one canonical Official endpoint from the repository variable", () => {
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/pages.yml"), "utf8");
  const build = fs.readFileSync(path.join(root, "scripts/build.js"), "utf8");
  assert.match(workflow, /EVERBLISS_OFFICIAL_ENDPOINT:\s*\$\{\{ vars\.EVERBLISS_OFFICIAL_ENDPOINT \}\}/);
  assert.match(build, /process\.env\.EVERBLISS_OFFICIAL_ENDPOINT/);
  assert.equal(release.officialEndpoint, "", "the source release manifest remains environment-driven");
});


test("GAS Product Config exposes the machine-readable HKD/USD trial conversion setting", () => {
  assert.match(gas, /hkd_per_usd_calculation_rate:\['港元兌美元試算換算率','number'\]/);
});
