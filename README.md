# AVA EverBliss

EverBliss is an independent AVA customer App for helping pre-retirement and retired customers understand how part of accumulated retirement wealth may be converted into monthly cashflow.

## Positioning

「將累積的財富，轉化成每月現金流」

The customer journey starts with their concern, monthly living needs, stable income, and liquidity reserve. It then explains annuity timing, lets the customer explore a supported cashflow scenario, and summarizes the result without a hard sell. The App is not positioned as a wealth-growth or principal-growth plan.

## Independent App architecture

- Independent repository, deployment workflow, version, product calculations, data, PWA, and local state.
- No runtime dependency on AVA Platform. The persistent Return to AVA link is navigation only.
- Frontstage and User entry open the same customer experience. User editing supports a local Home hero title and subtitle, with Preview, Save Local, and reset.
- `avaEntry=admin` is routing only. Admin capability is `false`; no Admin connector or Official write exists in v0.1.0.
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

- Official product timing, benefits, and service qualifications use AIA's official EverBliss product material.
- Verified US$25,000 annual income anchors for ages 50, 52, 55, 57, 60, 65, 67, and 70 where supplied are recorded as Official inputs. Original proposal PDFs/reference IDs were not attached; the metadata preserves that provenance limitation.
- Premium-scaled results are labeled `SCALED_FROM_OFFICIAL`; they are not presented as official proposal quotations.
- Missing income ages are linearly interpolated only between surrounding anchors for the same gender and accumulation mode. Results are explicitly marked `INTERPOLATED`; no extrapolation is performed. Unsupported combinations remain unavailable.
- Exact Year-10 death/cash-value data are only available for the age-50 anchors. Income interpolation does not infer death benefit, cash value, terminal bonus, or surrender values.
- The HKD/USD exchange rate is user-entered; no rate is embedded.
- OALA values are from official SWD pages and stored with an effective date, verification date, treatment metadata, and source URLs.
- Product Official records, Government records, and User presentation overrides are separate layers. No raw documents are stored.

## Non-guaranteed income

The main result leads with the first guaranteed income phase: current monthly income for immediate mode, or Year-6 monthly income for deferred mode. The Year-8-and-later expected monthly total is secondary. HKD is shown using the user-entered HKD/USD rate with USD detail and an FX caveat. Non-guaranteed amounts may be higher, lower, or zero. Immediate guaranteed income starts in month 1; five-year deferred guaranteed income starts in month 61; non-guaranteed income starts in month 85.

## User and future Admin architecture

IndexedDB stores local journey/OALA inputs and separate User Overrides. Namespaced LocalStorage is a fallback. The User Layer cannot change calculations, Official product values, Government facts, security, or source metadata.

Future Admin domains are product data, Official age/proposal data, Government/OALA data, hidden comparison data, feature/service content, and system information. These remain read-only until the App has AVA Studio authorization under the current Mother contract and an App-owned Official Write connector with persisted-write evidence.

## Version

The single user-facing App version source is `release.json`: `v0.1.0`. The deployment SHA is technical build metadata and does not replace the human-readable version.
