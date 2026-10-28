import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../gas/Code.gs',import.meta.url),'utf8');
// Read-only snapshot of the owner's Sheet, 2026-10-28. Percent values are numeric points.
const snapshot=JSON.parse(fs.readFileSync(new URL('./fixtures/canonical-sheet-snapshot.json',import.meta.url),'utf8'));
function harness(){
 const rows=structuredClone(snapshot), sheets={ 'AIA優悅年金_官方保證收入率':rows.income,'香港年金_領取金額及百分比':rows.hk};
 const ctx={console,Date,Math,JSON,Object,Array,String,Number,RegExp,Error,Set,Map,PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'id'})},SpreadsheetApp:{openById:()=>({getSheetByName:name=>sheets[name]?{getDataRange:()=>({getValues:()=>sheets[name]})}:null})},ContentService:{createTextOutput:x=>({setMimeType:()=>x}),MimeType:{JSON:'json'}}};
 vm.createContext(ctx);vm.runInContext(source,ctx);return {ctx,rows};
}
test('canonical sheet parses 144 combinations; all 104 supported rows reconcile and retain units',()=>{
 const {ctx}=harness(),r=ctx.readCanonicalIncomeRates_();assert.equal(r.length,104);
 for(const x of r){assert.ok(Math.abs(x.guaranteedRate+x.nonGuaranteedRateFromYear8-x.totalRateFromYear8)<1e-12);}
 for(const age of [50,51,52,55,57,60,62,65,67,68,70,73,75]) for(const gender of ['M','F'])for(const mode of ['immediate','deferred'])assert.ok(r.find(x=>x.age===age&&x.gender===gender&&x.mode===mode));
 const x=r.find(x=>x.age===60&&x.gender==='M'&&x.mode==='immediate');assert.ok(Math.abs(x.totalRateFromYear8-.066)<1e-12);assert.ok(Math.abs(x.guaranteedRate-.042)<1e-12);
 assert.ok(!r.some(x=>x.age<50||x.age>75));
});
test('canonical parsing rejects invalid modes, missing rates, inconsistent sums and interpolation',()=>{
 for(const mutate of [r=>r[43][2]='invalid',r=>r[43][5]='',r=>r[43][6]=99,r=>r[47][5]+=1,r=>r.pop()]){const {ctx,rows}=harness();mutate(rows.income);assert.throws(()=>ctx.readCanonicalIncomeRates_());}
});
test('public and Admin income read paths use canonical data; legacy income writes remain blocked',()=>{
 const {ctx}=harness();ctx.ensurePublished_=()=>{};const list=ctx.publicAction_('getIncomeRates').incomeRates;assert.equal(list.length,104);assert.equal(list.find(x=>x.issue_age===60&&x.gender==='M'&&x.mode==='immediate').total_rate_from_year8,.066);
 ctx.requireAdmin_=()=>({expiresAt:'later'});ctx.readProductConfig_=()=>({});ctx.readSurrender_=()=>[];ctx.readDeath_=()=>[];ctx.readSources_=()=>[];ctx.readDatasetMeta_=()=>({});ctx.readAuditLog_=()=>[];
 const admin=ctx.adminGetDataset_({});assert.equal(admin.dataset.incomeRates.length,104);assert.throws(()=>ctx.validateChanges_([{domain:'income',recordId:'income-60-M-immediate',field:'total_rate_from_year8',newValue:.07}]),/INCOME_CANONICAL_SHEET_EDIT_REQUIRED/);
});
test('published data requires matching dataset version and canonical fingerprint',()=>{
 const {ctx}=harness();ctx.readDatasetMeta_=()=>({status:'PUBLISHED',dataset_version:'v1',published_version:'v1',source_sha:'abc'});ctx.computeSha_=()=> 'abc';assert.doesNotThrow(()=>ctx.ensurePublished_());ctx.computeSha_=()=> 'different';assert.throws(()=>ctx.ensurePublished_(),/FINGERPRINT_MISMATCH/);ctx.readDatasetMeta_=()=>({status:'PUBLISHED',dataset_version:'v2',published_version:'v1'});assert.throws(()=>ctx.ensurePublished_(),/NOT_PUBLISHED/);
});
test('HKMC reference sheet has 52 rows with exact yearly payout percentages',()=>{
 const {ctx}=harness(),result=ctx.getHKAnnuityRates_();assert.equal(result.count,52);assert.equal(result.status,'REFERENCE_ONLY_NOT_CURRENT_VERIFIED');for(const r of result.rates)assert.ok(Math.abs(r.annualPayoutPercent-r.monthlyPaymentHkd*12/10000)<1e-9);assert.equal(result.rates.find(r=>r.issueAge===60&&r.gender==='M').monthlyPaymentHkd,5100);
});
test('unauthorized requests cannot access admin data or publish changes',()=>{
 const {ctx}=harness();ctx.CacheService={getScriptCache:()=>({get:()=>null})};assert.throws(()=>ctx.adminGetDataset_({session:'bad'}),/ADMIN_SESSION_REQUIRED/);assert.throws(()=>ctx.requireAdmin_({session:'bad'},'official-write'),/ADMIN_SESSION_REQUIRED/);
});
test('HKMC Sheet monthly examples agree with all 52 official reference table records',()=>{
 const {ctx}=harness(),rates=ctx.getHKAnnuityRates_().rates;
 const lines=fs.readFileSync(new URL('../docs/hk-annuity/HK_Annuity_Rates.csv',import.meta.url),'utf8').trim().split(/\r?\n/).slice(1);
 assert.equal(lines.length,52);for(const line of lines){const [age,gender,premium,monthly]=line.split(',');const item=rates.find(r=>r.issueAge===Number(age)&&r.gender===gender);assert.ok(item);assert.equal(item.referencePremiumHkd,Number(premium));assert.equal(item.monthlyPaymentHkd,Number(monthly));}
});
