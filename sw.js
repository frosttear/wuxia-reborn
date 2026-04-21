// Service worker: cache-first for all image assets
// Bump CACHE_NAME when images are updated to force re-download
const CACHE_NAME = 'wuxia-assets-v0.12.9';

const PRECACHE = [
    'assets/characters/player.png',
    'assets/characters/li-yunshu.png',
    'assets/characters/wang-tie.png',
    'assets/characters/mysterious-elder.png',
    'assets/characters/yan-chixing.png',
    'assets/characters/ling-xue.png',
    'assets/characters/su-qing.png',
    'assets/illustrations/li-yunshu-ending.png',
    'assets/illustrations/wang-tie-ending.png',
    'assets/illustrations/mysterious-elder-ending.png',
    'assets/illustrations/yan-chixing-ending.png',
    'assets/illustrations/su-qing-ending.png',
    'assets/illustrations/ling-xue-ending.png',
    'assets/illustrations/sword-soul-win.png',
    'assets/illustrations/sword-soul-lose.png',
    'assets/illustrations/tianmo-win.png',
    'assets/illustrations/tianmo-lose.png',
    'assets/illustrations/rebirth.png',
    'assets/illustrations/wuxiang-unlock.png',
];

// Install: pre-fetch all images into cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            // allSettled so a missing image doesn't abort the whole install
            Promise.allSettled(PRECACHE.map(url => cache.add(url)))
        ).then(() => self.skipWaiting())
    );
});

// Activate: delete caches from older versions
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: serve images from cache; fall back to network and cache the result
self.addEventListener('fetch', event => {
    if (!/\.(png|jpg|jpeg|svg|webp)(\?.*)?$/.test(event.request.url)) return;
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
