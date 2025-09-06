import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminRole } from '@/hooks/useAdminRole'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AdminRouteProps {
  children: ReactNode
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading } = useAdminRole()
  const { t } = useTranslation('common')

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}