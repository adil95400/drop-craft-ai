/**
 * RealtimeKPICard — KPI card with live Supabase updates + framer-motion animations
 */
import { memo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedCounter } from '@/components/ui/animated-counter'

interface RealtimeKPICardProps {
  title: string
  value: number
  previousValue?: number
  format?: 'number' | 'currency' | 'percentage'
  icon: React.ReactNode
  color?: string
  pulse?: boolean
  delay?: number
}

export const RealtimeKPICard = memo(function RealtimeKPICard({
  title,
  value,
  previousValue,
  format = 'number',
  icon,
  color = 'text-primary',
  pulse = false,
  delay = 0,
}: RealtimeKPICardProps) {
  const [hasUpdated, setHasUpdated] = useState(false)
  const [prevVal, setPrevVal] = useState(value)

  useEffect(() => {
    if (value !== prevVal) {
      setHasUpdated(true)
      setPrevVal(value)
      const t = setTimeout(() => setHasUpdated(false), 1500)
      return () => clearTimeout(t)
    }
  }, [value, prevVal])

  const change = previousValue && previousValue > 0
    ? ((value - previousValue) / previousValue) * 100
    : 0

  const trendIcon = change > 0
    ? <TrendingUp className="h-3 w-3" aria-hidden="true" />
    : change < 0
    ? <TrendingDown className="h-3 w-3" aria-hidden="true" />
    : <Minus className="h-3 w-3" aria-hidden="true" />

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300 border',
          hasUpdated && 'ring-2 ring-primary/30 shadow-lg shadow-primary/10'
        )}
        role="region"
        aria-label={`KPI ${title}`}
      >
        {pulse && (
          <div className="absolute top-3 right-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
        )}

        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                {title}
              </p>
              <div className="text-2xl font-bold">
                <AnimatedCounter
                  value={value}
                  format={format}
                  duration={800}
                />
              </div>
              <AnimatePresence>
                {change !== 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] font-semibold gap-0.5 px-1.5 py-0',
                        change > 0 && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                        change < 0 && 'bg-red-500/10 text-red-600 border-red-500/20'
                      )}
                    >
                      {trendIcon}
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className={cn('p-2.5 rounded-xl bg-muted/50', color)}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
