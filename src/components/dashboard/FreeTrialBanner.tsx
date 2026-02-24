import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Rocket, ArrowRight, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUnifiedPlan } from '@/lib/unified-plan-system'

export function FreeTrialBanner() {
  const { currentPlan } = useUnifiedPlan()
  const navigate = useNavigate()

  // Only show for free users
  if (currentPlan !== 'free') return null

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 overflow-hidden relative">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Plan Gratuit
              </Badge>
            </div>
            
            <div>
              <h3 className="text-lg font-bold">
                Débloquez tout le potentiel de Drop Craft AI
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Vous utilisez actuellement le plan gratuit. Passez à un plan payant pour accéder à l'import, l'IA, l'automatisation et bien plus.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {['Import multi-sources', 'IA & Enrichissement', 'Automatisation', 'Analytics avancés'].map((feature) => (
                <div key={feature} className="flex items-center gap-1 text-xs">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[200px]">
            <Button 
              size="lg" 
              className="w-full gap-2"
              onClick={() => navigate('/choose-plan')}
            >
              <Crown className="h-4 w-4" />
              Voir les plans
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              À partir de 29€/mois · Essai à 0,99€
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
