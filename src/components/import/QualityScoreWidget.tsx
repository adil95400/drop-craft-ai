/**
 * QualityScoreWidget — Displays product extraction quality score
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'
import type { QualityScore } from '@/services/scraper/types'

interface QualityScoreWidgetProps {
  qualityScore: QualityScore
}

export function QualityScoreWidget({ qualityScore }: QualityScoreWidgetProps) {
  const { score, breakdown } = qualityScore

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-500'
    if (s >= 60) return 'text-yellow-500'
    if (s >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreBadge = (s: number) => {
    if (s >= 80) return { label: 'Excellent', variant: 'default' as const }
    if (s >= 60) return { label: 'Bon', variant: 'secondary' as const }
    if (s >= 40) return { label: 'Moyen', variant: 'outline' as const }
    return { label: 'Faible', variant: 'destructive' as const }
  }

  const badge = getScoreBadge(score)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Score qualité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global score */}
        <div className="flex items-center gap-3">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{val.label}</span>
                <span className="font-medium">{val.score}/{val.max}</span>
              </div>
              <Progress value={(val.score / Math.max(val.max, 1)) * 100} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
