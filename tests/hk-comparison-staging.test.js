import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/app/main.js',import.meta.url),'utf8');
const rates=readFileSync(new URL('../docs/hk-annuity/HK_Annuity_Rates.csv',import.meta.url),'utf8').trim().split(/\r?\n/);
test('reference-only rates cover ages and sexes without being presented as current',()=>{assert.equal(rates.length,53);assert.ok(rates.slice(1).every(x=>x.includes('REFERENCE_ONLY_NOT_CURRENT_VERIFIED')));});
test('comparison reuses selected outcome and never fabricates HKMC results',()=>{const s=source.slice(source.indexOf('function renderAnnuityComparison'),source.indexOf('function renderConcept'));assert.match(s,/cumulativeScheduledIncome\(outcome.schedule,year\)/);assert.match(s,/暫無官方數據/);assert.doesNotMatch(s,/<input/);assert.match(s,/data-comparison-tab/);assert.match(s,/comparisonOpen\?"open"/);});
test('result no longer renders yellow disclosure',()=>{const s=source.slice(source.indexOf('function renderResult'),source.indexOf('function renderAnnuityComparison'));assert.doesNotMatch(s,/class="disclosure"/);});
