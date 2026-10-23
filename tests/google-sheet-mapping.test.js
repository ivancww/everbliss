import test from "node:test";
import assert from "node:assert/strict";
import mapping from "../src/data/official/google-sheet-display-mapping.json" with { type: "json" };

test("Chinese Sheet presentation resolves every English canonical tab and field", () => {
  const displayTabs = Object.values(mapping.tabs).map(({ displayName }) => displayName);
  assert.equal(displayTabs.length, 7);
  assert.equal(new Set(displayTabs).size, 7);
  for (const [canonicalTab, tab] of Object.entries(mapping.tabs)) {
    assert.match(canonicalTab, /^[A-Z][A-Za-z]+$/);
    assert.ok(tab.displayName);
    assert.ok(tab.fields.length > 0);
    for (const field of tab.fields) {
      assert.match(field, /^[a-z][a-z0-9_]*$/);
      assert.ok(mapping.fieldLabels[field], `missing Chinese display label for ${field}`);
    }
  }
});

test("canonical enum values stay English while display labels are Chinese", () => {
  assert.deepEqual(mapping.valueLabels.gender, { M: "男", F: "女" });
  assert.deepEqual(mapping.valueLabels.mode, { immediate: "即期", deferred: "5年延期" });
  assert.equal(mapping.valueLabels.source_type.OFFICIAL, "官方數據");
  assert.equal(mapping.valueLabels.source_type.OFFICIAL_PARSED, "官方數據");
  assert.equal(mapping.configKeyLabels.min_issue_age, "最小投保年齡");
});
