// Service Worker for aggressive cache busting
const CACHE_NAME = `command-center-${Date.now()}`;

self.addEventListener("install", (event) => {
  console.log("Service Worker installing with cache:", CACHE_NAME);
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  // Always go to network first, no caching for development
  event.respondWith(
    fetch(event.request.clone()).catch(() => {
      // Only serve from cache if network fails
      return caches.match(event.request);
    })
  );
});

// Listen for messages to force refresh
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FORCE_REFRESH") {
    // Notify all clients to refresh
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "REFRESH" });
      });
    });
  }
});
