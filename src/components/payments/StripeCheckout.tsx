import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStripePayments } from '@/hooks/useStripePayments'
import { Check, Crown, Zap, Star } from 'lucide-react'

interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  features: string[]
  popular?: boolean
  stripePriceId: string
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour débuter',
    price: 29,
    currency: 'EUR',
    interval: 'mois',
    stripePriceId: 'price_starter_monthly', // Replace with real Stripe price ID
    features: [
      'Jusqu\'à 100 produits',
      '1 intégration boutique',
      'Support email',
      'Analytics de base',
      'Import CSV/XML'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Le plus populaire',
    price: 79,
    currency: 'EUR',
    interval: 'mois',
    stripePriceId: 'price_pro_monthly', // Replace with real Stripe price ID
    popular: true,
    features: [
      'Jusqu\'à 1000 produits',
      '5 intégrations boutiques',
      'Support prioritaire',
      'Analytics avancés',
      'IA d\'optimisation',
      'Marketing automation',
      'Tracking en temps réel'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Pour les pros',
    price: 199,
    currency: 'EUR',
    interval: 'mois',
    stripePriceId: 'price_enterprise_monthly', // Replace with real Stripe price ID
    features: [
      'Produits illimités',
      'Intégrations illimitées',
      'Support 24/7',
      'Analytics Ultra Pro',
      'IA avancée',
      'API personnalisée',
      'Onboarding dédié'
    ]
  }
]

export function StripeCheckout() {
  const {
    subscription,
    hasActiveSubscription,
    isSubscriptionCancelled,
    createCheckoutSession,
    createPortalSession,
    checkSubscription,
    isCreatingCheckout,
    isCreatingPortal,
    isCheckingSubscription
  } = useStripePayments()

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handleSubscribe = (plan: PricingPlan) => {
    setSelectedPlan(plan.id)
    createCheckoutSession({
      priceId: plan.stripePriceId,
      successUrl: `${window.location.origin}/dashboard?success=true`,
      cancelUrl: `${window.location.origin}/pricing?canceled=true`
    })
  }

  const handleManageSubscription = () => {
    createPortalSession()
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Zap className="w-5 h-5" />
      case 'pro':
        return <Star className="w-5 h-5" />
      case 'enterprise':
        return <Crown className="w-5 h-5" />
      default:
        return <Check className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {hasActiveSubscription && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Abonnement Actif</CardTitle>
            <CardDescription className="text-green-600">
              Votre abonnement {subscription?.plan_name} est actif jusqu'au{' '}
              {subscription?.current_period_end 
                ? new Date(subscription.current_period_end).toLocaleDateString()
                : 'date inconnue'
              }
              {isSubscriptionCancelled && (
                <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                  Sera annulé
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isCreatingPortal}
            >
              {isCreatingPortal ? 'Ouverture...' : 'Gérer l\'abonnement'}
            </Button>
            <Button
              variant="outline"
              onClick={() => checkSubscription()}
              disabled={isCheckingSubscription}
            >
              {isCheckingSubscription ? 'Vérification...' : 'Actualiser le statut'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Pricing Plans */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Choisissez votre plan</h2>
          <p className="text-muted-foreground">
            Démarrez gratuitement, puis évoluez selon vos besoins
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Le plus populaire
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {plan.price}€
                  </span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCreatingCheckout && selectedPlan === plan.id}
                >
                  {isCreatingCheckout && selectedPlan === plan.id
                    ? 'Redirection...'
                    : hasActiveSubscription && subscription?.plan_name === plan.name
                    ? 'Plan actuel'
                    : 'Choisir ce plan'
                  }
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Enterprise Contact */}
      <Card className="text-center">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2">Besoin d'un plan sur mesure ?</h3>
          <p className="text-muted-foreground mb-4">
            Contactez-nous pour une solution Enterprise personnalisée
          </p>
          <Button variant="outline">
            Contacter les ventes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}