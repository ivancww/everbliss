# Front, User Edit, and Admin ownership

## Front — customer runtime

Front owns the J01–J08 customer journey, OALA customer scenario, feature information, and local customer inputs. It can read presentation overrides and Official product data. It cannot edit presentation configuration, product rules, Official data, or publish datasets.

## User Edit — personal presentation

User Edit owns only `USER_OVERRIDE` presentation values under `everbliss-user-config-v1`. The editable schema covers Home, J01–J08, feature-card text/visibility/order, and OALA presentation copy/visibility. It excludes calculation inputs and product truth, including all income/surrender/death rates and values, age/premium limits, FX configuration, health-extra rules, Official sources, and Government OALA values.

The editor supports edit → preview → save. Preview uses pending presentation values in the same Front renderers. Resetting a section or all settings restores App defaults and removes only User Override data; journey state and Official LKG remain intact. Missing, malformed, or incomplete User configuration falls back field-by-field to App defaults.

## Admin — Official management

Admin owns Official product/configuration management and dataset lifecycle:

1. Product Config
2. Income Rates
3. Surrender Multipliers
4. Death Multipliers
5. Official Sources
6. Dataset Version / Publish
7. Audit Log

Official changes follow current value → draft → review → publish. Drafts carry the expected dataset version; conflicts block publish. GAS remains responsible for validation, atomic writes, rollback, read-back, and audit. Audit is read-only in the App editor. Existing GAS field allowlists remain authoritative.

Admin route access requires AVA proof through `ava-admin-session-v1`; `?avaEntry=admin`, local storage, and passwords do not grant access. The page renders a secure verification shell while auth is pending and denies access when proof is absent or invalid.

## Independent data layers

| Layer | Owns | Persistence / source |
| --- | --- | --- |
| Customer state | Journey inputs and progress | Existing local state store |
| User Override | Presentation preferences only | Namespaced local User config store |
| Official data | Product rates, multipliers, config, provenance | Cloud Official → LKG → verified bundled fallback |
| Admin draft | Unsaved proposed Official changes | In-memory draft until publish |
| PWA shell | Versioned static app assets | EverBliss build-specific service-worker cache |

These layers have separate schemas and precedence. User presentation values never participate in calculations.
