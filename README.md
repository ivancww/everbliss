# AVA EverBliss

EverBliss is an independent AVA customer App for helping pre-retirement and retired customers understand how part of accumulated retirement wealth may be converted into monthly cashflow.

## Positioning

「將累積的財富，轉化成每月現金流」

The customer journey starts with their concern, monthly living needs, stable income, and liquidity reserve. It then explains annuity timing, lets the customer explore a supported cashflow scenario, and summarizes the result without a hard sell. The App is not positioned as a wealth-growth or principal-growth plan.

## Independent App architecture

- Independent repository, deployment workflow, version, product calculations, data, PWA, and local state.
- No runtime dependency on AVA Platform. The persistent Return to AVA link is navigation only.
- Frontstage and User entry open the same customer experience. User editing supports a local Home hero title and subtitle, with Preview, Save Local, and reset.
- `avaEntry=admin` declares the app-owned Admin entry but is routing only. Access requires the AVA `ava-admin-session-v1` ticket, nonce, retained-opener proof, and a successful EverBliss server-side exchange. No local password or query-only grant exists.
- The optional Hong Kong Annuity comparison is hidden by default. No HKMC values are fabricated or included.

## Local development

Requires Node.js 20 or later and no third-party package installation.

```sh
npm test
npm run build
npm run serve
```

Open `http://localhost:4173` after building.

## Automatic Official App Shell update

The GitHub Pages workflow builds the static shell and stamps its immutable commit SHA into generated deployment metadata and the Service Worker. The Service Worker stages the complete new shell, activates only after staging, retires only older EverBliss shell caches, and leaves LocalStorage and IndexedDB intact. The App calls the Service Worker update check on startup. The update behavior is independent from Platform releases and Official dataset changes.

`npm test` includes a controlled two-deployment Service Worker lifecycle test. Physical iPad, Android, browser-installed PWA, and production deployment testing still require device/live verification.

## Data sources and calculated values

- The Full Outcome Engine uses the Canonical Data Pack v1 in `docs/research/` and its normalized runtime modules under `src/data/official/`. Income is premium × age/gender/mode rate; surrender and death are premium × policy-year multiplier.
- Income covers all 104 issue-age/gender/mode combinations from ages 50–75, with `OFFICIAL` and `INTERPOLATED` provenance. There are 36 `OFFICIAL_PARSED` surrender/death curves. Interpolated surrender/death fields are aligned by attained age and preserve source ages; all 104 schedules reach attained age 100. At the first illustrated year only, if the upper proposal starts after the requested boundary age, its first illustrated row is used to fill that edge.
- The customer outcome view switches one selected policy year among annual income, total surrender value, and total death benefit. Each view supports every policy year from 1 through attained age 100.
- Surrender and death values use each Official proposal’s `支取每月入息（詳細說明）` withdrawal scenario. Surrender total is `保證現金價值 + 終期紅利`; death total is `保證身故價值 + 終期紅利`. Cumulative withdrawn income and accumulated-income interest are excluded. The 741 added annual rows reconcile exactly for both totals. Across the complete 1,396-row death dataset, 1,394 component sums are exact; two 75F Deferred rows differ by US$1 because of whole-dollar source rounding, documented in `docs/calculation-rules.md`.
- Official product timing, benefits, and service qualifications use AIA's official EverBliss product material.
- Verified US$25,000 income and outcome proposal anchors are recorded as Official inputs, with proposal filenames and annual source-page references retained in the outcome dataset.
- Premium-scaled results are labeled `SCALED_FROM_OFFICIAL`; they are not presented as official proposal quotations.
- Missing income ages are linearly interpolated only between surrounding anchors for the same gender and accumulation mode. Results are explicitly marked `INTERPOLATED`; no extrapolation is performed. Unsupported combinations remain unavailable.
- Exact outcome curves are available for every age anchor listed in `docs/research/everbliss-source-map.md`. Income interpolation does not infer death benefit, cash value, terminal bonus, or surrender values.
- The HKD/USD exchange rate is user-entered; no rate is embedded.
- OALA values are from official SWD pages and stored with an effective date, verification date, treatment metadata, and source URLs.
- Product Official records, Government records, and User presentation overrides are separate layers. No raw documents are stored.

## Non-guaranteed income

The main result leads with the first guaranteed income phase: current monthly income for immediate mode, or Year-6 monthly income for deferred mode. The Year-8-and-later expected monthly total is secondary. HKD is shown using the user-entered HKD/USD rate with USD detail and an FX caveat. Non-guaranteed amounts may be higher, lower, or zero. Immediate guaranteed income starts in month 1; five-year deferred guaranteed income starts in month 61; non-guaranteed income starts in month 85.

## User and Admin architecture

IndexedDB v2 stores local journey/OALA inputs, separate User Overrides, and a separate Last Known Good Official cache. Namespaced LocalStorage is a fallback. User Override fields remain limited to presentation and cannot change calculations, Official product values, Government facts, security, or source metadata.

## Official Google Sheet / GAS preparation

`docs/google-sheet-gas-architecture.md` and `gas/Code.gs` prepare the seven-tab Official data schema, public dataset reads, versioned write flow, ScriptLock, read-after-write, and audit design. Drive/repository checks found no existing EverBliss Sheet, GAS project, deployment URL, or Script Properties; therefore no external resource was created or deployed. The configured runtime uses validated cloud Official data, then Last Known Good, then the bundled verified release snapshot. Until a production connector is provisioned, the bundled snapshot supplies calculation data.

The app-owned Admin surface has Product Config, Income Rates, Surrender Multipliers, Death Multipliers, Official Sources, and Dataset Status domains, with filters and a draft → validate → review → publish workflow. The route is not authorization: access requires AVA ticket/nonce, retained-opener proof, and a successful server exchange. Dataset writes remain disabled until the verified AVA server proof verifier and live Google Sheet/GAS connector are configured and tested. No second password, URL-based authorization, or User Override write path to Sheets exists.

## Version

The single user-facing App version source is `release.json`: `v0.1.0`. The deployment SHA is technical build metadata and does not replace the human-readable version.
