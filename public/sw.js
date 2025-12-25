/**
 * Service Worker - 用于缓存 WebLLM 模型文件
 * 解决模型加载慢的问题，首次下载后永久缓存
 */

const CACHE_NAME = 'liulix-webllm-cache-v1';
const MODEL_CACHE_NAME = 'liulix-model-files';

// 需要预缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
];

// WebLLM 模型文件的特征URL模式
const MODEL_URL_PATTERNS = [
    /huggingface\.co.*\.wasm$/i,
    /huggingface\.co.*\.bin$/i,
    /huggingface\.co.*\.safetensors$/i,
    /huggingface\.co.*tokenizer/i,
    /mlc-ai.*\.wasm$/i,
    /mlc-ai.*\.bin$/i,
];

/**
 * 判断是否是模型文件请求
 */
function isModelRequest(url) {
    return MODEL_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * 安装事件 - 预缓存静态资源
 */
self.addEventListener('install', (event) => {
    console.log('[SW] 安装中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting()) // 立即激活
    );
});

/**
 * 激活事件 - 清理旧缓存
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] 激活中...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== MODEL_CACHE_NAME) {
                        console.log('[SW] 删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // 立即接管所有页面
    );
});

/**
 * 请求拦截 - 缓存策略
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = request.url;

    // 只处理 GET 请求
    if (request.method !== 'GET') return;

    // 模型文件：Cache First（优先使用缓存，永久缓存）
    // WebLLM会同时使用SW缓存和IndexedDB，两层缓存提升性能
    if (isModelRequest(url)) {
        event.respondWith(
            caches.open(MODEL_CACHE_NAME).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    if (cachedResponse) {
                        // 缓存命中，直接返回
                        return cachedResponse;
                    }

                    // 缓存未命中，下载并缓存
                    return fetch(request).then(response => {
                        if (response.ok) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    });
                });
            })
        );
        return;
    }

    // 静态资源：Network First（优先网络，失败时使用缓存）
    event.respondWith(
        fetch(request).then(response => {
            // 成功响应，更新缓存
            if (response.ok && request.url.startsWith(self.location.origin)) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseClone);
                });
            }
            return response;
        }).catch(() => {
            // 网络失败，使用缓存
            return caches.match(request).then(cachedResponse => {
                if (cachedResponse) {
                    console.log('[SW] 离线模式，使用缓存:', request.url);
                    return cachedResponse;
                }
                // 缓存也没有，返回离线页面或错误
                throw new Error('网络和缓存均不可用');
            });
        })
    );
});

/**
 * 消息监听 - 支持手动清除缓存
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }).then(() => {
                console.log('[SW] 所有缓存已清除');
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});
