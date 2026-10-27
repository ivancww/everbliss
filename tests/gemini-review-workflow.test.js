import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const workflow=fs.readFileSync('.github/workflows/gemini-pr-review.yml','utf8');
const lock=JSON.parse(fs.readFileSync('tools/gemini-review/package-lock.json','utf8'));

test('credential job uses trusted rules and does not execute reviewed PR code',()=>{
  assert.match(workflow,/pull_request_target:/);
  assert.match(workflow,/pull_request\.number == 7/);
  assert.match(workflow,/cat docs\/review\/AVA-GEMINI-SHARED\.md GEMINI\.md/);
  assert.doesNotMatch(workflow,/git show "\$HEAD:(?:GEMINI\.md|docs\/review\/AVA-GEMINI-SHARED\.md)"/);
  assert.match(workflow,/tools.*core.*__no_tools__/);
  assert.match(workflow,/npm ci --prefix tools\/gemini-review --ignore-scripts --omit=optional/);
  assert.doesNotMatch(workflow,/id-token:\s*write|--yolo/);
  assert.equal(lock.packages['node_modules/@google/gemini-cli'].version,'0.65.0');
});
test('review is bounded, bound to exact head and prevents duplicate reports',()=>{
  assert.match(workflow,/ad3c360f27bbd0aabd94264122c30996469e9865/);
  assert.match(workflow,/\[ "\$CURRENT" = "\$HEAD" \]/);
  assert.match(workflow,/ava-gemini-review:\$HEAD/);
  assert.match(workflow,/180000/);assert.match(workflow,/350000/);
  assert.match(workflow,/PR HEAD changed during review/);
});
