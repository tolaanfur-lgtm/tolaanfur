// Firebase Messaging Service Worker
// Tolaanfur — Push Notifications

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD4o7SprtOMn7F4iFjVmPB37C1Tf7mICDk",
  authDomain: "tolaanfur-5b5f5.firebaseapp.com",
  projectId: "tolaanfur-5b5f5",
  storageBucket: "tolaanfur-5b5f5.firebasestorage.app",
  messagingSenderId: "188890145767",
  appId: "1:188890145767:web:6ec8fe6fae4ddd90891342"
});

const messaging = firebase.messaging();

// Toon notificatie als app op achtergrond is
messaging.onBackgroundMessage(function(payload) {
  console.log('Background message:', payload);
  
  const title = payload.notification?.title || 'Tolaanfur';
  const body = payload.notification?.body || 'New notification';
  const icon = payload.notification?.icon || '/icon.png';

  self.registration.showNotification(title, {
    body: body,
    icon: icon,
    badge: '/icon.png',
    tag: payload.data?.tag || 'tolaanfur',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Open App' }
    ]
  });
});

// Klik op notificatie opent app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('https://tolaanfur-sigma.vercel.app');
      }
    })
  );
});
