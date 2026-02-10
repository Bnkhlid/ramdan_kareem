const CACHE_NAME = 'ramadan-v25-nitro-final';
const urlsToCache = [
    '/',
    '/index.html',
    '/quran.html',
    '/prayer.html',
    '/tracker.html',
    '/adhkar.html',
    '/names.html',
    '/quiz.html',
    '/tafsir.html',
    '/bookmarks.html',
    '/hadith.html',
    '/reciters.html',
    '/radio.html',
    '/tasbih.html',
    '/verse.html',
    '/cards.html',
    '/zakat.html',
    '/khatma.html',
    '/moshaf.html',
    '/css/style.css?v=v_spa_fixed_v17',
    '/js/main.js?v=v_spa_fixed_v17',
    '/js/notifications.js?v=v_spa_fixed_v17',
    '/js/share-utils.js?v=v_spa_fixed_v17',
    '/data/adkar.json',
    '/data/Allah-99-names.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache V9');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Stale-While-Revalidate for critical app files
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Bypass for streaming and external APIs
    if (url.hostname.includes('radiojar.com') ||
        url.hostname.includes('qurango.net') ||
        url.hostname.includes('mp3quran.net') ||
        url.hostname.includes('api.aladhan.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
        return;
    }

    const isAppShell = event.request.mode === 'navigate' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css');

    if (isAppShell) {
        // Stale-While-Revalidate strategy
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchedResponse = fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    }).catch(() => null);

                    return cachedResponse || fetchedResponse;
                });
            })
        );
    } else {
        // Cache-First with Network Fallback
        event.respondWith(
            caches.match(event.request)
                .then((response) => response || fetch(event.request))
        );
    }
});

// Push notification event (unchanged)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'رمضان كريم';
    const options = {
        body: data.body || 'تذكير من تطبيق رمضان',
        icon: '/images/icon-192.png?v=1',
        badge: '/images/icon-192.png?v=1',
        vibrate: [200, 100, 200],
        tag: data.tag || 'ramadan-notification',
        data: { url: data.url || '/index.html' },
        dir: 'rtl',
        lang: 'ar'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event (unchanged)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/index.html';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                for (let client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) return client.focus();
                }
                if (clients.openWindow) return clients.openWindow(urlToOpen);
            })
    );
});

