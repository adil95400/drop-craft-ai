/**
 * Composant unifié pour contrôler l'accès aux fonctionnalités
 * Remplace tous les guards de plan dispersés
 */

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Zap, Shield } from 'lucide-react'
import { useUnifiedPlan, type PlanType } from '@/lib/unified-plan-system'

interface FeatureGateProps {
  children: React.ReactNode
  feature?: string
  minPlan?: PlanType
  fallback?: React.ReactNode
  showUpgrade?: boolean
  upgradeMessage?: string
  onUpgrade?: () => void
}

export function UnifiedFeatureGate({
  children,
  feature,
  minPlan,
  fallback,
  showUpgrade = true,
  upgradeMessage,
  onUpgrade
}: FeatureGateProps) {
  const { hasFeature, hasPlan, effectivePlan, isPro, isUltraPro } = useUnifiedPlan()
  
  // Vérifier l'accès selon la fonctionnalité ou le plan minimum
  const hasAccess = feature ? hasFeature(feature) : minPlan ? hasPlan(minPlan) : true
  
  if (hasAccess) {
    return <>{children}</>
  }
  
  // Fallback personnalisé
  if (fallback) {
    return <>{fallback}</>
  }
  
  // Interface d'upgrade par défaut
  if (showUpgrade) {
    const targetPlan = feature 
      ? (hasFeature(feature) ? null : (isPro() ? 'ultra_pro' : 'pro'))
      : minPlan
    
    const planIcon = targetPlan === 'ultra_pro' ? Crown : targetPlan === 'pro' ? Zap : Shield
    const PlanIcon = planIcon
    
    return (
      <Alert className="border-dashed">
        <PlanIcon className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="space-y-1">
            <p>{upgradeMessage || `Cette fonctionnalité nécessite le plan ${targetPlan?.toUpperCase()}`}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Plan actuel:</span>
              <Badge variant="outline">{effectivePlan.toUpperCase()}</Badge>
              {targetPlan && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="default">{targetPlan.toUpperCase()}</Badge>
                </>
              )}
            </div>
          </div>
          {onUpgrade && (
            <Button onClick={onUpgrade} size="sm">
              Upgrader
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }
  
  return null
}

// Composants de convenance pour les plans spécifiques
export const ProFeature: React.FC<Omit<FeatureGateProps, 'minPlan'>> = (props) => (
  <UnifiedFeatureGate {...props} minPlan="pro" />
)

export const UltraProFeature: React.FC<Omit<FeatureGateProps, 'minPlan'>> = (props) => (
  <UnifiedFeatureGate {...props} minPlan="ultra_pro" />
)

// Hook pour les composants qui veulent juste vérifier l'accès
export function useFeatureAccess(feature?: string, minPlan?: PlanType) {
  const { hasFeature, hasPlan } = useUnifiedPlan()
  
  if (feature) return hasFeature(feature)
  if (minPlan) return hasPlan(minPlan)
  return true
}