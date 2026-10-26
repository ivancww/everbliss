import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { calculateOutcome } from "../src/calculations/full-outcomes.js";
import { formatOutcomeAmount, restorePlanInputs, validatePlanPremiumUsd } from "../src/app/plan-input.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("USD premium boundaries and arbitrary in-range amounts validate directly", () => {
  for (const premiumUsd of [25000, 50000, 85000, 115000, 150000, 200000, 1000000, 3860000, 4000000]) {
    assert.deepEqual(validatePlanPremiumUsd(premiumUsd), { valid: true, reason: null, premiumUsd });
  }
  assert.equal(validatePlanPremiumUsd(24999).valid, false);
  assert.equal(validatePlanPremiumUsd(4000001).valid, false);
  assert.equal(validatePlanPremiumUsd("").reason, "REQUIRED");
});

test("US$50,000 enters the existing calculation engine without FX conversion", () => {
  const validation = validatePlanPremiumUsd(50000);
  assert.equal(validation.valid, true);
  const outcome = calculateOutcome({ issueAge: 60, gender: "F", mode: "immediate", premiumUsd: validation.premiumUsd });
  assert.equal(outcome.available, true);
  assert.equal(outcome.premiumUsd, 50000);
});

test("legacy HKD allocation is ignored without disturbing other saved journey state", () => {
  const saved = { issueAge: 63, page: "plan", annuityAllocationHkd: 50000, hkdPerUsd: "7.8" };
  const restored = { ...saved, ...restorePlanInputs(saved, null) };
  delete restored.annuityAllocationHkd;
  assert.equal(restored.issueAge, 63);
  assert.equal(restored.page, "plan");
  assert.equal(restored.premiumUsd, 25000);
  assert.equal(restored.hkdPerUsd, 7.8);
  assert.equal("annuityAllocationHkd" in restored, false);
});

test("result currency uses configured or retained FX, and remains usable in USD without FX", () => {
  assert.deepEqual(formatOutcomeAmount(100, 7.8), { amount: "HK$780", currency: "HKD", fxRate: 7.8 });
  assert.deepEqual(formatOutcomeAmount(100, null), { amount: "US$100", currency: "USD", fxRate: null });
});

test("J06 shows age, gender and USD premium only, without FX or technical source detail", async () => {
  const source = await fs.readFile(path.join(root, "src/app/main.js"), "utf8");
  const plan = source.match(/function renderPlan\(\)\{([\s\S]*?)\nfunction getDisplayFxRate/);
  assert.ok(plan, "renderPlan should be available as one canonical function");
  assert.match(plan[1], /data-field="issueAge"/);
  assert.match(plan[1], /data-field="gender"/);
  assert.match(plan[1], /numberField\("premiumUsd","單次保費（USD）"/);
  assert.doesNotMatch(plan[1], /hkdPerUsd|HKD|匯率|插值|官方錨點|25000官方基礎/);
  assert.equal((source.match(/annuityAllocationHkd/g) || []).length, 1, "legacy field should appear only in migration cleanup");
});

test("customer shell removes persistent footer copy and save-status presentation", async () => {
  const [html, source] = await Promise.all([
    fs.readFile(path.join(root, "index.html"), "utf8"),
    fs.readFile(path.join(root, "src/app/main.js"), "utf8")
  ]);
  assert.doesNotMatch(html, /app-footer|save-status|EverBliss · 退休現金流規劃/);
  assert.doesNotMatch(source, /已儲存於此裝置|save-status/);
});

test("journey back controls retain the AVA icon and card button styling", async () => {
  const [source, css] = await Promise.all([
    fs.readFile(path.join(root, "src/app/main.js"), "utf8"),
    fs.readFile(path.join(root, "src/ui/styles.css"), "utf8")
  ]);
  assert.match(source, /class="back-button"[^>]*>\$\{icon\("back"\)\} 返回/);
  assert.match(css, /\.back-button[^{]*\{[^}]*min-height:48px[^}]*border:1px solid[^}]*background:var\(--paper\)/);
  assert.doesNotMatch(css, /\.app-footer\s*\{/);
});
