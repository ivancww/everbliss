# EverBliss live Official data status

Verified: **2026-10-26**. PR branch baseline fetched before this sync: `0d5820b84fc03c8d9354a31a8c397047f828b147`.

## Production resources and live API

| Item | Verified state | Evidence |
| --- | --- | --- |
| Native Google Sheet | **AVA - EverBliss** | Spreadsheet ID `1BwXsIQ8bTxGo-91vgaackwQwYJBEHn8f_eL4hXjhY3k`; Sheet metadata and ranges read back. |
| Visible Sheet tabs | **6** | `產品設定`, `官方產品數據`, `官方資料來源`, `Workflow`, `數據版本`, `修改紀錄`. |
| Hidden system tabs | **6** | `系統_每年收入回報率`, `系統_退保價值倍數`, `系統_身故賠償倍數`, `系統_官方資料來源`, `系統_數據版本`, `系統_修改紀錄`. |
| GAS Web App | **Deployed** | `https://script.google.com/macros/s/AKfycbw0tTMX_iTEYS1uK9X0TkP8wEgF9wP4j8q4ch2pMfFLjN88JyMt4e2i4_g9WJdRY4r-zA/exec`. |
| Health | **PASS** | `success: true`, app ID `everbliss`, service `EverBliss Official Data API`, spreadsheet `AVA - EverBliss`. |
| Dataset metadata | **PASS** | `Canonical Data Pack v1`, schema `1`, status `PUBLISHED`; source SHA `c515b8636f683dae2952e30728e2e325cc70a8adb2c13644e4692992a1f5b618`. |
| Official dataset API | **PASS** | `success: true`, schemaVersion `1`, datasetName `everbliss-official`, 36 income anchors, 36 multiplier scenarios; every annual scenario is continuous through attained age 100. |
| GAS source alignment | **Updated in this PR** | `gas/Code.gs` uses the deployed Chinese sheet tabs/headers and English canonical response schema. No GAS deployment was made by this repository task. |

The provided production source’s field mappings were compared with actual Sheet headers and sample rows. The hidden income, surrender, death, source, and dataset-meta headers match the GAS mappings; the Product Config labels used by the source match the Sheet rows. Machine values are normalized to `M`/`F`, `immediate`/`deferred`, and canonical dataset status.

## Live dataset regression read-back

| Scenario | Live Year 10 values |
| --- | --- |
| 60M Immediate | Surrender US$14,210 / `0.56840`; death US$20,225 / `0.80900` (guaranteed US$15,750 + bonus US$4,475). |
| 60M Deferred | Surrender US$18,002 / `0.72008`; death US$25,070 / `1.00280`. |
| 75M Immediate | Death US$15,900 / `0.63600`. |

The published API data therefore matches the corrected withdrawal-scenario regressions. Dataset version and source SHA are independent of the PWA build version.

## App runtime and deploy configuration

The App already resolves Official data in this order:

`VALID_CLOUD_OFFICIAL → LAST_KNOWN_GOOD_OFFICIAL → VERIFIED_BUILT_IN_OFFICIAL_FALLBACK`

Only a fully normalized and validated cloud payload is saved as LKG. Network errors and malformed/incomplete cloud responses fall through without replacing LKG. Existing automated resolver tests cover valid cloud, LKG after outage/invalid response, and clean bundled fallback.

The endpoint remains centralized in the release/build configuration. GitHub Pages workflow reads the repository variable `EVERBLISS_OFFICIAL_ENDPOINT`, and `scripts/build.js` injects it into `dist/release.json`. The GitHub connector in this session does not expose repository Actions-variable management, so I could not set or independently read back that variable. **Required repository setting:** `Settings → Secrets and variables → Actions → Variables → New repository variable`; name `EVERBLISS_OFFICIAL_ENDPOINT`, value the `/exec` URL in the table above. A local build with that environment variable is verified separately; the source `release.json` remains blank by design.

The live GAS endpoint was directly verified in the browser. An App runtime build running against the cloud endpoint was not hosted in a preview during this task, so an end-to-end browser runtime source badge / cloud calculation round-trip is **BROWSER QA PENDING**. Do not interpret live API validation and resolver unit tests as a deployed customer runtime test.

## Admin security

The GAS Admin exchange requires AVA Platform proof and fails closed when `AVA_ADMIN_VERIFY_URL` is absent. `AVA_ADMIN_VERIFY_TOKEN` is server-to-server configuration, not an Admin password. The App Admin route still requires the AVA launch proof; no second password, query-parameter grant, or local authorization bypass was added. No AVA Platform change, production GAS deployment, or Sheet write was made in this sync.
