/**
 * MetricsGrid - Grille de métriques principales du dashboard
 */

import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react'
import { MetricCard } from './MetricCard'

interface MetricsGridProps {
  stats: {
    monthlyRevenue?: number
    revenueChange?: number
    ordersCount?: number
    ordersChange?: number
    productsCount?: number
    productsChange?: number
    customersCount?: number
    customersChange?: number
  } | null
  isLoading?: boolean
}

export function MetricsGrid({ stats, isLoading = false }: MetricsGridProps) {
  const metrics = [
    {
      title: 'Revenus totaux',
      value: stats?.monthlyRevenue || 0,
      format: (v: number) => `${v.toLocaleString('fr-FR')} €`,
      trend: stats?.revenueChange || 0,
      icon: DollarSign,
      color: 'text-green-600',
      link: '/analytics'
    },
    {
      title: 'Commandes',
      value: stats?.ordersCount || 0,
      trend: stats?.ordersChange || 0,
      icon: ShoppingCart,
      color: 'text-blue-600',
      link: '/dashboard/orders'
    },
    {
      title: 'Produits',
      value: stats?.productsCount || 0,
      trend: stats?.productsChange || 0,
      icon: Package,
      color: 'text-purple-600',
      link: '/products'
    },
    {
      title: 'Clients',
      value: stats?.customersCount || 0,
      trend: stats?.customersChange || 0,
      icon: Users,
      color: 'text-orange-600',
      link: '/dashboard/customers'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          trend={metric.trend}
          icon={metric.icon}
          color={metric.color}
          link={metric.link}
          format={metric.format}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}
