# Gemini Vertex AI GitHub PR Review — Setup

This is a PR-only pilot. It does not change production Pages, GAS, Sheets, Firebase or app code.

## Existing workflow
`.github/workflows/pages.yml` deploys on push to main. The new `gemini-pr-review.yml` runs independently on PRs. `npm test` and `npm run build` run in a job without Google credentials. The credential-bearing review job checks out trusted base code and only reads PR diffs; it does not execute PR code.

## Required one-time Google Cloud configuration (owner)
1. Identify the existing Vertex AI project, location, and service account used for this integration. Do not copy iPad local ADC credentials or service-account keys into GitHub.
2. Create or reuse a GitHub OIDC Workload Identity Pool + Provider, scoped by repository and branch/PR claims to `ivancww/everbliss`. Set restrictive attribute conditions; avoid allowing all GitHub repositories.
3. Grant the dedicated service account only the Vertex AI permissions needed for model invocation (for example `roles/aiplatform.user` at an appropriately narrow scope), and permit the provider principal to impersonate that service account via `roles/iam.workloadIdentityUser`.
4. Configure GitHub Actions repository **Variables**: `GEMINI_WIF_PROVIDER` (full provider resource), `GEMINI_SERVICE_ACCOUNT` (email), `GEMINI_VERTEX_PROJECT` (project ID), `GEMINI_VERTEX_LOCATION` (region), and optional `GEMINI_MODEL` (model supported in that region).
5. Ensure GitHub Actions is enabled and permitted to run Google auth / Node actions, and that workflow permissions allow PR comments. Review cost/quotas and the Gemini CLI version before enabling broad use.
6. Create a small same-repository PR and verify: test job, Google OIDC authentication, Gemini CLI review, PR comment, head SHA, and no deployment. A successful Actions run is not proof of correctness; review findings manually.

## Security / limitations
- No static Google Cloud credentials, API keys or private customer documents in the repository.
- Fork PRs do not receive Vertex credentials; manual review is required.
- Review is advisory and may miss defects; Critical/High findings and failing checks block a merge recommendation.
- Authentication failure, empty report, oversized diff, unsupported model, and missing variables fail the review job rather than producing a false PASS.
- The workflow uses the CLI's current published npm package at runtime. For production hardening, pin exact reviewed action SHAs and a vetted Gemini CLI version, and configure branch protection/required checks.
- This pilot does not automatically ask ChatGPT/Codex to fix findings or push notifications to an existing ChatGPT conversation. Those require a separate orchestration mechanism.
- Google Cloud and GitHub variable configuration must be completed by an authorized owner; this PR cannot verify the iPad terminal's ADC or Vertex setup.
