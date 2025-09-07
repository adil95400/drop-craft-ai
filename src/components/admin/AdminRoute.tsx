import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'

interface AdminRouteProps {
  children: ReactNode
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user } = useAuth()
  const { t } = useTranslation('common')

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Pour le moment, on laisse passer tous les utilisateurs authentifiés
  // Le contrôle d'accès se fera au niveau des données avec RLS
  return <>{children}</>
}