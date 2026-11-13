// Service worker do protótipo: a casca do site fica guardada para abrir sem internet; o HTML vai sempre à rede primeiro.
const CACHE = 'm7-v1';
const CASCA = ['./', 'index.html', 'estilo.css', 'app.js', 'manifest.webmanifest', 'assets/icone.svg', 'assets/hero-q.webp', 'assets/hero-960.webp'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  if (r.mode === 'navigate' || r.url.endsWith('.js') || r.url.endsWith('.css')) {
    e.respondWith(fetch(r).then((resp) => { const cp = resp.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); return resp; }).catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((resp) => { const cp = resp.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); return resp; })));
  }
});
