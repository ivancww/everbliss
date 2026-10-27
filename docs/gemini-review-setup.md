# Gemini Independent PR Review — API-key pilot

This PR adds a review workflow separate from the existing Pages deployment. The owner reports that an API key already exists; the workflow expects the Actions repository secret `GEMINI_API_KEY` and passes it only to the Gemini execution step. Do not print, copy or commit secret values. A real Actions run is required to establish whether the secret is available and accepted.

The test job runs the checked-out PR without Google credentials. The review job uses pinned Actions and the locked Gemini CLI, installing without credentials or lifecycle scripts. It loads `GEMINI.md` and the shared AVA rules from the trusted workflow checkout, never from the target PR. The target's diff and selected source files are bounded untrusted data; target code is never executed in the credential-bearing job. CLI tools and extensions are disabled, and the report is advisory.

Before PR #7 is merged, its owner-controlled branch can run the restricted bootstrap for PR #8 at the exact reviewed SHA. After owner approval and merge, `pull_request_target` uses the trusted main-branch workflow for same-repository PRs. The workflow rejects stale HEADs, unsupported forks, oversized input and changes to excluded Official data or GAS. A SHA marker prevents duplicate comments. The review publishes only if the PR HEAD remains unchanged.

A successful API request and advisory review do not prove code correctness or authorize a merge. Verify model identity, report evidence and findings, then repair and independently re-review as necessary. Automated Codex repair, three-cycle orchestration and owner notifications are not implemented. The API-key pilot requires no Vertex or WIF configuration.
