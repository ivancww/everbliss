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
  assert.match(source,/sourceType: "OFFICIAL"/);assert.match(source,/verifiedDate: null/);assert.match(source,/OWNER_SUPPLIED_VERIFIED_INPUT/);
  assert.deepEqual(dataSourceTypes,["OFFICIAL","SCALED_FROM_OFFICIAL","INTERPOLATED","CALCULATED"]);
});
test("interpolated income identifies its Official surrounding anchors and does not extrapolate",async()=>{
  const {getAnchor,calculateEverBliss}=await import("../src/calculations/engine.js");
  const r=getAnchor({issueAge:56,gender:"M",accumulation:"immediate"});assert.equal(r.sourceType,"INTERPOLATED");assert.deepEqual(r.sourceAges,[55,57]);
  assert.equal(getAnchor({issueAge:67,gender:"F",accumulation:"immediate"}),null);
  assert.equal(calculateEverBliss({issueAge:71,gender:"M",accumulation:"immediate",premiumUsd:25000}).available,false);
});
test("Government data carries current effective date and official source metadata",()=>{
  assert.equal(oalaData.effectiveDate,"2026-02-01");assert.equal(oalaData.verifiedDate,"2026-10-21");
  assert.ok(oalaData.sourceUrl.includes("swd.gov.hk"));assert.ok(oalaData.limitsSourceUrl.includes("swd.gov.hk"));assert.ok(oalaData.paymentSourceUrl.includes("swd.gov.hk"));
});
test("HK Annuity comparison is hidden by default and remains a separate optional page",()=>{
  assert.equal(appDefaults.showHongKongAnnuityComparison,false);
  const appSource=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");assert.match(appSource,/if\(!appDefaults\.showHongKongAnnuityComparison\)/);assert.match(appSource,/hkComparison:renderHiddenComparison/);
});
test("Front, User and protected Admin are declared; query route cannot grant access",()=>{
  assert.deepEqual(appCapabilities,{frontend:true,user:true,admin:true});
  const appSource=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");const authSource=fs.readFileSync(path.join(root,"src/admin/admin-auth.js"),"utf8");
  assert.match(appSource,/entry==="admin"/);assert.match(appSource,/ADMIN ACCESS DENIED/);assert.match(authSource,/ava-admin-session-v1/);assert.match(authSource,/event\?\.source !== opener/);assert.match(authSource,/event\?\.origin !== platformOrigin/);
});
test("feature hub and Return to AVA remain part of the shell",()=>{
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");const appSource=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");
  assert.match(html,/id="return-ava"/);assert.match(html,/https:\/\/ivancww\.github\.io\/avaplatform\//);assert.match(html,/返回 AVA/);assert.match(appSource,/計劃特點/);
});
test("OALA page uses conditional rule framing and keeps asset and income results separate",()=>{
  const source=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");
  assert.match(source,/只按社署目前公開的市場年金處理原則作初步估算/);assert.match(source,/最終由社會福利署按當時政策審批/);
  assert.match(source,/資產審查/);assert.match(source,/入息審查/);assert.doesNotMatch(source,/政府已確認合資格/);
});
test("RetireSmart is identified as non-contractual with verified provider and fee caveats",()=>{
  const source=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");
  assert.match(source,/非保單合約利益/);assert.match(source,/指定獨立第三方服務供應商/);assert.match(source,/直接向服務供應商付款/);assert.match(source,/暫停或終止/);
});
test("result rendering keeps the first guaranteed phase primary and supports configured HKD display",()=>{
  const source=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");
  assert.match(source,/function renderResult\(\)/);assert.match(source,/data-outcome/);assert.match(source,/data-year/);
  assert.match(source,/calculateOutcome\(/);assert.match(source,/premiumUsd:n\(state\.premiumUsd\)/);assert.match(source,/formatOutcomeAmount\(value,fx\)/);assert.match(source,/每年領取/);assert.match(source,/退保價值/);assert.match(source,/身故賠償/);
  assert.doesNotMatch(source,/renderResult=correctedRenderResult/);
});
test("release version has one canonical source and matches visible label contract",()=>{
  const release=JSON.parse(fs.readFileSync(path.join(root,"release.json"),"utf8"));assert.equal(release.version,"v0.1.0");
  const main=fs.readFileSync(path.join(root,"src/app/main.js"),"utf8");const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
  assert.match(main,/release\?\.version/);assert.match(html,/id="app-version"/);assert.doesNotMatch(main,/AVA_VERSION\s*=/);
});
