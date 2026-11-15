const C = 'saraati-v4';
const FILES = ['./', './index.html', './style.css', './app.js', './engine.js', './i18n.js', './meals.js', './quicklog.js', './foods.js', './manifest.json', './icon.svg'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(FILES))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())));
// الشبكة أولا (عشان التحديثات توصل) وبعدين الكاش للأوفلاين
self.addEventListener('fetch', e => e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); return res; }).catch(() => caches.match(e.request, { ignoreSearch: true }))));
