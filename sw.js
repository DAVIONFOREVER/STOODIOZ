// A simple service worker to handle push notifications.
import { generatePlaceholderUrl } from './utils/location';

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
  
  const iconUrl = 'data:image/svg+xml,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3e%3cpath d="M50 5 L95 27.5 L95 72.5 L50 95 L5 72.5 L5 27.5 Z" stroke="%23f97316" stroke-width="5" fill="none" /%3e%3ccircle cx="50" cy="50" r="15" fill="%23f97316" /%3e%3c/svg%3e';

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const title = data.title || 'Stoodioz';
    const options = {
      body: data.body,
      icon: iconUrl, 
      badge: iconUrl, 
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
      console.error('Error parsing push data:', e);
      const title = 'Stoodioz';
      const options = {
          body: event.data.text(),
          icon: iconUrl,
          badge: iconUrl,
      };
      event.waitUntil(self.registration.showNotification(title, options));
  }
});