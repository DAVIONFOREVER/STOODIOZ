// A simple service worker to handle push notifications.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting(); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  // Take control of all pages under this scope immediately.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const title = data.title || 'Stoodioz';
    const options = {
      body: data.body,
      icon: 'https://picsum.photos/seed/stoodiozicon/192/192', 
      badge: 'https://picsum.photos/seed/stoodiozbadge/72/72', 
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
      console.error('Error parsing push data:', e);
      const title = 'Stoodioz';
      const options = {
          body: event.data.text(),
          icon: 'https://picsum.photos/seed/stoodiozicon/192/192',
          badge: 'https://picsum.photos/seed/stoodiozbadge/72/72',
      };
      event.waitUntil(self.registration.showNotification(title, options));
  }
});