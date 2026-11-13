const cacheName = 'play-jam-mobile-v3';
const files = ['./index.html', './css/app.css', './js/icons.js', './assets/audio/bank.js',
  './js/audio.js', './js/model.js', './js/app.js', './js/install.js',
  './manifest.webmanifest', './app-icon.png', './app-icon-192.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files)));
});

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).catch(async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(request) ||
      (request.mode === 'navigate' ? await cache.match('./index.html') : Response.error());
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('play-jam-mobile-') && key !== cacheName)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
