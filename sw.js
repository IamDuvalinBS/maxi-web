// Caché para que la página abra casi al instante después de la primera visita.
const V = 'mb-v32';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || r.cache === 'no-store' || u.pathname.endsWith('lista.json')) return;
  if (r.mode === 'navigate') { // la página: primero la red (siempre al día), y si no hay internet, la copia guardada
    e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(V).then(ch => ch.put(r, c)); return x; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.open(V).then(async ch => { // archivos: copia guardada al instante + se actualiza por detrás
    const m = await ch.match(r);
    const net = fetch(r).then(x => { if (x.ok) ch.put(r, x.clone()); return x; }).catch(() => m);
    return m || net;
  }));
});
