/**
 * Panel IA Contextuel V3
 * Affiche les insights IA pour la sélection actuelle ou le catalogue
 */

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, 
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  ChevronRight,
  Info,
  X
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProductAIBadge, AIPriorityEngineResult } from './useAIPriorityEngine'

interface AIContextPanelProps {
  engineResult: AIPriorityEngineResult
  selectedProductIds?: string[]
  onClose?: () => void
  onAction?: (action: string, productIds: string[]) => void
  isCollapsed?: boolean
  className?: string
}

export function AIContextPanel({
  engineResult,
  selectedProductIds = [],
  onClose,
  onAction,
  isCollapsed = false,
  className
}: AIContextPanelProps) {
  const { metrics, productBadges, priorityCards } = engineResult
  
  // Calculer les stats pour la sélection ou le catalogue complet
  const contextStats = useMemo(() => {
    const targetIds = selectedProductIds.length > 0 
      ? selectedProductIds 
      : Array.from(productBadges.keys())
    
    const badges = targetIds
      .map(id => productBadges.get(id))
      .filter(Boolean) as ProductAIBadge[]
    
    const riskCount = badges.filter(b => b.type === 'risk').length
    const opportunityCount = badges.filter(b => b.type === 'opportunity').length
    const optimizedCount = badges.filter(b => b.type === 'optimized').length
    const criticalCount = badges.filter(b => b.priority === 'critical').length
    
    return {
      total: targetIds.length,
      riskCount,
      opportunityCount,
      optimizedCount,
      criticalCount,
      isSelection: selectedProductIds.length > 0
    }
  }, [selectedProductIds, productBadges])
  
  // Top actions recommandées
  const topActions = useMemo(() => {
    const actions: Array<{
      id: string
      label: string
      description: string
      impact: string
      productIds: string[]
      variant: 'destructive' | 'warning' | 'primary'
    }> = []
    
    // Actions basées sur les cartes de priorité
    priorityCards.slice(0, 3).forEach(card => {
      if (card.count > 0) {
        actions.push({
          id: card.type,
          label: getActionLabel(card.type),
          description: getActionDescription(card.type, card.count),
          impact: card.impactLabel,
          productIds: card.productIds,
          variant: card.priority === 'critical' ? 'destructive' : 
                   card.priority === 'high' ? 'warning' : 'primary'
        })
      }
    })
    
    return actions
  }, [priorityCards])
  
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'fixed right-4 top-1/2 -translate-y-1/2 z-40',
          className
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full bg-primary/10 border-primary/30 hover:bg-primary/20"
                onClick={() => onAction?.('expand', [])}
              >
                <Brain className="h-6 w-6 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Ouvrir le panel IA</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn('relative', className)}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Intelligence IA
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {contextStats.isSelection 
                    ? `${contextStats.total} sélectionné(s)`
                    : 'Vue catalogue'
                  }
                </p>
              </div>
            </div>
            
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Health Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Score santé</span>
              <span className="font-bold text-lg">{metrics.healthScore}/100</span>
            </div>
            <Progress 
              value={metrics.healthScore} 
              className="h-2"
            />
            <p className="text-[10px] text-muted-foreground">
              Basé sur stock, marges, qualité et synchronisation
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-4 w-4 mx-auto text-red-500 mb-1" />
              <p className="text-lg font-bold text-red-600">{contextStats.riskCount}</p>
              <p className="text-[10px] text-muted-foreground">Risques</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
              <p className="text-lg font-bold text-emerald-600">{contextStats.opportunityCount}</p>
              <p className="text-[10px] text-muted-foreground">Opportunités</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-500/10">
              <CheckCircle className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold text-blue-600">{contextStats.optimizedCount}</p>
              <p className="text-[10px] text-muted-foreground">Optimisés</p>
            </div>
          </div>
          
          {/* Estimated Gain */}
          {metrics.estimatedPotentialGain > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
              <Sparkles className="h-5 w-5 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-600">
                  +{metrics.estimatedPotentialGain.toLocaleString()}€
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Potentiel d'optimisation estimé
                </p>
              </div>
            </div>
          )}
          
          {/* Top Actions */}
          {topActions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Actions recommandées
              </p>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2 pr-2">
                  {topActions.map((action) => (
                    <motion.button
                      key={action.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onAction?.(action.id, action.productIds)}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left transition-colors',
                        'hover:border-primary/50 hover:bg-primary/5',
                        action.variant === 'destructive' && 'border-red-500/30 bg-red-500/5',
                        action.variant === 'warning' && 'border-amber-500/30 bg-amber-500/5',
                        action.variant === 'primary' && 'border-primary/30 bg-primary/5'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{action.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {action.description}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className="mt-2 text-[10px]"
                      >
                        {action.impact}
                      </Badge>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {/* AI Info */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-[10px] text-muted-foreground">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            <p>
              Les priorités sont calculées selon: Stock (35%), Marge (25%), Qualité (20%), Sync (10%), Prix (10%)
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Helpers
function getActionLabel(type: string): string {
  const labels: Record<string, string> = {
    stock_critical: 'Gérer le stock',
    no_price_rule: 'Appliquer règle prix',
    ai_opportunities: 'Optimiser maintenant',
    not_synced: 'Resynchroniser',
    quality_low: 'Améliorer qualité',
    margin_loss: 'Revoir les prix'
  }
  return labels[type] || 'Action'
}

function getActionDescription(type: string, count: number): string {
  const descriptions: Record<string, string> = {
    stock_critical: `${count} produits en rupture imminente`,
    no_price_rule: `${count} produits sans règle de tarification`,
    ai_opportunities: `${count} opportunités d'optimisation détectées`,
    not_synced: `${count} produits non synchronisés`,
    quality_low: `${count} produits avec score qualité faible`,
    margin_loss: `${count} produits avec marge insuffisante`
  }
  return descriptions[type] || `${count} produits concernés`
}
