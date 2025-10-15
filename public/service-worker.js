
// A simple service worker for caching the app shell
const CACHE_NAME = 'smart-extractor-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // NOTE: You might need to add other static assets here like CSS, JS bundles, etc.
  // For this project structure, the main files are sufficient for a basic offline experience.
];

// Install event: open a cache and add the app shell files to it
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request);
      })
  );
});
