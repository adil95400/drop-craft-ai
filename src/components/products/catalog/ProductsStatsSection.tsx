/**
 * Section Stats pour la page Produits
 * Affiche les KPIs principaux du catalogue
 */
import { motion } from 'framer-motion'
import { ChannableStatsGrid } from '@/components/channable'
import { ChannableStat } from '@/components/channable/types'
import { Package, Target, AlertCircle, CheckCircle, DollarSign } from 'lucide-react'

interface ProductsStatsSectionProps {
  stats: {
    total: number
    active: number
    inactive: number
    lowStock: number
    totalValue: number
    avgPrice: number
    totalMargin: number
  }
  auditStats: {
    averageScore: number
    excellentCount: number
    goodCount: number
    averageCount: number
    poorCount: number
  }
  compact?: boolean
}

export function ProductsStatsSection({ stats, auditStats, compact = true }: ProductsStatsSectionProps) {
  const productStats: ChannableStat[] = [
    {
      label: 'Total Produits',
      value: stats.total.toLocaleString(),
      icon: Package,
      color: 'primary',
      change: 5.2,
      trend: 'up',
      changeLabel: 'ce mois'
    },
    {
      label: 'Score Qualité',
      value: `${auditStats.averageScore}%`,
      icon: Target,
      color: auditStats.averageScore >= 70 ? 'success' : auditStats.averageScore >= 50 ? 'warning' : 'destructive',
      change: 3,
      trend: 'up',
      changeLabel: 'excellents'
    },
    {
      label: 'À Optimiser',
      value: auditStats.poorCount.toString(),
      icon: AlertCircle,
      color: auditStats.poorCount > 0 ? 'destructive' : 'success',
      changeLabel: 'score < 40'
    },
    {
      label: 'Actifs',
      value: stats.active.toLocaleString(),
      icon: CheckCircle,
      color: 'success',
      change: stats.total > 0 ? ((stats.active / stats.total) * 100) : 0,
      trend: 'neutral',
      changeLabel: '% du total'
    },
    {
      label: 'Stock Faible',
      value: stats.lowStock.toString(),
      icon: AlertCircle,
      color: stats.lowStock > 0 ? 'warning' : 'success',
      changeLabel: 'réassort'
    },
    {
      label: 'Valeur Stock',
      value: `${stats.totalValue.toLocaleString()} €`,
      icon: DollarSign,
      color: 'info',
      changeLabel: `Marge: ${stats.totalMargin.toFixed(0)} €`
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ChannableStatsGrid stats={productStats} columns={3} compact={compact} />
    </motion.div>
  )
}
