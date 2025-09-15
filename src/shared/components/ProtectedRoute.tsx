// COMPOSANT UNIFIÉ POUR PROTECTION DES ROUTES
// Remplace tous les composants AuthGuard/AdminRoute/ProtectedRoute dupliqués

import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import type { UserRole } from '@/hooks/useEnhancedAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requireRole?: UserRole
  permission?: string
  redirectTo?: string
  fallback?: ReactNode
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireRole,
  permission,
  redirectTo = '/auth',
  fallback
}: ProtectedRouteProps) => {
  const { isAuthenticated, loading, hasRole, canAccess } = useAuthOptimized()
  const location = useLocation()

  // Loading state
  if (loading) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  // Auth check
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Role check
  if (requireRole && !hasRole(requireRole)) {
    return <Navigate to="/dashboard" replace />
  }

  // Permission check
  if (permission && !canAccess(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Composants spécialisés pour faciliter l'usage
export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requireRole="admin">
    {children}
  </ProtectedRoute>
)

export const ManagerRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requireRole="manager">
    {children}
  </ProtectedRoute>
)

export const AuthenticatedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>
    {children}
  </ProtectedRoute>
)