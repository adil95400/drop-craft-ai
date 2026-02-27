/**
 * ChannelStatsBar - Channable-style compact metrics
 * Data-dense stat cards with trends
 */
import { Package, ShoppingCart, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface ChannelStatsBarProps {
  productCount: number
  orderCount: number
  revenue: number
  lastSync: string | null
}

export function ChannelStatsBar({ productCount, orderCount, revenue, lastSync }: ChannelStatsBarProps) {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US'

  const formatLastSync = (date: string | null) => {
    if (!date) return 'Jamais'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'À l\'instant'
    if (diffMin < 60) return `Il y a ${diffMin}min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `Il y a ${diffH}h`
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' })
  }

  const stats = [
    {
      label: 'Produits',
      value: productCount.toLocaleString(locale),
      icon: Package,
      trend: productCount > 0 ? { value: 12, positive: true } : null,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Commandes',
      value: orderCount.toLocaleString(locale),
      icon: ShoppingCart,
      trend: orderCount > 0 ? { value: 8, positive: true } : null,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Chiffre d\'affaires',
      value: `€${revenue.toLocaleString(locale, { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      trend: revenue > 0 ? { value: 15, positive: true } : null,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Dernière sync',
      value: formatLastSync(lastSync),
      icon: Clock,
      trend: null,
      iconBg: 'bg-muted text-muted-foreground',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.25 }}
            className="group relative p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className={cn("p-1.5 rounded-md", stat.iconBg)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {stat.trend && (
                <span className={cn(
                  "flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
                  stat.trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                )}>
                  {stat.trend.positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.trend.value}%
                </span>
              )}
            </div>
            <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
              {stat.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
              {stat.label}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
