import test from "node:test";
import assert from "node:assert/strict";
import { calculateOutcome, getDeathMultiplier, getIncomeRates, getSurrenderMultiplier } from "../src/calculations/full-outcomes.js";
import { officialMultiplierData } from "../src/data/official/official-multipliers.js";

const modes = ["immediate", "deferred"];
const genders = ["M", "F"];
const ages = Array.from({ length: 26 }, (_, i) => i + 50);
const premiums = [25000, 37500, 88000, 100000, 318000, 500000, 1000000, 1750000, 3860000, 4000000];

test("full 104-age/gender/mode income matrix resolves with explicit source provenance", () => {
  let scenarios = 0;
  for (const issueAge of ages) for (const gender of genders) for (const mode of modes) {
    const rates = getIncomeRates({ issueAge, gender, mode });
    const result = calculateOutcome({ issueAge, gender, mode, premiumUsd: 25000 });
    assert.ok(rates, `${issueAge}${gender} ${mode} income rates`);
    assert.equal(result.available, true);
    assert.ok(["OFFICIAL", "INTERPOLATED"].includes(result.incomeSourceType));
    assert.equal(result.schedule.length, 100 - issueAge);
    scenarios++;
  }
  assert.equal(scenarios, 104);
});

test("all 104 scenarios accept ten arbitrary premiums from the supported range", () => {
  for (const issueAge of ages) for (const gender of genders) for (const mode of modes) for (const premiumUsd of premiums) {
    const result = calculateOutcome({ issueAge, gender, mode, premiumUsd });
    assert.equal(result.available, true, `${issueAge}${gender} ${mode} $${premiumUsd}`);
    assert.equal(result.schedule.length, 100 - issueAge);
    for (const row of result.schedule) {
      assert.ok(Number.isFinite(row.annualDisplayedIncome));
      assert.ok(row.annualDisplayedIncome >= 0);
      assert.ok(row.surrenderValue === null || (Number.isFinite(row.surrenderValue) && row.surrenderValue >= 0));
      assert.ok(row.deathBenefit === null || (Number.isFinite(row.deathBenefit) && row.deathBenefit >= 0));
    }
  }
});

test("annual policy years are continuous through attained age 100", () => {
  for (const issueAge of ages) for (const gender of genders) for (const mode of modes) {
    const schedule = calculateOutcome({ issueAge, gender, mode, premiumUsd: 318000 }).schedule;
    assert.deepEqual(schedule.map(row => row.policyYear), Array.from({ length: 100 - issueAge }, (_, i) => i + 1));
    assert.equal(schedule.at(-1).attainedAge, 100);
  }
});

test("income phases respect immediate and deferred timing", () => {
  for (const gender of genders) {
    const immediate = calculateOutcome({ issueAge: 60, gender, mode: "immediate", premiumUsd: 100000 }).schedule;
    assert.ok(immediate.slice(0, 7).every(row => row.annualDisplayedIncome === row.annualGuaranteedIncome && row.annualNonGuaranteedIncome === 0));
    assert.equal(immediate[7].annualDisplayedIncome, immediate[7].annualGuaranteedIncome + immediate[7].annualNonGuaranteedIncome);
    const deferred = calculateOutcome({ issueAge: 60, gender, mode: "deferred", premiumUsd: 100000 }).schedule;
    assert.ok(deferred.slice(0, 5).every(row => row.annualDisplayedIncome === 0));
    assert.ok(deferred.slice(5, 7).every(row => row.annualDisplayedIncome === row.annualGuaranteedIncome && row.annualNonGuaranteedIncome === 0));
    assert.equal(deferred[7].annualDisplayedIncome, deferred[7].annualGuaranteedIncome + deferred[7].annualNonGuaranteedIncome);
  }
});

test("premium multiplication matches canonical examples for 60M immediate and deferred", () => {
  const immediate = calculateOutcome({ issueAge: 60, gender: "M", mode: "immediate", premiumUsd: 1000000 });
  assert.equal(immediate.schedule[0].annualDisplayedIncome, 42000);
  assert.equal(immediate.schedule[7].annualDisplayedIncome, 66000);
  assert.equal(immediate.schedule[9].surrenderValue, 568400);
  assert.equal(immediate.schedule[9].deathBenefit, 1385320);
  const deferred = calculateOutcome({ issueAge: 60, gender: "M", mode: "deferred", premiumUsd: 1000000 });
  assert.equal(deferred.schedule[5].annualDisplayedIncome, 53640);
  assert.equal(deferred.schedule[7].annualDisplayedIncome, 83640);
  assert.equal(deferred.schedule[9].surrenderValue, 720080);
  assert.equal(deferred.schedule[9].deathBenefit, 1389720);
});

test("official parsed multiplier anchors preserve per-year values and provenance", () => {
  const official = officialMultiplierData.scenarios["75M_immediate"].years["10"];
  const surrender = getSurrenderMultiplier({ issueAge: 75, gender: "M", mode: "immediate", policyYear: 10 });
  const death = getDeathMultiplier({ issueAge: 75, gender: "M", mode: "immediate", policyYear: 10 });
  assert.equal(surrender.sourceType, "OFFICIAL_PARSED");
  assert.equal(death.sourceType, "OFFICIAL_PARSED");
  assert.equal(surrender.value, official.surrenderMultiplier);
  assert.equal(death.value, official.deathMultiplier);
  assert.equal(calculateOutcome({ issueAge: 75, gender: "M", mode: "immediate", premiumUsd: 25000 }).schedule[9].surrenderValue, official.surrenderTotal);
  assert.equal(calculateOutcome({ issueAge: 75, gender: "M", mode: "immediate", premiumUsd: 25000 }).schedule[9].deathBenefit, official.deathTotal);
});

test("multiplier interpolation keeps provenance and fails closed without bracketing data", () => {
  const interpolated = getSurrenderMultiplier({ issueAge: 62, gender: "F", mode: "immediate", policyYear: 10 });
  assert.equal(interpolated.sourceType, "INTERPOLATED");
  assert.deepEqual(interpolated.sourceAges, [60, 65]);
  assert.equal(getDeathMultiplier({ issueAge: 52, gender: "F", mode: "immediate", policyYear: 10 }), null);
  assert.equal(getSurrenderMultiplier({ issueAge: 55, gender: "M", mode: "deferred", policyYear: 10 }), null);
  assert.equal(getSurrenderMultiplier({ issueAge: 49, gender: "F", mode: "immediate", policyYear: 10 }), null);
});

test("unsupported premium boundaries fail closed", () => {
  for (const premiumUsd of [24999.99, 4000000.01, NaN]) {
    assert.equal(calculateOutcome({ issueAge: 60, gender: "F", mode: "immediate", premiumUsd }).available, false);
  }
});
