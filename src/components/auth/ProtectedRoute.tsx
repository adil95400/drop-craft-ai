/**
 * Composant de protection des routes nécessitant une authentification
 * Redirige automatiquement les nouveaux utilisateurs vers le wizard d'onboarding
 */
import React from 'react'
import { useUnifiedAuth as useAuth } from '@/contexts/UnifiedAuthContext'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

// Routes exclues de la redirection onboarding (pour éviter les boucles)
const ONBOARDING_EXEMPT_ROUTES = ['/onboarding', '/auth', '/choose-plan', '/pricing']

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground animate-fade-in">
            Vérification de votre session...
          </p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!requireAuth && user) {
    const redirectUrl = new URLSearchParams(location.search).get('redirect')
    return <Navigate to={redirectUrl || '/dashboard'} replace />
  }

  // Auto-redirect new users to onboarding wizard
  if (
    user &&
    profile &&
    !profile.onboarding_completed &&
    !ONBOARDING_EXEMPT_ROUTES.some(r => location.pathname.startsWith(r))
  ) {
    return <Navigate to="/onboarding/wizard" replace />
  }

  return <>{children}</>
}