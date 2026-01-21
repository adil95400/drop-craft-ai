// Service Worker pour PWA Drop Craft AI - Mode Hors Ligne Complet
const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `dropcraft-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dropcraft-dynamic-v${CACHE_VERSION}`;
const API_CACHE = `dropcraft-api-v${CACHE_VERSION}`;
const IMAGE_CACHE = `dropcraft-images-v${CACHE_VERSION}`;

// Ressources statiques essentielles à précacher
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Patterns pour le cache API
const API_PATTERNS = [
  /\/rest\/v1\/(products|orders|suppliers|customers)/,
  /\/functions\/v1\//
];

// Durée de vie du cache API (5 minutes)
const API_CACHE_DURATION = 5 * 60 * 1000;

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Précacher les ressources statiques
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Some static assets failed to cache:', err);
        });
      }),
      // Préparer les caches dynamiques
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
      caches.open(IMAGE_CACHE)
    ]).then(() => {
      console.log('[SW] All caches initialized');
      return self.skipWaiting();
    })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Stratégies de cache
const cacheStrategies = {
  // Network First - Pour les données critiques
  networkFirst: async (request, cacheName) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  },

  // Cache First - Pour les ressources statiques
  cacheFirst: async (request, cacheName) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Rafraîchir en background
      fetch(request).then((response) => {
        if (response.ok) {
          caches.open(cacheName).then((cache) => cache.put(request, response));
        }
      }).catch(() => {});
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  },

  // Stale While Revalidate - Pour le contenu semi-dynamique
  staleWhileRevalidate: async (request, cacheName) => {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(cacheName).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
      }
      return networkResponse;
    }).catch(() => cachedResponse);

    return cachedResponse || fetchPromise;
  }
};

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes chrome-extension et autres
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Stratégie pour les images
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(cacheStrategies.cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Stratégie pour les API Supabase
  if (url.hostname.includes('supabase') || API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      cacheStrategies.networkFirst(request, API_CACHE).catch(async () => {
        // Retourner une réponse offline pour les API
        return new Response(
          JSON.stringify({ 
            error: 'offline', 
            message: 'Vous êtes hors ligne. Les données seront synchronisées automatiquement.',
            cached: true 
          }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Stratégie pour les fichiers statiques (JS, CSS)
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    event.respondWith(cacheStrategies.cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Stratégie pour les pages HTML - Network First avec fallback offline
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      cacheStrategies.networkFirst(request, DYNAMIC_CACHE).catch(async () => {
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) {
          return offlinePage;
        }
        return new Response(
          `<!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mode Hors Ligne - ShopOpti</title>
            <style>
              body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
              .container { text-align: center; padding: 2rem; }
              h1 { color: #333; }
              p { color: #666; }
              button { padding: 0.75rem 1.5rem; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 1rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📡 Mode Hors Ligne</h1>
              <p>Vous êtes actuellement hors ligne. Vérifiez votre connexion internet.</p>
              <button onclick="window.location.reload()">Réessayer</button>
            </div>
          </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Par défaut: Stale While Revalidate
  event.respondWith(cacheStrategies.staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// IndexedDB pour les données offline
const DB_NAME = 'shopopti-offline';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store pour les actions en attente
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      }
      
      // Store pour les données cachées
      if (!db.objectStoreNames.contains('cachedData')) {
        const store = db.createObjectStore('cachedData', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
};

// Sauvegarder une action en attente
const savePendingAction = async (action) => {
  const db = await openDB();
  const tx = db.transaction('pendingActions', 'readwrite');
  const store = tx.objectStore('pendingActions');
  
  await store.add({
    ...action,
    timestamp: Date.now()
  });
  
  return tx.complete;
};

// Récupérer les actions en attente
const getPendingActions = async () => {
  const db = await openDB();
  const tx = db.transaction('pendingActions', 'readonly');
  const store = tx.objectStore('pendingActions');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Supprimer une action synchronisée
const removePendingAction = async (id) => {
  const db = await openDB();
  const tx = db.transaction('pendingActions', 'readwrite');
  const store = tx.objectStore('pendingActions');
  
  await store.delete(id);
  return tx.complete;
};

// Cache de données avec timestamp
const cacheData = async (key, data) => {
  const db = await openDB();
  const tx = db.transaction('cachedData', 'readwrite');
  const store = tx.objectStore('cachedData');
  
  await store.put({
    key,
    data,
    timestamp: Date.now()
  });
  
  return tx.complete;
};

// Récupérer des données cachées
const getCachedData = async (key, maxAge = API_CACHE_DURATION) => {
  const db = await openDB();
  const tx = db.transaction('cachedData', 'readonly');
  const store = tx.objectStore('cachedData');
  
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result;
      if (result && (Date.now() - result.timestamp) < maxAge) {
        resolve(result.data);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

// Synchroniser les actions en attente
const syncPendingActions = async () => {
  try {
    const pendingActions = await getPendingActions();
    console.log('[SW] Syncing', pendingActions.length, 'pending actions');
    
    for (const action of pendingActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          await removePendingAction(action.id);
          console.log('[SW] Synced action:', action.id);
          
          // Notifier le client
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              actionId: action.id
            });
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
};

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'ShopOpti',
    body: 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || 'general',
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'dismiss', title: 'Ignorer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const targetUrl = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Chercher une fenêtre existante
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      // Ouvrir une nouvelle fenêtre
      return clients.openWindow(targetUrl);
    })
  );
});

// Message handler pour communication avec l'app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_DATA':
      cacheData(event.data.key, event.data.data);
      break;
      
    case 'GET_CACHED_DATA':
      getCachedData(event.data.key).then((data) => {
        event.ports[0].postMessage({ data });
      });
      break;
      
    case 'SAVE_PENDING_ACTION':
      savePendingAction(event.data.action).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'GET_CACHE_STATUS':
      Promise.all([
        caches.open(STATIC_CACHE).then(c => c.keys()),
        caches.open(DYNAMIC_CACHE).then(c => c.keys()),
        caches.open(API_CACHE).then(c => c.keys()),
        getPendingActions()
      ]).then(([staticKeys, dynamicKeys, apiKeys, pendingActions]) => {
        event.ports[0].postMessage({
          static: staticKeys.length,
          dynamic: dynamicKeys.length,
          api: apiKeys.length,
          pending: pendingActions.length,
          version: CACHE_VERSION
        });
      });
      break;
  }
});

console.log('[SW] Service Worker loaded, version:', CACHE_VERSION);
