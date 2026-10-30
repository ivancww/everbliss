import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assessment, assessLimits, parseAssessmentAmount, formatAssessmentInput, deleteAcrossSeparator, allowanceIllustration } from '../src/app/oala-assessment.js';
import { resetNavigationForAvaEntry } from '../src/app/entry-surfaces.js';
import { calculateOutcome } from '../src/calculations/full-outcomes.js';

const base={household:'couple',assets:'800000',income:'0',premium:'500000',issueAge:60,gender:'F',mode:'immediate',policyYear:8,fx:7.8};
test('conditional assessment uses actual scenario and preserves limits',()=>{
 const r=assessment(base), row=calculateOutcome({issueAge:60,gender:'F',mode:'immediate',premiumUsd:500000/7.8}).schedule[7];
 assert.equal(r.before.assetDifference,-170000);assert.equal(r.after.assets,300000);assert.equal(r.after.assetDifference,330000);assert.equal(r.outcome.monthly,Math.round(row.annualDisplayedIncome/12*7.8));assert.equal(r.provisional,true);
 const year7=assessment({...base,policyYear:7});assert.ok(year7.outcome.monthly<r.outcome.monthly);
 const deferred=assessment({...base,mode:'deferred',policyYear:5});assert.equal(deferred.outcome.monthly,0);
});
test('household, equality and separate breach reasons use correct limits',()=>{
 assert.equal(assessLimits(415000,10900,'single').within,true);assert.equal(assessLimits(630000,16680,'couple').within,true);
 for(const [a,i,ab,ib] of [[415001,0,true,false],[0,10901,false,true],[415001,10901,true,true],[0,0,false,false]]){const r=assessLimits(a,i,'single');assert.equal(r.assetDifference<0,ab);assert.equal(r.incomeDifference<0,ib);}
});
test('invalid and excessive inputs never fabricate a result',()=>{
 for(const v of ['',null,'-1','abc','1e9','999999999999999999999'])assert.equal(parseAssessmentAmount(v),null);
 assert.equal(parseAssessmentAmount('0'),0);assert.equal(parseAssessmentAmount('500,000'),500000);
 assert.equal(assessment({...base,premium:'900000'}).reason,'PREMIUM_EXCEEDS_ASSETS');
 assert.equal(assessment({...base,assets:'',premium:'500000'}).after,null);
});
test('official notes and update contract remain explicit',()=>{
 const s=fs.readFileSync('src/app/main.js','utf8');assert.match(s,/function oalaNotes\(\)/);assert.match(s,/<details><summary>\$\{title\}/);assert.doesNotMatch(s,/<details open/);assert.match(s,/最終申請資格及批核結果以社署決定為準/);assert.match(s,/id="oala-years"/);assert.match(s,/updateOalaResults\(\)/);
 assert.match(fs.readFileSync('src/pwa/sw-template.js','utf8'),/oala-assessment\.js/);
});

test('canonical new AVA entry resets navigation but preserves customer data',()=>{
 const saved={page:'summary',journeyStep:'summary',issueAge:65,oala:{currentAssets:'800000'},selectedPolicyYear:8};
 const reset=resetNavigationForAvaEntry(saved,'?avaEntry=frontend');assert.equal(reset.page,'home');assert.equal(reset.journeyStep,'concern');assert.equal(reset.issueAge,65);assert.equal(reset.oala.currentAssets,'800000');assert.equal(reset.selectedPolicyYear,8);
 assert.strictEqual(resetNavigationForAvaEntry(saved,''),saved);assert.strictEqual(resetNavigationForAvaEntry(saved,'?avaEntry=bogus'),saved);
});

test('rapid queued state saves retain snapshots in order without rolling back live state',async()=>{
 const vm=await import('node:vm');const s=fs.readFileSync('src/app/main.js','utf8');const fn=s.slice(s.indexOf('let saveQueue ='),s.indexOf('function setPage('));
 const state={oala:{currentAssets:'1'}};const snapshots=[];const ctx={state,structuredClone,Promise,saveAppState:async snapshot=>{snapshots.push(snapshot.oala.currentAssets);await new Promise(r=>setTimeout(r,5));return snapshot;}};
 await vm.runInNewContext(fn+`; (async()=>{const a=persist();state.oala.currentAssets='12';const b=persist();await Promise.all([a,b]);})()`,ctx);
 assert.deepEqual(snapshots,['1','12']);assert.equal(state.oala.currentAssets,'12');
});

test('live amount formatting preserves numeric values and caret across edits and paste',()=>{
 assert.deepEqual(formatAssessmentInput('500000',6),{value:'500,000',caret:7,number:500000});
 assert.deepEqual(formatAssessmentInput('1000000',7),{value:'1,000,000',caret:9,number:1000000});
 assert.deepEqual(formatAssessmentInput('12,345',2),{value:'12,345',caret:2,number:12345});
 assert.deepEqual(formatAssessmentInput('',0),{value:'',caret:0,number:null});
 assert.equal(formatAssessmentInput('0',1).number,0);
 assert.equal(formatAssessmentInput('12a',3).number,null);
 assert.equal(deleteAcrossSeparator('1,000',2,'deleteContentBackward').value,'000');
 assert.equal(deleteAcrossSeparator('1,000',1,'deleteContentForward').value,'100');
});
test('conditional income illustration counts one recipient only and excludes failed assessments',()=>{
 const r=assessment(base); const v=allowanceIllustration(r);
 assert.equal(v.recipients,1);assert.equal(v.allowance,4345);assert.equal(v.total,r.outcome.monthly+4345);
 assert.equal(allowanceIllustration(assessment({...base,income:16680})),null);
 assert.equal(allowanceIllustration(assessment({...base,assets:2000000})),null);
 assert.equal(allowanceIllustration(assessment({...base,premium:'900000'})),null);
 assert.deepEqual(allowanceIllustration({after:{within:true},outcome:{monthly:1655}}),{annuity:1655,allowance:4345,total:6000,recipients:1});
});
test('four independent official topics precede limits and comparison',async()=>{
 const vm=await import('node:vm');const s=fs.readFileSync('src/app/main.js','utf8');
 const notes=s.slice(s.indexOf('function oalaNotes()'),s.indexOf('function oalaField('));
 const markup=vm.runInNewContext(notes+';oalaNotes()',{});
 assert.equal((markup.match(/<details>/g)||[]).length,4);assert.doesNotMatch(markup,/<details open|name=/);
 for(const label of ['每月入息審查','資產審查','年金保費及年金收入','夫婦及申請資格'])assert.ok(markup.includes(label));
 assert.match(markup,/https:\/\/www\.swd\.gov\.hk\/oala\//);
 const page=s.slice(s.indexOf('function renderOala(){'),s.indexOf('function renderHiddenComparison'));
 assert.ok(page.indexOf('${oalaNotes()}')<page.indexOf('社署財務限額'));assert.ok(page.indexOf('社署財務限額')<page.indexOf('目前財務狀況'));assert.ok(page.indexOf('目前財務狀況')<page.indexOf('id="oala-results"'));
 assert.equal((page.match(/oalaNotes\(\)/g)||[]).length,1);
});
