self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Minimal fetch listener to trigger the "Add to Home Screen" prompt
  event.respondWith(fetch(event.request));
});
