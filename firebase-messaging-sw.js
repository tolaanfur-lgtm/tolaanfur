// ============================================================
// TOLAANFUR — Service worker voor push-meldingen op de achtergrond
// Dit bestand ontvangt meldingen ook als de app dicht is.
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD4o7SprtOMn7F4iFjVmPB37C1Tf7mICDk",
  authDomain: "tolaanfur-5b5f5.firebaseapp.com",
  projectId: "tolaanfur-5b5f5",
  storageBucket: "tolaanfur-5b5f5.firebasestorage.app",
  messagingSenderId: "188890145767",
  appId: "1:188890145767:web:6ec8fe6fae4ddd90891342",
});

const messaging = firebase.messaging();

// Toont de melding wanneer de app op de achtergrond staat
messaging.onBackgroundMessage(function (payload) {
  const titel = (payload.notification && payload.notification.title) || "Tolaanfur";
  const opties = {
    body: (payload.notification && payload.notification.body) || "",
    icon: "/img/avatars/av_01.png",
    badge: "/img/avatars/av_01.png",
    data: { link: "/?screen=notifications" },
  };
  self.registration.showNotification(titel, opties);
});

// Bij het aantikken van de melding: open de app op het meldingenscherm
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (lijst) {
      for (const c of lijst) {
        if (c.url.includes("tolaanfur") && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow("/?screen=notifications");
    })
  );
});
