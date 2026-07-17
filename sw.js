// Tolaanfur Service Worker
// v2: friends.html toegevoegd, alleen GET + eigen domein wordt gecachet,
//     oude cache (met daarin verouderde API-antwoorden) wordt opgeruimd.
const CACHE = 'tolaanfur-v3';
const FILES = [
  '/',
  '/index.html',
  '/lessons.html',
  '/sirah_quiz.html',
  '/tasbih_game.html',
  '/prayer.html',
  '/verhalen.html',
  '/photos.html',
  '/videos.html',
  '/announcements.html',
  '/admin.html',
  '/search.html',
  '/userprofile.html',
  '/media.html',
  '/community.html',
  '/friends.html',
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
  // FIX: alleen GET-verzoeken afhandelen (cache.put crasht op POST e.d.)
  if(e.request.method !== 'GET') return;

  // Geen Firebase calls cachen
  if(e.request.url.indexOf('firestore') >= 0 ||
     e.request.url.indexOf('firebase') >= 0 ||
     e.request.url.indexOf('googleapis') >= 0) {
    return;
  }

  // FIX: alleen bestanden van ons eigen domein in de cache bewaren.
  // Externe API's (gebedstijden, locatie, azan-audio) worden dus nooit
  // als "vers" uit de cache geserveerd wanneer je offline bent.
  var sameOrigin = false;
  try { sameOrigin = new URL(e.request.url).origin === self.location.origin; } catch(err) {}

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        if(sameOrigin && response && response.ok) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Offline: gebruik cache (alleen eigen bestanden staan erin)
        return caches.match(e.request);
      })
  );
});
