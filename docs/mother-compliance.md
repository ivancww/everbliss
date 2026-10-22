# Mother compliance record — EverBliss v0.1.0

## Baseline studied

- `ivancww/avaplatform` `main` at `63cf0d5ef0b45f6722f2ec16d10106a1dda86b0f` (2026-10-19), including root `AGENTS.md`, `docs/MOTHER-RULES.md`, `design-system/DESIGN-SYSTEM.md`, AVA Studio Admin authentication, App release governance, and current reference App registration docs.
- Mother rules take precedence over this App's documentation. Medical, Critical Illness, and Saving were considered reference Apps only; no product journey, schema, calculation, or customer data was copied.

## Compliance implementation

- Independent repository, deployment, product data, calculation engine, local persistence, and Service Worker. No runtime dependency on AVA Platform.
- App header displays EverBliss and canonical `v0.1.0` from the single `release.json` version source; persistent Return to AVA link is present on the shell.
- Pages use App Header → Page Control where applicable → adaptive Main Presentation Card → app-specific interactions. The user-facing journey is not a cloned Medical flow.
- Frontstage is the primary customer experience. `?avaEntry=frontend` opens it. `?avaEntry=user` edits the same Frontstage and supports Preview, Save Local, and reset of allowed hero copy. User overrides are separate from protected product and Government data.
- `?avaEntry=admin` declares the app-owned Admin route but cannot authorize access. The route accepts only AVA `ava-admin-session-v1` ticket/nonce plus retained-opener browser proof and a successful server-side exchange; it fails closed when the connector is absent. No local password exists.
- Product Official proposal records and Government data are immutable module inputs. Derived premium-scaled and interpolated income outputs retain explicit source labels and bracketing-age metadata. Unsupported ages/combinations remain unavailable; income anchors do not create death/cash-value data.
- Journey, User override, FX entry, OALA inputs, and Last Known Good Official data are separated Local-first stores. IndexedDB v2 is primary; namespaced LocalStorage is a fallback. No source documents or customer PDFs are stored.
- Return to AVA points to the current Platform production destination, preserving `avaSurface=user/admin` context when present.
- Version is independent from AVA Platform. The Pages workflow stamps deployment SHA into `release.json` and the generated Service Worker; cache namespace is fixed and per-deployment cache instances retire safely.
- PWA uses standalone manifest mode and the same Service Worker update lifecycle as browser mode. Physical installed-PWA and device-level checks are not represented as passed by local tests.
- Responsive CSS covers narrow phone through desktop and safe-area insets; iPad and physical-device checks remain pending.
- App-owned Admin domains, proof-gated route, draft/publish workflow, Official dataset resolver, Google Sheet schema, and GAS endpoint source are prepared. The Admin connector intentionally fails closed and no cloud write is enabled pending the exact Platform server-verifier contract and live Google resource configuration.

## Release gates

Source tests cover calculations, layer separation, OALA metadata, routing/config, state fallback, and simulated Service Worker version transitions. Browser deployment, real iPad, Android, and installed-PWA gates require live deployment/device validation and remain `CODE COMPLETE / DEVICE QA PENDING`.
