/**
 * ChannelStatsBar - Barre de statistiques premium horizontale
 */
import { Package, ShoppingCart, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface StatItem {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  color: 'blue' | 'green' | 'purple' | 'orange'
}

interface ChannelStatsBarProps {
  productCount: number
  orderCount: number
  revenue: number
  lastSync: string | null
}

const colorClasses = {
  blue: 'from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-400',
  green: 'from-green-500/20 to-green-600/10 text-green-600 dark:text-green-400',
  purple: 'from-purple-500/20 to-purple-600/10 text-purple-600 dark:text-purple-400',
  orange: 'from-orange-500/20 to-orange-600/10 text-orange-600 dark:text-orange-400',
}

const iconBgClasses = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green: 'bg-green-500/10 text-green-600 dark:text-green-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
}

export function ChannelStatsBar({ productCount, orderCount, revenue, lastSync }: ChannelStatsBarProps) {
  const { t, i18n } = useTranslation('channels')
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'de' ? 'de-DE' : i18n.language === 'es' ? 'es-ES' : 'en-US'

  const stats: StatItem[] = [
    {
      label: t('stats.products'),
      value: productCount.toLocaleString(locale),
      icon: <Package className="h-5 w-5" />,
      trend: { value: 12, isPositive: true },
      color: 'blue'
    },
    {
      label: t('stats.orders'),
      value: orderCount.toLocaleString(locale),
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'green'
    },
    {
      label: t('stats.revenue'),
      value: `€${revenue.toLocaleString(locale, { minimumFractionDigits: 0 })}`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'purple'
    },
    {
      label: t('stats.lastSync'),
      value: lastSync ? new Date(lastSync).toLocaleDateString(locale, { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }) : t('stats.never'),
      icon: <Clock className="h-5 w-5" />,
      color: 'orange'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 border border-border/30",
            colorClasses[stat.color]
          )}
        >
          <div className="flex items-start justify-between">
            <div className={cn("p-2.5 rounded-xl", iconBgClasses[stat.color])}>
              {stat.icon}
            </div>
            {stat.trend && (
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full",
                stat.trend.isPositive 
                  ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                  : "bg-red-500/20 text-red-600 dark:text-red-400"
              )}>
                {stat.trend.isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {stat.trend.value}%
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {stat.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
