import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { retirementGap, reserveSummary, oalaScenarioValues } from "../src/app/journey-model.js";
import { oalaData } from "../src/data/government/oala.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("retirement gap updates from desired spending and existing income", () => {
  assert.equal(retirementGap(30000, 10000), 20000);
  assert.equal(retirementGap(10000, 30000), 0);
});

test("liquidity reserve supports amount, months and unknown without treating unknown as zero", () => {
  assert.deepEqual(reserveSummary({ mode: "amount", totalAssets: 500000, reserveAmount: 100000 }), { known: true, reserve: 100000, available: 400000, displayReserve: 100000, displayAvailable: 400000 });
  assert.equal(reserveSummary({ mode: "months", totalAssets: 500000, desiredMonthlySpending: 30000, reserveMonths: 6 }).reserve, 180000);
  const unknown = reserveSummary({ mode: "unknown", totalAssets: 500000, reserveAmount: 0, reserveMonths: 0 });
  assert.equal(unknown.reserve, null);
  assert.equal(unknown.available, null);
  assert.equal(unknown.displayReserve, "待定");
  assert.equal(unknown.displayAvailable, "待定");
});

test("OALA values derive from the selected valid EverBliss scenario", () => {
  const outcome = { available: true, schedule: [{ policyYear: 1, attainedAge: 61, annualDisplayedIncome: 51000 }] };
  assert.deepEqual(oalaScenarioValues({ premiumHkd: 390000, outcome, policyYear: 1, hkdPerUsd: 7.8 }), { annuityPremium: 390000, annuityMonthlyIncome: 33150, policyYear: 1, attainedAge: 61 });
  assert.equal(oalaScenarioValues({ premiumHkd: 390000, outcome: null, policyYear: 1, hkdPerUsd: 7.8 }), null);
});

test("OALA uses Traditional Chinese SWD links and current published limits", () => {
  assert.equal(oalaData.limitsSourceUrl, "https://www.swd.gov.hk/tc/pubsvc/socsecu/ssallowance/ssaec/ssaec_oala/ssaec_oala_limit/");
  assert.equal(oalaData.paymentSourceUrl, "https://www.swd.gov.hk/tc/pubsvc/socsecu/ssallowance/ssa_amt/ssa_amt_all/");
  assert.deepEqual(oalaData.single, { incomeLimit: 10900, assetLimit: 415000 });
  assert.deepEqual(oalaData.couple, { incomeLimit: 16680, assetLimit: 630000 });
  assert.equal(oalaData.monthlyBenefit, 4345);
  assert.equal(oalaData.effectiveDate, "2026-02-01");
});

test("J02, J03, OALA and J07 presentation contracts remain in the single frontstage renderers", async () => {
  const source = await fs.readFile(path.join(root, "src/app/main.js"), "utf8");
  const shell = await fs.readFile(path.join(root, "src/pwa/sw-template.js"), "utf8");
  assert.match(source, /id="retirement-gap-value"/);
  assert.match(source, /updateRetirementGap\(\)/);
  assert.match(source, /choice\("暫時未知","unknown"/);
  assert.match(source, /id="liquidity-reserve-value"/);
  assert.match(source, /尚未完成 EverBliss 年金試算/);
  assert.doesNotMatch(source, /id="oala-premium"|id="oala-payout"/);
  assert.match(source, /data-policy-year-slider/);
  assert.match(source, /data-result-age/);
  assert.match(source, /data-result-policy-year/);
  assert.match(source, /data-result-primary/);
  assert.match(source, /每年 \$\{annual\}/);
  assert.match(source, /selectedPolicyYearTouched\?state\.selectedPolicyYear:\(state\.accumulation===\"deferred\"\?6:1\)/);
  assert.match(source, /liquidity-reserve-value/);
  assert.match(source, /updateLiquiditySummary\(\)/);
  assert.match(source, /已包括第8年起額外每月收入/);
  assert.doesNotMatch(source, /year-chip|數據來源|插值錨點|premium scaling|Official anchor/i);
  assert.match(shell, /src\/app\/journey-model\.js/);
  assert.match(shell, /src\/data\/official\/product-config\.js/);
  assert.match(await fs.readFile(path.join(root, "src/ui/styles.css"), "utf8"), /touch-action:pan-y/);
});
