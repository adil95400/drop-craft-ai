import { useState } from 'react'
import { Crown, Star, TrendingUp, Zap, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUnifiedPlan } from './UnifiedPlanProvider'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'
import { useNavigate } from 'react-router-dom'

const quickUpgrades = [
  {
    from: 'free',
    to: 'pro' as const,
    title: 'Passez au Pro',
    description: 'Débloquez l\'IA et les fonctionnalités avancées',
    benefits: ['AI Analytics', 'Import automatisé', 'Support prioritaire'],
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    from: 'free',
    to: 'ultra_pro' as const,
    title: 'Directement à Ultra Pro',
    description: 'Toute la puissance pour les professionnels',
    benefits: ['Tout illimité', 'Predictive Analytics', 'Support 24/7'],
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    popular: true
  },
  {
    from: 'pro',
    to: 'ultra_pro' as const,
    title: 'Upgrade vers Ultra Pro',
    description: 'Maximisez vos performances',
    benefits: ['Analytics avancés', 'Automatisation complète', 'API illimitée'],
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
]

export const PlanQuickActions = () => {
  const [loading, setLoading] = useState<string | null>(null)
  const { plan, loading: planLoading } = useUnifiedPlan()
  const { createCheckout } = useStripeSubscription()
  const navigate = useNavigate()

  if (planLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  const availableUpgrades = quickUpgrades.filter(upgrade => upgrade.from === plan)

  if (availableUpgrades.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <Crown className="h-8 w-8 text-green-600 mx-auto" />
            <p className="font-semibold text-green-800">Vous avez le plan maximum !</p>
            <p className="text-sm text-green-600">Profitez de toutes les fonctionnalités premium</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleUpgrade = async (targetPlan: 'pro' | 'ultra_pro') => {
    setLoading(targetPlan)
    try {
      await createCheckout(targetPlan)
    } catch (error) {
      console.error('Erreur lors de la création du checkout:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Upgrades recommandés</h3>
      </div>
      
      <div className="grid gap-4">
        {availableUpgrades.map((upgrade) => {
          const IconComponent = upgrade.icon
          const isLoading = loading === upgrade.to
          
          return (
            <Card 
              key={upgrade.to}
              className={`relative ${upgrade.borderColor} border-2 ${upgrade.bgColor} transition-all hover:shadow-md`}
            >
              {upgrade.popular && (
                <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
                  Recommandé
                </Badge>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <IconComponent className={`h-6 w-6 ${upgrade.color}`} />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{upgrade.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {upgrade.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={() => handleUpgrade(upgrade.to)}
                  disabled={isLoading}
                  className="w-full gap-2"
                  variant={upgrade.popular ? "default" : "outline"}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Redirection...
                    </div>
                  ) : (
                    <>
                      Passer au {upgrade.to === 'ultra_pro' ? 'Ultra Pro' : 'Pro'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <div className="text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/pricing')}
          className="text-muted-foreground hover:text-foreground"
        >
          Voir tous les plans et tarifs
        </Button>
      </div>
    </div>
  )
}