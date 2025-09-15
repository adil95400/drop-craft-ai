import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { logError } from '@/utils/consoleCleanup'
import { Loader2, Crown, CreditCard, Calendar, ExternalLink, Sparkles } from 'lucide-react'

interface SubscriptionData {
  subscribed: boolean
  subscription_tier: string
  subscription_end: string | null
}

const PlanCard = ({ 
  name, 
  price, 
  period = "/mois",
  features, 
  current = false, 
  popular = false,
  onSelect 
}: {
  name: string
  price: string
  period?: string
  features: string[]
  current?: boolean
  popular?: boolean
  onSelect: () => void
}) => (
  <Card className={`relative transition-all duration-200 hover:shadow-lg ${
    current ? 'ring-2 ring-primary bg-primary/5' : ''
  } ${popular ? 'border-orange-200 bg-orange-50/30' : ''}`}>
    {popular && (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1">
          <Sparkles className="w-3 h-3 mr-1" />
          Populaire
        </Badge>
      </div>
    )}
    
    <CardHeader className="text-center">
      <CardTitle className="text-xl">{name}</CardTitle>
      <div className="flex items-center justify-center gap-1">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-muted-foreground">{period}</span>
      </div>
    </CardHeader>
    
    <CardContent className="space-y-4">
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            {feature}
          </li>
        ))}
      </ul>
      
      <Button 
        onClick={onSelect}
        className={`w-full ${current ? 'btn-gradient' : 'btn-outline'}`}
        disabled={current}
      >
        {current ? 'Plan Actuel' : 'Choisir ce Plan'}
      </Button>
    </CardContent>
  </Card>
)

export const SubscriptionManager: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const plans = [
    {
      id: 'standard',
      name: 'Standard',
      price: '9.99€',
      features: [
        '5 fournisseurs connectés',
        '1,000 produits importés',
        'Synchronisation quotidienne',
        'Support par email',
        'Analytics de base'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '19.99€',
      popular: true,
      features: [
        '25 fournisseurs connectés',
        '10,000 produits importés',
        'Synchronisation temps réel',
        'IA d\'optimisation',
        'Analytics avancés',
        'Support prioritaire',
        'Automatisation commandes'
      ]
    },
    {
      id: 'ultra_pro',
      name: 'Ultra Pro',
      price: '39.99€',
      features: [
        'Fournisseurs illimités',
        'Produits illimités',
        'Sync instantanée',
        'IA prédictive complète',
        'Business Intelligence',
        'Support 24/7',
        'Gestion multi-boutiques',
        'API personnalisée'
      ]
    }
  ]

  useEffect(() => {
    if (user) {
      checkSubscription()
    }
  }, [user])

  const checkSubscription = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('check-subscription')
      
      if (error) throw error
      
      setSubscription(data)
    } catch (error) {
      logError(error as Error, 'Error checking subscription');
      toast({
        title: "Erreur",
        description: "Impossible de vérifier l'abonnement",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string) => {
    if (!user) return

    try {
      setCheckingOut(planId)
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          plan: planId,
          mode: 'subscription'
        }
      })
      
      if (error) throw error
      
      // Redirect to Stripe Checkout
      if (data?.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      logError(error as Error, 'Error creating checkout');
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement",
        variant: "destructive"
      })
    } finally {
      setCheckingOut(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.functions.invoke('customer-portal')
      
      if (error) throw error
      
      if (data?.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      logError(error as Error, 'Error opening customer portal');
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au portail de gestion",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {subscription && (
        <Card className={`${subscription.subscribed ? 'bg-green-50 border-green-200' : 'bg-muted/30'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className={`h-5 w-5 ${subscription.subscribed ? 'text-green-600' : 'text-muted-foreground'}`} />
                <CardTitle>Mon Abonnement</CardTitle>
              </div>
              
              <Badge 
                variant={subscription.subscribed ? 'default' : 'secondary'}
                className={subscription.subscribed ? 'bg-green-600' : ''}
              >
                {subscription.subscription_tier?.toUpperCase() || 'GRATUIT'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className="font-medium">
                  {subscription.subscribed ? 'Actif' : 'Gratuit'}
                </p>
              </div>
              
              {subscription.subscription_end && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Renouvellement</p>
                  <p className="font-medium">
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={checkSubscription}
                disabled={loading}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              
              {subscription.subscribed && (
                <Button onClick={handleManageSubscription}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gérer l'Abonnement
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Available */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Choisissez Votre Plan</h2>
          <p className="text-muted-foreground">
            Déverrouillez tout le potentiel de votre dropshipping avec nos plans premium
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              name={plan.name}
              price={plan.price}
              features={plan.features}
              popular={plan.popular}
              current={subscription?.subscription_tier === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des Fonctionnalités</CardTitle>
          <CardDescription>
            Découvrez ce qui est inclus dans chaque plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Fonctionnalité</th>
                  <th className="text-center py-2">Standard</th>
                  <th className="text-center py-2">Pro</th>
                  <th className="text-center py-2">Ultra Pro</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                <tr className="border-b">
                  <td className="py-2">Fournisseurs connectés</td>
                  <td className="text-center">5</td>
                  <td className="text-center">25</td>
                  <td className="text-center">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Produits importés</td>
                  <td className="text-center">1,000</td>
                  <td className="text-center">10,000</td>
                  <td className="text-center">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">IA d'optimisation</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Business Intelligence</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Support</td>
                  <td className="text-center">Email</td>
                  <td className="text-center">Prioritaire</td>
                  <td className="text-center">24/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}