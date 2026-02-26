import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'
import { Crown, Star, Shield, Calendar, CreditCard, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

const planIcons = {
  free: Shield,
  pro: Star,
  ultra_pro: Crown
}

const planNames = {
  free: 'Gratuit',
  pro: 'Pro',
  ultra_pro: 'Ultra Pro'
}

const planColors = {
  free: 'text-gray-600 bg-gray-100',
  pro: 'text-blue-600 bg-blue-100',
  ultra_pro: 'text-purple-600 bg-purple-100'
}

export const SubscriptionManager = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { subscription, loading, checkSubscription, openCustomerPortal } = useStripeSubscription()
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (user) {
      checkSubscription()
    }
  }, [user])

  const handleRefreshSubscription = async () => {
    setIsChecking(true)
    await checkSubscription()
    setIsChecking(false)
  }

  const handleManageSubscription = () => {
    openCustomerPortal()
  }

  if (loading || !subscription) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const currentPlan = subscription.subscribed && subscription.plan 
    ? subscription.plan 
    : 'standard'
  
  const PlanIcon = planIcons[currentPlan as keyof typeof planIcons]
  const planName = planNames[currentPlan as keyof typeof planNames]
  const planColor = planColors[currentPlan as keyof typeof planColors]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlanIcon className="h-6 w-6 text-primary" />
            <CardTitle>Gestion de l'Abonnement</CardTitle>
          </div>
          <Badge className={planColor}>
            <PlanIcon className="h-3 w-3 mr-1" />
            {planName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status d'abonnement */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${subscription.subscribed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div>
                <p className="font-medium">Statut de l'abonnement</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.subscribed ? 'Actif' : 'Inactif'}
                </p>
              </div>
            </div>
            {subscription.subscribed && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Payé
              </Badge>
            )}
          </div>

          {/* Date d'expiration */}
          {subscription.subscription_end && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Prochaine facturation</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(subscription.subscription_end), 'dd MMMM yyyy', { locale: getDateFnsLocale() })}
                </p>
              </div>
            </div>
          )}

          {/* Plan actuel */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <PlanIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Plan actuel</p>
              <p className="text-sm text-muted-foreground">
                {planName} {subscription.subscribed && currentPlan === 'pro' && '(29€/mois)'}
                {subscription.subscribed && currentPlan === 'ultra_pro' && '(99€/mois)'}
                {!subscription.subscribed && '(Gratuit)'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {subscription.subscribed ? (
            <Button 
              onClick={handleManageSubscription}
              className="flex-1 gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Gérer l'abonnement
              <ExternalLink className="h-3 w-3" />
            </Button>
          ) : (
            <Button 
              onClick={() => navigate('/pricing')}
              className="flex-1 gap-2"
            >
              <Crown className="h-4 w-4" />
              Passer à un plan payant
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleRefreshSubscription}
            disabled={isChecking}
            className="gap-2"
          >
            {isChecking ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              'Actualiser'
            )}
          </Button>
        </div>

        {/* Informations supplémentaires */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Les changements d'abonnement sont gérés via Stripe</p>
          <p>• La facturation est automatique et sécurisée</p>
          <p>• Vous pouvez annuler à tout moment</p>
        </div>
      </CardContent>
    </Card>
  )
}