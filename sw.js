// v3 — примусово видаляє ВСІ кеші
const V = 'v3';
self.addEventListener('install', e => {
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request.url+'?v='+V, {cache:'no-store'}).catch(()=>fetch(e.request)));
});
