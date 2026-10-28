/* Build replaces __BUILD_ID__ with the immutable deployment commit SHA. */
const BUILD_ID = "__BUILD_ID__";
const CACHE_PREFIX = "everbliss-shell-";
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;
const SHELL_FILES = ["./", "./index.html", "./build-info.js", "./manifest.webmanifest", "./src/ui/tokens.css", "./src/ui/styles.css", "./src/app/main.js", "./src/app/plan-input.js", "./src/app/journey-model.js", "./src/app/oala-assessment.js", "./src/app/entry-surfaces.js", "./src/app/local-first-startup.js", "./src/pwa/release-check.js", "./src/admin/admin-auth.js", "./src/admin/admin-view.js", "./src/admin/admin-workflow.js", "./src/calculations/engine.js", "./src/calculations/full-outcomes.js", "./src/data/official/income-rates.js", "./src/data/official/official-multipliers.js", "./src/data/official/official-dataset.js", "./src/data/official/product-config.js", "./src/data/official/everbliss-anchors.js", "./src/data/government/oala.js", "./src/data/metadata/app-config.js", "./src/storage/state.js", "./assets/aia/owner-reference/health-extra-income.jpeg", "./assets/aia/owner-reference/designated-recipient-option.jpeg", "./assets/aia/owner-reference/designated-recipient-eligibility.jpeg", "./assets/aia/owner-reference/healthy-ageing-four-highlights.jpeg", "./assets/aia/owner-reference/healthy-ageing-services.jpeg", "./assets/aia/monthly-income.webp", "./assets/aia/advance-timeline.webp", "./assets/aia/service-structure.webp", "./assets/everbliss.svg"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const previous = names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME);
    await Promise.all(previous.map(name => caches.delete(name)));
    await self.clients.claim();
    if (previous.length) {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) client.postMessage({ type: "EVERBLISS_SHELL_UPDATED", buildId: BUILD_ID });
    }
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "EVERBLISS_SKIP_WAITING") event.waitUntil(self.skipWaiting());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/release.json")) {
    event.respondWith(fetch(new Request(request, { cache: "no-store" })));
    return;
  }
  const cachePromise = caches.open(CACHE_NAME);
  const refresh = cachePromise.then(cache => fetch(new Request(request, { cache: "no-store" })).then(async response => {
      if (response?.ok && response.type !== "opaque") await cache.put(request, response.clone());
      return response;
    }));
  event.waitUntil(refresh.catch(() => {}));
  event.respondWith((async () => {
    const cache = await cachePromise;
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    try { return await refresh; }
    catch (error) {
      const shell = await cache.match("./index.html");
      if (shell && (request.mode === "navigate" || url.pathname.endsWith("/"))) return shell;
      throw error;
    }
  })());
});
