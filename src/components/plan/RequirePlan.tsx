import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePlan, PlanType } from '@/hooks/usePlan'
import { UpgradeDialog } from './UpgradeDialog'

interface RequirePlanProps {
  children: ReactNode
  minPlan: PlanType
  redirectTo?: string
  showModal?: boolean
}

export const RequirePlan = ({ 
  children, 
  minPlan, 
  redirectTo = '/pricing',
  showModal = false 
}: RequirePlanProps) => {
  const { user, loading: authLoading } = useAuth()
  const { hasPlan, loading: planLoading } = usePlan(user)
  const location = useLocation()

  // Still loading
  if (authLoading || planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // Has required plan
  if (hasPlan(minPlan)) {
    return <>{children}</>
  }

  // Insufficient plan
  if (showModal) {
    return <UpgradeDialog requiredPlan={minPlan} />
  }

  return <Navigate to={redirectTo} state={{ from: location }} replace />
}