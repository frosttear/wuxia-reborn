// Service worker: cache-first for all image assets
// Bump CACHE_NAME when images are updated to force re-download
const CACHE_NAME = 'wuxia-v0.27.0';

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

const ASSET_RE  = /\.(png|jpg|jpeg|svg|webp|ogg|mp3)(\?.*)?$/;
const FONT_RE   = /\.(woff2?|ttf|otf)(\?.*)?$|fonts\.gstatic\.com/;
const FONT_TIMEOUT_MS = 3000;

// Fetch: cache-first for images/audio; cache-first-with-network-timeout for fonts
self.addEventListener('fetch', event => {
    const url = event.request.url;

    if (ASSET_RE.test(url)) {
        // Images & audio: cache-first, lazy populate
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
        return;
    }

    if (FONT_RE.test(url)) {
        // Fonts: cache-first; on miss, race network vs timeout so a blocked
        // Google Fonts CDN doesn't stall the page for more than 3 seconds.
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                const networkFetch = fetch(event.request).then(resp => {
                    if (resp.ok) {
                        const clone = resp.clone();
                        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    }
                    return resp;
                });
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('font timeout')), FONT_TIMEOUT_MS)
                );
                return Promise.race([networkFetch, timeout]).catch(() => {
                    // Font unavailable — return empty 200 so the browser uses fallback
                    return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
                });
            })
        );
    }
});
