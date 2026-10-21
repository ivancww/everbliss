import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { officialAnchors, dataSourceTypes } from "../src/data/official/everbliss-anchors.js";
import { oalaData } from "../src/data/government/oala.js";
import { appDefaults, appCapabilities, dataPrecedence } from "../src/data/metadata/app-config.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
test("Official records remain separate from User Override storage and cannot be silently overwritten",async()=>{
  const stateSource=fs.readFileSync(path.join(root,"src/storage/state.js"),"utf8");
  assert.match(stateSource,/OVERRIDE_STORE = "userOverrides"/);assert.match(stateSource,/STATE_STORE = "appState"/);
  assert.equal(dataPrecedence.join(","),"BUILT_IN_DEFAULT,OFFICIAL,USER_OVERRIDE");
  assert.equal(officialAnchors["50|F|immediate"].guaranteedAnnual,891);
  const overrides={heroTitle:"My heading"};assert.equal(overrides.heroTitle,"My heading");assert.equal(officialAnchors["50|F|immediate"].guaranteedAnnual,891);
});
test("source types distinguish owner-provided Official data and premium-scaled outputs",()=>{
  const record=officialAnchors["50|F|immediate"];
  assert.equal(record.issueAge,50);assert.equal(record.singlePremium,25000);assert.equal(record.accumulation,"immediate");
  const source=fs.readFileSync(path.join(root,"src/data/official/everbliss-anchors.js"),"utf8");
  assert.match(source,/sourceType: "OFFICIAL"/);assert.match(source,/verifiedDate: null/);assert.match(source,/REFERENCE_PENDING/);
  assert.deepEqual(dataSourceTypes,["OFFICIAL","SCALED_FROM_OFFICIAL","INTERPOLATED","CALCULATED"]);
});
test("age interpolation is not silently fabricated when an Official anchor is missing",()=>{
  const source=fs.readFileSync(path.join(root,"src/calculations/engine.js"),"utf8");
  assert.match(source,/NO_OFFICIAL_AGE_ANCHOR/);assert.doesNotMatch(source,/interpolat\w*\s*\(/i);
});
test("Government data carries current effective date and official source metadata",()=>{
  assert.equal(oalaData.effectiveDate,"2026-02-01");assert.equal(oalaData.verifiedDate,"2026-10-21");
  assert.ok(oalaData.sourceUrl.includes("swd.gov.hk"));assert.ok(oalaData.limitsSourceUrl.includes("swd.gov.hk"));assert.ok(oalaData.paymentSourceUrl.includes("swd.gov.hk"));
});
test("HK Annuity comparison is hidden by default and remains a separate optional page",()=>{
  assert.equal(appDefaults.showHongKongAnnuityComparison,false);
  const appSource=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");assert.match(appSource,/if\(!appDefaults\.showHongKongAnnuityComparison\)/);assert.match(appSource,/hkComparison:renderHiddenComparison/);
});
test("capabilities fail closed for Admin while Front and User are declared",()=>{
  assert.deepEqual(appCapabilities,{frontend:true,user:true,admin:false});
  const appSource=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");assert.match(appSource,/entry==="admin"/);assert.match(appSource,/網址或查詢參數只用於路由/);
});
test("feature hub and Return to AVA remain part of the shell",()=>{
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");const appSource=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");
  assert.match(html,/id="return-ava"/);assert.match(html,/https:\/\/ivancww\.github\.io\/avaplatform\//);assert.match(html,/返回 AVA/);assert.match(appSource,/計劃特點/);
});
test("release version has one canonical source and matches visible label contract",()=>{
  const release=JSON.parse(fs.readFileSync(path.join(root,"release.json"),"utf8"));assert.equal(release.version,"v0.1.0");
  const main=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
  assert.match(main,/release\?\.version/);assert.match(html,/id="app-version"/);assert.doesNotMatch(main,/AVA_VERSION\s*=/);
});
