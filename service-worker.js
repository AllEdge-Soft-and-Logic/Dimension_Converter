const CACHE_NAME = 'v11.03';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/img/icon.png',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/service-worker.js',
    // Add other static assets here
];

// Install the service worker and cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting()) // Activate the new service worker immediately
            .catch((error) => {
                console.error('Failed to cache assets:', error);
            })
    );
});

// Fetch cached assets or fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Fetch from network if not in cache
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache the new response for future requests
                        if (event.request.method === 'GET' && networkResponse.ok) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseToCache));
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Fallback to a custom offline page or response
                        return caches.match('/offline.html'); // Ensure you have an offline.html file
                    });
            })
    );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim()) // Take control of all clients immediately
    );
});