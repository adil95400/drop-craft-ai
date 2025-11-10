// INDEX UNIFIÉ POUR TOUS LES COMPOSANTS ET HOOKS PARTAGÉS
// Permet d'importer depuis un seul endroit

// Hooks optimisés
export { useAuthOptimized, useAuthStatus, useAdminActions } from './hooks/useAuthOptimized'

// Composants de protection
export { ProtectedRoute, AdminRoute, ManagerRoute, AuthenticatedRoute } from './components/ProtectedRoute'

// Composants UI unifiés
export { UserDropdown } from './components/UserDropdown'
export { LoadingSpinner } from './components/LoadingSpinner'

// Utilitaires performance
export { memoizedComponents, debounce, throttle } from './utils/performanceOptimizations'
export { unifiedCache } from '@/services/UnifiedCacheService'