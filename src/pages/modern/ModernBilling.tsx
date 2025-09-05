/**
 * Interface moderne de facturation et abonnements
 */
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Check,
  Crown,
  Star,
  Zap,
  CreditCard,
  Settings,
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useSearchParams } from 'react-router-dom'

interface Subscription {
  subscribed: boolean
  subscription_tier?: string
  subscription_end?: string
}

const plans = [
  {
    id: 'standard',
    name: 'Standard',
    price: 0,
    description: 'Pour débuter avec les fonctionnalités de base',
    features: [
      'Import de produits basique',
      'Gestion de 100 produits max',
      'Support par email',
      'Tableaux de bord standard'
    ],
    icon: Star,
    color: 'bg-gray-100 text-gray-800',
    current: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    description: 'Pour les entreprises en croissance',
    features: [
      'Import illimité de produits',
      'Connecteurs fournisseurs avancés',
      'Analytics et rapports détaillés',
      'Automatisation IA',
      'Support prioritaire'
    ],
    icon: Zap,
    color: 'bg-blue-100 text-blue-800',
    popular: true
  },
  {
    id: 'ultra_pro',
    name: 'Ultra Pro',
    price: 19.99,
    description: 'Pour les professionnels exigeants',
    features: [
      'Toutes les fonctionnalités Pro',
      'Marketing automation avancé',
      'IA prédictive et insights',
      'Intégrations enterprise',
      'Support dédié 24/7',
      'Fonctionnalités white-label'
    ],
    icon: Crown,
    color: 'bg-purple-100 text-purple-800'
  }
]

export default function ModernBilling() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingSubscription, setCheckingSubscription] = useState(false)

  // Check for success/cancel parameters
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: "Abonnement activé !",
        description: "Votre abonnement a été activé avec succès. Vérification en cours...",
      })
      // Check subscription after successful payment
      setTimeout(() => checkSubscription(), 2000)
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Paiement annulé",
        description: "Vous pouvez reprendre votre abonnement à tout moment.",
        variant: "destructive"
      })
    }
  }, [searchParams, toast])

  const checkSubscription = async () => {
    if (!user) return
    
    setCheckingSubscription(true)
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription')
      
      if (error) throw error
      
      setSubscription(data)
      toast({
        title: "Statut mis à jour",
        description: "Votre statut d'abonnement a été actualisé",
      })
    } catch (error) {
      console.error('Error checking subscription:', error)
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le statut de l'abonnement",
        variant: "destructive"
      })
    } finally {
      setCheckingSubscription(false)
    }
  }

  const createCheckout = async (plan: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour souscrire à un abonnement",
        variant: "destructive"
      })
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { plan }
      })
      
      if (error) throw error
      
      if (data?.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement",
        variant: "destructive"
      })
    }
  }

  const openCustomerPortal = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal')
      
      if (error) throw error
      
      if (data?.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le portail client",
        variant: "destructive"
      })
    }
  }

  // Initial subscription check
  useEffect(() => {
    if (user) {
      checkSubscription().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  const getCurrentPlan = () => {
    if (!subscription?.subscribed) return 'standard'
    return subscription.subscription_tier || 'standard'
  }

  const currentPlan = getCurrentPlan()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturation & Abonnements</h1>
          <p className="text-muted-foreground">
            Gérez votre abonnement et accédez aux fonctionnalités premium
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={checkSubscription}
            disabled={checkingSubscription}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${checkingSubscription ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {subscription?.subscribed && (
            <Button variant="outline" size="sm" onClick={openCustomerPortal}>
              <Settings className="mr-2 h-4 w-4" />
              Gérer l'abonnement
            </Button>
          )}
        </div>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-primary/20">
                  {subscription.subscribed ? (
                    <Crown className="h-6 w-6 text-primary" />
                  ) : (
                    <Star className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl">
                    Plan {plans.find(p => p.id === currentPlan)?.name || 'Standard'}
                  </CardTitle>
                  <CardDescription>
                    {subscription.subscribed 
                      ? `Actif jusqu'au ${new Date(subscription.subscription_end || '').toLocaleDateString('fr-FR')}`
                      : 'Plan gratuit'
                    }
                  </CardDescription>
                </div>
              </div>
              <Badge className={plans.find(p => p.id === currentPlan)?.color}>
                {subscription.subscribed ? 'Actif' : 'Gratuit'}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const PlanIcon = plan.icon
          const isCurrentPlan = plan.id === currentPlan
          
          return (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden ${
                plan.popular ? 'border-2 border-primary shadow-lg scale-105' : ''
              } ${isCurrentPlan ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Populaire
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-medium rounded-br-lg">
                  Plan actuel
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <PlanIcon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price === 0 ? 'Gratuit' : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mois</span>}
                </div>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled variant="outline">
                      Plan actuel
                    </Button>
                  ) : plan.id === 'standard' ? (
                    <Button className="w-full" variant="outline" disabled>
                      Plan gratuit
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => createCheckout(plan.id)}
                      disabled={!user}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {subscription?.subscribed ? 'Changer de plan' : 'Commencer'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Pourquoi passer à un plan payant ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Automatisation IA avancée
              </h4>
              <p className="text-sm text-muted-foreground">
                Optimisation automatique des prix, génération de contenu SEO, 
                et analyse prédictive de la performance produits.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                Intégrations premium
              </h4>
              <p className="text-sm text-muted-foreground">
                Connectez-vous aux plus grands fournisseurs et marketplaces
                avec nos connecteurs premium et API avancées.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Warning */}
      {!user && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Connexion requise</p>
              <p className="text-sm text-yellow-700">
                Connectez-vous pour gérer vos abonnements et accéder aux fonctionnalités premium.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}