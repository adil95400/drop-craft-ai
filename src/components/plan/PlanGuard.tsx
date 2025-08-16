import { ReactNode } from 'react'
import { Lock, Crown, Star, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { usePlan, PlanType } from '@/hooks/usePlan'
import { PlanGatedButton } from './PlanGatedButton'

interface PlanGuardProps {
  children: ReactNode
  requiredPlan: PlanType
  fallback?: ReactNode
  showUpgradeCard?: boolean
  className?: string
}

const planConfig = {
  pro: {
    name: 'Pro',
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Débloquez les fonctionnalités avancées'
  },
  ultra_pro: {
    name: 'Ultra Pro',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Accès complet à toutes les fonctionnalités premium'
  }
}

export const PlanGuard = ({ 
  children, 
  requiredPlan, 
  fallback,
  showUpgradeCard = true,
  className 
}: PlanGuardProps) => {
  const { user } = useAuth()
  const { hasPlan } = usePlan(user)
  
  const hasAccess = hasPlan(requiredPlan)
  
  if (hasAccess) {
    return <div className={className}>{children}</div>
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>
  }

  if (!showUpgradeCard) {
    return null
  }

  const config = planConfig[requiredPlan as keyof typeof planConfig]
  if (!config) return null

  const IconComponent = config.icon

  return (
    <div className={className}>
      <Card className={`${config.borderColor} border-2 ${config.bgColor}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${config.bgColor} ${config.borderColor} border-2`}>
              <IconComponent className={`h-6 w-6 ${config.color}`} />
            </div>
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Fonctionnalité {config.name}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {config.description}
          </p>
          
          <PlanGatedButton
            requiredPlan={requiredPlan}
            className="w-full"
            to="/pricing"
          >
            Passer à {config.name}
            <ArrowRight className="h-4 w-4 ml-2" />
          </PlanGatedButton>
        </CardContent>
      </Card>
    </div>
  )
}