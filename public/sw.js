const CACHE_NAME = "sable-wallet-v2";

const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/sable-mark.svg",
  "/icons/sable-192.png",
  "/icons/sable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  const url = new URL(request.url);

  // Never intercept API, auth, or server-function requests.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_server/")
  ) {
    return;
  }

  // Never cache HTML/navigation requests. Always let Vercel serve the
  // current application build so a deployment cannot be hidden by SW cache.
  if (request.mode === "navigate" || request.destination === "document") {
    return;
  }

  // Cache only the small, explicitly listed static PWA assets.
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request))
    );
  }
});
