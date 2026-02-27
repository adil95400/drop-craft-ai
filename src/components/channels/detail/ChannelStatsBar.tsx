/**
 * ChannelStatsBar - Shopify Admin Style Stats Cards
 * Clean metric cards with subtle styling
 */
import { Package, ShoppingCart, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'

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
    },
    {
      label: 'Commandes',
      value: orderCount.toLocaleString(locale),
      icon: ShoppingCart,
      trend: orderCount > 0 ? { value: 8, positive: true } : null,
    },
    {
      label: 'Chiffre d\'affaires',
      value: `€${revenue.toLocaleString(locale, { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      trend: revenue > 0 ? { value: 15, positive: true } : null,
    },
    {
      label: 'Dernière sync',
      value: formatLastSync(lastSync),
      icon: Clock,
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
          >
            <Card className="border-border/60 shadow-none hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {stat.trend && (
                    <span className={cn(
                      "flex items-center gap-0.5 text-xs font-medium",
                      stat.trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
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
                <p className="text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
