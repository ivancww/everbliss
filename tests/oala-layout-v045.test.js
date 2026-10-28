import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeUserPresentationConfig,resolveUserPresentation} from '../src/data/presentation/user-config.js';

test('legacy F04 service settings migrate, legacy death F03 never contaminates',()=>{
 const legacy={schema:'everbliss-user-config-v1',schemaVersion:1,values:{'features.F03.title':'death','features.F03.visible':false,'features.F04.title':'service custom','features.F04.visible':true,'home.heroTitle':'other'}};
 const n=normalizeUserPresentationConfig(legacy);assert.equal(n.schemaVersion,2);assert.equal(n.values['features.F03.title'],'service custom');assert.equal(n.values['features.F03.visible'],true);assert.equal(n.values['home.heroTitle'],'other');assert.ok(!('features.F04.title' in n.values));
 const oldOnly=resolveUserPresentation({schema:'everbliss-user-config-v1',schemaVersion:1,values:{'features.F03.title':'death'}});assert.equal(oldOnly['features.F03.title'],'增值服務');
 const fresh=normalizeUserPresentationConfig({schema:'everbliss-user-config-v1',schemaVersion:2,values:{'features.F03.title':'new service'}});assert.equal(fresh.values['features.F03.title'],'new service');assert.deepEqual(normalizeUserPresentationConfig(fresh),fresh);
});
test('OALA desktop and mobile layout and rendering maintain dynamic boundaries',()=>{
 const s=fs.readFileSync('src/app/main.js','utf8'),css=fs.readFileSync('src/ui/styles.css','utf8');
 assert.match(css,/\.oala-topics\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);assert.match(css,/@media\(max-width:700px\)\{\.oala-topics,\.oala-input-columns,\.oala-comparison\{grid-template-columns:1fr/);
 for(const name of ['oalaData.single','oalaData.couple','oalaData.monthlyBenefit','allowanceIllustration(r)','renderOalaSelected()','renderOalaYears()','財務限額比較'])assert.ok(s.includes(name));
 const notes=s.slice(s.indexOf('function oalaNotes()'),s.indexOf('function oalaField('));assert.ok(notes.indexOf('每月入息審查')<notes.indexOf('年金保費及年金收入'));assert.ok(notes.indexOf('年金保費及年金收入')<notes.indexOf('資產審查'));assert.doesNotMatch(notes,/<details open/);
});
