import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('official feature images exist in shell and retain the product boundaries',()=>{
 const source=fs.readFileSync('src/app/main.js','utf8'),sw=fs.readFileSync('src/pwa/sw-template.js','utf8');
 for(const name of ['monthly-income','case-illustration','advance-timeline','healthy-ageing','service-structure']){assert.ok(fs.statSync(`assets/aia/${name}.webp`).size>0);assert.ok(source.includes(`assets/aia/${name}.webp`));assert.ok(sw.includes(`assets/aia/${name}.webp`));}
 for(const phrase of ['額外20次','合共25次','保證每月收入的50%','並非個人試算','並非額外獎賞','非保單合約利益'])assert.ok(source.includes(phrase));
 assert.ok(source.includes('formatOutcomeAmount(calc.healthExtraMonthly,getDisplayFxRate())'));
});
