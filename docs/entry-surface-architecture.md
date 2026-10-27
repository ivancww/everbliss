# EverBliss entry-surface contract

Release: `v0.4.2`
App ID: `everbliss`

EverBliss exposes three App-owned entry surfaces. An absent or unrecognized `avaEntry` defaults to Front.

| Surface | URL contract | Owner | Return route |
| --- | --- | --- | --- |
| Front | `?avaEntry=frontend` | Customer journey and presentation | AVA Front |
| User Edit | `?avaEntry=user` | Local presentation overrides | AVA User |
| Admin | `?avaEntry=admin` | Official product data management | AVA Admin / AVA Studio |

All surfaces keep EverBliss branding, release version, responsive shell, and the shared PWA update contract. Front and User enter the same Frontstage renderer. User entry starts in a distinct Edit Mode on that Frontstage; Preview hides edit styling and uses pending User Overrides. Admin remains a separate protected Official management surface. Normal Front never exposes editing or management controls.

## Authority and persistence

- Front uses customer journey state, resolved presentation defaults/overrides, and Official calculation data.
- User Edit directly edits allowlisted presentation content on the Frontstage and uses compact section controls for visibility/order. The schema is `everbliss-user-config-v1`, stored in the namespaced User Override layer. Preview → Return to Edit preserves pending edits; Save Local persists only User Override and returns to normal Frontstage.
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
- Admin authorization: AVA Platform one-time proof exchanged server-to-server by EverBliss GAS; its signed `adminSessionProof` stays server-side and only an opaque short-lived App session ID is returned to the browser. Each protected operation is checked through Platform `verifyAdminSession`.
- Release: `v0.4.2`; semantic version is distinct from deployment build ID

AVA Platform remains unchanged in this App PR. Live User Frontstage persistence must pass before Platform enables User. Live GAS deployment, `AVA_PLATFORM_ADMIN_ENDPOINT`, Platform allowlisting, and live Studio proof/read verification must pass before Platform enables Admin.
