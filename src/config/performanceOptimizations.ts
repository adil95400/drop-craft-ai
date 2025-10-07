/**
 * Configuration centralisée des optimisations performance
 */

export const PERFORMANCE_CONFIG = {
  // React Query
  queryClient: {
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,        // 2 minutes
        gcTime: 10 * 60 * 1000,          // 10 minutes (anciennement cacheTime)
        refetchOnWindowFocus: false,      // Désactivé par défaut pour économiser les requêtes
        refetchOnMount: true,             // Refetch au mount pour données fraîches
        refetchOnReconnect: true,         // Refetch à la reconnexion
        retry: 1,                         // 1 seul retry pour accélérer les erreurs
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  },

  // Image optimization
  images: {
    lazyLoadThreshold: 100,              // px avant viewport
    placeholderQuality: 10,              // Qualité du placeholder
    formats: ['webp', 'avif', 'jpg'],   // Formats supportés en ordre de préférence
  },

  // Code splitting
  routes: {
    chunkSize: 244 * 1024,              // 244 KB max par chunk (optimal pour HTTP/2)
    prefetchDelay: 2000,                // Délai avant prefetch (ms)
  },

  // Bundle optimization
  bundle: {
    treeshaking: true,
    minification: true,
    compression: 'gzip',
  },

  // Component memoization
  memoization: {
    heavyComponents: true,              // Memoize les composants lourds
    callbacks: true,                    // useCallback pour event handlers
    values: true,                       // useMemo pour calculs coûteux
  },

  // Network
  network: {
    timeout: 30000,                     // 30s timeout
    maxConcurrentRequests: 6,           // Limite de requêtes simultanées
    batchRequests: true,                // Grouper les requêtes quand possible
  },

  // Analytics
  analytics: {
    batchEvents: true,
    flushInterval: 5000,                // Envoyer les events toutes les 5s
    maxBatchSize: 50,
  },
} as const;

/**
 * Stratégies de cache par type de données
 */
export const CACHE_STRATEGIES = {
  // Données statiques (catégories, configs, etc.)
  static: {
    staleTime: 60 * 60 * 1000,          // 1 heure
    gcTime: 24 * 60 * 60 * 1000,        // 24 heures
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },

  // Données utilisateur (profil, préférences)
  user: {
    staleTime: 5 * 60 * 1000,           // 5 minutes
    gcTime: 30 * 60 * 1000,             // 30 minutes
    refetchOnMount: false,
  },

  // Données transactionnelles (commandes, produits)
  transactional: {
    staleTime: 2 * 60 * 1000,           // 2 minutes
    gcTime: 10 * 60 * 1000,             // 10 minutes
    refetchOnMount: true,
  },

  // Données en temps réel (notifications, stocks)
  realtime: {
    staleTime: 30 * 1000,               // 30 secondes
    gcTime: 2 * 60 * 1000,              // 2 minutes
    refetchInterval: 30 * 1000,         // Refetch auto toutes les 30s
  },

  // Analytics et ML (données lourdes)
  analytics: {
    staleTime: 10 * 60 * 1000,          // 10 minutes
    gcTime: 60 * 60 * 1000,             // 1 heure
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
} as const;

/**
 * Préchargement intelligent des routes
 */
export const PREFETCH_ROUTES = [
  '/dashboard',
  '/products',
  '/orders',
] as const;

/**
 * Composants à charger en lazy loading
 */
export const LAZY_LOAD_COMPONENTS = [
  'AIPredictiveAnalytics',
  'AnalyticsStudio',
  'AIStudio',
  'AutomationStudio',
  'ExtensionsHub',
  'MarketplaceHub',
] as const;
