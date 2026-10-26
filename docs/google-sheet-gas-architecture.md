# EverBliss Official Google Sheet and GAS architecture

The native Official data Sheet is **AVA - EverBliss**, ID `1BwXsIQ8bTxGo-91vgaackwQwYJBEHn8f_eL4hXjhY3k`; URL: https://docs.google.com/spreadsheets/d/1BwXsIQ8bTxGo-91vgaackwQwYJBEHn8f_eL4hXjhY3k/edit. A production GAS Web App is deployed at `https://script.google.com/macros/s/AKfycbw0tTMX_iTEYS1uK9X0TkP8wEgF9wP4j8q4ch2pMfFLjN88JyMt4e2i4_g9WJdRY4r-zA/exec`; the Official dataset is `PUBLISHED`. The endpoint and Sheet were verified 2026-10-26. Runtime resolution uses valid cloud Official → Last Known Good → bundled verified fallback. The Sheet and GAS remain App-owned; this PR does not deploy or modify either production resource.

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

The Sheet contains **36** Official parsed proposal scenarios, **36** exact Official income-rate anchor rows, **1,396** Official surrender rows, **1,396** Official death rows, and **36** Official source records. The 55M deferred rate was read directly from its Official proposal's Year 6 guaranteed and Year 8 income rows (US$1,245 guaranteed; US$708 non-guaranteed; US$1,953 total per US$25,000), rather than retaining its former interpolated classification. No interpolated age rates were written as Official records. Multiplier rows are direct `OFFICIAL_PARSED` source rows from `支取每月入息（詳細說明）`; no interpolated rows are stored. The proposal generator version is marked `未提供` where the source did not provide it. Known source extraction dates are retained; unknown extraction dates are shown as `未記錄`.

The frozen built-in fallback remains unchanged. It retains its earlier source set and may classify the 55M deferred rate as `INTERPOLATED`; the live published Cloud dataset includes the 55M deferred Official anchor. Dataset versioning keeps the cloud release independent from the App shell version.

The visible Chinese tabs are `產品設定`, `官方產品數據`, `官方資料來源`, `Workflow`, `數據版本`, `修改紀錄`; hidden machine tabs are `系統_每年收入回報率`, `系統_退保價值倍數`, `系統_身故賠償倍數`, `系統_官方資料來源`, `系統_數據版本`, `系統_修改紀錄`. The GAS source reads the hidden system tabs and translates headers through the canonical-English-to-Chinese mapping in `gas/Code.gs`; API/business logic keys stay English. The current live data has 36 income anchors, 36 scenarios and 1,396 surrender/death year records each. The published API read-back is documented in `docs/live-integration-status.md`.

User Override is stored only in the App's local `userOverrides` store and has no Sheet tab or GAS upload endpoint.

## Runtime precedence

`VALID_CLOUD_OFFICIAL → LAST_KNOWN_GOOD_OFFICIAL → VERIFIED_BUILT_IN_OFFICIAL_FALLBACK`

Cloud payloads are rejected unless schema, dataset version, complete 104-row income coverage, all Official multiplier anchors, continuous annual rows, finite surrender/death multipliers, and attained-age-100 endpoints validate. A rejected payload never replaces LKG.

## GAS endpoints in `gas/Code.gs`

Public reads: `health`, `getOfficialDataset`, `getProductConfig`, `getIncomeRates`, `getSurrenderMultipliers`, `getDeathMultipliers`, `getDatasetMeta`.

Admin operations: `exchangeAdminSession`, `getAdminOfficialDataset`, `publishDataset` (draft changes are submitted to the publish operation). Mutations require an Admin session after AVA Platform proof verification, operation allowlisting, schema validation, expected dataset version, ScriptLock, record and dataset version increments, read-after-write verification, and append-only audit. The verifier fails closed until its production properties are configured; no password or local-only Admin grant is provided.

## Deployment gates

The production Web App and Sheet are live and public Official reads are verified. Runtime deployment obtains the endpoint through the GitHub Actions repository variable `EVERBLISS_OFFICIAL_ENDPOINT`; source `release.json` intentionally remains blank and build-time injection writes the endpoint only to `dist/release.json`. The repository variable was configured with the deployed `/exec` URL and read back on 2026-10-26. No Pages deployment or hosted runtime/browser QA was triggered by this task. The current App adapter uses the Mother Rules `ava-admin-session-v1` protocol. EverBliss GAS requires the server-side Script Property `AVA_PLATFORM_ADMIN_ENDPOINT` (Platform GAS Web App URL); it does not use the obsolete `AVA_ADMIN_VERIFY_URL` or `AVA_ADMIN_VERIFY_TOKEN`. The signed Platform proof is retained server-side and verified for each protected operation. This branch does not deploy GAS or configure Script Properties; live Admin stays fail-closed until deployed and verified.


## HKD customer display conversion

The ProductConfig API exposes `hkd_per_usd_calculation_rate`, read from the Chinese `產品設定` row `港元兌美元試算換算率`. This rate converts a customer-entered HKD plan premium to USD before calling the frozen Official calculation engine, and converts USD outcomes back to HKD for display. It is not an Official product return rate or a live market quote. The retained 7.8 value preserves the prior customer trial conversion until an authorized configuration update changes it. User input never edits the rate.

The app requests `getProductConfig`; if the cloud config is unavailable or lacks a valid rate, it uses the bundled verified configuration fallback. The Sheet row is prepared and read back. The GAS source change is in this branch; production GAS must be updated and redeployed separately before the live API serves the new key.
