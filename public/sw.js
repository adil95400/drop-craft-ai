// Service Worker pour PWA Drop Craft AI
const CACHE_NAME = 'dropcraft-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourne la réponse du cache si disponible
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'Drop Craft AI',
        body: event.data.text(),
        icon: '/icons/icon-192x192.png'
      };
    }
  }

  const notificationTitle = notificationData.title || 'Drop Craft AI';
  const notificationOptions = {
    body: notificationData.body || 'Nouvelle notification',
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: notificationData.tag || 'general',
    requireInteraction: notificationData.requireInteraction || false,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer'
      }
    ],
    data: notificationData.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const clickUrl = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      for (const client of clientList) {
        if (client.url === clickUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
  
  if (event.tag === 'sync-inventory') {
    event.waitUntil(syncInventory());
  }
});

// Fonctions de synchronisation
async function syncOrders() {
  try {
    // Logique de synchronisation des commandes
    console.log('Syncing orders...');
    
    // Récupération des commandes en attente depuis IndexedDB
    const pendingOrders = await getPendingOrders();
    
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order)
        });
        
        if (response.ok) {
          await removePendingOrder(order.id);
        }
      } catch (error) {
        console.error('Error syncing order:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncOrders:', error);
  }
}

async function syncInventory() {
  try {
    console.log('Syncing inventory...');
    // Logique de synchronisation du stock
  } catch (error) {
    console.error('Error in syncInventory:', error);
  }
}

// Helpers pour IndexedDB
async function getPendingOrders() {
  // Implémentation IndexedDB pour récupérer les commandes en attente
  return [];
}

async function removePendingOrder(orderId) {
  // Implémentation IndexedDB pour supprimer une commande synchronisée
  console.log('Removing pending order:', orderId);
}