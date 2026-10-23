# EverBliss Official Google Sheet and GAS architecture

The native Official data Sheet was created and populated on **2026-10-23** as **優悅年金 EverBliss｜官方數據庫**. Spreadsheet ID: `1BwXsIQ8bTxGo-91vgaackwQwYJBEHn8f_eL4hXjhY3k`; URL: https://docs.google.com/spreadsheets/d/1BwXsIQ8bTxGo-91vgaackwQwYJBEHn8f_eL4hXjhY3k/edit. This is a prepared data-management source; EverBliss runtime is **not** reading it live. No GAS project or Web App deployment was created. Until a separately authorized GAS deployment is configured, the verified bundled Official release snapshot remains the runtime fallback.

The stored dataset is **Canonical Data Pack v1**, schema version `1`, with source fingerprint `10d6e280f67955e62e1f25df9ca95f64b9ea6233342a59e5d20758a6f807a4a0`. The fingerprint is SHA-256 over the two frozen inputs, including each repository-relative filename and a NUL separator: `src/data/official/everbliss-income-rates-50-75.json` and `src/data/official/everbliss-official-parsed-multipliers.json`.

## Canonical schema and Chinese display mapping

`src/data/official/google-sheet-display-mapping.json` is the centralized mapping source. Its tab definitions retain stable English identifiers and canonical field keys; `fieldLabels`, `valueLabels`, and `configKeyLabels` define the Chinese presentation. Calculations and dataset records continue to use English canonical keys and enum values. Changing a Chinese tab or column label requires a mapping update, not a calculation change.

| Canonical tab | Visible Sheet tab | Canonical columns |
| --- | --- | --- |
| `ProductConfig` | 產品設定 | `key`, `value`, `value_type`, `effective_date`, `verified_date`, `source`, `record_version`, `updated_at` |
| `IncomeRates` | 每年收入回報率 | `record_id`, `issue_age`, `gender`, `mode`, `guaranteed_rate`, `ng_rate_from_year8`, `total_rate_from_year8`, `source_type`, `source_file`, `source_version`, `verified_date`, `record_version`, `updated_at` |
| `SurrenderMultipliers` | 退保價值倍數 | `record_id`, `issue_age`, `gender`, `mode`, `policy_year`, `attained_age`, `surrender_total_usd_25k`, `surrender_multiplier`, `source_type`, `source_file`, `source_version`, `verified_date`, `record_version`, `updated_at` |
| `DeathMultipliers` | 身故賠償倍數 | `record_id`, `issue_age`, `gender`, `mode`, `policy_year`, `attained_age`, `guaranteed_death_value_usd_25k`, `terminal_bonus_usd_25k`, `death_total_usd_25k`, `death_multiplier`, `source_type`, `source_file`, `source_version`, `verified_date`, `record_version`, `updated_at` |
| `OfficialSources` | 官方資料來源 | `source_id`, `filename`, `issue_age`, `gender`, `mode`, `base_premium_usd`, `proposal_generator_version`, `table_type`, `extraction_date`, `verified_date`, `status`, `notes` |
| `DatasetMeta` | 數據版本管理 | `dataset_name`, `dataset_version`, `schema_version`, `published_version`, `status`, `source_sha`, `updated_at`, `published_at`, `published_by` |
| `AuditLog` | 修改紀錄 | `timestamp`, `admin_session_id`, `operation`, `domain`, `record_id`, `old_value`, `new_value`, `dataset_version_before`, `dataset_version_after`, `source_sha` |

Canonical value labels include `M` → `男`, `F` → `女`, `immediate` → `即期`, `deferred` → `5年延期`, and both `OFFICIAL` and `OFFICIAL_PARSED` → `官方數據`. The Chinese value is presentation-only; the source-type distinction remains in canonical data. `修改紀錄` contains headers only because no Sheet edit history was fabricated.

## Populated dataset

The Sheet contains **36** Official parsed proposal scenarios, **35** exact Official income-rate anchor rows, **1,396** Official surrender rows, **1,396** Official death rows, and **36** Official source records. The income-rate sheet contains exact Official anchors only; no age-interpolated values were written as Official records. Multiplier rows are direct `OFFICIAL_PARSED` source rows from `支取每月入息（詳細說明）`; no interpolated rows are stored. The proposal generator version is marked `未提供` where the source did not provide it. Known source extraction dates are retained; unknown extraction dates are shown as `未記錄`.

The tabs have Chinese display names and headers, `zh_TW` locale, Hong Kong time zone, frozen header rows, hidden gridlines, filters, readable column sizing, wrapped source names, percentage formats, and five-decimal multiplier formats. The Sheet was read back after import: all seven tab names and mapped headers match the central schema. Reconciliation found zero surrender multiplier discrepancies and zero death multiplier discrepancies. Death component totals differ by **US$1** only for 75-year-old female deferred Years 22 and 23, matching the accepted Official whole-dollar component-rounding cases. See `docs/live-integration-status.md` for read-back sample values and runtime status.

User Override is stored only in the App's local `userOverrides` store and has no Sheet tab or GAS upload endpoint.

## Runtime precedence

`VALID_CLOUD_OFFICIAL → LAST_KNOWN_GOOD_OFFICIAL → VERIFIED_BUILT_IN_OFFICIAL_FALLBACK`

Cloud payloads are rejected unless schema, dataset version, complete 104-row income coverage, all Official multiplier anchors, continuous annual rows, finite surrender/death multipliers, and attained-age-100 endpoints validate. A rejected payload never replaces LKG.

## GAS endpoints prepared in `gas/Code.gs`

Public reads: `getOfficialDataset`, `getProductConfig`, `getIncomeRates`, `getSurrenderMultipliers`, `getDeathMultipliers`, `getDatasetMeta`.

Admin operations: `getAdminOfficialDataset`, `upsertIncomeRate`, `upsertSurrenderMultiplier`, `upsertDeathMultiplier`, `upsertProductConfig`, `publishDataset`. Mutations require an Admin session after AVA Platform proof verification, operation allowlisting, schema validation, expected dataset version, ScriptLock, record and dataset version increments, read-after-write verification, and append-only audit. The verifier fails closed until the exact AVA Platform production exchange contract and deployment properties are wired; no password or local-only Admin grant is provided.

## Deployment gates

Before cloud data can be called the runtime source of truth, an owner must configure the recorded Sheet ID and exact production origins as Script Properties, implement the verified AVA Platform `ava-admin-session-v1` server exchange, create/deploy the GAS Web App, verify GET/POST behavior, and record deployed source equivalence. The Sheet is populated, but no production GAS project, deployment, or Script Properties are configured. Do not treat the Sheet's existence as a live runtime connection.
