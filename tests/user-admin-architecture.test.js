import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveEntrySurface, returnAvaUrl } from "../src/app/entry-surfaces.js";
import { DEFAULT_USER_PRESENTATION, normalizeUserPresentationConfig, resolveUserPresentation, resetPresentationSection } from "../src/data/presentation/user-config.js";
import { ADMIN_DOMAINS, createAdminDraft, addAdminDraftChange, validateAdminDraft } from "../src/admin/admin-workflow.js";
import { renderAdminSurface } from "../src/admin/admin-view.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("three-entry routing defaults safely to Front and preserves AVA return surfaces", () => {
  assert.equal(resolveEntrySurface(""), "frontend");
  assert.equal(resolveEntrySurface("?avaEntry=frontend"), "frontend");
  assert.equal(resolveEntrySurface("?avaEntry=user"), "user");
  assert.equal(resolveEntrySurface("?avaEntry=admin"), "admin");
  assert.equal(resolveEntrySurface("?avaEntry=admin&avaAdminAuthorized=true"), "admin");
  assert.equal(returnAvaUrl("frontend"), "https://ivancww.github.io/avaplatform/");
  assert.match(returnAvaUrl("user"), /avaSurface=user/);
  assert.match(returnAvaUrl("admin"), /avaSurface=admin/);
  const main = read("src/app/main.js");
  assert.match(main, /let entryMode = resolveEntrySurface\(location.search\)/);
  assert.match(main, /正在驗證管理工作階段/);
  assert.match(main, /ADMIN ACCESS DENIED · FAIL CLOSED/);
});

test("versioned User presentation accepts only presentation fields and safely defaults corrupt/incomplete data", () => {
  const config = normalizeUserPresentationConfig({ schema: "everbliss-user-config-v1", schemaVersion: 1, values: {
    "home.heroTitle": "我的標題", "j02.spendingHelper": "每月開支提示", "features.F01.visible": false,
    "features.F02.order": 1, guaranteed_rate: 0.99, hkd_per_usd_calculation_rate: 9.9, "oalaData.single.assetLimit": 1
  } });
  const resolved = resolveUserPresentation(config);
  assert.equal(config.layer, "USER_OVERRIDE");
  assert.equal(resolved["home.heroTitle"], "我的標題");
  assert.equal(resolved["j02.spendingHelper"], "每月開支提示");
  assert.equal(resolved["features.F01.visible"], false);
  assert.equal(resolved["features.F02.order"], 1);
  assert.equal(resolved["j07.year8Extra"], DEFAULT_USER_PRESENTATION["j07.year8Extra"]);
  assert.equal("guaranteed_rate" in config.values, false);
  assert.equal("hkd_per_usd_calculation_rate" in config.values, false);
  assert.equal("oalaData.single.assetLimit" in config.values, false);
  assert.equal(resolveUserPresentation({ schema: "everbliss-user-config-v1", schemaVersion: 0, values: { "home.heroTitle": "stale" } })["home.heroTitle"], DEFAULT_USER_PRESENTATION["home.heroTitle"]);
  assert.deepEqual(resolveUserPresentation(null), DEFAULT_USER_PRESENTATION);
  assert.deepEqual(resolveUserPresentation("not-json"), DEFAULT_USER_PRESENTATION);
});

test("User preview/save/reset controls affect only User Override and presentation rendering", () => {
  const main = read("src/app/main.js");
  const state = read("src/storage/state.js");
  const schema = read("src/data/presentation/user-config.js");
  for (const section of ["HOME", "J01 CONCERN", "J02 INCOME", "J03 LIQUIDITY", "J04 CONCEPT", "J05 TIMING", "J06 PLAN", "J07 RESULT", "J08 SUMMARY", "FEATURES", "OALA"]) assert.ok(schema.includes(section));
  for (const action of ["preview", "edit-again", "save-overrides", "reset-overrides"]) assert.ok(main.includes(`action===\"${action}\"`));
  assert.match(main, /data-reset-section/);
  assert.match(main, /clearUserOverrides/);
  assert.match(state, /OVERRIDE_STORE = "userOverrides"/);
  assert.match(state, /function clearUserOverrides/);
  assert.match(main, /contenteditable="true"/);
  assert.match(main, /data-presentation-edit/);
  assert.match(main, /data-user-value/);
  assert.match(main, /USER_OVERRIDE/);
  const reset = resetPresentationSection({ "home.heroTitle": "Custom", "j02.gapLabel": "Gap", "j03.helper": "Liquidity" }, "J02 INCOME");
  assert.equal(reset["home.heroTitle"], "Custom");
  assert.equal(reset["j03.helper"], "Liquidity");
  assert.equal(reset["j02.gapLabel"], undefined);
});

test("Front resolves presentation only and keeps Official calculator layer independent", () => {
  const main = read("src/app/main.js");
  assert.match(main, /function present\(\).*resolveUserPresentation/s);
  assert.match(main, /setOfficialCalculationDataset\(official\.dataset\)/);
  assert.match(main, /resolveLocalOfficialDataset\(lastKnownGood\)/);
  assert.match(main, /if\(entryMode==="user"\).*userEdit=true/s);
  assert.doesNotMatch(main, /renderUserEditor/);
  assert.match(main, /root\.innerHTML=\(pages\[state\.page\]/);
  assert.match(main, /root\.dataset\.page=state\.page/);
  assert.match(main, /userEdit\?\{schema:"everbliss-user-config-v1",schemaVersion:3,values:pendingUserValues\}:overrides/);
  assert.match(main, /\)\+editToolbar\(\)/);
  assert.match(main, /\["hkComparison","admin","adminBlocked","userEditor"\]\.includes\(state\.page\)/);
  assert.match(main, /userEditing=false;previewMode=false;render\(\)/);
  assert.match(main, /Save|儲存本機設定/);
});

test("Admin domains expose product, income, surrender, death, sources, dataset and read-only audit", () => {
  assert.deepEqual(ADMIN_DOMAINS.map(item => item.id), ["product", "income", "surrender", "death", "sources", "dataset", "audit"]);
  let draft = createAdminDraft({ datasetMeta: { dataset_version: "v4" } });
  assert.equal(draft.baseVersion, "v4");
  draft = addAdminDraftChange(draft, { domain: "product", recordId: "hkd_per_usd_calculation_rate", field: "value", oldValue: 7.8, newValue: 7.81 });
  assert.equal(validateAdminDraft(draft).valid, true);
  assert.throws(() => addAdminDraftChange(draft, { domain: "audit", recordId: "1", field: "new_value", newValue: "tamper" }), /not editable/);
  const rendered = renderAdminSurface({ activeDomain: "audit", dataset: { datasetMeta: { dataset_version: "v4", status: "PUBLISHED" }, auditLog: [{ timestamp: "now", operation: "publish", record_id: "x" }] }, appVersion: "v0.4.0" });
  assert.match(rendered, /AVA Admin/);
  assert.match(rendered, /數據版本／發布/);
  assert.match(rendered, /修改紀錄/);
  assert.match(rendered, /ava-admin-session-v1/);
  assert.match(rendered, /v0\.4\.0/);
});

test("Admin audit API is authenticated read-only and GAS Admin connector remains fail-closed", () => {
  const gas = read("gas/Code.gs");
  assert.match(gas, /function adminGetDataset_\(body\)/);
  assert.match(gas, /auditLog:readAuditLog_\(\)/);
  assert.match(gas, /function readAuditLog_\(\)/);
  assert.match(gas, /function requireAdmin_\(body,operation\)/);
  assert.match(gas, /AVA_PLATFORM_ADMIN_ENDPOINT_NOT_CONFIGURED/);
  assert.doesNotMatch(gas, /adminPassword|queryParam.*adminAuthorized/i);
});
