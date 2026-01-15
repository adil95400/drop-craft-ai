/**
 * Statistiques rapides pour le dashboard retours
 * Affiche les KPIs clés avec animations
 */
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Timer
} from 'lucide-react'
import { useReturns } from '@/hooks/useReturns'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subValue?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color: 'primary' | 'warning' | 'success' | 'destructive' | 'info'
  delay?: number
}

function StatCard({ title, value, subValue, icon: Icon, trend, trendValue, color, delay = 0 }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/10 text-amber-500',
    success: 'bg-emerald-500/10 text-emerald-500',
    destructive: 'bg-red-500/10 text-red-500',
    info: 'bg-blue-500/10 text-blue-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subValue && (
                <p className="text-xs text-muted-foreground">{subValue}</p>
              )}
            </div>
            <div className={cn("p-2.5 rounded-lg", colorClasses[color])}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          
          {trend && trendValue && (
            <div className="mt-3 flex items-center gap-1">
              {trend === 'up' ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              ) : trend === 'down' ? (
                <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
              ) : null}
              <span className={cn(
                "text-xs font-medium",
                trend === 'up' && "text-emerald-500",
                trend === 'down' && "text-red-500"
              )}>
                {trendValue}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ReturnsQuickStats() {
  const { returns, stats, isLoading } = useReturns()

  const metrics = useMemo(() => {
    if (!returns.length) return {
      avgProcessingDays: 0,
      autoApprovalRate: 0,
      topReason: 'N/A',
      urgentCount: 0
    }

    // Calculate avg processing time
    const completedReturns = returns.filter(r => 
      r.status === 'completed' || r.status === 'refunded'
    )
    const avgDays = completedReturns.length > 0
      ? completedReturns.reduce((sum, r) => {
          const created = new Date(r.created_at).getTime()
          const completed = new Date(r.updated_at).getTime()
          return sum + (completed - created) / (1000 * 60 * 60 * 24)
        }, 0) / completedReturns.length
      : 0

    // Find top reason
    const reasonCounts: Record<string, number> = {}
    returns.forEach(r => {
      const reason = r.reason_category || 'other'
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    })
    const topReason = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    const reasonLabels: Record<string, string> = {
      defective: 'Défectueux',
      wrong_item: 'Mauvais article',
      not_as_described: 'Non conforme',
      changed_mind: 'Changement avis',
      damaged_shipping: 'Endommagé',
      other: 'Autre'
    }

    // Urgent = pending for more than 48h
    const now = Date.now()
    const urgentCount = returns.filter(r => {
      if (r.status !== 'pending') return false
      const created = new Date(r.created_at).getTime()
      return (now - created) > 48 * 60 * 60 * 1000
    }).length

    return {
      avgProcessingDays: avgDays.toFixed(1),
      autoApprovalRate: stats.approved + stats.completed > 0 
        ? ((stats.completed / (stats.approved + stats.completed)) * 100).toFixed(0)
        : 0,
      topReason: reasonLabels[topReason] || topReason,
      urgentCount
    }
  }, [returns, stats])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="h-[120px] animate-pulse bg-muted/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total actif"
        value={stats.total}
        subValue={`${stats.pending} en attente`}
        icon={Package}
        color="primary"
        delay={0}
      />
      
      <StatCard
        title="En attente"
        value={stats.pending}
        subValue={metrics.urgentCount > 0 ? `${metrics.urgentCount} urgent(s)` : undefined}
        icon={Clock}
        color={metrics.urgentCount > 0 ? 'destructive' : 'warning'}
        delay={0.05}
      />
      
      <StatCard
        title="Taux traitement"
        value={`${metrics.autoApprovalRate}%`}
        subValue="Terminés / Approuvés"
        icon={CheckCircle}
        color="success"
        delay={0.1}
      />
      
      <StatCard
        title="Temps moyen"
        value={`${metrics.avgProcessingDays}j`}
        subValue="Création → Clôture"
        icon={Timer}
        color="info"
        delay={0.15}
      />
      
      <StatCard
        title="Total remboursé"
        value={`€${stats.totalRefunded.toLocaleString()}`}
        subValue={`Top: ${metrics.topReason}`}
        icon={RefreshCw}
        color="primary"
        delay={0.2}
      />
    </div>
  )
}
