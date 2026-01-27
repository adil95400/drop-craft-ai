/**
 * Action Celebration Modal V3
 * Mini-modal de célébration post-action avec métriques avant/après
 * Feedback business immédiat pour la confiance utilisateur
 */

import { memo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, TrendingUp, TrendingDown, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface ActionResult {
  type: 'success' | 'partial' | 'info'
  title: string
  description?: string
  metrics?: {
    label: string
    before?: number
    after: number
    unit: string
    improvement?: boolean
  }[]
  estimatedGain?: number
  riskReduced?: number
  scoreImprovement?: number
}

interface ActionCelebrationModalProps {
  result: ActionResult | null
  onClose: () => void
  autoCloseDelay?: number
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: -20,
    transition: { duration: 0.2 }
  }
}

const checkVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { 
    scale: 1, 
    rotate: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 15, delay: 0.1 }
  }
}

const MetricRow = memo(function MetricRow({ 
  label, 
  before, 
  after, 
  unit, 
  improvement 
}: {
  label: string
  before?: number
  after: number
  unit: string
  improvement?: boolean
}) {
  const hasChange = before !== undefined && before !== after
  const isPositive = improvement !== false && (before === undefined || after > before)
  
  return (
    <motion.div 
      className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {before !== undefined && (
          <>
            <span className="text-sm text-muted-foreground line-through">
              {before.toLocaleString('fr-FR')}{unit}
            </span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </motion.div>
          </>
        )}
        <motion.span 
          className={cn(
            'text-sm font-bold',
            hasChange && isPositive && 'text-emerald-500',
            hasChange && !isPositive && 'text-red-500'
          )}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          {after.toLocaleString('fr-FR')}{unit}
        </motion.span>
      </div>
    </motion.div>
  )
})

export const ActionCelebrationModal = memo(function ActionCelebrationModal({
  result,
  onClose,
  autoCloseDelay = 5000
}: ActionCelebrationModalProps) {
  const [progress, setProgress] = useState(100)
  
  // Auto-close with progress bar
  useEffect(() => {
    if (!result) return
    
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / autoCloseDelay) * 100)
      setProgress(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
        onClose()
      }
    }, 50)
    
    return () => clearInterval(interval)
  }, [result, autoCloseDelay, onClose])
  
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className={cn(
              'relative w-full max-w-sm rounded-2xl border-2 p-6',
              'bg-background/95 backdrop-blur-xl shadow-2xl',
              result.type === 'success' && 'border-emerald-500/50',
              result.type === 'partial' && 'border-yellow-500/50',
              result.type === 'info' && 'border-blue-500/50'
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            
            {/* Success Icon */}
            <motion.div 
              className="flex justify-center mb-4"
              variants={checkVariants}
            >
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center',
                result.type === 'success' && 'bg-emerald-500/20',
                result.type === 'partial' && 'bg-yellow-500/20',
                result.type === 'info' && 'bg-blue-500/20'
              )}>
                {result.type === 'success' ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                ) : (
                  <Sparkles className="h-8 w-8 text-yellow-500" />
                )}
              </div>
            </motion.div>
            
            {/* Title */}
            <motion.h3 
              className="text-lg font-bold text-center mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {result.title}
            </motion.h3>
            
            {result.description && (
              <motion.p 
                className="text-sm text-muted-foreground text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {result.description}
              </motion.p>
            )}
            
            {/* Metrics */}
            {result.metrics && result.metrics.length > 0 && (
              <div className="bg-muted/30 rounded-xl p-3 mb-4">
                {result.metrics.map((metric, i) => (
                  <MetricRow key={i} {...metric} />
                ))}
              </div>
            )}
            
            {/* Impact Summary */}
            <div className="flex items-center justify-center gap-4 text-sm">
              {result.estimatedGain !== undefined && result.estimatedGain > 0 && (
                <motion.div 
                  className="flex items-center gap-1.5 text-emerald-500"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-bold">+{result.estimatedGain}€</span>
                </motion.div>
              )}
              
              {result.riskReduced !== undefined && result.riskReduced > 0 && (
                <motion.div 
                  className="flex items-center gap-1.5 text-blue-500"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">-{result.riskReduced}% risque</span>
                </motion.div>
              )}
              
              {result.scoreImprovement !== undefined && result.scoreImprovement > 0 && (
                <motion.div 
                  className="flex items-center gap-1.5 text-purple-500"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">+{result.scoreImprovement} pts</span>
                </motion.div>
              )}
            </div>
            
            {/* Auto-close progress bar */}
            <div className="mt-4 h-1 bg-muted/50 rounded-full overflow-hidden">
              <motion.div 
                className={cn(
                  'h-full rounded-full',
                  result.type === 'success' && 'bg-emerald-500',
                  result.type === 'partial' && 'bg-yellow-500',
                  result.type === 'info' && 'bg-blue-500'
                )}
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
