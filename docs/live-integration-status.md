# Live integration and Official Sheet status

Verified: **2026-10-23**
Repository branch baseline: `b0c51d5597b8b61e41cd4f626f6d96f20b0d763d`

This record separates the populated Official-data management Sheet from the still-unconfigured GAS runtime connector.

## Verified status

| Item | Status | Evidence / effect |
| --- | --- | --- |
| EverBliss native Google Sheet | **Created and populated** | [優悅年金 EverBliss｜官方數據庫](https://docs.google.com/spreadsheets/d/1BwXsIQ8bTxGo-91vgaackwQwYJBEHn8f_eL4hXjhY3k/edit), ID `1BwXsIQ8bTxGo-91vgaackwQwYJBEHn8f_eL4hXjhY3k`. |
| Sheet tabs and presentation | **Verified by read-back** | Seven exact Chinese tabs; Chinese headers and mapped display values; `zh_TW` locale, `Asia/Hong_Kong` time zone, frozen first row, hidden gridlines, and filters. |
| Official source records | **36** | One row for each direct Official parsed proposal scenario. |
| Official income rate anchors | **36** | Exact Official anchors only; the 55M deferred rate is read from its Official proposal; interpolated age rates are not written as Official rows. |
| Official surrender multiplier rows | **1,396** | All are direct Official parsed withdrawal/cashed-income rows. |
| Official death multiplier rows | **1,396** | All are direct Official parsed withdrawal/cashed-income rows. |
| Surrender reconciliation | **0 discrepancies** | Every stored multiplier equals `US$25,000 surrender value ÷ 25,000`. |
| Death component reconciliation | **2 accepted US$1 exceptions** | 75F deferred Years 22 and 23; all other total/component rows reconcile exactly. Death multipliers reconcile to the displayed Official total. |
| GAS project and Web App deployment | **Not found / not created / not deployed** | GAS source remains in-repository preparation only; no production `/exec` URL or Script Properties are configured. |
| Runtime cloud Official read | **Not connected** | App continues to use `VERIFIED_BUILT_IN_OFFICIAL_FALLBACK`; there is no live Sheet/GAS read. |
| AVA Admin verifier / live connector | **Not configured** | Admin access remains fail-closed without valid AVA proof and a configured server verifier. |
| Production Google systems | **No deployment or production data changes** | This task created/populated the requested native Official data Sheet only. No GAS, production Sheets, Firebase, or AVA Platform change was made. |

## Read-back checks

| Sheet tab | Data rows (header excluded) |
| --- | ---: |
| 產品設定 | 10 |
| 每年收入回報率 | 36 |
| 退保價值倍數 | 1,396 |
| 身故賠償倍數 | 1,396 |
| 官方資料來源 | 36 |
| 數據版本管理 | 1 |
| 修改紀錄 | 0 (headers only) |

Verified samples from the Sheet:

- **60歲、男、即期、第10年:** surrender US$14,210 / `0.56840`; guaranteed death US$15,750 + terminal bonus US$4,475 = total US$20,225 / `0.80900`.
- **60歲、男、5年延期、第10年:** surrender US$18,002 / `0.72008`; death total US$25,070 / `1.00280`.
- **75歲、男、即期、第10年:** death total US$15,900 / `0.63600`.

The dataset is **Canonical Data Pack v1**, schema version `1`, populated **2026-10-23**. Its source SHA-256 is `10d6e280f67955e62e1f25df9ca95f64b9ea6233342a59e5d20758a6f807a4a0`. The fingerprint is defined in `docs/google-sheet-gas-architecture.md`.

The 55M deferred rate is source-backed in the Sheet (US$1,245 guaranteed, US$708 non-guaranteed and US$1,953 total per US$25,000). The frozen App calculation bundle still classifies this rate as interpolated; its calculation data was intentionally left unchanged in this Sheet-only task.

## Runtime data path

The App runtime precedence remains:

`VALID_CLOUD_OFFICIAL → LAST_KNOWN_GOOD_OFFICIAL → VERIFIED_BUILT_IN_OFFICIAL_FALLBACK`

Because no live GAS endpoint is configured, the populated Sheet is not yet used by the customer App. Cloud payload validation, LKG preservation, and the fail-closed Admin verifier remain as previously implemented.
