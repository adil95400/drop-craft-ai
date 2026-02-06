/**
 * Carte de santé du catalogue - jauge visuelle
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react'
import { CockpitProductHealth } from '@/hooks/useCockpitData'

interface CatalogHealthCardProps {
  health: CockpitProductHealth
}

export function CatalogHealthCard({ health }: CatalogHealthCardProps) {
  const healthPercent = health.total > 0 ? Math.round((health.healthy / health.total) * 100) : 0
  const warningPercent = health.total > 0 ? Math.round((health.warning / health.total) * 100) : 0
  const criticalPercent = health.total > 0 ? Math.round((health.critical / health.total) * 100) : 0

  const overallScore = health.total > 0
    ? Math.round(((health.healthy * 100) + (health.warning * 50) + (health.critical * 10)) / health.total)
    : 0

  const scoreColor = overallScore >= 70 ? 'text-green-600' : overallScore >= 40 ? 'text-yellow-600' : 'text-destructive'

  const segments = [
    { label: 'Complets', count: health.healthy, percent: healthPercent, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-500' },
    { label: 'Partiels', count: health.warning, percent: warningPercent, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-500' },
    { label: 'Critiques', count: health.critical, percent: criticalPercent, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Santé du catalogue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score global */}
        <div className="text-center">
          <span className={cn("text-4xl font-bold", scoreColor)}>{overallScore}</span>
          <span className="text-lg text-muted-foreground">/100</span>
          <p className="text-xs text-muted-foreground mt-1">Score de qualité global</p>
        </div>

        {/* Barre de progression stacked */}
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          {health.healthy > 0 && (
            <div className="bg-green-500 transition-all" style={{ width: `${healthPercent}%` }} />
          )}
          {health.warning > 0 && (
            <div className="bg-yellow-500 transition-all" style={{ width: `${warningPercent}%` }} />
          )}
          {health.critical > 0 && (
            <div className="bg-destructive transition-all" style={{ width: `${criticalPercent}%` }} />
          )}
        </div>

        {/* Détails */}
        <div className="space-y-2">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <seg.icon className={cn("h-4 w-4", seg.color)} />
                <span>{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{seg.count}</span>
                <span className="text-muted-foreground text-xs">({seg.percent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
