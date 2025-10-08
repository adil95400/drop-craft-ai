import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'
import { Crown, CreditCard, Calendar, RefreshCw, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const SubscriptionManager = () => {
  const { 
    subscription,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal
  } = useStripeSubscription()
  const { toast } = useToast()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  const handleUpgrade = async (plan: 'pro' | 'ultra_pro') => {
    try {
      await createCheckout(plan)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement",
        variant: "destructive"
      })
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await checkSubscription()
      toast({
        title: "Statut mis à jour",
        description: "Votre statut d'abonnement a été actualisé",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal()
    } catch (error) {
      toast({
        title: "Erreur", 
        description: "Impossible d'ouvrir le portail de gestion",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPlanBadge = (tier: string | null) => {
    switch (tier) {
      case 'pro':
        return <Badge className="bg-blue-100 text-blue-800">Pro</Badge>
      case 'ultra_pro':
        return <Badge className="bg-purple-100 text-purple-800"><Crown className="w-3 h-3 mr-1" />Ultra Pro</Badge>
      default:
        return <Badge variant="secondary">Standard</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Chargement...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Mon Abonnement
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Actualiser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Plan actuel</p>
              <div className="flex items-center gap-2 mt-1">
                {getPlanBadge(subscription?.plan)}
                {subscription?.subscribed && (
                  <Badge className="bg-green-100 text-green-800">Actif</Badge>
                )}
              </div>
            </div>
            {subscription?.subscribed && subscription?.subscription_end && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Renouvellement</p>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(subscription.subscription_end)}</span>
                </div>
              </div>
            )}
          </div>

          {subscription?.subscribed && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Gérer mon abonnement
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {!subscription?.subscribed && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                Plan Pro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold">19,99€</div>
                <div className="text-sm text-muted-foreground">par mois</div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Fonctionnalités avancées
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Support prioritaire
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Analytics détaillés
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => handleUpgrade('pro')}
                disabled={loading}
              >
                Passer au Pro
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-purple-200">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Populaire
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                Plan Ultra Pro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold">49,99€</div>
                <div className="text-sm text-muted-foreground">par mois</div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Toutes les fonctionnalités Pro
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  IA avancée et automatisation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Intégrations entreprise
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Support 24/7
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700" 
                onClick={() => handleUpgrade('ultra_pro')}
                disabled={loading}
              >
                Passer à Ultra Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}