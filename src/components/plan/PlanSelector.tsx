import { useState } from 'react'
import { Crown, Star, Shield, Check, X } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useNewPlan, PlanType } from '@/hooks/useNewPlan'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'
import { useNavigate } from 'react-router-dom'

interface PlanFeature {
  name: string
  included: boolean
  limit?: string
}

interface PlanConfig {
  name: string
  price: string
  icon: typeof Crown
  color: string
  bgColor: string
  description: string
  features: PlanFeature[]
  popular?: boolean
}

const planConfigs: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Gratuit',
    price: 'Gratuit',
    icon: Shield,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: 'Parfait pour commencer',
    features: [
      { name: 'Import basique', included: true, limit: '10/jour' },
      { name: 'Catalogue produits', included: true, limit: '100 produits' },
      { name: 'Support email', included: true },
      { name: 'AI Analytics', included: false },
      { name: 'Import automatisé', included: false },
      { name: 'Intégrations avancées', included: false }
    ]
  },
  pro: {
    name: 'Pro',
    price: '29€/mois',
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Pour les professionnels',
    popular: true,
    features: [
      { name: 'Import avancé', included: true, limit: '100/jour' },
      { name: 'Catalogue illimité', included: true },
      { name: 'Support prioritaire', included: true },
      { name: 'AI Analytics', included: true },
      { name: 'Import automatisé', included: true, limit: '5 tâches' },
      { name: 'Intégrations avancées', included: true }
    ]
  },
  ultra_pro: {
    name: 'Ultra Pro',
    price: '99€/mois',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Toute la puissance de l\'IA',
    features: [
      { name: 'Import illimité', included: true },
      { name: 'Catalogue illimité', included: true },
      { name: 'Support 24/7', included: true },
      { name: 'AI Analytics avancé', included: true },
      { name: 'Import automatisé illimité', included: true },
      { name: 'Toutes les intégrations', included: true }
    ]
  }
}

export const PlanSelector = () => {
  const [loading, setLoading] = useState<PlanType | null>(null)
  const { user } = useAuth()
  const { plan: currentPlan, loading: planLoading } = useNewPlan(user)
  const { createCheckout } = useStripeSubscription()
  const navigate = useNavigate()

  const handleUpgrade = async (newPlan: PlanType) => {
    if (!user || newPlan === currentPlan || newPlan === 'free') return

    setLoading(newPlan)
    await createCheckout(newPlan as 'pro' | 'ultra_pro')
    setLoading(null)
  }

  const handleGetStarted = (plan: PlanType) => {
    if (plan === 'free') {
      navigate('/auth')
    } else {
      handleUpgrade(plan)
    }
  }

  if (planLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {Object.entries(planConfigs).map(([planKey, config]) => {
        const plan = planKey as PlanType
        const IconComponent = config.icon
        const isCurrentPlan = currentPlan === plan
        const canUpgrade = currentPlan !== plan && planKey !== 'free'
        const isLoading = loading === plan

        return (
          <Card 
            key={plan} 
            className={`relative ${config.popular ? 'ring-2 ring-primary shadow-lg' : ''} ${config.bgColor}`}
          >
            {config.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                Plus populaire
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <IconComponent className={`h-6 w-6 ${config.color}`} />
                <CardTitle className="text-xl">{config.name}</CardTitle>
                {isCurrentPlan && (
                  <Badge variant="outline" className="ml-2">
                    Actuel
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold">{config.price}</div>
              <p className="text-muted-foreground">{config.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <Separator />
              <div className="space-y-3">
                {config.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={feature.included ? '' : 'text-muted-foreground'}>
                      {feature.name}
                      {feature.limit && (
                        <span className="text-sm text-muted-foreground ml-1">
                          ({feature.limit})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                variant={isCurrentPlan ? "outline" : "default"}
                disabled={isCurrentPlan || isLoading}
                onClick={() => handleGetStarted(plan)}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Redirection...
                  </div>
                ) : isCurrentPlan ? (
                  'Plan actuel'
                ) : plan === 'free' && !user ? (
                  'Commencer gratuitement'
                ) : (
                  `Passer au ${config.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}