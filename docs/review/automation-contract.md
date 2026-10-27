# AVA Dual-AI end-to-end automation contract (implementation gate)

## Intended sequence
1. ChatGPT/Codex opens a PR in an independent app.
2. GitHub Actions runs tests and Gemini independent audit with the shared AVA rules.
3. Gemini publishes a structured finding report tied to exact head SHA.
4. If NEEDS_FIX, a **separate authenticated Codex worker** receives the report, checks the PR SHA is unchanged, edits only the PR branch, runs tests and pushes a new commit.
5. The new commit triggers Gemini audit again. Stop after at most three repair attempts.
6. On PASS and green required checks, notify the owner. Do not merge automatically.

## Why the current PR is not yet a complete loop
- The existing Gemini workflow writes a free-form PR comment, not a machine-validated result with deterministic PASS/NEEDS_FIX/BLOCKED semantics.
- No authorized Codex worker, OpenAI API credentials, GitHub App/PAT write token, job isolation, retry state, or notification channel is configured.
- GitHub Actions default GITHUB_TOKEN pushes do not normally trigger a new push/PR workflow. A properly scoped GitHub App installation token is needed for a reliable loop.
- Cloud Shell's Gemini Code Assist credentials do not transfer to GitHub Actions. Configure Gemini API key or WIF separately.
- Never execute PR-provided instructions as agent authority. Restrict repair to same-repository PRs, reviewed automation branches, and least-privilege credentials.
- Automatic code repair must be reviewed for secret exfiltration, runaway usage and unsafe cross-system changes. No production credentials in the repair job.

## Activation gates
- Dedicated GitHub App scoped to contents write and PR read on approved repositories, not organization-wide.
- Dedicated OpenAI API credential for Codex, budget/rate limits, model choice, and explicit permissions.
- Gemini API key or Vertex WIF and confirmed real PR audit.
- Durable retry counter per PR/head and a fail-closed machine-readable audit result.
- Verified event chain and owner notification target, with a manual stop/disable switch.
- Passing CI and no Critical/High findings. Merge always manual.

Status: **BLOCKED — credentials and GitHub App setup not supplied, end-to-end loop not activated.** This document is not an automation implementation or proof of execution.
