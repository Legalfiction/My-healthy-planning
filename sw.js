
const CACHE_NAME = 'mijn-gezond-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/translations.ts',
  '/services/calculator.ts',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://esm.sh/react@^19.2.3',
  'https://esm.sh/react-dom@^19.2.3',
  'https://esm.sh/react-dom@^19.2.3/client',
  'https://esm.sh/lucide-react@^0.562.0',
  'https://cdn-icons-png.flaticon.com/512/3062/3062276.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We gebruiken een meer vergevingsgezinde addAll om te voorkomen dat 1 ontbrekende file de hele installatie blokkeert
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Voor navigatie en scripts gebruiken we Network First
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'script' || 
      event.request.url.includes('.tsx') ||
      event.request.url.includes('esm.sh')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Voor afbeeldingen en fonts gebruiken we Cache First
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
