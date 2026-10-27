import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('official feature images exist in shell and retain the product boundaries',()=>{
 const source=fs.readFileSync('src/app/main.js','utf8'),sw=fs.readFileSync('src/pwa/sw-template.js','utf8');
 for(const name of ['monthly-income','advance-timeline','service-structure']){assert.ok(fs.statSync(`assets/aia/${name}.webp`).size>0);assert.ok(source.includes(`assets/aia/${name}.webp`));assert.ok(sw.includes(`assets/aia/${name}.webp`));}
 for(const phrase of ['額外20次','合共25次','保證每月收入的50%','並非額外獎賞','非保單合約利益'])assert.ok(source.includes(phrase));
 assert.ok(source.includes('formatOutcomeAmount(calc.healthExtraMonthly,getDisplayFxRate())'));
});

test('each feature detail owns only its intended image assets',()=>{
 const s=fs.readFileSync('src/app/main.js','utf8');
 const between=(a,b)=>s.slice(s.indexOf(`function ${a}(`),s.indexOf(`function ${b}(`));
 const health=between('renderHealth','renderCare'),care=between('renderCare','renderDeath'),death=between('renderDeath','renderServices'),services=between('renderServices','oalaNotes');
 for(const name of ['monthly-income'])assert.ok(health.includes(name+'.webp'));
 assert.ok(care.includes('advance-timeline.webp'));
 for(const name of ['service-structure'])assert.ok(services.includes(name+'.webp'));
 assert.doesNotMatch(death,/assets\/aia/);
 for(const part of [health,care,services])assert.match(part,/loading="lazy"/);
});

test('feature overview renders three cards even for saved F03 settings in User edit mode',async()=>{
 const vm=await import('node:vm');const s=fs.readFileSync('src/app/main.js','utf8');const fn=s.slice(s.indexOf('function renderFeatureCards('),s.indexOf('function renderFeatures('));
 for(const edit of [false,true]){const config={};for(const code of ['F01','F02','F03','F04']){config[`features.${code}.visible`]=true;config[`features.${code}.order`]=1;config[`features.${code}.title`]=code;config[`features.${code}.description`]=code;}
 const html=vm.runInNewContext(fn+';renderFeatureCards(config)',{config,userEdit:edit,userEditing:edit,previewMode:false,present:()=>config,presentationText:(_,v)=>v});assert.equal((html.match(/class="feature-card"/g)||[]).length,3);assert.doesNotMatch(html,/F03|feature-death/);assert.match(html,/F04/);}
 const config=await import('../src/data/presentation/user-config.js');assert.ok(!config.PRESENTATION_FIELDS.some(x=>x.path.startsWith('features.F03.')));
});

test('removed feature imagery and case details are absent from pages and cache',()=>{
 const s=fs.readFileSync('src/app/main.js','utf8'),sw=fs.readFileSync('src/pwa/sw-template.js','utf8');const health=s.slice(s.indexOf('function renderHealth()'),s.indexOf('function renderCare()'));const services=s.slice(s.indexOf('function renderServices()'),s.indexOf('function oalaNotes()'));
 assert.doesNotMatch(health,/Sophia|Sean|case-illustration|class="disclosure"/);assert.match(health,/healthExtraMonthly/);assert.match(health,/保證每月收入的50%/);assert.doesNotMatch(services,/healthy-ageing/);assert.match(services,/service-structure/);
 for(const name of ['case-illustration','healthy-ageing']){assert.ok(!fs.existsSync(`assets/aia/${name}.webp`));assert.ok(!sw.includes(name));}
 const care=s.slice(s.indexOf('function renderCare()'),s.indexOf('function renderDeath()'));assert.match(care,/第5個保單週年日/);assert.match(care,/未償還欠款/);assert.match(care,/aia\.com\.hk/);assert.doesNotMatch(care,/18歲/);
});
