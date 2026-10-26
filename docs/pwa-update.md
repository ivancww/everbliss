# Automatic Official App Shell update

`scripts/build.js` stamps the immutable deployment commit SHA into the generated `sw.js` and `release.json`. The human-readable App version has one source in root `release.json`; it is not used as a manually maintained cache name.

Each Service Worker install downloads the complete shell into a cache named `everbliss-shell-<deployment SHA>`. Only after staging succeeds does it call `skipWaiting`. Activation removes only prior cache names with the EverBliss-owned prefix, claims the App's clients, and notifies existing windows only when an earlier EverBliss shell cache existed. The page reload handler is bounded once per deployment ID per tab session. The shell never clears LocalStorage or IndexedDB.

All same-origin GETs are network-first and written to the current shell cache; offline requests fall back to that cache. `release.json` is checked with `cache: no-store`. On app startup, the browser calls `registration.update()` so browser and installed standalone PWA discover a later deployed worker on reopen.

`npm test` runs a controlled Service Worker harness across two deployment IDs and verifies new worker detection, activation, safe old cache retirement, client notification, build ID consistency, and persistence being outside shell caches. This is code-level/scripted verification; it is not a physical installed-PWA pass. Device QA is pending.
