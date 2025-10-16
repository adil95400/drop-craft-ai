import { useState } from 'react'
import { Crown, Star, Heart, Check, X, Sparkles, Zap, Shield } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { PlanType } from '@/hooks/usePlan'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'
import { useNavigate } from 'react-router-dom'

interface PlanFeature {
  name: string
  included: boolean
  limit?: string
  highlight?: boolean
}

interface SmartPlanConfig {
  name: string
  price: string
  originalPrice?: string
  icon: typeof Crown
  color: string
  bgColor: string
  borderColor: string
  description: string
  features: PlanFeature[]
  popular?: boolean
  recommended?: boolean
  savings?: string
}

const smartPlanConfigs: Record<PlanType, SmartPlanConfig> = {
  free: {
    name: 'Gratuit',
    price: '0€',
    icon: Heart,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Parfait pour découvrir',
    features: [
      { name: 'Import basique', included: true, limit: '10/jour' },
      { name: 'Catalogue produits', included: true, limit: '100 produits' },
      { name: 'Support communautaire', included: true },
      { name: 'Analytics de base', included: true },
      { name: 'AI Analytics', included: false },
      { name: 'Automatisation', included: false }
    ]
  },
  standard: {
    name: 'Gratuit',
    price: '0€',
    icon: Heart,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Parfait pour découvrir',
    features: [
      { name: 'Import basique', included: true, limit: '10/jour' },
      { name: 'Catalogue produits', included: true, limit: '100 produits' },
      { name: 'Support communautaire', included: true },
      { name: 'Analytics de base', included: true },
      { name: 'AI Analytics', included: false },
      { name: 'Import automatisé', included: false },
      { name: 'Intégrations premium', included: false },
      { name: 'Support prioritaire', included: false }
    ]
  },
  pro: {
    name: 'Pro',
    price: '29€',
    originalPrice: '39€',
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Idéal pour les professionnels',
    popular: true,
    savings: 'Économisez 25%',
    features: [
      { name: 'Import avancé', included: true, limit: '500/jour' },
      { name: 'Catalogue illimité', included: true },
      { name: 'Support prioritaire', included: true },
      { name: 'AI Analytics', included: true, highlight: true },
      { name: 'Import automatisé', included: true, limit: '10 tâches' },
      { name: 'Intégrations avancées', included: true },
      { name: 'SEO automation', included: true, highlight: true },
      { name: 'Real-time tracking', included: true }
    ]
  },
  ultra_pro: {
    name: 'Ultra Pro',
    price: '99€',
    originalPrice: '129€',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Toute la puissance de l\'IA',
    recommended: true,
    savings: 'Économisez 23%',
    features: [
      { name: 'Import illimité', included: true },
      { name: 'Catalogue illimité', included: true },
      { name: 'Support 24/7', included: true },
      { name: 'AI Analytics avancé', included: true, highlight: true },
      { name: 'Automatisation complète', included: true, highlight: true },
      { name: 'Toutes les intégrations', included: true },
      { name: 'Predictive Analytics', included: true, highlight: true },
      { name: 'Security monitoring', included: true, highlight: true }
    ]
  }
}

export const SmartPlanSelector = () => {
  const [loading, setLoading] = useState<PlanType | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const { user } = useAuth()
  const { currentPlan, loading: planLoading } = useUnifiedPlan()
  const { createCheckout } = useStripeSubscription()
  const navigate = useNavigate()

  const handleUpgrade = async (newPlan: PlanType) => {
    if (!user || newPlan === currentPlan || newPlan === 'standard') return

    setLoading(newPlan)
    try {
      await createCheckout(newPlan as 'pro' | 'ultra_pro')
    } catch (error) {
      console.error('Erreur lors de la création du checkout:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleGetStarted = (plan: PlanType) => {
    if (plan === 'standard') {
      navigate('/auth')
    } else {
      handleUpgrade(plan)
    }
  }

  const getPrice = (config: SmartPlanConfig) => {
    if (config.price === '0€') return config.price
    
    const basePrice = parseInt(config.price.replace('€', ''))
    if (billingCycle === 'yearly') {
      const yearlyPrice = Math.round(basePrice * 12 * 0.8) // 20% de réduction
      return `${Math.round(yearlyPrice / 12)}€`
    }
    return config.price
  }

  if (planLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Toggle de facturation */}
      <div className="flex justify-center">
        <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="monthly" className="gap-2">
              <Zap className="h-4 w-4" />
              Mensuel
            </TabsTrigger>
            <TabsTrigger value="yearly" className="gap-2">
              <Shield className="h-4 w-4" />
              Annuel (-20%)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grille de plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {Object.entries(smartPlanConfigs).map(([planKey, config]) => {
          const plan = planKey as PlanType
          const IconComponent = config.icon
          const isCurrentPlan = currentPlan === plan
          const isLoading = loading === plan
          const displayPrice = getPrice(config)

          return (
            <Card 
              key={plan} 
              className={`relative transition-all duration-300 hover:shadow-xl ${
                config.popular ? 'ring-2 ring-blue-500 shadow-lg scale-105' : ''
              } ${config.recommended ? 'ring-2 ring-purple-500 shadow-lg scale-105' : ''} ${
                config.bgColor
              } ${config.borderColor} border-2`}
            >
              {/* Badges */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {config.popular && (
                  <Badge className="bg-blue-600 text-white shadow-md">
                    <Star className="h-3 w-3 mr-1" />
                    Plus populaire
                  </Badge>
                )}
                {config.recommended && (
                  <Badge className="bg-purple-600 text-white shadow-md">
                    <Crown className="h-3 w-3 mr-1" />
                    Recommandé
                  </Badge>
                )}
              </div>
              
              <CardHeader className="text-center pt-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <IconComponent className={`h-8 w-8 ${config.color}`} />
                  <CardTitle className="text-2xl">{config.name}</CardTitle>
                  {isCurrentPlan && (
                    <Badge variant="outline" className="ml-2">
                      Actuel
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold">{displayPrice}</span>
                    {plan !== 'standard' && (
                      <span className="text-muted-foreground">
                        /{billingCycle === 'monthly' ? 'mois' : 'mois'}
                      </span>
                    )}
                  </div>
                  
                  {config.originalPrice && billingCycle === 'monthly' && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">
                        {config.originalPrice}/mois
                      </span>
                      <Badge variant="secondary" className="text-green-600">
                        {config.savings}
                      </Badge>
                    </div>
                  )}
                  
                  {billingCycle === 'yearly' && plan !== 'standard' && (
                    <Badge variant="secondary" className="text-green-600">
                      <Sparkles className="h-3 w-3 mr-1" />
                      2 mois offerts
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground text-lg">{config.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <Separator />
                <div className="space-y-3">
                  {config.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={`${
                        feature.included ? '' : 'text-muted-foreground'
                      } ${feature.highlight ? 'font-semibold text-primary' : ''}`}>
                        {feature.name}
                        {feature.limit && (
                          <span className="text-sm text-muted-foreground ml-1">
                            ({feature.limit})
                          </span>
                        )}
                        {feature.highlight && (
                          <Sparkles className="h-3 w-3 inline ml-1 text-primary" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={isCurrentPlan ? "outline" : config.popular ? "default" : "outline"}
                  size="lg"
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
                  ) : plan === 'standard' && !user ? (
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

      {/* Informations supplémentaires */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Annulation à tout moment
          </div>
          <div className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Support dédié inclus
          </div>
          <div className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Mises à jour incluses
          </div>
        </div>
      </div>
    </div>
  )
}