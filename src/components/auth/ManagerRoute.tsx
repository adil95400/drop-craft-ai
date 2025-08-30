import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { LoadingState } from '@/components/common/LoadingState'

interface ManagerRouteProps {
  children: ReactNode
}

export const ManagerRoute = ({ children }: ManagerRouteProps) => {
  const { user, isManager, loading } = useEnhancedAuth()

  if (loading) {
    return <LoadingState />
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (!isManager) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}