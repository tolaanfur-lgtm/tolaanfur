// Tolaanfur Service Worker
// v6: offline-cache EN push-meldingen in één service worker (voorkomt botsing).

// ── Push-meldingen (Firebase Cloud Messaging) ──
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
try {
  firebase.initializeApp({
    apiKey: "AIzaSyD4o7SprtOMn7F4iFjVmPB37C1Tf7mICDk",
    authDomain: "tolaanfur-5b5f5.firebaseapp.com",
    projectId: "tolaanfur-5b5f5",
    storageBucket: "tolaanfur-5b5f5.firebasestorage.app",
    messagingSenderId: "188890145767",
    appId: "1:188890145767:web:6ec8fe6fae4ddd90891342"
  });
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage(function (payload) {
    const titel = (payload.notification && payload.notification.title) || "Tolaanfur";
    self.registration.showNotification(titel, {
      body: (payload.notification && payload.notification.body) || "",
      icon: "/img/avatars/av_01.png",
      badge: "/img/avatars/av_01.png",
      data: { link: "/?screen=notifications" }
    });
  });
} catch (e) { /* messaging niet beschikbaar */ }

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const doel = (event.notification.data && event.notification.data.link) || "/?screen=notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (lijst) {
      // Staat de app al open? Focus erop en stuur hem naar meldingen.
      for (const c of lijst) {
        if (c.url.includes("tolaanfur")) {
          c.postMessage({ type: "open-notifications" });
          return c.focus();
        }
      }
      // Anders: open de app vers op de meldingen-plek
      if (clients.openWindow) return clients.openWindow(doel);
    })
  );
});
const CACHE = 'tolaanfur-v40';
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
  '/azkar.html',
  '/daily.html',
  '/daily/content.json',
  '/azkar/adhkar.json',
  '/audio/lijst.txt',
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
  '/img/home/quran_1.jpg',
  '/img/home/quran_2.jpg',
  '/img/home/quran_loop.mp4',
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
