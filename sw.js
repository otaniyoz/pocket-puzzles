self.addEventListener('install', function(event) {
  if (self.skipWaiting) { self.skipWaiting(); }

  event.waitUntil(
    caches.open('pocket-puzzles-sw-v2').then(function(cache) {
      return cache.addAll([
        '/pocket-puzzles/',
        '/pocket-puzzles/style.css',
        '/pocket-puzzles/favicon.png',
        '/pocket-puzzles/script.js',
        '/pocket-puzzles/fonts/IBMPlexSans-Bold.woff',
        '/pocket-puzzles/fonts/IBMPlexSans-Regular.woff'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});