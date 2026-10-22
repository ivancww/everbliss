import test from "node:test";
import assert from "node:assert/strict";
import { establishAdminSession, validateAdminLaunchMessage } from "../src/admin/admin-auth.js";
import { addAdminDraftChange, createAdminDraft, publishAdminDraft, validateAdminDraft } from "../src/admin/admin-workflow.js";

const opener = {};
const ticket = "one-time-ticket";
const nonce = "launch-nonce";
const event = { source: opener, origin: "https://ivancww.github.io", data: { type: "ava-admin-session-response", contract: "ava-admin-session-v1", appId: "everbliss", launchTicket: ticket, launchNonce: nonce, browserProof: "one-time-browser-proof-token", expiresAt: new Date(Date.now() + 60_000).toISOString() } };

test("admin query routing alone never grants authorization", async () => {
  const result = await establishAdminSession({ location: { search: "?avaEntry=admin" }, opener, exchangeProof: async () => ({ success: true, adminAuthorized: true }) });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, "ADMIN_LAUNCH_PROOF_REQUIRED");
});

test("Admin launch proof validates opener, origin, app ID, nonce and expiry", () => {
  assert.equal(validateAdminLaunchMessage({ event, opener, launchTicket: ticket, launchNonce: nonce }), true);
  assert.equal(validateAdminLaunchMessage({ event: { ...event, source: {} }, opener, launchTicket: ticket, launchNonce: nonce }), false);
  assert.equal(validateAdminLaunchMessage({ event: { ...event, origin: "https://evil.invalid" }, opener, launchTicket: ticket, launchNonce: nonce }), false);
  assert.equal(validateAdminLaunchMessage({ event, opener, launchTicket: ticket, launchNonce: "replay" }), false);
});

test("valid mocked Platform proof only opens Admin after successful server exchange", async () => {
  const session = await establishAdminSession({
    location: { search: `?avaEntry=admin&avaAdminLaunch=${ticket}&avaAdminLaunchNonce=${nonce}` },
    opener, postMessage: () => {}, waitForProof: async () => event,
    exchangeProof: async proof => ({ success: proof.contract === "ava-admin-session-v1", appId: "everbliss", adminAuthorized: true, expiresAt: new Date(Date.now() + 60_000).toISOString(), session: "ephemeral-server-session" })
  });
  assert.equal(session.authorized, true);
});

test("mock proof without server approval is denied", async () => {
  const session = await establishAdminSession({ location: { search: `?avaAdminLaunch=${ticket}&avaAdminLaunchNonce=${nonce}` }, opener, waitForProof: async () => event, exchangeProof: async () => ({ success: false }) });
  assert.equal(session.authorized, false);
  assert.equal(session.reason, "SERVER_ADMIN_EXCHANGE_DENIED");
});

test("Admin draft validates allowlisted domains and blocks protected calculation fields", () => {
  let draft = createAdminDraft({ datasetVersion: "dataset-1" });
  draft = addAdminDraftChange(draft, { domain: "product", recordId: "min_issue_age", field: "value", oldValue: "40", newValue: "50" });
  assert.equal(validateAdminDraft(draft).valid, true);
  assert.throws(() => addAdminDraftChange(draft, { domain: "income", recordId: "60|M|immediate", field: "guaranteed_rate", newValue: 0.09 }), /source proposal is required/);
  const sourced = addAdminDraftChange(draft, { domain: "income", recordId: "60|M|immediate", field: "guaranteed_rate", newValue: 0.043, sourceFile: "60yrs 即期 m.pdf", scenarioId: "60|M|immediate" });
  assert.equal(validateAdminDraft(sourced).valid, true);
  assert.throws(() => addAdminDraftChange(draft, { domain: "unknown", recordId: "x", field: "label", newValue: "x" }), /Unknown Admin domain/);
});

test("Admin publish requires authorized session and returns safe conflict from connector", async () => {
  const draft = addAdminDraftChange(createAdminDraft({ datasetVersion: "dataset-1" }), { domain: "product", recordId: "min_issue_age", field: "value", oldValue: "40", newValue: "50" });
  assert.equal((await publishAdminDraft({ draft, session: null, connector: async () => ({ status: "PUBLISHED" }) })).status, "DENIED");
  const result = await publishAdminDraft({ draft, session: { authorized: true, expiresAt: new Date(Date.now() + 60_000).toISOString() }, connector: async payload => ({ status: payload.expected_dataset_version === "dataset-1" ? "CONFLICT" : "PUBLISHED" }) });
  assert.equal(result.status, "CONFLICT");
});
