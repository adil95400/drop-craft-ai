import { Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PlanSelector } from '@/components/plan/PlanSelector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Star, Zap } from 'lucide-react'

const Pricing = () => {
  const { user } = useAuth()

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Plans et Tarifs</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Choisissez le plan parfait pour vos besoins de dropshipping et e-commerce. 
          Commencez gratuitement et évoluez selon vos besoins.
        </p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            Mise à niveau instantanée
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Star className="h-3 w-3" />
            Support inclus
          </Badge>
        </div>
      </div>

      {/* Plan Selector */}
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <PlanSelector />
      </Suspense>

      {/* Features Comparison */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="text-center">Comparaison détaillée des fonctionnalités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Fonctionnalité</th>
                  <th className="text-center p-4">Standard</th>
                  <th className="text-center p-4">Pro</th>
                  <th className="text-center p-4">Ultra Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Import produits/jour</td>
                  <td className="text-center p-4">10</td>
                  <td className="text-center p-4">100</td>
                  <td className="text-center p-4">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Catalogue produits</td>
                  <td className="text-center p-4">100</td>
                  <td className="text-center p-4">Illimité</td>
                  <td className="text-center p-4">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">IA Analytics</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">✅</td>
                  <td className="text-center p-4">✅ Avancé</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Automatisation</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">5 tâches</td>
                  <td className="text-center p-4">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Support</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4">Prioritaire</td>
                  <td className="text-center p-4">24/7</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">API Access</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">Basique</td>
                  <td className="text-center p-4">Complète</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="text-center">Questions Fréquentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Puis-je changer de plan à tout moment ?</h3>
            <p className="text-muted-foreground">
              Oui, vous pouvez mettre à niveau votre plan à tout moment. La facturation est ajustée au prorata.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Y a-t-il des frais cachés ?</h3>
            <p className="text-muted-foreground">
              Non, tous nos tarifs sont transparents. Pas de frais d'installation ou de configuration.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Comment fonctionne la période d'essai ?</h3>
            <p className="text-muted-foreground">
              Commencez avec le plan Standard gratuit, puis passez à Pro ou Ultra Pro quand vous êtes prêt.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Que se passe-t-il si je dépasse mes quotas ?</h3>
            <p className="text-muted-foreground">
              Vous recevrez une notification et pourrez soit attendre la réinitialisation, soit passer à un plan supérieur.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Pricing