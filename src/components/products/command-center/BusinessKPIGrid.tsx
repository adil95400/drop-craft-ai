/**
 * Grille de KPI Business simplifiée
 * 2 lignes: Business critique + Optimisation
 */

import { motion } from 'framer-motion'
import { 
  Package, CheckCircle2, AlertTriangle, TrendingUp, 
  Target, Sparkles 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'

interface BusinessKPIGridProps {
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
    poorCount: number
  }
  compact?: boolean
}

interface KPIItemProps {
  label: string
  value: string | number
  icon: typeof Package
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  sublabel?: string
}

const variantStyles = {
  default: 'text-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-orange-600 dark:text-orange-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400'
}

function KPIItem({ label, value, icon: Icon, variant = 'default', sublabel }: KPIItemProps) {
  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center',
        'bg-background border border-border/50'
      )}>
        <Icon className={cn('h-4 w-4', variantStyles[variant])} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className={cn('text-lg font-bold', variantStyles[variant])}>
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </p>
        {sublabel && (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </motion.div>
  )
}

export function BusinessKPIGrid({ stats, auditStats, compact = false }: BusinessKPIGridProps) {
  // Ligne 1: Business critique
  const businessKPIs: KPIItemProps[] = [
    {
      label: 'Stock faible',
      value: stats.lowStock,
      icon: AlertTriangle,
      variant: stats.lowStock > 10 ? 'danger' : stats.lowStock > 0 ? 'warning' : 'success',
      sublabel: stats.lowStock > 0 ? 'à surveiller' : 'tout va bien'
    },
    {
      label: 'Produits actifs',
      value: stats.active,
      icon: CheckCircle2,
      variant: 'success',
      sublabel: `sur ${stats.total} total`
    },
    {
      label: 'Valeur du stock',
      value: formatPrice(stats.totalValue),
      icon: TrendingUp,
      variant: 'info'
    }
  ]
  
  // Ligne 2: Optimisation
  const optimizationKPIs: KPIItemProps[] = [
    {
      label: 'Score qualité moyen',
      value: `${auditStats.averageScore}/100`,
      icon: Target,
      variant: auditStats.averageScore >= 70 ? 'success' : auditStats.averageScore >= 40 ? 'warning' : 'danger'
    },
    {
      label: 'À optimiser',
      value: auditStats.poorCount,
      icon: Sparkles,
      variant: auditStats.poorCount > 20 ? 'danger' : auditStats.poorCount > 0 ? 'warning' : 'success',
      sublabel: 'score < 40'
    },
    {
      label: 'Excellents',
      value: auditStats.excellentCount,
      icon: CheckCircle2,
      variant: 'success',
      sublabel: 'score > 70'
    }
  ]
  
  if (compact) {
    // Mode compact: une seule ligne avec les KPIs les plus importants
    const compactKPIs = [
      businessKPIs[0], // Stock faible
      businessKPIs[1], // Produits actifs
      optimizationKPIs[0], // Score qualité
      optimizationKPIs[1], // À optimiser
    ]
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {compactKPIs.map((kpi, i) => (
          <KPIItem key={i} {...kpi} />
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Ligne 1: Business critique */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Business critique
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {businessKPIs.map((kpi, i) => (
            <KPIItem key={i} {...kpi} />
          ))}
        </div>
      </div>
      
      {/* Ligne 2: Optimisation */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Optimisation
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {optimizationKPIs.map((kpi, i) => (
            <KPIItem key={i} {...kpi} />
          ))}
        </div>
      </div>
    </div>
  )
}
