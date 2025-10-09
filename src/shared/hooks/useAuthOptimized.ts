// PHASE 1: HOOK UNIFIÉ OPTIMISÉ POUR PERFORMANCE
// Remplace tous les hooks useAuth/useUser/useProfile dupliqués

import { useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/hooks/useEnhancedAuth'

// Interface unifiée pour tous les besoins d'authentification
interface AuthState {
  // État utilisateur
  user: any | null
  profile: any | null
  loading: boolean
  
  // Rôles et permissions
  role: UserRole
  isAdmin: boolean
  isManager: boolean
  isAuthenticated: boolean
  
  // Actions optimisées
  signOut: () => Promise<void>
  canAccess: (permission: string) => boolean
  hasRole: (requiredRole: UserRole) => boolean
}

// Cache pour éviter les recalculs
const permissionCache = new Map<string, boolean>()
const roleHierarchy = { user: 1, manager: 2, admin: 3 }

export const useAuthOptimized = (): AuthState => {
  const { user, profile, signOut, loading } = useAuth()
  
  // Calculs memoizés pour éviter les re-renders
  const authState = useMemo(() => {
    const isAdmin = profile?.is_admin === true
    const role = isAdmin ? 'admin' : 'user' as UserRole
    const isManager = isAdmin // For now, admin includes manager permissions
    const isAuthenticated = !!user
    
    return {
      role,
      isAdmin,
      isManager,
      isAuthenticated
    }
  }, [user, profile])
  
  // Permission check optimisé avec cache
  const canAccess = useCallback((permission: string): boolean => {
    if (!authState.isAuthenticated) return false
    
    const cacheKey = `${authState.role}-${permission}`
    if (permissionCache.has(cacheKey)) {
      return permissionCache.get(cacheKey)!
    }
    
    // Permissions système
    const permissions: Record<string, UserRole[]> = {
      // Admin seulement
      'manage_users': ['admin'],
      'manage_system': ['admin'],
      'view_security_events': ['admin'],
      'view_analytics_advanced': ['admin'],
      
      // Manager et Admin
      'manage_customers': ['manager', 'admin'],
      'view_analytics': ['manager', 'admin'],
      'manage_products': ['manager', 'admin'],
      'export_data': ['manager', 'admin'],
      
      // Tous les utilisateurs authentifiés
      'view_dashboard': ['user', 'manager', 'admin'],
      'manage_own_data': ['user', 'manager', 'admin'],
      'import_data': ['user', 'manager', 'admin']
    }
    
    const allowedRoles = permissions[permission] || []
    const hasPermission = allowedRoles.includes(authState.role)
    
    // Cache le résultat
    permissionCache.set(cacheKey, hasPermission)
    return hasPermission
  }, [authState])
  
  // Role check optimisé
  const hasRole = useCallback((requiredRole: UserRole): boolean => {
    return roleHierarchy[authState.role] >= roleHierarchy[requiredRole]
  }, [authState.role])
  
  return {
    user,
    profile,
    loading,
    ...authState,
    signOut,
    canAccess,
    hasRole
  }
}

// Hook léger pour les composants qui n'ont besoin que du statut d'authentification
export const useAuthStatus = () => {
  const { user, loading } = useAuth()
  return useMemo(() => ({
    isAuthenticated: !!user,
    loading
  }), [user, loading])
}

// Hook pour les actions administratives
export const useAdminActions = () => {
  const { isAdmin, canAccess } = useAuthOptimized()
  
  return useMemo(() => ({
    isAdmin,
    canManageUsers: canAccess('manage_users'),
    canManageSystem: canAccess('manage_system'),
    canViewSecurityEvents: canAccess('view_security_events')
  }), [isAdmin, canAccess])
}