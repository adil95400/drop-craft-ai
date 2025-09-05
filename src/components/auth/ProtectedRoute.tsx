/**
 * Composant de protection des routes nécessitant une authentification
 */
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
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
    // Redirect to auth page with return URL
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!requireAuth && user) {
    // Redirect authenticated users away from auth pages
    const redirectUrl = new URLSearchParams(location.search).get('redirect')
    return <Navigate to={redirectUrl || '/dashboard'} replace />
  }

  return <>{children}</>
}