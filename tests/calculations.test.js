import test from "node:test";
import assert from "node:assert/strict";
import { calculateEverBliss, calculateIncomeByPolicyYear, cumulativeIncomeThroughPolicyYear, convertHkdToUsd, evaluateOala, cashflowPresentation, getAnchor } from "../src/calculations/engine.js";
import { officialAnchors, productTerms } from "../src/data/official/everbliss-anchors.js";
import { oalaData } from "../src/data/government/oala.js";

const calc=(gender,accumulation,premiumUsd=25000,issueAge=50)=>calculateEverBliss({issueAge,gender,accumulation,premiumUsd});

test("age 50 female immediate Official anchor values are preserved",()=>{
  const r=calc("F","immediate");
  assert.equal(r.sourceType,"OFFICIAL");assert.equal(r.guaranteedMonthly,74.25);assert.equal(r.nonGuaranteedMonthly,45);assert.equal(r.displayedMonthlyTotalYear8Plus,119.25);
  assert.equal(r.anchorSourceType,"OFFICIAL");assert.equal(r.valueSourceType,"CALCULATED");
  assert.deepEqual(r.year10,{guaranteedCashValue:11006,terminalBonus:4550,surrenderTotal:15556,guaranteedDeathBenefit:17340,expectedDeathBenefit:21890,formulaDeathValue:17340});
});
test("age 50 male immediate Official anchor values are preserved",()=>{const r=calc("M","immediate");assert.equal(r.guaranteedMonthly,77.5);assert.equal(r.nonGuaranteedMonthly,45.75);assert.equal(r.displayedMonthlyTotalYear8Plus,123.25);assert.equal(r.year10.guaranteedDeathBenefit,16950);});
test("age 50 female deferred Official anchor values are preserved",()=>{const r=calc("F","deferred");assert.equal(r.guaranteedMonthly,91);assert.equal(r.nonGuaranteedMonthly,54.5);assert.equal(r.displayedMonthlyTotalYear8Plus,145.5);assert.equal(r.year10.guaranteedDeathBenefit,20790);});
test("age 50 male deferred Official anchor values are preserved",()=>{const r=calc("M","deferred");assert.equal(r.guaranteedMonthly,95.75);assert.equal(r.nonGuaranteedMonthly,55.25);assert.equal(r.displayedMonthlyTotalYear8Plus,151);assert.equal(r.year10.guaranteedDeathBenefit,20505);});

test("immediate Year 1–7 excludes NG; Year 8 includes G plus NG",()=>{
  const r=calc("F","immediate");assert.equal(r.year1.displayedMonthlyTotal,74.25);
  for(let year=1;year<=7;year++){const row=calculateIncomeByPolicyYear({guaranteedMonthly:r.guaranteedMonthly,nonGuaranteedMonthly:r.nonGuaranteedMonthly,accumulation:"immediate",policyYear:year});assert.equal(row.nonGuaranteedMonthly,0);}
  assert.equal(r.year8.displayedMonthlyTotal,119.25);assert.equal(r.year8.startsNonGuaranteedThisYearAtMonth,85);
});
test("deferred Years 1–5 have zero income, Years 6–7 guaranteed only, Year 8 can include NG",()=>{
  const r=calc("F","deferred");for(let y=1;y<=5;y++){const row=calculateIncomeByPolicyYear({guaranteedMonthly:r.guaranteedMonthly,nonGuaranteedMonthly:r.nonGuaranteedMonthly,accumulation:"deferred",policyYear:y});assert.equal(row.displayedMonthlyTotal,0);}
  assert.equal(r.year6.guaranteedMonthly,91);assert.equal(r.year6.nonGuaranteedMonthly,0);assert.equal(r.year7.displayedMonthlyTotal,91);assert.equal(r.year8.displayedMonthlyTotal,145.5);assert.equal(r.year8.startsNonGuaranteedThisYearAtMonth,85);
});
test("health extra income is exactly half of guaranteed income, not displayed total",()=>{const r=calc("F","immediate");assert.equal(r.healthExtraMonthly,37.13);assert.notEqual(r.healthExtraMonthly,Math.round(r.displayedMonthlyTotalYear8Plus*0.5*100)/100);});
test("guaranteed death formula uses the higher of cash value or 105% premium less cumulative guaranteed income",()=>{for(const [gender,mode] of [["F","immediate"],["M","immediate"],["F","deferred"],["M","deferred"]]){const r=calc(gender,mode);assert.equal(r.year10.formulaDeathValue,r.year10.guaranteedDeathBenefit);assert.equal(r.year10.guaranteedDeathBenefit,Math.max(r.year10.guaranteedCashValue,Math.round(1.05*25000-r.cumulativeYear10.guaranteedIncome)));}});
test("expected death result composes guaranteed death benefit and terminal bonus",()=>{const r=calc("F","deferred");assert.equal(r.year10.expectedDeathBenefit,r.year10.guaranteedDeathBenefit+r.year10.terminalBonus);});
test("premium scaling is explicit and preserves the official anchor base",()=>{const r=calc("F","immediate",50000);assert.equal(r.sourceType,"SCALED_FROM_OFFICIAL");assert.equal(r.scaleFactor,2);assert.equal(r.guaranteedMonthly,148.5);assert.equal(r.year10.expectedDeathBenefit,43780);assert.match(r.disclosures[1],/並非逐份官方/);});
test("Official anchors are frozen; a bracketed age is explicitly interpolated",()=>{assert.ok(Object.isFrozen(officialAnchors));const r=calc("F","immediate",25000,51);assert.equal(r.available,true);assert.equal(r.sourceType,"INTERPOLATED");assert.equal(r.ageSourceType,"INTERPOLATED");assert.deepEqual(r.ageSourceAges,[50,52]);assert.equal(r.year10,null);});
test("age 60 works for all four supported gender and accumulation combinations",()=>{
  for(const [gender,accumulation,guaranteedAnnual,ngAnnual] of [["F","immediate",993,579],["M","immediate",1050,600],["F","deferred",1254,729],["M","deferred",1341,750]]){
    const r=calculateEverBliss({issueAge:60,gender,accumulation,premiumUsd:25000});assert.equal(r.available,true);assert.equal(r.sourceType,"OFFICIAL");assert.equal(r.guaranteedMonthly,guaranteedAnnual/12);assert.equal(r.nonGuaranteedMonthly,ngAnnual/12);assert.equal(r.year10,null);
  }
});
test("age 65 and 70 supplied combinations work and remain Official",()=>{
  for(const [issueAge,gender,accumulation] of [[65,"F","immediate"],[65,"M","immediate"],[65,"F","deferred"],[65,"M","deferred"],[70,"M","immediate"],[70,"F","deferred"],[70,"M","deferred"]]){
    const r=calculateEverBliss({issueAge,gender,accumulation,premiumUsd:25000});assert.equal(r.available,true);assert.equal(r.sourceType,"OFFICIAL");assert.equal(r.ageSourceType,"OFFICIAL");
  }
});
test("age interpolation is separate by gender and accumulation mode",()=>{
  const interpolated=getAnchor({issueAge:56,gender:"M",accumulation:"immediate"});assert.equal(interpolated.sourceType,"INTERPOLATED");assert.deepEqual(interpolated.sourceAges,[55,57]);assert.equal(interpolated.guaranteedAnnual,1002);assert.equal(interpolated.nonGuaranteedAnnualFromYear8,580.5);
  assert.equal(getAnchor({issueAge:55,gender:"M",accumulation:"deferred"}).sourceType,"INTERPOLATED");
  assert.equal(getAnchor({issueAge:67,gender:"F",accumulation:"immediate"}),null);
  assert.equal(getAnchor({issueAge:49,gender:"M",accumulation:"immediate"}),null);assert.equal(getAnchor({issueAge:71,gender:"M",accumulation:"immediate"}),null);
});
test("income-only age anchors do not fabricate death, cash value or surrender data",()=>{
  for(const issueAge of [52,55,57,60,65,67,70]){
    const r=calculateEverBliss({issueAge,gender:"M",accumulation:"immediate",premiumUsd:25000});assert.equal(r.year10,null);
  }
  assert.ok(calculateEverBliss({issueAge:50,gender:"F",accumulation:"immediate",premiumUsd:25000}).year10);
});
test("HKD/USD conversion requires an entered rate",()=>{assert.equal(convertHkdToUsd(78000,7.8),10000);assert.equal(convertHkdToUsd(78000,""),null);assert.equal(convertHkdToUsd(78000,0),null);});
test("cashflow result presentation leads with first guaranteed income and converts to HKD",()=>{
  const immediate=calc("F","immediate",25000,60);const now=cashflowPresentation(immediate,"immediate",7.8);assert.equal(now.heroLabel,"現在開始每月退休現金流");assert.equal(now.heroUsd,82.75);assert.equal(now.heroHkd,645);assert.equal(now.year8Usd,131);assert.equal(now.year8Hkd,1022);assert.equal(now.firstFiveYearsNoIncome,false);
  assert.equal(now.healthExtraUsd,41.38);assert.equal(now.healthExtraHkd,323);
  const deferred=calc("F","deferred",25000,60);const later=cashflowPresentation(deferred,"deferred",7.8);assert.equal(later.heroLabel,"第6年開始每月退休現金流");assert.equal(later.heroUsd,104.5);assert.equal(later.firstFiveYearsNoIncome,true);assert.equal(later.year8Usd,165.25);assert.equal(cashflowPresentation(immediate,"immediate",0),null);
});
test("OALA limits are sourced from metadata and compare before/after separately",()=>{
  const result=evaluateOala({age:65,household:"single",currentAssets:600000,currentMonthlyIncome:2500,annuityPremium:500000,annuityMonthlyIncome:2900});
  assert.equal(result.remainingAssessableAssets,100000);assert.equal(result.monthlyIncomeTestAmount,5400);assert.equal(result.withinAssetLimit,true);assert.equal(result.withinIncomeLimit,true);assert.equal(result.ageEligible,true);assert.equal(result.assetLimit,oalaData.single.assetLimit);assert.equal(result.preliminaryOnly,true);
  assert.equal(result.governmentConfirmed,false);assert.equal("qualified" in result,false);
  assert.equal(oalaData.effectiveDate,"2026-02-01");assert.equal(oalaData.monthlyBenefit,4345);assert.ok(oalaData.sourceUrl.startsWith("https://www.swd.gov.hk/"));
});
test("couple OALA test uses couple limits and surrender proceeds count as assets",()=>{const r=evaluateOala({age:60,household:"couple",currentAssets:500000,currentMonthlyIncome:14000,annuityPremium:100000,annuityMonthlyIncome:3000,surrenderProceeds:40000});assert.equal(r.remainingAssessableAssets,440000);assert.equal(r.monthlyIncomeTestAmount,17000);assert.equal(r.assetLimit,630000);assert.equal(r.incomeLimit,16680);assert.equal(r.withinAssetLimit,true);assert.equal(r.withinIncomeLimit,false);assert.equal(r.ageEligible,false);});
test("OALA refuses an after-annuity asset result when premium exceeds declared assets",()=>{const r=evaluateOala({age:65,household:"single",currentAssets:300000,currentMonthlyIncome:4000,annuityPremium:500000,annuityMonthlyIncome:4000});assert.equal(r.remainingAssessableAssets,null);assert.equal(r.withinAssetLimit,null);assert.equal(r.assetSimulationValid,false);assert.equal(r.withinIncomeLimit,true);assert.equal(r.governmentConfirmed,false);});
test("product timing constants are explicit",()=>{assert.deepEqual([...productTerms.accumulationYears],[0,5]);assert.equal(productTerms.guaranteeStartsAtPolicyMonth.immediate,1);assert.equal(productTerms.guaranteeStartsAtPolicyMonth.deferred,61);assert.equal(productTerms.nonGuaranteedStartsAtPolicyMonth,85);});
