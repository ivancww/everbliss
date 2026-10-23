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

test("EverBliss GAS prepares seven Official-only Sheet tabs and public read operations", () => {
  for (const tab of ["ProductConfig", "IncomeRates", "SurrenderMultipliers", "DeathMultipliers", "OfficialSources", "DatasetMeta", "AuditLog"]) {
    assert.match(gas, new RegExp(`${tab}: \\[`));
    assert.match(schema, new RegExp(`\\| ${tab} \\|`));
  }
  for (const action of ["getOfficialDataset", "getProductConfig", "getIncomeRates", "getSurrenderMultipliers", "getDeathMultipliers", "getDatasetMeta"]) assert.ok(gas.includes(action));
  assert.doesNotMatch(gas, /USER_OVERRIDE|userOverrides/i);
});

test("GAS Admin mutation path is fail-closed, versioned, locked and audited", () => {
  assert.match(gas, /AVA_PLATFORM_ADMIN_VERIFIER_NOT_CONFIGURED/);
  assert.match(gas, /expected_dataset_version/);
  assert.match(gas, /LockService\.getScriptLock\(\)/);
  assert.match(gas, /READ_AFTER_WRITE_FAILED/);
  assert.match(gas, /sheet\.appendRow\(/);
  assert.match(gas, /FIELD_NOT_ALLOWED/);
  assert.match(gas, /OFFICIAL_SOURCE_REQUIRED/);
  assert.doesNotMatch(gas, /password|secret|token/i);
});

test("unprovisioned live connector remains explicit and fail-closed", async () => {
  assert.equal(release.officialEndpoint, "");
  await assert.rejects(adminExchangeFromConfiguredEndpoint("")({}), /Admin Connector is not configured/);
  assert.match(gas, /EVERBLISS_SHEET_ID_NOT_CONFIGURED/);
  assert.match(gas, /AVA_PLATFORM_ADMIN_VERIFIER_NOT_CONFIGURED/);
  assert.doesNotMatch(gas, /https:\/\/script\.google\.com\/macros\/s\//);
  assert.match(liveStatus, /0 live rows written/);
  assert.match(liveStatus, /Not deployed/);
  assert.match(liveStatus, /Not configured live/);
});
