import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useFreeTrial } from '@/hooks/useFreeTrial'
import { Sparkles, Clock, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function FreeTrialBanner() {
  const { trial, hasActiveTrial, daysRemaining, convertTrial, isConverting } = useFreeTrial()
  const navigate = useNavigate()

  if (!hasActiveTrial) return null

  // Get trial data from the trial object (from free_trial_subscriptions table)
  const trialDays = (trial as any)?.trial_days || 14
  const trialPlan = (trial as any)?.trial_plan || 'pro'
  const progress = trialDays > 0 ? ((trialDays - daysRemaining) / trialDays) * 100 : 0

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-lg">
              Essai gratuit {trialPlan?.toUpperCase()} actif
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant
                {daysRemaining > 1 ? 's' : ''} sur {trialDays}
              </span>
            </div>

            <Progress value={progress} className="h-2" />

            <p className="text-sm text-muted-foreground">
              Profitez de toutes les fonctionnalités premium. Convertissez en
              abonnement payant pour continuer après l'essai.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => convertTrial()}
            disabled={isConverting}
            className="whitespace-nowrap"
          >
            <Crown className="w-4 h-4 mr-2" />
            {isConverting ? 'Conversion...' : 'Passer au plan payant'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/billing')}
            className="whitespace-nowrap"
          >
            Voir les tarifs
          </Button>
        </div>
      </div>
    </Card>
  )
}