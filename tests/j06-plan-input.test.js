import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateOutcome } from "../src/calculations/full-outcomes.js";
import { formatOutcomeAmount, premiumHkdToUsd, restorePlanInputs, validatePlanPremiumHkd } from "../src/app/plan-input.js";
import { resolveProductConfig } from "../src/data/official/product-config.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("HKD premium input converts to USD for Official validation and calculations", () => {
  for (const usd of [25000, 50000, 85000, 115000, 150000, 200000, 1000000, 3860000, 4000000]) {
    const hkd = usd * 7.8;
    const result = validatePlanPremiumHkd(hkd, 7.8);
    assert.equal(result.valid, true);
    assert.equal(result.premiumUsd, usd);
  }
  assert.equal(validatePlanPremiumHkd(24999 * 7.8, 7.8).reason, "BELOW_MINIMUM");
  assert.equal(validatePlanPremiumHkd(4000001 * 7.8, 7.8).reason, "ABOVE_MAXIMUM");
  assert.equal(premiumHkdToUsd(390000, 7.8), 50000);
  const outcome = calculateOutcome({ issueAge: 60, gender: "F", mode: "immediate", premiumUsd: validatePlanPremiumHkd(390000, 7.8).premiumUsd });
  assert.equal(outcome.available, true);
  assert.equal(outcome.premiumUsd, 50000);
});

test("old premiumUsd local state migrates to one HKD input without dropping journey fields", () => {
  const restored = { page: "plan", issueAge: 63, ...restorePlanInputs({ premiumUsd: 50000 }, 7.8) };
  assert.equal(restored.premiumHkd, 390000);
  assert.equal(restored.page, "plan");
  assert.equal(restored.issueAge, 63);
  assert.equal("hkdPerUsd" in restored, false);
});

test("customer result converts USD to HKD and safely falls back to USD if FX is absent", () => {
  assert.deepEqual(formatOutcomeAmount(100, 7.8), { amount: "HK$780", currency: "HKD", fxRate: 7.8 });
  assert.deepEqual(formatOutcomeAmount(100, null), { amount: "US$100", currency: "USD", fxRate: null });
});

test("J06 exposes age, gender and HKD premium only", async () => {
  const source = await fs.readFile(path.join(root, "src/app/main.js"), "utf8");
  const plan = source.match(/function renderPlan\(\)\{([\s\S]*?)\nfunction getDisplayFxRate/);
  assert.ok(plan);
  assert.match(plan[1], /data-field="issueAge"/);
  assert.match(plan[1], /data-field="gender"/);
  assert.match(plan[1], /numberField\("premiumHkd",presentationText\("j06\.premiumLabel"/);
  const presentation = await fs.readFile(path.join(root, "src/data/presentation/user-config.js"), "utf8");assert.match(presentation, /"j06.premiumLabel": "投入年金保費（HKD）"/);
  assert.doesNotMatch(plan[1], /hkdPerUsd|HKD per USD|匯率/);
  assert.equal((source.match(/annuityAllocationHkd/g) || []).length, 1);
  assert.match(source, /premiumUsd:validation\.premiumUsd/);
  assert.doesNotMatch(source, /validatePlanPremiumUsd/);
});

test("Official Product Config supplies FX; verified fallback is available on cloud failure", async () => {
  const online = await resolveProductConfig({ endpoint: "https://example.test/api", fallback: { hkd_per_usd_calculation_rate: 7.8 }, fetchImpl: async url => ({ ok: true, json: async () => ({ success: true, productConfig: { hkd_per_usd_calculation_rate: 7.82 } }) }) });
  assert.equal(online.hkdPerUsd, 7.82);
  assert.equal(online.source, "VALID_CLOUD_PRODUCT_CONFIG");
  const fallback = await resolveProductConfig({ endpoint: "https://example.test/api", fallback: { hkd_per_usd_calculation_rate: 7.8 }, fetchImpl: async () => { throw new Error("offline"); } });
  assert.equal(fallback.hkdPerUsd, 7.8);
  assert.equal(fallback.source, "VERIFIED_BUILT_IN_CONFIG_FALLBACK");
});
