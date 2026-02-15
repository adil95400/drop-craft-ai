/**
 * SmartAlertsPanel — Alertes business intelligentes avec scoring et actions
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  Bell, AlertTriangle, TrendingDown, Package, DollarSign,
  ArrowRight, CheckCircle2, XCircle, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface SmartAlert {
  id: string
  type: 'stock' | 'margin' | 'seo' | 'performance' | 'opportunity'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  score: number
  action: { label: string; path: string }
  count?: number
}

interface SmartAlertsPanelProps {
  products: Array<{
    id: string
    name: string
    price: number
    cost_price?: number
    stock_quantity?: number
    profit_margin?: number
    description?: string
    seo_title?: string
    image_url?: string
  }>
  revenue: number
}

export function SmartAlertsPanel({ products, revenue }: SmartAlertsPanelProps) {
  const navigate = useNavigate()

  const alerts = useMemo((): SmartAlert[] => {
    const result: SmartAlert[] = []
    const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0)
    const lowStock = products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 5)
    const negativeMargin = products.filter(p => (p.profit_margin || 0) < 0)
    const lowMargin = products.filter(p => (p.profit_margin || 0) > 0 && (p.profit_margin || 0) < 10)
    const noSEO = products.filter(p => !p.seo_title)
    const noDesc = products.filter(p => !p.description || p.description.length < 20)
    const noImage = products.filter(p => !p.image_url)

    if (outOfStock.length > 0) {
      result.push({
        id: 'oos',
        type: 'stock',
        severity: 'critical',
        title: 'Ruptures de stock',
        description: `${outOfStock.length} produit(s) à 0 unité — perte de ventes active`,
        score: 95,
        action: { label: 'Gérer le stock', path: '/stock' },
        count: outOfStock.length,
      })
    }

    if (negativeMargin.length > 0) {
      result.push({
        id: 'neg-margin',
        type: 'margin',
        severity: 'critical',
        title: 'Marges négatives',
        description: `${negativeMargin.length} produit(s) vendus à perte`,
        score: 92,
        action: { label: 'Corriger les prix', path: '/products' },
        count: negativeMargin.length,
      })
    }

    if (lowStock.length > 3) {
      result.push({
        id: 'low-stock',
        type: 'stock',
        severity: 'warning',
        title: 'Stock critique',
        description: `${lowStock.length} produit(s) avec moins de 5 unités`,
        score: 75,
        action: { label: 'Réapprovisionner', path: '/stock' },
        count: lowStock.length,
      })
    }

    if (noSEO.length > products.length * 0.3) {
      result.push({
        id: 'seo-gap',
        type: 'seo',
        severity: 'warning',
        title: 'Lacunes SEO',
        description: `${noSEO.length} produits sans titre SEO — visibilité réduite`,
        score: 68,
        action: { label: 'Optimiser le SEO', path: '/seo' },
        count: noSEO.length,
      })
    }

    if (lowMargin.length > 5) {
      result.push({
        id: 'low-margin',
        type: 'margin',
        severity: 'warning',
        title: 'Marges sous 10%',
        description: `${lowMargin.length} produits avec rentabilité fragile`,
        score: 60,
        action: { label: 'Analyser les prix', path: '/products' },
        count: lowMargin.length,
      })
    }

    if (noDesc.length > 0) {
      result.push({
        id: 'no-desc',
        type: 'seo',
        severity: 'info',
        title: 'Descriptions incomplètes',
        description: `${noDesc.length} produits à enrichir pour améliorer le taux de conversion`,
        score: 45,
        action: { label: 'Enrichir avec l\'IA', path: '/products' },
        count: noDesc.length,
      })
    }

    if (noImage.length > 0) {
      result.push({
        id: 'no-img',
        type: 'performance',
        severity: 'info',
        title: 'Images manquantes',
        description: `${noImage.length} produits sans visuel — impact conversion estimé -30%`,
        score: 40,
        action: { label: 'Ajouter des images', path: '/products' },
        count: noImage.length,
      })
    }

    return result.sort((a, b) => b.score - a.score)
  }, [products, revenue])

  const severityConfig = {
    critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', badge: 'bg-red-100 text-red-700' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 text-amber-700' },
    info: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-100 text-blue-700' },
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Alertes Intelligentes
          <div className="ml-auto flex gap-1.5">
            {criticalCount > 0 && <Badge variant="destructive" className="text-xs">{criticalCount} critique{criticalCount > 1 ? 's' : ''}</Badge>}
            {warningCount > 0 && <Badge className="text-xs bg-amber-500">{warningCount} warning{warningCount > 1 ? 's' : ''}</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Aucune alerte — Tout est en ordre !</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {alerts.map((alert, i) => {
              const config = severityConfig[alert.severity]
              const SeverityIcon = config.icon
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn('flex items-center gap-3 p-3 rounded-lg border', config.bg, config.border)}
                >
                  <SeverityIcon className={cn('h-4 w-4 shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{alert.title}</span>
                      {alert.count && (
                        <Badge className={cn('text-[10px] px-1 h-4', config.badge)}>{alert.count}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">P{alert.score}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => navigate(alert.action.path)}
                    >
                      {alert.action.label}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
