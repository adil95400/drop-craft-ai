// PHASE 1: HOOK UNIFIÉ OPTIMISÉ POUR PERFORMANCE
// Utilise UnifiedAuthContext comme source de vérité unique

import { useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/hooks/useEnhancedAuth'

interface AuthState {
  user: any | null
  profile: any | null
  loading: boolean
  role: UserRole
  isAdmin: boolean
  isManager: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  canAccess: (permission: string) => boolean
  hasRole: (requiredRole: UserRole) => boolean
}

const roleHierarchy: Record<UserRole, number> = { user: 1, manager: 2, admin: 3 }

export const useAuthOptimized = (): AuthState => {
  // Delegates to UnifiedAuthContext (single source of truth)
  const auth = useAuth()
  
  const authState = useMemo(() => {
    const isAdmin = auth.profile?.is_admin === true
    const role: UserRole = isAdmin ? 'admin' : 'user'
    return { role, isAdmin, isManager: isAdmin, isAuthenticated: !!auth.user }
  }, [auth.user, auth.profile])
  
  // Delegates to real canAccess from UnifiedAuthContext
  const canAccess = useCallback((permission: string): boolean => {
    if (!authState.isAuthenticated) return false
    // Use the real canAccess from context (no separate cache needed)
    return (auth as any).canAccess?.(permission) ?? authState.isAdmin
  }, [authState, auth])
  
  const hasRole = useCallback((requiredRole: UserRole): boolean => {
    return roleHierarchy[authState.role] >= roleHierarchy[requiredRole]
  }, [authState.role])
  
  return {
    user: auth.user,
    profile: auth.profile,
    loading: auth.loading,
    ...authState,
    signOut: auth.signOut,
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
