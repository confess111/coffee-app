const CACHE = 'cafe-latte-v47';
const ASSETS = ['./', './index.html', './copy.html', './manifest.json', './icon-192.png', './icon-512.png', './cover.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    for (const url of ASSETS) {
      try { await c.add(url); } catch (err) { console.warn('skip cache', url); }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isNav = url.pathname.endsWith('index.html') || url.pathname.endsWith('copy.html') || url.pathname === '/' || url.pathname.endsWith('/');
  if (isNav) {
    // 导航请求走网络优先，保证每次都拿到最新页面
    e.respondWith(
      fetch(e.request).then((r) => {
        const cp = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, cp));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});
