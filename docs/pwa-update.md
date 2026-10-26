# EverBliss v0.3.0 local-first startup and update contract

`release.json` is the only source of the semantic App version. The build validates `vMAJOR.MINOR.PATCH`, writes a generated `build-info.js` containing the same version plus the independent Git build SHA, and stamps that SHA into the Service Worker cache name. The build replaces the header version token so it is visible in the static shell before application JavaScript or network requests run.

## Startup

Front and User startup loads local journey state, User Overrides, last-known-good Official data, and last-known-good Product Config. It activates valid local data (or the verified bundled Official/7.8 fallback), renders the current page, and then schedules cloud Official/Product Config refresh and release checks. GAS response time does not gate first render. Full cloud validation remains required before data is persisted as last-known-good. Invalid or unavailable cloud data cannot replace LKG.

Admin stays separate and fail-closed. Its proof/session verification may require the network; no query parameter grants access.

## Static shell and forced update

The Service Worker stages a build-specific shell cache during install and activates it immediately after staging. Same-origin static files use cache-first with background refresh; offline navigation can use the cached shell. `release.json` bypasses the shell cache and uses `no-store`. The app registers with `updateViaCache: "none"` after first render and checks release metadata again when the document becomes visible.

When a newer version or build is detected, the app asks the browser to update the Service Worker. The new worker stages its complete shell, activates, removes only obsolete `everbliss-shell-*` caches, claims clients, and notifies open EverBliss windows. Each old page reloads once per target build using a session guard. IndexedDB, local storage, journey state, User Overrides, and Official LKG are not cleared.

## Release rule

Every customer-facing production change must bump `release.json` to a new semantic version before merge. The release-contract workflow rejects customer-facing changes with an unchanged version and verifies generated version/build metadata and the Service Worker build contract. Release process: bump version, merge, Pages deploy, then installed PWAs detect the release and force refresh.

The build SHA is deployment identity only; it is never presented as the customer version. Official dataset versions remain independent from both App version and build SHA.
