
const CACHE_NAME = 'mijn-gezond-v2-stable';
const ASSETS = [
  'index.html',
  'manifest.json',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'constants.ts',
  'translations.ts',
  'services/calculator.ts',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://esm.sh/react@19.0.0',
  'https://esm.sh/react-dom@19.0.0',
  'https://esm.sh/react-dom@19.0.0/client',
  'https://esm.sh/lucide-react@0.475.0?external=react',
  'https://cdn-icons-png.flaticon.com/512/3062/3062276.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching V2-Stable assets');
      return Promise.allSettled(ASSETS.map(url => 
        fetch(url, { cache: 'no-store' }).then(response => {
          if (response.ok) return cache.put(url, response);
        }).catch(err => console.error(`Failed to pre-cache ${url}:`, err))
      ));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return cache.match('index.html');
          }
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
