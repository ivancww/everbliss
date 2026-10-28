import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeUserPresentationConfig,resolveUserPresentation} from '../src/data/presentation/user-config.js';

test('legacy feature settings migrate by semantic identity',()=>{
 const legacy={schema:'everbliss-user-config-v1',schemaVersion:1,values:{'features.F03.title':'death','features.F04.title':'service custom','features.F04.visible':true,'home.heroTitle':'other'}};
 const n=normalizeUserPresentationConfig(legacy);assert.equal(n.schemaVersion,3);assert.equal(n.values['features.F04.title'],'service custom');assert.equal(n.values['home.heroTitle'],'other');assert.ok(!('features.F03.title' in n.values));
 const old=normalizeUserPresentationConfig({schema:'everbliss-user-config-v1',schemaVersion:2,values:{'features.F03.title':'增值服務','features.F03.visible':false,'features.F02.title':'靈活／照顧安排','features.F02.visible':false}});assert.equal(resolveUserPresentation(old)['features.F04.title'],'樂齡健康服務');assert.equal(old.values['features.F04.visible'],false);assert.equal(old.values['features.F03.visible'],false);assert.equal(resolveUserPresentation(old)['features.F02.title'],'指定收款人');
 const fresh=normalizeUserPresentationConfig({schema:'everbliss-user-config-v1',schemaVersion:3,values:{'features.F03.title':'advance custom'}});assert.equal(fresh.values['features.F03.title'],'advance custom');assert.deepEqual(normalizeUserPresentationConfig(fresh),fresh);
});
test('OALA desktop and mobile layout and rendering maintain dynamic boundaries',()=>{
 const s=fs.readFileSync('src/app/main.js','utf8'),css=fs.readFileSync('src/ui/styles.css','utf8');
 assert.match(css,/\.oala-topics\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);assert.match(css,/@media\(max-width:700px\)\{\.oala-topics,\.oala-input-columns,\.oala-comparison\{grid-template-columns:1fr/);
 for(const name of ['oalaData.single','oalaData.couple','oalaData.monthlyBenefit','allowanceIllustration(r)','renderOalaSelected()','renderOalaYears()','財務限額比較'])assert.ok(s.includes(name));
 const notes=s.slice(s.indexOf('function oalaNotes()'),s.indexOf('function oalaField('));assert.ok(notes.indexOf('每月入息審查')<notes.indexOf('年金保費及年金收入'));assert.ok(notes.indexOf('年金保費及年金收入')<notes.indexOf('資產審查'));assert.doesNotMatch(notes,/<details open/);
});
