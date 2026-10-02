/* Service worker del Rellotge de Pèndol: funciona sense connexió.
   Quan canviïs index.html, puja el número de VERSIO perquè els dispositius agafin la versió nova. */
const VERSIO = 'rellotge-v2';
const BASE = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-64.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIO).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSIO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Temps i ubicació: sempre en directe (la pàgina ja gestiona l'error si no hi ha xarxa)
  if (/open-meteo\.com|bigdatacloud\.net/.test(url.hostname)) return;
  // Pàgina: primer la xarxa (per rebre actualitzacions), si falla la còpia guardada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSIO).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Fonts i fitxers propis: còpia guardada i actualització en segon pla
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(VERSIO).then(c => c.put(req, cp)); } return r; })
      .catch(() => hit);
    return hit || net;
  }));
});
