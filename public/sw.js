
const CACHE_NAME = 'checksystem-v2.2.0';
const SUPABASE_HOST = 'hjwlkijchjmuzmydjchb.supabase.co';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-16x16.svg',
  '/icons/icon-32x32.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/login',
  '/checklist',
  '/agendamentos',
  '/admin'
];

// Util para decidir se devemos ignorar cache para a request
function shouldBypassCache(req) {
  try {
    const url = new URL(req.url);
    const isSupabase = url.hostname.includes(SUPABASE_HOST);
    const hasAuthHeader =
      req.headers.has('authorization') ||
      req.headers.has('Authorization') ||
      req.headers.has('apikey') ||
      req.headers.has('Apikey');

    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

    // Nunca cachear chamadas do Supabase ou com cabeçalhos de autenticação/apikey
    return isSupabase || hasAuthHeader || isMutation;
  } catch {
    return false;
  }
}

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Opened cache', CACHE_NAME);
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Ignorar cache para Supabase e qualquer request autenticada
  if (shouldBypassCache(req)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => {
        // Fallback se offline (retorna do cache caso exista, ex: assets estáticos)
        return caches.match(req);
      })
    );
    return;
  }

  // Network-first para navegação/HTML para evitar versões antigas
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first para demais requests com atualização em background
  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      });
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background sync tasks
  console.log('Background sync triggered');
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do CheckSystem',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-32x32.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icons/icon-32x32.svg'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-32x32.svg'
      }
    ],
    tag: 'checksystem-notification',
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification('CheckSystem', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
