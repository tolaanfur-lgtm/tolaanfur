// Tolaanfur Service Worker
const CACHE = 'tolaanfur-v1';
const FILES = [
  '/',
  '/index.html',
  '/lessons.html',
  '/sirah_quiz.html',
  '/tasbih_game.html',
  '/prayer.html',
  '/media.html',
  '/community.html',
  '/calendar.html',
  '/notifications.html',
  '/icon.png',
  '/manifest.json'
];

// Installeer - cache alle bestanden
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

// Activeer - verwijder oude cache
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, dan cache
self.addEventListener('fetch', function(e) {
  // Alleen HTML/JS/CSS cachen, geen Firebase calls
  if(e.request.url.indexOf('firestore') >= 0 ||
     e.request.url.indexOf('firebase') >= 0 ||
     e.request.url.indexOf('googleapis') >= 0) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Update cache met nieuwe versie
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        // Offline: gebruik cache
        return caches.match(e.request);
      })
  );
});
