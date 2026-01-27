/**
 * Command Center Header V3
 * Header avec badge IA global et métriques de santé
 */

import { motion } from 'framer-motion'
import { Brain, CheckCircle2, AlertTriangle, TrendingUp, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { COMMAND_CENTER_HEADER } from './labels'
import { RealTimeIndicator } from '../RealTimeIndicator'

interface CommandCenterHeaderV3Props {
  hasIssues: boolean
  totalIssues: number
  healthScore: number
  estimatedPotentialGain: number
  isLoading?: boolean
}

export function CommandCenterHeaderV3({
  hasIssues,
  totalIssues,
  healthScore,
  estimatedPotentialGain,
  isLoading = false
}: CommandCenterHeaderV3Props) {
  const healthColor = healthScore >= 80 
    ? 'text-emerald-500' 
    : healthScore >= 60 
    ? 'text-yellow-500' 
    : 'text-red-500'
  
  const healthBg = healthScore >= 80 
    ? 'from-emerald-500/20 to-green-500/10' 
    : healthScore >= 60 
    ? 'from-yellow-500/20 to-amber-500/10' 
    : 'from-red-500/20 to-orange-500/10'
  
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title + AI Badge */}
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <motion.div 
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
              `bg-gradient-to-br ${healthBg}`,
              'border border-border/50'
            )}
            animate={hasIssues ? { 
              boxShadow: [
                '0 0 0 0 rgba(249, 115, 22, 0)', 
                '0 0 0 8px rgba(249, 115, 22, 0.1)', 
                '0 0 0 0 rgba(249, 115, 22, 0)'
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {hasIssues ? (
              <AlertTriangle className="h-7 w-7 text-orange-500" />
            ) : (
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            )}
          </motion.div>
          
          {/* Title + Subtitle */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold">
                {hasIssues 
                  ? COMMAND_CENTER_HEADER.title 
                  : COMMAND_CENTER_HEADER.allClear.title
                }
              </h2>
              
              {/* AI Badge */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1.5"
                    >
                      <Brain className="h-3.5 w-3.5" />
                      {COMMAND_CENTER_HEADER.aiBadge}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{COMMAND_CENTER_HEADER.aiTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <p className="text-sm text-muted-foreground max-w-xl">
              {hasIssues 
                ? COMMAND_CENTER_HEADER.subtitle 
                : COMMAND_CENTER_HEADER.allClear.subtitle
              }
            </p>
          </div>
        </div>
        
        {/* Right: Metrics + Real-time */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-sm">
            {/* Health Score */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      'bg-gradient-to-br',
                      healthBg
                    )}>
                      <span className={cn('text-sm font-bold', healthColor)}>
                        {healthScore}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-muted-foreground">Santé</p>
                      <p className={cn('text-sm font-medium', healthColor)}>
                        {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Moyen' : 'Critique'}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Score de santé global de votre catalogue (0-100)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Potential Gain */}
            {estimatedPotentialGain > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">Potentiel</p>
                        <p className="text-sm font-medium text-emerald-500">
                          +{estimatedPotentialGain.toLocaleString('fr-FR')}€
                        </p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Gain potentiel estimé si vous traitez les opportunités IA</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Issues Count */}
            {hasIssues && (
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="font-bold">
                  {totalIssues.toLocaleString('fr-FR')}
                </Badge>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  à traiter
                </span>
              </div>
            )}
          </div>
          
          {/* Real-time Indicator */}
          <RealTimeIndicator showMetrics />
        </div>
      </div>
      
      {/* Info Banner (collapsible hint) */}
      <motion.div 
        className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ delay: 0.3 }}
      >
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Une carte = une décision = une action.</span>
          {' '}Cliquez sur le bouton principal pour agir immédiatement, ou sur "Voir détails" pour analyser.
        </p>
      </motion.div>
    </motion.div>
  )
}
