// Service Worker for FLAYM Web Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Support actual Push Notifications via Web Push API
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'FLAYM Order Update! 🔥';
  const options = {
    body: data.body || 'Your order status has changed.',
    icon: '/src/assets/images/flaym_hero_meat_1784290684310.jpg',
    badge: '/src/assets/images/flaym_hero_meat_1784290684310.jpg',
    data: data.url || '/',
    vibrate: [200, 100, 200],
    tag: data.tag || 'flaym-order-notification',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Support local messaging from the client (useful as a robust fallback/alternative)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload;
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: '/src/assets/images/flaym_hero_meat_1784290684310.jpg',
        badge: '/src/assets/images/flaym_hero_meat_1784290684310.jpg',
        vibrate: [200, 100, 200],
        ...options
      })
    );
  }
});

// Click action on the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
