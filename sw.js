const CACHE_NAME = 'bussola-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Cache-first for the app shell, falling back to network; network-first for
// everything else (Google Fonts, etc.) so content stays fresh when online.
self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  var isAppShell = url.origin === self.location.origin;

  if (isAppShell){
    event.respondWith(
      caches.match(event.request).then(function(cached){
        var fetchPromise = fetch(event.request).then(function(response){
          if (response && response.ok){
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
          }
          return response;
        }).catch(function(){ return cached; });
        return cached || fetchPromise;
      })
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(function(){ return caches.match(event.request); })
    );
  }
});
