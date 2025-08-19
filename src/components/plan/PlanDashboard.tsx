import { useAuth } from '@/contexts/AuthContext'
import { useSimplePlan } from '@/hooks/useSimplePlan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { QuotaIndicator } from './QuotaIndicator'
import { SubscriptionManager } from './SubscriptionManager'
import { Crown, Star, Shield, TrendingUp, Database, Zap } from 'lucide-react'

const planIcons = {
  standard: Shield,
  pro: Star,
  ultra_pro: Crown
}

const planNames = {
  standard: 'Gratuit',
  pro: 'Pro',
  ultra_pro: 'Ultra Pro'
}

const quotaLabels = {
  'daily_imports': 'Imports quotidiens',
  'monthly_products': 'Produits mensuels',
  'ai_requests': 'Requêtes IA',
  'automation_tasks': 'Tâches automatisées'
}

export const PlanDashboard = () => {
  const { user } = useAuth()
  const { plan, loading } = useSimplePlan(user)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const PlanIcon = planIcons[plan]
  const planName = planNames[plan]

  // Quotas temporairement désactivés
  const mainQuotas: any[] = []

  return (
    <div className="space-y-6">
      {/* Subscription Manager */}
      <SubscriptionManager />

      {/* Plan Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PlanIcon className="h-6 w-6 text-primary" />
              <CardTitle>Plan Actuel</CardTitle>
            </div>
            <Badge variant="default" className="gap-2">
              <PlanIcon className="h-3 w-3" />
              {planName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Performances</p>
                <p className="text-sm text-muted-foreground">Excellent</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Database className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Stockage</p>
                <p className="text-sm text-muted-foreground">Illimité</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Vitesse</p>
                <p className="text-sm text-muted-foreground">Optimale</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotas Overview - Désactivé temporairement */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisation des Quotas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Quotas temporairement désactivés pour éviter les boucles infinies
          </p>
        </CardContent>
      </Card>

      {/* Plan Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Avantages de votre plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan === 'standard' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  Import basique inclus
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  Catalogue de base
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  Support email
                </div>
              </>
            )}
            {plan === 'pro' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  Import avancé avec IA
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  Catalogue illimité
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  Analytics avancés
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  Automatisation
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  Support prioritaire
                </div>
              </>
            )}
            {plan === 'ultra_pro' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  Import illimité + IA
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  Catalogue entreprise
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  IA prédictive
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  Automatisation complète
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  Support 24/7
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  API dédiée
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}