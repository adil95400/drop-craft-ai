/**
 * Grille de KPIs pour le Cockpit Business
 */
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  Package, DollarSign, TrendingUp, TrendingDown, 
  AlertTriangle, ShieldAlert, Minus 
} from 'lucide-react'
import { CockpitKPI } from '@/hooks/useCockpitData'

const icons = [Package, DollarSign, TrendingUp, AlertTriangle, ShieldAlert, ShieldAlert]
const colors = ['primary', 'info', 'success', 'warning', 'destructive', 'destructive'] as const

const colorMap = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  success: 'bg-green-500/10 text-green-600 dark:text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  destructive: 'bg-destructive/10 text-destructive',
}

const accentMap = {
  primary: 'bg-primary',
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  destructive: 'bg-destructive',
}

interface CockpitKPIGridProps {
  kpis: CockpitKPI[]
}

export function CockpitKPIGrid({ kpis }: CockpitKPIGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, i) => {
        const Icon = icons[i] || Package
        const color = colors[i] || 'primary'
        const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus

        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
              <div className={cn("absolute top-0 left-0 w-1 h-full", accentMap[color])} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", colorMap[color])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <TrendIcon className={cn(
                    "h-4 w-4",
                    kpi.trend === 'up' && "text-green-500",
                    kpi.trend === 'down' && "text-destructive",
                    kpi.trend === 'neutral' && "text-muted-foreground"
                  )} />
                </div>
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
