import test from "node:test";
import assert from "node:assert/strict";
import { BUNDLED_OFFICIAL_FALLBACK, normalizeOfficialDataset, resolveOfficialDataset, validateOfficialDataset } from "../src/data/official/official-dataset.js";
import { officialDatasetUserOverrideIsIsolated } from "../src/data/official/official-dataset.js";

test("bundled official fallback is valid and requires complete income coverage", () => {
  assert.equal(validateOfficialDataset(BUNDLED_OFFICIAL_FALLBACK), true);
  assert.equal(BUNDLED_OFFICIAL_FALLBACK.incomeRates.rates.length, 104);
  const malformed = structuredClone(BUNDLED_OFFICIAL_FALLBACK);
  malformed.incomeRates.rates.pop();
  assert.equal(validateOfficialDataset(malformed), false);
});

test("incomplete anchor-only data is rejected instead of inventing guaranteed rates", () => {
  const anchorsOnly = structuredClone(BUNDLED_OFFICIAL_FALLBACK);
  anchorsOnly.incomeRates.rates = anchorsOnly.incomeRates.rates.filter(row => row.sourceType !== "INTERPOLATED");
  assert.equal(normalizeOfficialDataset(anchorsOnly), null);
  assert.equal(validateOfficialDataset(anchorsOnly), false);
});

test("valid cloud Official data wins and is saved as Last Known Good", async () => {
  let saved;
  const dataset = structuredClone(BUNDLED_OFFICIAL_FALLBACK);
  dataset.datasetVersion = "v-test";
  const result = await resolveOfficialDataset({ endpoint: "https://gas.invalid/exec", fetchImpl: async () => ({ ok: true, json: async () => ({ dataset }) }), saveLastKnownGood: async value => { saved = value; } });
  assert.equal(result.source, "VALID_CLOUD_OFFICIAL");
  assert.equal(result.dataset.datasetVersion, "v-test");
  assert.equal(saved.datasetVersion, "v-test");
});

test("cloud failure or malformed partial cloud data falls back to valid LKG", async () => {
  const lkg = structuredClone(BUNDLED_OFFICIAL_FALLBACK); lkg.datasetVersion = "lkg-v";
  for (const fetchImpl of [async () => { throw new Error("offline"); }, async () => ({ ok: true, json: async () => ({ dataset: { schemaVersion: 1, datasetVersion: "partial", incomeRates: { rates: [] }, multipliers: { scenarios: {} } } }) })]) {
    const result = await resolveOfficialDataset({ endpoint: "https://gas.invalid/exec", fetchImpl, loadLastKnownGood: async () => lkg });
    assert.equal(result.source, "LAST_KNOWN_GOOD_OFFICIAL");
    assert.equal(result.dataset.datasetVersion, "lkg-v");
  }
});

test("without valid cloud or LKG uses immutable verified bundled fallback", async () => {
  const result = await resolveOfficialDataset({ loadLastKnownGood: async () => ({ schemaVersion: 1, datasetVersion: "bad" }) });
  assert.equal(result.source, "VERIFIED_BUILT_IN_OFFICIAL_FALLBACK");
  assert.equal(result.dataset, BUNDLED_OFFICIAL_FALLBACK);
});

test("User Override cannot replace the Official multiplier dataset", () => {
  const userOverride = { deathMultiplier: 99, heroTitle: "我的首頁" };
  assert.equal(officialDatasetUserOverrideIsIsolated(BUNDLED_OFFICIAL_FALLBACK, userOverride), BUNDLED_OFFICIAL_FALLBACK);
  assert.notEqual(BUNDLED_OFFICIAL_FALLBACK.multipliers.scenarios["60M_immediate"].years["10"].deathMultiplier, userOverride.deathMultiplier);
});

test("legacy untagged Last Known Good cannot supersede canonical sheet fallback", async () => {
  const old = structuredClone(BUNDLED_OFFICIAL_FALLBACK); delete old.incomeRates.datasetContract;
  const result = await resolveOfficialDataset({loadLastKnownGood: async () => old});
  assert.equal(result.source, "VERIFIED_BUILT_IN_OFFICIAL_FALLBACK");
});
test("bundled rates match the read-only canonical sheet snapshot", async () => {
  const fs = await import('node:fs');
  const rows = JSON.parse(fs.readFileSync(new URL('./fixtures/canonical-sheet-snapshot.json', import.meta.url),'utf8')).income.slice(1).filter(r => r[0] >= 50);
  for (const row of rows) {
    const rate=BUNDLED_OFFICIAL_FALLBACK.incomeRates.rates.find(r => r.age===row[0] && r.gender===(row[1]==='男'?'M':'F') && r.mode===(row[2]==='即時'?'immediate':'deferred'));
    assert.ok(rate); assert.ok(Math.abs(rate.guaranteedRate-row[4]/100)<1e-12);assert.ok(Math.abs(rate.totalRateFromYear8-row[5]/100)<1e-12);assert.ok(Math.abs(rate.nonGuaranteedRateFromYear8-(row[5]-row[4])/100)<1e-12);
  }
});
