import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Crown, Zap, ArrowRight } from 'lucide-react'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { useNavigate } from 'react-router-dom'

interface PlanGateProps {
  children: ReactNode
  requiredPlan: 'pro' | 'ultra_pro'
  feature: string
  title?: string
  description?: string
  showUpgrade?: boolean
}

export const PlanGate = ({ 
  children, 
  requiredPlan, 
  feature, 
  title, 
  description,
  showUpgrade = true 
}: PlanGateProps) => {
  const { currentPlan, hasFeature } = useUnifiedPlan()
  const navigate = useNavigate()

  // Check if user has access to this feature
  if (hasFeature(feature)) {
    return <>{children}</>
  }

  if (!showUpgrade) {
    return null
  }

  const planConfig = {
    pro: {
      name: 'Pro',
      icon: Crown,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      features: [
        'Import avancé CSV/XML/API',
        'Connexion fournisseurs illimitée', 
        'Synchronisation automatique',
        'SEO automatique basique'
      ]
    },
    ultra_pro: {
      name: 'Ultra Pro',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      features: [
        'IA avancée pour titres et descriptions',
        'Automatisation complète',
        'Analytics prédictifs',
        'Support prioritaire 24/7'
      ]
    }
  }

  const config = planConfig[requiredPlan]
  const IconComponent = config.icon

  return (
    <Card className={`${config.bgColor} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/20" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/80 ${config.color}`}>
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className={`h-5 w-5 ${config.color}`} />
                {title || `Fonctionnalité ${config.name}`}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {description || `Cette fonctionnalité nécessite le plan ${config.name}`}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <IconComponent className="h-3 w-3" />
            Plan {config.name}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {config.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
              {feature}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={() => navigate('/pricing')}
            className={`flex-1 ${config.color.replace('text-', 'bg-').replace('600', '500')} hover:${config.color.replace('text-', 'bg-').replace('600', '600')} text-white`}
          >
            <Crown className="h-4 w-4 mr-2" />
            Passer à {config.name}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => navigate('/pricing')}>
            Voir tous les plans
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Essai gratuit • Sans engagement • Annulation à tout moment
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Convenience components for common use cases
export const ProGate = ({ children, feature, ...props }: Omit<PlanGateProps, 'requiredPlan'>) => (
  <PlanGate requiredPlan="pro" feature={feature} {...props}>
    {children}
  </PlanGate>
)

export const UltraProGate = ({ children, feature, ...props }: Omit<PlanGateProps, 'requiredPlan'>) => (
  <PlanGate requiredPlan="ultra_pro" feature={feature} {...props}>
    {children}
  </PlanGate>
)