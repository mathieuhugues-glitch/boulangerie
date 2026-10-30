/* La boulangerie - offline cache (cache first, refreshed in background) */
const C = 'boul-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/style.css', 'css/fonts.css', 'js/money.js', 'js/sound.js', 'js/voice.js', 'js/game.js',
  'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/rubik-latin-700-normal.woff2', 'fonts/rubik-latin-800-normal.woff2', 'fonts/rubik-latin-ext-700-normal.woff2', 'fonts/rubik-latin-ext-800-normal.woff2'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
