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
      // Using placeholder icons as no assets are available
      icon: 'https://source.unsplash.com/seeded/icon/192x192', 
      badge: 'https://source.unsplash.com/seeded/badge/72x72', 
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
      console.error('Error parsing push data:', e);
      const title = 'Stoodioz';
      const options = {
          body: event.data.text(),
          icon: 'https://source.unsplash.com/seeded/icon/192x192',
          badge: 'https://source.unsplash.com/seeded/badge/72x72',
      };
      event.waitUntil(self.registration.showNotification(title, options));
  }
});