// Service Worker для Ларіки - PWA
// Дозволяє грі працювати офлайн

const CACHE_NAME = 'larika-v2.0.0';
const RUNTIME_CACHE = 'larika-runtime';

// Файли для кешування при встановленні
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/larika_v2.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Встановлення Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Встановлення...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Кешування файлів');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активація - очищення старих кешів
self.addEventListener('activate', event => {
  console.log('[SW] Активація...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map(cacheName => {
            console.log('[SW] Видалення старого кешу:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Обробка запитів - Cache First стратегія
self.addEventListener('fetch', event => {
  // Пропускаємо запити до інших доменів
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Пропускаємо POST запити
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[SW] Відповідь з кешу:', event.request.url);
          return cachedResponse;
        }

        // Немає в кеші - завантажити з мережі
        return fetch(event.request)
          .then(response => {
            // Перевірка валідності відповіді
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонувати відповідь
            const responseToCache = response.clone();

            // Додати в runtime кеш
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('[SW] Помилка завантаження:', error);
            
            // Якщо офлайн - спробувати знайти в runtime кеші
            return caches.match(event.request);
          });
      })
  );
});

// Повідомлення від клієнта
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then(cache => cache.addAll(event.data.urls))
    );
  }
});

// Background Sync (експериментально)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  // Синхронізація прогресу при відновленні з'єднання
  console.log('[SW] Синхронізація прогресу...');
  // TODO: реалізувати синхронізацію з сервером якщо потрібно
}

// Push Notifications (опціонально)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Нове досягнення!',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Відкрити гру'
      },
      {
        action: 'close',
        title: 'Закрити'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Ларіка', options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service Worker завантажено');
