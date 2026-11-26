const CACHE_NAME = "points-student-shell-v18";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./question-hunter-3d.js"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("points-student-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  event.respondWith(fetch(request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
    return response;
  }).catch(() => caches.match("./index.html")));
});
