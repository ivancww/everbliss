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
    assert.ok(result.schedule.length > 0);
    assert.equal(result.schedule.length, result.coverage.sourceSupportedPolicyYears);
    scenarios++;
  }
  assert.equal(scenarios, 104);
});

test("all 104 scenarios accept ten arbitrary premiums from the supported range", () => {
  for (const issueAge of ages) for (const gender of genders) for (const mode of modes) for (const premiumUsd of premiums) {
    const result = calculateOutcome({ issueAge, gender, mode, premiumUsd });
    assert.equal(result.available, true, `${issueAge}${gender} ${mode} $${premiumUsd}`);
    assert.equal(result.schedule.length, result.coverage.sourceSupportedPolicyYears);
    for (const row of result.schedule) {
      assert.ok(Number.isFinite(row.annualDisplayedIncome));
      assert.ok(row.annualDisplayedIncome >= 0);
      assert.ok(row.surrenderValue === null || (Number.isFinite(row.surrenderValue) && row.surrenderValue >= 0));
      assert.ok(row.deathBenefit === null || (Number.isFinite(row.deathBenefit) && row.deathBenefit >= 0));
    }
  }
});

test("annual policy years are continuous through each source-supported endpoint", () => {
  for (const issueAge of ages) for (const gender of genders) for (const mode of modes) {
    const result = calculateOutcome({ issueAge, gender, mode, premiumUsd: 318000 });
    const { schedule, coverage } = result;
    assert.deepEqual(schedule.map(row => row.policyYear), Array.from({ length: coverage.sourceSupportedPolicyYears }, (_, i) => i + 1));
    assert.ok(schedule.every(row => row.surrenderValue !== null && row.deathBenefit !== null));
    assert.equal(schedule.at(-1).attainedAge, coverage.sourceSupportedEndpointAge);
    if (officialMultiplierData.scenarios[`${issueAge}${gender}_${mode}`]) assert.equal(coverage.sourceSupportedEndpointAge, 100);
    assert.equal(coverage.surrenderFirstMissingYear, coverage.sourceSupportedPolicyYears < 100 - issueAge ? coverage.sourceSupportedPolicyYears + 1 : null);
    assert.equal(coverage.deathFirstMissingYear, coverage.surrenderFirstMissingYear);
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
  assert.equal(immediate.schedule[9].deathBenefit, 809000);
  const deferred = calculateOutcome({ issueAge: 60, gender: "M", mode: "deferred", premiumUsd: 1000000 });
  assert.equal(deferred.schedule[5].annualDisplayedIncome, 53640);
  assert.equal(deferred.schedule[7].annualDisplayedIncome, 83640);
  assert.equal(deferred.schedule[9].surrenderValue, 720080);
  assert.equal(deferred.schedule[9].deathBenefit, 1002800);
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
  assert.equal(official.guaranteedDeathValue + official.terminalBonus, official.deathTotal);
});

test("Official multiplier anchor coverage includes ages 50, 52, 55M deferred, 57 and 67", () => {
  for (const age of [50, 52, 57, 67]) for (const gender of genders) for (const mode of modes) {
    const scenario = officialMultiplierData.scenarios[`${age}${gender}_${mode}`];
    assert.ok(scenario, `${age}${gender} ${mode} exact Official proposal`);
    assert.equal(scenario.sourceType, "OFFICIAL_PARSED");
  }
  assert.equal(officialMultiplierData.scenarios["55M_deferred"].sourceType, "OFFICIAL_PARSED");
  assert.equal(Object.keys(officialMultiplierData.scenarios).length, 36);
});

test("all 104 supported scenarios resolve every multiplier year in the Official bracket overlap", () => {
  let scenarios = 0;
  const missing = [];
  for (const issueAge of ages) for (const gender of genders) for (const mode of modes) {
    const result = calculateOutcome({ issueAge, gender, mode, premiumUsd: 25000 });
    assert.equal(result.available, true);
    assert.equal(result.schedule.length, result.coverage.sourceSupportedPolicyYears);
    for (const row of result.schedule) {
      if (row.surrenderValue === null) missing.push(`${issueAge}${gender}/${mode}/surrender/year${row.policyYear}`);
      if (row.deathBenefit === null) missing.push(`${issueAge}${gender}/${mode}/death/year${row.policyYear}`);
      assert.ok(Number.isFinite(row.surrenderMultiplier), `${issueAge}${gender}/${mode} surrender year ${row.policyYear}`);
      assert.ok(Number.isFinite(row.deathMultiplier), `${issueAge}${gender}/${mode} death year ${row.policyYear}`);
    }
    assert.equal(result.coverage.surrender, true, `${issueAge}${gender}/${mode} surrender coverage`);
    assert.equal(result.coverage.death, true, `${issueAge}${gender}/${mode} death coverage`);
    const firstUnsupportedTailYear = result.coverage.sourceSupportedPolicyYears < 100 - issueAge
      ? result.coverage.sourceSupportedPolicyYears + 1
      : null;
    assert.equal(result.coverage.surrenderFirstMissingYear, firstUnsupportedTailYear);
    assert.equal(result.coverage.deathFirstMissingYear, firstUnsupportedTailYear);
    scenarios++;
  }
  assert.equal(scenarios, 104);
  assert.deepEqual(missing, []);
});

test("multiplier interpolation keeps provenance and fails closed outside the source range", () => {
  const interpolated = getSurrenderMultiplier({ issueAge: 62, gender: "F", mode: "immediate", policyYear: 10 });
  assert.equal(interpolated.sourceType, "INTERPOLATED");
  assert.deepEqual(interpolated.sourceAges, [60, 65]);
  assert.equal(getDeathMultiplier({ issueAge: 52, gender: "F", mode: "immediate", policyYear: 10 }).sourceType, "OFFICIAL_PARSED");
  assert.equal(getSurrenderMultiplier({ issueAge: 55, gender: "M", mode: "deferred", policyYear: 10 }).sourceType, "OFFICIAL_PARSED");
  assert.equal(getSurrenderMultiplier({ issueAge: 50, gender: "F", mode: "immediate", policyYear: 10 }).sourceType, "OFFICIAL_PARSED");
  assert.equal(getSurrenderMultiplier({ issueAge: 75, gender: "M", mode: "immediate", policyYear: 10 }).sourceType, "OFFICIAL_PARSED");
  assert.equal(getSurrenderMultiplier({ issueAge: 49, gender: "F", mode: "immediate", policyYear: 10 }), null);
});

test("unsupported premium boundaries fail closed", () => {
  for (const premiumUsd of [24999.99, 4000000.01, NaN]) {
    assert.equal(calculateOutcome({ issueAge: 60, gender: "F", mode: "immediate", premiumUsd }).available, false);
  }
});


test("withdrawal-scenario parsed death components reconcile across all official rows", () => {
  const exceptions = [];
  let rows = 0;
  let exact = 0;
  let maxAbsError = 0;
  for (const [scenarioKey, scenario] of Object.entries(officialMultiplierData.scenarios)) {
    assert.match(scenario.deathSourceTable, /^支取每月入息（詳細說明）/);
    for (const [policyYear, row] of Object.entries(scenario.years)) {
      rows++;
      const error = row.deathTotal - (row.guaranteedDeathValue + row.terminalBonus);
      assert.equal(error, row.deathComponentRoundingError, `${scenarioKey} year ${policyYear}`);
      maxAbsError = Math.max(maxAbsError, Math.abs(error));
      if (error === 0) exact++;
      else exceptions.push([scenarioKey, Number(policyYear), error]);
      assert.equal(row.deathMultiplier, row.deathTotal / 25000);
    }
  }
  assert.equal(rows, 1396);
  assert.equal(exact, 1394);
  assert.deepEqual(exceptions, [["75F_deferred", 22, -1], ["75F_deferred", 23, -1]]);
  assert.equal(maxAbsError, 1);
});

test("newly parsed withdrawal surrender components reconcile to their Official totals", () => {
  let rows = 0;
  for (const scenario of Object.values(officialMultiplierData.scenarios)) {
    for (const [year, row] of Object.entries(scenario.years)) {
      if (!Number.isFinite(row.guaranteedCashValue) || !Number.isFinite(row.surrenderTerminalBonus)) continue;
      assert.equal(row.surrenderTotal - (row.guaranteedCashValue + row.surrenderTerminalBonus), row.surrenderComponentRoundingError, `${scenario.sourceFile} year ${year}`);
      assert.equal(row.surrenderMultiplier, row.surrenderTotal / 25000);
      rows++;
    }
  }
  assert.equal(rows, 741);
});

test("withdrawal death regressions match the Official proposal totals", () => {
  const immediate60m = officialMultiplierData.scenarios["60M_immediate"].years["10"];
  assert.equal(immediate60m.guaranteedDeathValue, 15750);
  assert.equal(immediate60m.terminalBonus, 4475);
  assert.equal(immediate60m.deathTotal, 20225);
  assert.equal(calculateOutcome({ issueAge: 60, gender: "M", mode: "immediate", premiumUsd: 1000000 }).schedule[9].deathBenefit, 809000);

  const immediate75m = officialMultiplierData.scenarios["75M_immediate"].years["10"];
  assert.equal(immediate75m.guaranteedDeathValue, 12750);
  assert.equal(immediate75m.terminalBonus, 3150);
  assert.equal(immediate75m.deathTotal, 15900);
  assert.equal(calculateOutcome({ issueAge: 75, gender: "M", mode: "immediate", premiumUsd: 25000 }).schedule[9].deathBenefit, 15900);
});
