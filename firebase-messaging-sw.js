// firebase-messaging-sw.js — Service Worker para notificaciones push en background
// Este archivo debe estar en la raíz del proyecto (mismo nivel que index.html)

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ⚠️ IMPORTANTE: Usa la misma configuración de Firebase que en index.html
firebase.initializeApp({
  apiKey: "AIzaSyAJXumzB7iyw5BUStuRg3oBZUUvenmVLNg",
  authDomain: "optinet-gpon.firebaseapp.com",
  projectId: "optinet-gpon",
  storageBucket: "optinet-gpon.firebasestorage.app",
  messagingSenderId: "618343246245",
  appId: "1:618343246245:web:baba9fcd33f73c0799604c"
});

const messaging = firebase.messaging();

// Manejar mensajes en background (app cerrada o en segundo plano)
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Mensaje en background:', payload);

  const notificationTitle = payload.notification?.title || 'Optinet';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: payload.data?.tipo || 'optinet-notif',
    data: payload.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Al hacer clic en la notificación, abrir/enfocar la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
