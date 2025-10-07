/**
 * Configuration des optimisations par module
 */

export const MODULE_OPTIMIZATIONS = {
  // Real-time subscriptions
  realtime: {
    maxConnectionsPerTable: 1,              // 1 seule connexion par table
    enablePooling: true,                    // Pooling des connexions
    reconnectDelay: 2000,                   // Délai avant reconnexion (ms)
    heartbeatInterval: 30000,               // Heartbeat toutes les 30s
  },

  // Import module
  import: {
    batchSize: 100,                         // Traiter 100 items à la fois
    parallelJobs: 3,                        // Max 3 jobs simultanés
    cacheImportHistory: true,
    cacheTime: 5 * 60 * 1000,              // 5 minutes
  },

  // Products module
  products: {
    pageSize: 50,                           // 50 produits par page
    enableVirtualization: true,             // Virtualisation pour grandes listes
    imageOptimization: true,
    lazyLoadImages: true,
  },

  // Orders module
  orders: {
    pageSize: 30,
    realtimeUpdates: true,
    cacheStrategy: 'transactional',         // Cache 2 min
  },

  // Marketing module
  marketing: {
    campaignCacheTime: 10 * 60 * 1000,     // 10 minutes
    segmentCacheTime: 15 * 60 * 1000,      // 15 minutes
    realtimeUpdates: false,                 // Désactivé par défaut
    batchAnalytics: true,
  },

  // Analytics module  
  analytics: {
    refreshInterval: 5 * 60 * 1000,        // Refresh toutes les 5 min
    cacheStrategy: 'analytics',             // Cache 10 min
    enablePredictions: true,
    predictionCacheTime: 30 * 60 * 1000,   // 30 minutes
  },

  // AI modules
  ai: {
    modelCacheTime: 60 * 60 * 1000,        // 1 heure
    enableStreaming: false,                 // Streaming désactivé par défaut
    maxConcurrentRequests: 2,
    timeoutMs: 30000,                       // 30s timeout
  },
} as const;

/**
 * Priorités de chargement des modules
 */
export const MODULE_LOADING_PRIORITY = {
  critical: ['dashboard', 'products', 'orders'],
  high: ['customers', 'analytics', 'import'],
  medium: ['marketing', 'automation', 'ai'],
  low: ['extensions', 'admin', 'settings'],
} as const;

/**
 * Modules à précharger selon la route
 */
export const ROUTE_PRELOAD_MODULES: Record<string, string[]> = {
  '/dashboard': ['products', 'orders', 'analytics'],
  '/products': ['import', 'suppliers'],
  '/orders': ['customers', 'products'],
  '/marketing': ['customers', 'analytics'],
  '/analytics': ['orders', 'products', 'customers'],
} as const;

/**
 * Limites de mémoire par module (en MB)
 */
export const MODULE_MEMORY_LIMITS = {
  products: 100,      // Max 100MB pour le module produits
  analytics: 150,     // Max 150MB pour analytics
  ai: 200,           // Max 200MB pour AI (modèles lourds)
  import: 80,
  marketing: 60,
} as const;
