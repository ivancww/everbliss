# EverBliss Official Google Sheet and GAS preparation

This repository contains a deployable schema and endpoint design. No EverBliss spreadsheet, GAS project, production `exec` URL, or Script Properties were found in the connected Drive searches or current repository snapshot. No Google resource was created or deployed. Until an approved EverBliss deployment is configured, the verified bundled release data is the runtime fallback; a future validated cloud dataset will take precedence and be cached as Last Known Good.

## Official spreadsheet tabs

| Tab | Header fields |
| --- | --- |
| ProductConfig | `key`, `value`, `value_type`, `effective_date`, `verified_date`, `source`, `record_version`, `updated_at` |
| IncomeRates | `record_id`, `issue_age`, `gender`, `mode`, `guaranteed_rate`, `ng_rate_from_year8`, `total_rate_from_year8`, `source_type`, `source_file`, `source_version`, `verified_date`, `record_version`, `updated_at` |
| SurrenderMultipliers | `record_id`, `issue_age`, `gender`, `mode`, `policy_year`, `attained_age`, `surrender_total_usd_25k`, `surrender_multiplier`, `source_type`, `source_file`, `source_version`, `verified_date`, `record_version`, `updated_at` |
| DeathMultipliers | `record_id`, `issue_age`, `gender`, `mode`, `policy_year`, `attained_age`, `guaranteed_death_value_usd_25k`, `terminal_bonus_usd_25k`, `death_total_usd_25k`, `death_multiplier`, `source_type`, `source_file`, `source_version`, `verified_date`, `record_version`, `updated_at` |
| OfficialSources | `source_id`, `filename`, `issue_age`, `gender`, `mode`, `base_premium_usd`, `proposal_generator_version`, `table_type`, `extraction_date`, `verified_date`, `status`, `notes` |
| DatasetMeta | `dataset_name`, `dataset_version`, `schema_version`, `published_version`, `status`, `source_sha`, `updated_at`, `published_at`, `published_by` |
| AuditLog | `timestamp`, `admin_session_id`, `operation`, `domain`, `record_id`, `old_value`, `new_value`, `dataset_version_before`, `dataset_version_after`, `source_sha` |

User Override is stored only in the App's local `userOverrides` store and has no Sheet tab or GAS upload endpoint.

## Runtime precedence

`VALID_CLOUD_OFFICIAL → LAST_KNOWN_GOOD_OFFICIAL → VERIFIED_BUILT_IN_OFFICIAL_FALLBACK`

Cloud payloads are rejected unless schema, dataset version, complete 104-row income coverage, all Official multiplier anchors, continuous annual rows, finite surrender/death multipliers, and attained-age-100 endpoints validate. A rejected payload never replaces LKG.

## GAS endpoints prepared in `gas/Code.gs`

Public reads: `getOfficialDataset`, `getProductConfig`, `getIncomeRates`, `getSurrenderMultipliers`, `getDeathMultipliers`, `getDatasetMeta`.

Admin operations: `getAdminOfficialDataset`, `upsertIncomeRate`, `upsertSurrenderMultiplier`, `upsertDeathMultiplier`, `upsertProductConfig`, `publishDataset`. Mutations require an Admin session after AVA Platform proof verification, operation allowlisting, schema validation, expected dataset version, ScriptLock, record and dataset version increments, read-after-write verification, and append-only audit. The verifier fails closed until the exact AVA Platform production exchange contract and deployment properties are wired; no password or local-only Admin grant is provided.

## Deployment gates

Before cloud data can be called the source of truth, an owner must provision or identify the existing EverBliss spreadsheet and GAS project, set the spreadsheet ID and exact production origins as Script Properties, implement the verified AVA Platform `ava-admin-session-v1` server exchange, deploy the Web App, verify GET/POST behavior, and record deployed source equivalence. This PR leaves these live resource operations untouched. Do not publish a made-up spreadsheet ID or deployment URL.
