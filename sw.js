// v2 — цей воркер видаляє всі старі кеші і більше нічого не кешує
const VERSION = 'larika-v2-nocache';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Завжди мережа — ніякого кешу
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => new Response('Offline', {status: 503}))
  );
});
