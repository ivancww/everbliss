# Owner setup: AVA Gemini + Codex automation

## Gemini authentication
Choose one: (A) `GEMINI_API_KEY` as a GitHub Actions secret; or (B) `GEMINI_WIF_PROVIDER`, `GEMINI_SERVICE_ACCOUNT`, `GEMINI_VERTEX_PROJECT`, `GEMINI_VERTEX_LOCATION` as repository variables with a scoped Google Cloud WIF trust. Cloud Shell `compute-default-credentials` are not portable to Actions. Do not paste secrets in ChatGPT or commit them.

## Codex automation
A separate least-privilege GitHub App installation token and `OPENAI_API_KEY` are required for a future repair worker. **No Codex auto-fix worker is enabled in this PR.** The repair worker must enforce exact SHA checks, retry budget, sandboxing, branch scope and tests before any push.

## Shared rollout
Canonical `GEMINI.md` lives in `ivancww/avaplatform`. This EverBliss PR vendors a copy in `docs/review/AVA-GEMINI-SHARED.md`. Other app repos are not enrolled until they each have a reviewed workflow and pinned shared rules. Mother Rules alone do not trigger GitHub Actions in independent repos.

## Acceptance test
1. Configure Gemini auth without exposing keys.
2. Open small EverBliss PR and verify test/build, audit and posted PR comment.
3. Validate auth failure/oversize diff/fork handling.
4. Review Codex worker design and credential scope before enabling auto-repair.
5. Verify 3-cycle cap, re-audit on bot push, final notification and manual merge.

API-key pilot: the owner has reported that `GEMINI_API_KEY` is configured. Validate availability only by a real Actions run; do not print or request the key. Until PR #7 is merged, the restricted PR #7 bootstrap reviews PR #8 at its pinned HEAD. Production-wide PR review remains contingent on owner approval of PR #7 and validation of the trusted-base workflow.
