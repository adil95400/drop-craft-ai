import { ReactNode } from 'react'
import { Crown, Star, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNewPlan, PlanType } from '@/hooks/useNewPlan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface NewPlanGuardProps {
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
    description: 'Fonctionnalités avancées pour les professionnels'
  },
  ultra_pro: {
    name: 'Ultra Pro',
    icon: Crown,
    color: 'text-purple-600',
    description: 'Toutes les fonctionnalités premium et IA'
  }
}

export const NewPlanGuard = ({ 
  children, 
  requiredPlan, 
  fallback, 
  showUpgradeCard = true,
  className 
}: NewPlanGuardProps) => {
  const { user } = useAuth()
  const { hasPlan, loading } = useNewPlan(user)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (hasPlan(requiredPlan)) {
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
      <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/10">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <IconComponent className={`h-6 w-6 ${config.color}`} />
            <Badge variant="outline" className={config.color}>
              {config.name}
            </Badge>
          </div>
          <CardTitle className="text-lg">
            Fonctionnalité {config.name} Requise
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {config.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              onClick={() => navigate('/pricing')}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Passer au {config.name}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/features')}
            >
              Voir les fonctionnalités
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}