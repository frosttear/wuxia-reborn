// Service worker: cache-first for all image assets
// Bump CACHE_NAME when images are updated to force re-download
const CACHE_NAME = 'wuxia-v0.21.22';

// Install: activate immediately without blocking on image downloads
// Images are cached lazily on first access via the fetch handler below
self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

// Activate: delete caches from older versions
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: serve images and audio from cache; fall back to network and cache the result
self.addEventListener('fetch', event => {
    if (!/\.(png|jpg|jpeg|svg|webp|ogg|mp3)(\?.*)?$/.test(event.request.url)) return;
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(resp => {
                if (resp.ok) {
                    const clone = resp.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                }
                return resp;
            });
        })
    );
});
