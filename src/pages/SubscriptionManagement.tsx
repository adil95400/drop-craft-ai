import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Crown, 
  Check, 
  X, 
  TrendingUp, 
  Users, 
  Zap, 
  Shield,
  CreditCard,
  Calendar,
  AlertTriangle
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  billing: 'monthly' | 'yearly'
  features: string[]
  limits: {
    products: number
    orders: number
    storage: string
    support: string
  }
  popular?: boolean
}

interface UsageStats {
  products: { used: number; limit: number }
  orders: { used: number; limit: number }
  storage: { used: string; limit: string }
}

const SubscriptionManagement = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string>('standard')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [usageStats, setUsageStats] = useState<UsageStats>({
    products: { used: 247, limit: 1000 },
    orders: { used: 1892, limit: 5000 },
    storage: { used: '2.4 GB', limit: '10 GB' }
  })

  const plans: Plan[] = [
    {
      id: 'standard',
      name: 'Standard',
      price: billingCycle === 'monthly' ? 29 : 290,
      currency: 'EUR',
      billing: billingCycle,
      features: [
        'Jusqu\'à 1,000 produits',
        'Jusqu\'à 5,000 commandes/mois',
        '10 GB de stockage',
        'Support email',
        'Rapports de base',
        'Intégrations limitées'
      ],
      limits: {
        products: 1000,
        orders: 5000,
        storage: '10 GB',
        support: 'Email'
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? 79 : 790,
      currency: 'EUR',
      billing: billingCycle,
      popular: true,
      features: [
        'Jusqu\'à 10,000 produits',
        'Commandes illimitées',
        '100 GB de stockage',
        'Support prioritaire',
        'Rapports avancés',
        'Toutes les intégrations',
        'API avancée',
        'Automation marketing'
      ],
      limits: {
        products: 10000,
        orders: -1,
        storage: '100 GB',
        support: 'Prioritaire'
      }
    },
    {
      id: 'ultra_pro',
      name: 'Ultra Pro',
      price: billingCycle === 'monthly' ? 199 : 1990,
      currency: 'EUR',
      billing: billingCycle,
      features: [
        'Produits illimités',
        'Commandes illimitées',
        'Stockage illimité',
        'Support 24/7',
        'Analytics IA',
        'White label',
        'Intégrations custom',
        'API complète',
        'CRM avancé',
        'Automation IA'
      ],
      limits: {
        products: -1,
        orders: -1,
        storage: 'Illimité',
        support: '24/7'
      }
    }
  ]

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData()
      loadUsageStats()
    }
  }, [user?.id])

  const loadSubscriptionData = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      if (profile?.subscription_plan) {
        setCurrentPlan(profile.subscription_plan)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const loadUsageStats = async () => {
    try {
      // Load products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      if (productsError) throw productsError

      // Load orders count
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      if (ordersError) throw ordersError

      setUsageStats({
        products: { used: productsCount || 0, limit: 1000 },
        orders: { used: ordersCount || 0, limit: 5000 },
        storage: { used: '2.4 GB', limit: '10 GB' }
      })
    } catch (error) {
      console.error('Error loading usage stats:', error)
    }
  }

  const upgradePlan = async (planId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: planId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      setCurrentPlan(planId)
      toast.success(`Plan mis à jour vers ${plans.find(p => p.id === planId)?.name}`)
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast.error('Erreur lors de la mise à jour du plan')
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (used: number, limit: number) => {
    if (limit === -1) return 0
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (used: number, limit: number) => {
    if (limit === -1) return 'text-green-600'
    const percentage = (used / limit) * 100
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-orange-600'
    return 'text-green-600'
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <Crown className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gestion de l'abonnement</h1>
          <p className="text-muted-foreground">
            Gérez votre plan et suivez votre utilisation
          </p>
        </div>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Plan actuel</span>
            <Badge variant={currentPlan === 'ultra_pro' ? 'default' : 'secondary'}>
              {plans.find(p => p.id === currentPlan)?.name || 'Standard'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Votre abonnement actuel et son utilisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Produits</span>
                <span className={`text-sm ${getUsageColor(usageStats.products.used, usageStats.products.limit)}`}>
                  {usageStats.products.used} / {usageStats.products.limit === -1 ? '∞' : usageStats.products.limit}
                </span>
              </div>
              <Progress 
                value={calculateProgress(usageStats.products.used, usageStats.products.limit)} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Commandes</span>
                <span className={`text-sm ${getUsageColor(usageStats.orders.used, usageStats.orders.limit)}`}>
                  {usageStats.orders.used} / {usageStats.orders.limit === -1 ? '∞' : usageStats.orders.limit}
                </span>
              </div>
              <Progress 
                value={calculateProgress(usageStats.orders.used, usageStats.orders.limit)} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stockage</span>
                <span className="text-sm text-green-600">
                  {usageStats.storage.used} / {usageStats.storage.limit}
                </span>
              </div>
              <Progress value={24} className="h-2" />
            </div>
          </div>

          {usageStats.products.used / usageStats.products.limit > 0.8 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-800">
                Vous approchez de la limite de votre plan. Considérez une mise à niveau.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Cycle Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Plans disponibles</CardTitle>
          <CardDescription>
            Choisissez le plan qui correspond le mieux à vos besoins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground'}>
              Mensuel
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            >
              {billingCycle === 'monthly' ? 'Passer à l\'annuel' : 'Passer au mensuel'}
            </Button>
            <span className={billingCycle === 'yearly' ? 'font-medium' : 'text-muted-foreground'}>
              Annuel (-10%)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${
                  currentPlan === plan.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Plus populaire
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    {plan.id === 'ultra_pro' && <Crown className="w-5 h-5 text-yellow-500" />}
                    {plan.name}
                  </CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {plan.price}€
                      <span className="text-lg font-normal text-muted-foreground">
                        /{plan.billing === 'monthly' ? 'mois' : 'an'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-green-600">
                        Économisez 10% avec la facturation annuelle
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Limites du plan:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Produits: {plan.limits.products === -1 ? '∞' : plan.limits.products}</div>
                      <div>Commandes: {plan.limits.orders === -1 ? '∞' : plan.limits.orders}</div>
                      <div>Stockage: {plan.limits.storage}</div>
                      <div>Support: {plan.limits.support}</div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    variant={currentPlan === plan.id ? 'secondary' : 'default'}
                    disabled={currentPlan === plan.id || loading}
                    onClick={() => upgradePlan(plan.id)}
                  >
                    {currentPlan === plan.id ? 'Plan actuel' : `Passer à ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Historique de facturation
          </CardTitle>
          <CardDescription>
            Vos dernières factures et paiements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { date: '01/01/2024', amount: '79€', status: 'Payé', plan: 'Pro', period: 'Janvier 2024' },
              { date: '01/12/2023', amount: '79€', status: 'Payé', plan: 'Pro', period: 'Décembre 2023' },
              { date: '01/11/2023', amount: '29€', status: 'Payé', plan: 'Standard', period: 'Novembre 2023' },
              { date: '01/10/2023', amount: '29€', status: 'Payé', plan: 'Standard', period: 'Octobre 2023' }
            ].map((invoice, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invoice.period}</p>
                    <p className="text-sm text-muted-foreground">Plan {invoice.plan}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{invoice.amount}</span>
                  <Badge variant="secondary">{invoice.status}</Badge>
                  <Button variant="ghost" size="sm">
                    Télécharger
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <Button variant="outline">
              Voir tout l'historique
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Méthode de paiement</CardTitle>
          <CardDescription>
            Gérez vos informations de paiement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expire 12/2027</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Modifier
            </Button>
          </div>

          <Button variant="ghost" className="w-full">
            + Ajouter une méthode de paiement
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default SubscriptionManagement