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
  '/quran.html',
  '/img/avatars/av_01.png',
  '/img/avatars/av_02.png',
  '/img/avatars/av_03.png',
  '/img/avatars/av_04.png',
  '/img/avatars/av_05.png',
  '/img/avatars/av_06.png',
  '/img/avatars/av_07.png',
  '/img/avatars/av_08.png',
  '/img/avatars/av_09.png',
  '/img/avatars/av_10.png',
  '/img/avatars/av_11.png',
  '/img/avatars/av_12.png',
  '/img/avatars/av_13.png',
  '/img/avatars/av_14.png',
  '/img/avatars/av_15.png',
  '/img/avatars/av_16.png',
  '/img/avatars/av_17.png',
  '/img/avatars/av_18.png',
  '/img/avatars/av_19.png',
  '/img/avatars/av_20.png',
  '/img/avatars/av_21.png',
  '/img/avatars/av_22.png',
  '/img/avatars/av_23.png',
  '/img/avatars/av_24.png',
  '/img/avatars/av_25.png',
  '/img/avatars/av_26.png',
  '/img/avatars/av_27.png',
  '/img/avatars/av_28.png',
  '/img/avatars/av_29.png',
  '/img/avatars/av_30.png',
  '/img/scenes/sc_01.jpg',
  '/img/scenes/sc_02.jpg',
  '/img/scenes/sc_03.jpg',
  '/img/scenes/sc_04.jpg',
  '/img/scenes/sc_05.jpg',
  '/img/scenes/sc_06.jpg',
  '/img/scenes/sc_07.jpg',
  '/img/scenes/sc_08.jpg',
  '/img/scenes/sc_09.jpg',
  '/img/scenes/sc_10.jpg',
  '/img/scenes/sc_11.jpg',
  '/img/scenes/sc_12.jpg',
  '/img/scenes/sc_13.jpg',
  '/img/scenes/sc_14.jpg',
  '/img/scenes/sc_15.jpg',
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
