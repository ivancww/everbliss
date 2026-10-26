/* Build replaces only __BUILD_ID__ with the immutable deployment commit SHA. */
const BUILD_ID = "__BUILD_ID__";
const CACHE_PREFIX = "everbliss-shell-";
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;
const SHELL_FILES = ["./", "./index.html", "./manifest.webmanifest", "./release.json", "./src/ui/tokens.css", "./src/ui/styles.css", "./src/app/main.js", "./src/app/plan-input.js", "./src/admin/admin-auth.js", "./src/admin/admin-view.js", "./src/admin/admin-workflow.js", "./src/calculations/engine.js", "./src/calculations/full-outcomes.js", "./src/data/official/income-rates.js", "./src/data/official/official-multipliers.js", "./src/data/official/official-dataset.js", "./src/data/official/everbliss-anchors.js", "./src/data/government/oala.js", "./src/data/metadata/app-config.js", "./src/storage/state.js", "./assets/everbliss.svg"];

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

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const freshRequest = new Request(request, { cache: "no-store" });
      const response = await fetch(freshRequest);
      if (response && response.ok && response.type !== "opaque") await cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(request) || await cache.match("./index.html");
      if (cached) return cached;
      throw error;
    }
  })());
});
