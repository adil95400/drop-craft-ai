import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Crown, Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { checkSubscription } = useStripeSubscription()
  
  const plan = searchParams.get('plan')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Refresh subscription status after successful payment
    if (user && sessionId) {
      setTimeout(() => {
        checkSubscription()
      }, 2000)
    }
  }, [user, sessionId, checkSubscription])

  const planDetails = {
    pro: {
      name: 'Pro',
      price: '29€/mois',
      icon: Star,
      color: 'text-blue-600',
      features: [
        'Import avancé avec IA',
        'Catalogue illimité', 
        'Analytics avancés',
        'Support prioritaire',
        'Automatisation'
      ]
    },
    ultra_pro: {
      name: 'Ultra Pro',
      price: '99€/mois',
      icon: Crown,
      color: 'text-purple-600',
      features: [
        'Toutes les fonctionnalités Pro',
        'IA prédictive avancée',
        'Automatisation complète',
        'Support 24/7',
        'API dédiée'
      ]
    }
  }

  const currentPlan = plan && planDetails[plan as keyof typeof planDetails] 
    ? planDetails[plan as keyof typeof planDetails] 
    : null

  if (!currentPlan) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Paiement traité</h1>
        <Button onClick={() => navigate('/dashboard')}>
          Retour au Dashboard
        </Button>
      </div>
    )
  }

  const IconComponent = currentPlan.icon

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-500 p-3">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-800">
            Paiement réussi !
          </CardTitle>
          <p className="text-green-600">
            Votre abonnement au plan {currentPlan.name} est maintenant actif
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Plan Info */}
          <div className="text-center p-6 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-3 mb-3">
              <IconComponent className={`h-6 w-6 ${currentPlan.color}`} />
              <h3 className="text-xl font-semibold">Plan {currentPlan.name}</h3>
            </div>
            <p className="text-2xl font-bold text-primary mb-2">{currentPlan.price}</p>
            <p className="text-sm text-muted-foreground">Facturation mensuelle</p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="font-semibold">Ce qui est inclus :</h4>
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold">Prochaines étapes :</h4>
            <div className="space-y-2 text-sm">
              <p>✅ Votre compte a été automatiquement mis à niveau</p>
              <p>✅ Vous avez maintenant accès à toutes les fonctionnalités {currentPlan.name}</p>
              <p>✅ Votre prochaine facturation aura lieu dans 30 jours</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="flex-1 gap-2"
            >
              Accéder au Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/import')}
              className="flex-1"
            >
              Commencer l'import
            </Button>
          </div>

          {/* Support */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>Une question ? Contactez notre support à support@shopopti.com</p>
            <p>Facture envoyée par email • Gérez votre abonnement dans le Dashboard</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentSuccess