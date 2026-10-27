import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {reserveSummary, migrateLiquidityState, cumulativeScheduledIncome} from "../src/app/journey-model.js";
import {calculateOutcome} from "../src/calculations/full-outcomes.js";

test("years, zero, unknown, amount and historical months retain correct reserve meaning", () => {
  const base={totalAssets:500000,desiredMonthlySpending:10000};
  assert.equal(reserveSummary({...base,mode:"years",reserveYears:2.5}).reserve,300000);
  assert.equal(reserveSummary({...base,mode:"amount",reserveAmount:125000}).available,375000);
  assert.equal(reserveSummary({...base,mode:"years",reserveYears:0}).reserve,0);
  for(const input of [{reserveYears:2,unknown:true},{reserveYears:null}]) {
    const result=reserveSummary({...base,mode:"years",...input});
    assert.equal(result.known,false);assert.equal(result.reserve,null);assert.equal(result.available,null);
  }
  const old=migrateLiquidityState({liquidReserveMode:"months",liquidReserveMonths:18});
  assert.equal(old.liquidReserveYears,1.5);
  assert.equal(reserveSummary({...base,mode:old.liquidReserveMode,reserveYears:old.liquidReserveYears}).reserve,180000);
  assert.equal(migrateLiquidityState({liquidReserveMode:"unknown"}).liquidReserveUnknown,true);
});

test("cumulative cash flow uses each scheduled year, commencement and year 8 once", () => {
  for(const mode of ["immediate","deferred"]) {
    const outcome=calculateOutcome({issueAge:50,gender:"F",mode,premiumUsd:25000});
    assert.equal(outcome.available,true);
    const rows=outcome.schedule;
    assert.equal(rows[7].attainedAge,58);assert.equal(rows[7].policyYear,8);
    assert.equal(cumulativeScheduledIncome(rows,7),rows.slice(0,7).reduce((a,r)=>a+r.annualDisplayedIncome,0));
    assert.equal(cumulativeScheduledIncome(rows,8)-cumulativeScheduledIncome(rows,7),rows[7].annualDisplayedIncome);
    assert.ok(rows[7].annualNonGuaranteedIncome>0);
    if(mode==="deferred") assert.equal(cumulativeScheduledIncome(rows,5),0);
    assert.equal(cumulativeScheduledIncome(rows,0),0);
  }
});

test("summary back restores result even for old unsynchronised summary state",()=>{
  const source=fs.readFileSync("src/app/main.js","utf8");
  const fn=source.slice(source.indexOf("function previous()"),source.indexOf("function readJourneyInputs()"));
  const state={page:"summary",journeyStep:"result",issueAge:65,liquidReserveYears:2,liquidReserveUnknown:true,selectedPolicyYear:12,accumulation:"deferred"};
  const ctx={state,stepOrder:["concern","income","liquidity","concept","timing","plan","result","summary"],setPage(page){state.page=page;state.journeyStep=page;},persist(){},render(){}};
  vm.runInNewContext(fn+";previous()",ctx);
  assert.equal(state.page,"result");assert.equal(state.journeyStep,"result");assert.equal(state.selectedPolicyYear,12);assert.equal(state.liquidReserveYears,2);assert.equal(state.liquidReserveUnknown,true);assert.equal(state.issueAge,65);assert.equal(state.accumulation,"deferred");
  assert.match(source,/if\(action==="summary"\)\{state\.page="summary";state\.journeyStep="summary"/);
});

test("new controls and summary keep the requested presentation boundaries",()=>{
  const source=fs.readFileSync("src/app/main.js","utf8");
  const result=source.slice(source.indexOf("function renderResult()"),source.indexOf("function renderConcept()"));
  const summary=source.slice(source.indexOf("function renderSummary()"),source.indexOf("function editToolbar()"));
  assert.match(source,/data-reserve-unknown/);assert.match(source,/退休生活，可能比想像中更長。/);assert.match(source,/繼續了解/);
  assert.match(result,/data-year/);assert.match(result,/attainedAge/);assert.match(result,/policyYear/);assert.match(result,/cumulativeScheduledIncome/);
  assert.doesNotMatch(result,/data-policy-year-slider/);assert.doesNotMatch(result,/第8年起包括非保證額外每月收入/);
  assert.doesNotMatch(summary,/data-action="restart"|class="disclosure"/);assert.match(summary,/data-action="home">完成/);
});
