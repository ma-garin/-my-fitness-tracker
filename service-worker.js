const CACHE_NAME = 'fitness-tracker-v1';
const urlsToCache = [
    './', // index.html
    './index.html',
    './style.css',
    './script.js',
    'https://cdn.jsdelivr.net/npm/chart.js', // Chart.js CDNもキャッシュ
    './manifest.json',
    // アイコン画像をキャッシュする場合はここにパスを追加
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './icons/icon-maskable-192x192.png',
    './icons/icon-maskable-512x512.png'
];

// インストールイベント: キャッシュを開いて必要なアセットを追加
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// フェッチイベント: リクエストをインターセプトしてキャッシュから提供
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュにレスポンスがあればそれを使用
                if (response) {
                    return response;
                }
                // なければネットワークから取得
                return fetch(event.request);
            })
    );
});

// アクティベートイベント: 古いキャッシュをクリア
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName); // 不要なキャッシュを削除
                    }
                })
            );
        })
    );
});