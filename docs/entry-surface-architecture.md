# EverBliss entry-surface contract

Release: `v0.3.0`  
App ID: `everbliss`

EverBliss exposes three App-owned entry surfaces. An absent or unrecognized `avaEntry` defaults to Front.

| Surface | URL contract | Owner | Return route |
| --- | --- | --- | --- |
| Front | `?avaEntry=frontend` | Customer journey and presentation | AVA Front |
| User Edit | `?avaEntry=user` | Local presentation overrides | AVA User |
| Admin | `?avaEntry=admin` | Official product data management | AVA Admin / AVA Studio |

All surfaces keep EverBliss branding, release version, responsive shell, and the shared PWA update contract. User Edit and Admin are separate modes; Front does not render editing or management controls.

## Authority and persistence

- Front uses customer journey state, resolved presentation defaults/overrides, and Official calculation data.
- User Edit changes presentation fields only. The schema is `everbliss-user-config-v1`, stored in the namespaced User Override layer.
- Admin reads and drafts Official product/configuration changes through the authenticated GAS connector. It requires AVA proof under `ava-admin-session-v1`; route parameters do not authorize access.
- User reset removes only User Override storage. It preserves customer journey state, Official LKG, and PWA caches.

Presentation resolution is `USER_OVERRIDE → APP_DEFAULT_PRESENTATION`. Calculation resolution remains `VALID_CLOUD_OFFICIAL → LAST_KNOWN_GOOD_OFFICIAL → VERIFIED_BUILT_IN_OFFICIAL_FALLBACK`.

## AVA Platform integration readiness

This repository prepares the App-side contract; it does not modify or register AVA Platform.

- App ID: `everbliss`
- Front: `?avaEntry=frontend`
- User: `?avaEntry=user`
- Admin: `?avaEntry=admin`
- Admin proof/session contract: `ava-admin-session-v1`
- Admin authorization: AVA Platform one-time proof exchanged for a short-lived EverBliss GAS session
- Release: `v0.3.0`; semantic version is distinct from deployment build ID

AVA Platform registration and live verifier configuration remain a separate integration task.
