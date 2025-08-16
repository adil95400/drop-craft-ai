import { ReactNode } from 'react'
import { Lock, Crown, Star, Heart, ArrowRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUnifiedPlan } from './UnifiedPlanProvider'
import { PlanType } from '@/hooks/usePlan'
import { useNavigate } from 'react-router-dom'

interface EnhancedPlanGuardProps {
  children: ReactNode
  requiredPlan: PlanType
  fallback?: ReactNode
  showUpgradeCard?: boolean
  className?: string
  feature?: string
  customMessage?: string
}

const planConfig = {
  free: {
    name: 'Gratuit',
    icon: Heart,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Fonctionnalités de base incluses',
    price: 'Gratuit'
  },
  pro: {
    name: 'Pro',
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Débloquez les fonctionnalités avancées',
    price: '29€/mois'
  },
  ultra_pro: {
    name: 'Ultra Pro',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Accès complet à toutes les fonctionnalités premium',
    price: '99€/mois'
  }
}

const featureDescriptions: Record<string, string> = {
  'ai-analysis': 'Analyse IA avancée de vos données',
  'predictive-analytics': 'Analytics prédictifs avec IA',
  'advanced-automation': 'Automatisation avancée des tâches',
  'bulk-operations': 'Opérations en masse',
  'premium-integrations': 'Intégrations premium',
  'advanced-seo': 'SEO avancé avec optimisations IA',
  'crm-prospects': 'Gestion avancée des prospects CRM',
  'ai-import': 'Import intelligent avec IA',
  'marketing-automation': 'Automatisation marketing',
  'security-monitoring': 'Surveillance sécurité avancée',
  'analytics-insights': 'Insights analytics approfondis'
}

export const EnhancedPlanGuard = ({ 
  children, 
  requiredPlan, 
  fallback,
  showUpgradeCard = true,
  className,
  feature,
  customMessage
}: EnhancedPlanGuardProps) => {
  const { hasPlan, loading } = useUnifiedPlan()
  const navigate = useNavigate()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

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

  const config = planConfig[requiredPlan]
  if (!config) return null

  const IconComponent = config.icon
  const featureDescription = feature ? featureDescriptions[feature] : null

  return (
    <div className={className}>
      <Card className={`${config.borderColor} border-2 ${config.bgColor} transition-all hover:shadow-lg`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.bgColor} ${config.borderColor} border-2 shadow-md`}>
              <IconComponent className={`h-8 w-8 ${config.color}`} />
            </div>
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Fonctionnalité {config.name}
          </CardTitle>
          <Badge variant="outline" className={`${config.color} border-current mx-auto`}>
            {config.price}
          </Badge>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground text-lg">
              {customMessage || config.description}
            </p>
            {featureDescription && (
              <div className="flex items-center gap-2 justify-center p-3 bg-background/80 rounded-lg">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-primary">
                  {featureDescription}
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/pricing')}
              className="w-full gap-2"
              size="lg"
            >
              Passer à {config.name}
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Mise à niveau instantanée • Annulation à tout moment
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}