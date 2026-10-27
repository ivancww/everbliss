# EverBliss Mother Rules alignment

## Ownership

- Front owns the customer journey and customer state.
- User entry opens the same Frontstage and edits only the `everbliss-user-config-v1` User Override layer.
- EverBliss GAS owns Official reads/writes, validation, optimistic versioning, atomic publish, rollback, and audit.
- AVA Platform owns Admin identity, one-time launch ticket/nonce, browser proof, and session verification.

User presentation overrides remain in the EverBliss local User Override store and never enter the Official Sheet, calculation dataset, LKG cache, Product Config, or Admin draft.

## User flow

`?avaEntry=user` restores the Frontstage in Edit Mode. Permitted text is edited in place. Feature visibility/order and liquidity-option visibility use compact controls in their Frontstage sections. Preview uses pending presentation settings with edit affordances removed. Return to Edit restores the pending settings. Save Local persists only User Overrides and returns to normal Frontstage. Reset actions remove only overrides.

A fresh `?avaEntry=frontend` resolves saved local User Overrides over App presentation defaults; official calculation resolution remains cloud → LKG → bundled fallback.

## Admin flow

The app follows `ava-admin-session-v1`: Platform Studio launch → app-bound ticket and nonce → retained-opener browser proof → EverBliss GAS `exchangeAdminSession` → Platform GAS `exchangeAdminSession` → app-bound `adminSessionProof`. EverBliss GAS stores that signed proof server-side and returns only an opaque, short-lived app session ID. Each protected read/write calls Platform `verifyAdminSession` for the allowlisted operation. A revoked or expired Platform session therefore fails closed on the next request.

Required EverBliss Script Property: `AVA_PLATFORM_ADMIN_ENDPOINT`, set to the current Platform GAS Web App endpoint. No server-side token is placed in browser code. The Platform's existing `AVA_ADMIN_APP_IDS` list must include `everbliss` before Studio launch can issue a ticket. Do not configure this property or enable the Platform capability until the exact deployment is reviewed.

## Release and verification

The release manifest is `v0.4.2`; the existing build ID, local-first startup, service worker, and forced-update contracts remain owned by EverBliss. Product calculations and Official data are unchanged.

The repository implementation is reviewable in this branch. It is not a claim of live deployment: verify live Edit → Preview → Save Local and Front override persistence before enabling Platform User. Deploy the updated GAS to the existing EverBliss project, set `AVA_PLATFORM_ADMIN_ENDPOINT`, preserve existing properties, verify Platform `AVA_ADMIN_APP_IDS`, and exercise the one-time proof plus protected Official read before enabling Platform Admin.
