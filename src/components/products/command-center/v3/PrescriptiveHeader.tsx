/**
 * Prescriptive Header V3
 * Header minimaliste et prescriptif - focus sur l'action immédiate
 * Hiérarchie visuelle radicale : le Command Center domine
 */

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Brain, AlertTriangle, CheckCircle2, ChevronDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface PrescriptiveHeaderProps {
  hasIssues: boolean
  totalIssues: number
  healthScore: number
  estimatedPotentialGain: number
  topPriorityAction?: string
  isLoading?: boolean
}

export const PrescriptiveHeader = memo(function PrescriptiveHeader({
  hasIssues,
  totalIssues,
  healthScore,
  estimatedPotentialGain,
  topPriorityAction,
  isLoading = false
}: PrescriptiveHeaderProps) {
  // Health status derived
  const status = useMemo(() => {
    if (healthScore >= 80) return { label: 'Optimisé', color: 'emerald', icon: CheckCircle2 }
    if (healthScore >= 60) return { label: 'À surveiller', color: 'yellow', icon: AlertTriangle }
    return { label: 'Action requise', color: 'red', icon: AlertTriangle }
  }, [healthScore])
  
  const StatusIcon = status.icon
  
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Main Row - Compact & Impactful */}
      <div className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl',
        'bg-gradient-to-r border-2',
        hasIssues 
          ? 'from-orange-500/5 via-red-500/5 to-purple-500/5 border-orange-500/30' 
          : 'from-emerald-500/5 via-green-500/5 to-teal-500/5 border-emerald-500/30'
      )}>
        {/* Left: Status + Message */}
        <div className="flex items-center gap-4">
          {/* Status Icon with pulse */}
          <motion.div 
            className={cn(
              'relative w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
              status.color === 'emerald' && 'bg-emerald-500/20',
              status.color === 'yellow' && 'bg-yellow-500/20',
              status.color === 'red' && 'bg-red-500/20'
            )}
            animate={hasIssues ? { 
              boxShadow: [
                '0 0 0 0 rgba(239, 68, 68, 0)', 
                '0 0 0 10px rgba(239, 68, 68, 0.1)', 
                '0 0 0 0 rgba(239, 68, 68, 0)'
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <StatusIcon className={cn(
              'h-7 w-7',
              status.color === 'emerald' && 'text-emerald-500',
              status.color === 'yellow' && 'text-yellow-500',
              status.color === 'red' && 'text-red-500'
            )} />
            
            {/* Critical badge */}
            {hasIssues && totalIssues > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {totalIssues > 99 ? '99+' : totalIssues}
              </motion.div>
            )}
          </motion.div>
          
          {/* Title & Prescription */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold">
                {hasIssues ? 'Actions prioritaires' : 'Catalogue optimisé'}
              </h2>
              
              {/* AI Badge */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1"
                    >
                      <Brain className="h-3 w-3" />
                      IA
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Piloté par Intelligence Artificielle</p>
                    <p className="text-xs text-muted-foreground">
                      Les priorités sont calculées selon : Stock (35%), Marge (25%), Qualité (20%), Sync (10%), Prix (10%)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Prescriptive message */}
            <p className="text-sm text-muted-foreground mt-0.5">
              {hasIssues && topPriorityAction ? (
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-orange-500" />
                  <span className="font-medium text-foreground">{topPriorityAction}</span>
                  <span>• priorité #1</span>
                </span>
              ) : (
                'Aucune action urgente requise. Continuez à surveiller.'
              )}
            </p>
          </div>
        </div>
        
        {/* Right: Quick Stats + Score */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Potential Gain */}
          {estimatedPotentialGain > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <motion.div 
                    className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Potentiel
                    </p>
                    <p className="text-lg font-bold text-emerald-500">
                      +{estimatedPotentialGain.toLocaleString('fr-FR')}€
                    </p>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gain estimé si vous traitez toutes les opportunités IA</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Health Score Gauge */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <motion.div 
                  className={cn(
                    'relative w-16 h-16 rounded-full flex items-center justify-center',
                    'border-4',
                    status.color === 'emerald' && 'border-emerald-500',
                    status.color === 'yellow' && 'border-yellow-500',
                    status.color === 'red' && 'border-red-500'
                  )}
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="text-center">
                    <span className={cn(
                      'text-xl font-bold',
                      status.color === 'emerald' && 'text-emerald-500',
                      status.color === 'yellow' && 'text-yellow-500',
                      status.color === 'red' && 'text-red-500'
                    )}>
                      {healthScore}
                    </span>
                  </div>
                  
                  {/* Progress ring */}
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      strokeWidth="4"
                      className="stroke-muted/30"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className={cn(
                        status.color === 'emerald' && 'stroke-emerald-500',
                        status.color === 'yellow' && 'stroke-yellow-500',
                        status.color === 'red' && 'stroke-red-500'
                      )}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: healthScore / 100 }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      style={{
                        strokeDasharray: 176,
                        strokeDashoffset: 176 * (1 - healthScore / 100)
                      }}
                    />
                  </svg>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Score de santé: {healthScore}/100</p>
                <p className="text-xs text-muted-foreground">{status.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  )
})
