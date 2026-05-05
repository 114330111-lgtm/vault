const CACHE = 'vault-v2';
const SHELL = ['./vault.html', './vault-manifest.json', './vault-icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k.startsWith('vault-')).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // 同步、AI、圖片代理等外部請求一律走網路
  const url = e.request.url;
  if (url.includes('api.github.com') ||
      url.includes('api.anthropic.com') ||
      url.includes('r.jina.ai') ||
      url.includes('allorigins.win') ||
      url.includes('google.com/s2/favicons')) return;

  // Network-first：先抓最新，失敗才用快取（離線可用）
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request))
  );
});
