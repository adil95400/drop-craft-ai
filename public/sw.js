// Service Worker pour PWA ShopOpti - Mise à jour automatique intelligente
// IMPORTANT: Le navigateur ne met à jour le SW que si le fichier sw.js change.
// -> Incrémentez SW_SCRIPT_VERSION à chaque release pour forcer le refresh.
const SW_SCRIPT_VERSION = '3.0.1';

// VERSION AUTO-INCREMENTÉE À CHAQUE ACTIVATION
const CACHE_VERSION = `${SW_SCRIPT_VERSION}-` + Date.now();
const STATIC_CACHE = `shopopti-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `shopopti-dynamic-v${CACHE_VERSION}`;
const API_CACHE = `shopopti-api-v${CACHE_VERSION}`;
const IMAGE_CACHE = `shopopti-images-v${CACHE_VERSION}`;

// Ressources statiques essentielles
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

// Durée de vie du cache
const CACHE_DURATIONS = {
  api: 5 * 60 * 1000,      // 5 minutes
  static: 24 * 60 * 60 * 1000, // 24 heures
  dynamic: 60 * 60 * 1000  // 1 heure
};

// ============= INSTALLATION =============
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Some static assets failed to cache:', err);
        });
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
      caches.open(IMAGE_CACHE)
    ]).then(() => {
      console.log('[SW] Installation complete, activating immediately');
      // IMPORTANT: Activer immédiatement sans attendre
      return self.skipWaiting();
    })
  );
});

// ============= ACTIVATION =============
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Nettoyer TOUS les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Supprimer tout cache qui n'est pas de la version actuelle
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Prendre le contrôle immédiatement
      self.clients.claim()
    ]).then(() => {
      // Notifier tous les clients qu'une mise à jour est active
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// ============= STRATÉGIES DE CACHE =============
const cacheStrategies = {
  // Network First avec timeout - Pour le HTML et données critiques
  networkFirstWithTimeout: async (request, cacheName, timeout = 3000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const networkResponse = await fetch(request, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  },

  // Network Only - Pour les documents HTML (toujours frais)
  networkOnly: async (request, cacheName) => {
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

  // Cache First avec revalidation - Pour les assets statiques
  cacheFirstWithRevalidate: async (request, cacheName) => {
    const cachedResponse = await caches.match(request);
    
    // Toujours faire une requête réseau en background
    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    }).catch(() => null);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return fetchPromise;
  },

  // Stale While Revalidate amélioré
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

// ============= INTERCEPTION DES REQUÊTES =============
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;

  // Ignorer les requêtes non-HTTP
  if (!url.protocol.startsWith('http')) return;

  // IMPORTANT: HTML/Documents -> Network First (pour les mises à jour immédiates)
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      cacheStrategies.networkOnly(request, DYNAMIC_CACHE).catch(async () => {
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) return offlinePage;
        
        return new Response(
          `<!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mode Hors Ligne - ShopOpti</title>
            <style>
              body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { text-align: center; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); max-width: 400px; }
              h1 { color: #333; margin-bottom: 1rem; }
              p { color: #666; margin-bottom: 1.5rem; }
              button { padding: 0.75rem 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: transform 0.2s; }
              button:hover { transform: scale(1.05); }
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

  // Images -> Cache First avec revalidation
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(cacheStrategies.cacheFirstWithRevalidate(request, IMAGE_CACHE));
    return;
  }

  // API Supabase -> Network First avec timeout court
  if (url.hostname.includes('supabase') || API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      cacheStrategies.networkFirstWithTimeout(request, API_CACHE, 5000).catch(async () => {
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

  // JS/CSS avec hash -> Cache First (Vite ajoute des hashes)
  if (url.pathname.match(/\.[a-f0-9]{8}\.(js|css)$/)) {
    event.respondWith(cacheStrategies.cacheFirstWithRevalidate(request, STATIC_CACHE));
    return;
  }

  // Autres JS/CSS -> Stale While Revalidate
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    event.respondWith(cacheStrategies.staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Par défaut: Stale While Revalidate
  event.respondWith(cacheStrategies.staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ============= INDEXEDDB POUR OFFLINE =============
const DB_NAME = 'shopopti-offline';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cachedData')) {
        const store = db.createObjectStore('cachedData', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
};

// ============= BACKGROUND SYNC =============
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

const syncPendingActions = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction('pendingActions', 'readonly');
    const store = tx.objectStore('pendingActions');
    
    const pendingActions = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const action of pendingActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          const deleteTx = db.transaction('pendingActions', 'readwrite');
          await deleteTx.objectStore('pendingActions').delete(action.id);
          
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({ type: 'SYNC_COMPLETE', actionId: action.id });
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

// ============= PUSH NOTIFICATIONS =============
self.addEventListener('push', (event) => {
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

  event.waitUntil(
    self.registration.showNotification(data.title, {
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
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  
  const targetUrl = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// ============= MESSAGE HANDLER =============
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'FORCE_UPDATE':
      // Forcer la mise à jour: vider les caches et recharger
      caches.keys().then((names) => {
        return Promise.all(names.map(name => caches.delete(name)));
      }).then(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach(client => client.postMessage({ type: 'RELOAD_PAGE' }));
        });
      });
      break;
      
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_VERSION });
      break;
      
    case 'GET_CACHE_STATUS':
      Promise.all([
        caches.open(STATIC_CACHE).then(c => c.keys()),
        caches.open(DYNAMIC_CACHE).then(c => c.keys()),
        caches.open(API_CACHE).then(c => c.keys())
      ]).then(([staticKeys, dynamicKeys, apiKeys]) => {
        event.ports[0]?.postMessage({
          static: staticKeys.length,
          dynamic: dynamicKeys.length,
          api: apiKeys.length,
          version: CACHE_VERSION
        });
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.keys().then((names) => {
        return Promise.all(names.map(name => caches.delete(name)));
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
  }
});

console.log('[SW] Service Worker loaded, version:', CACHE_VERSION);
