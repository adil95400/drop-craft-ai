/**
 * Widget de facturation pour le tableau de bord
 * Utilise useStripeIntegration pour éviter les appels multiples
 */
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Crown,
  Star,
  CreditCard,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react'
import { useStripeIntegration } from '@/hooks/useStripeIntegration'
import { Link } from 'react-router-dom'

export function BillingWidget() {
  const { 
    subscription, 
    isLoadingSubscription: loading, 
    refreshSubscription, 
    isLoading: checking 
  } = useStripeIntegration()

  const getPlanConfig = () => {
    if (!subscription?.subscribed) {
      return {
        name: 'Standard',
        color: 'bg-gray-100 text-gray-800',
        icon: Star,
        description: 'Plan gratuit'
      }
    }
    
    if (subscription.subscription_tier === 'ultra_pro') {
      return {
        name: 'Ultra Pro',
        color: 'bg-purple-100 text-purple-800',
        icon: Crown,
        description: 'Plan premium complet'
      }
    }
    
    return {
      name: 'Pro',
      color: 'bg-blue-100 text-blue-800',
      icon: Crown,
      description: 'Plan professionnel'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  // No user check needed - subscription will be null if not logged in

  const planConfig = getPlanConfig()
  const PlanIcon = planConfig.icon
  const daysUntilExpiry = subscription?.subscription_end 
    ? Math.ceil((new Date(subscription.subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Mon Abonnement</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshSubscription}
          disabled={checking}
        >
          <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-primary/10">
            <PlanIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{planConfig.name}</span>
              <Badge className={planConfig.color}>
                {subscription?.subscribed ? 'Actif' : 'Gratuit'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {planConfig.description}
            </p>
          </div>
        </div>

        {subscription?.subscribed && subscription.subscription_end && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Expire dans</span>
              <span className="font-medium">{daysUntilExpiry} jours</span>
            </div>
            <Progress 
              value={Math.max(0, Math.min(100, (daysUntilExpiry || 0) / 30 * 100))} 
              className="h-2" 
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild className="flex-1">
            <Link to="/modern/billing" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Gérer
            </Link>
          </Button>
          {!subscription?.subscribed && (
            <Button size="sm" asChild className="flex-1">
              <Link to="/modern/billing" className="flex items-center gap-1">
                Passer Pro
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}