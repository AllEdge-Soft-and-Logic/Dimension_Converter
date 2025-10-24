const CACHE_NAME = 'v12.05';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/img/icon.png',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/service-worker.js',
    // Add '/offline.html' if you want offline fallback
];

// Install: Cache critical assets
self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(ASSETS_TO_CACHE);
            await self.skipWaiting();
        })().catch(error => {
            console.error('Failed to cache assets:', error);
        })
    );
});

// Fetch: Serve from cache, update cache if possible
self.addEventListener('fetch', event => {
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(event.request);
            if (cached) return cached;
            try {
                const response = await fetch(event.request);
                if (event.request.method === 'GET' && response.ok) {
                    cache.put(event.request, response.clone());
                }
                return response;
            } catch {
                // Fallback: show offline page if exists
                return cache.match('/offline.html');
            }
        })()
    );
});

// Activate: Remove old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
            await self.clients.claim();
        })()
    );
});
