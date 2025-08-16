import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Crown, Star, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useStripePayments } from '@/hooks/useStripePayments'

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    icon: Heart,
    description: 'Parfait pour commencer',
    features: [
      'Imports basiques',
      'Catalogue de base',
      'Support communautaire',
      'Tableau de bord simplifié'
    ],
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    stripePriceId: null
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29€',
    icon: Star,
    description: 'Pour les entreprises en croissance',
    features: [
      'Tout de Gratuit +',
      'Imports avancés',
      'IA et analyses',
      'Intégrations avancées',
      'Support prioritaire',
      'Exports illimités'
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    stripePriceId: 'price_pro_monthly',
    popular: false
  },
  {
    id: 'ultra_pro',
    name: 'Ultra Pro',
    price: '99€',
    icon: Crown,
    description: 'Solution complète pour les experts',
    features: [
      'Tout de Pro +',
      'IA prédictive avancée',
      'Automatisations complètes',
      'Analytics ultra-avancés',
      'API complète',
      'Support dédié 24/7',
      'Intégrations premium'
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    stripePriceId: 'price_ultra_pro_monthly',
    popular: true
  }
]

export default function PricingPage() {
  const location = useLocation()
  const { user } = useAuth()
  const { plan: currentPlan } = usePlan(user)
  const { createCheckoutSession, isCreatingCheckout } = useStripePayments()
  
  const highlightPlan = location.state?.highlightPlan

  const handleSubscribe = (planId: string, stripePriceId: string | null) => {
    if (!stripePriceId) return
    
    createCheckoutSession({
      priceId: stripePriceId,
      successUrl: `${window.location.origin}/dashboard?upgraded=${planId}`,
      cancelUrl: window.location.href
    })
  }

  const isCurrentPlan = (planId: string) => currentPlan === planId
  const isHighlighted = (planId: string) => highlightPlan === planId

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Choisissez votre plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Débloquez le potentiel complet de votre e-commerce avec nos plans adaptés à vos besoins
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const IconComponent = plan.icon
          const isCurrent = isCurrentPlan(plan.id)
          const isHighlightedPlan = isHighlighted(plan.id)
          
          return (
            <Card 
              key={plan.id}
              className={`relative transition-all duration-300 ${
                plan.popular || isHighlightedPlan
                  ? 'ring-2 ring-primary shadow-lg scale-105 z-10' 
                  : 'hover:shadow-md'
              } ${plan.borderColor} border-2`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Plus populaire
                  </Badge>
                </div>
              )}
              
              {isHighlightedPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-amber-500 text-white">
                    Recommandé pour vous
                  </Badge>
                </div>
              )}

              <CardHeader className={`text-center ${plan.bgColor}`}>
                <div className="mx-auto mb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${plan.bgColor} ${plan.borderColor} border-2`}>
                    <IconComponent className={`h-8 w-8 ${plan.color}`} />
                  </div>
                </div>
                
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-muted-foreground">{plan.description}</p>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.id !== 'free' && (
                    <span className="text-muted-foreground">/mois</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    Plan actuel
                  </Button>
                ) : plan.id === 'free' ? (
                  <Button variant="outline" disabled className="w-full">
                    Gratuit
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular || isHighlightedPlan ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.id, plan.stripePriceId)}
                    disabled={isCreatingCheckout || !user}
                  >
                    {isCreatingCheckout ? 'Redirection...' : `Choisir ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4">
          Besoin d'un plan sur mesure ?
        </p>
        <Button variant="outline">
          Contactez notre équipe commerciale
        </Button>
      </div>
    </div>
  )
}