const CACHE_NAME = 'health-tracker-cache-v1';
const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'manifest.json',
    'js/app.js',
    'js/ui/homeUI.js',
    'js/ui/foodUI.js',
    'js/ui/sportUI.js',
    'js/ui/graphUI.js',
    'js/utils/storage.js',
    'js/utils/helpers.js',
    'js/utils/domUtils.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュが見つかればそれを使う
                if (response) {
                    return response;
                }
                // キャッシュになければネットワークから取得
                return fetch(event.request).then(
                    (response) => {
                        // レスポンスが不正な場合（HTTPエラーなど）はキャッシュしない
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // レスポンスをキャッシュにコピーする
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // ホワイトリストにないキャッシュを削除する
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});