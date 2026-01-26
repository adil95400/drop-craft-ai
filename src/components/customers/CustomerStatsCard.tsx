/**
 * CustomerStatsCard - Carte de statistique premium pour clients
 */
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface CustomerStatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: number
  subtitle?: string
  color?: 'primary' | 'success' | 'warning' | 'info' | 'purple'
  delay?: number
}

export function CustomerStatsCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  subtitle,
  color = 'primary',
  delay = 0
}: CustomerStatsCardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      border: 'border-primary/20',
      gradient: 'from-primary/5 to-transparent'
    },
    success: {
      bg: 'bg-green-500/10',
      text: 'text-green-600',
      border: 'border-green-500/20',
      gradient: 'from-green-500/5 to-transparent'
    },
    warning: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600',
      border: 'border-amber-500/20',
      gradient: 'from-amber-500/5 to-transparent'
    },
    info: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      border: 'border-blue-500/20',
      gradient: 'from-blue-500/5 to-transparent'
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-600',
      border: 'border-purple-500/20',
      gradient: 'from-purple-500/5 to-transparent'
    },
  }

  const colors = colorClasses[color]
  const hasTrend = trend !== undefined && trend !== 0
  const isPositive = trend !== undefined && trend > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className={cn(
        "relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all",
        "bg-gradient-to-br", colors.gradient
      )}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-transparent opacity-95" />
        
        <CardContent className="relative p-4">
          <div className="flex items-start justify-between">
            <div className={cn(
              "p-2.5 rounded-xl border",
              colors.bg,
              colors.border
            )}>
              <Icon className={cn("h-5 w-5", colors.text)} />
            </div>
            
            {hasTrend && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium border-0 gap-1",
                  isPositive 
                    ? "bg-green-500/10 text-green-600" 
                    : "bg-red-500/10 text-red-600"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? '+' : ''}{trend}%
              </Badge>
            )}
          </div>
          
          <div className="mt-4">
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              typeof value === 'string' && value.includes('€') && "tabular-nums"
            )}>
              {value}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
