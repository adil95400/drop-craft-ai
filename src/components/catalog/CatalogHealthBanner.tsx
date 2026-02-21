/**
 * CatalogHealthBanner — Compact health score widget for the products page
 * Shows global score, grade, distribution, and top issues at a glance
 */
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  HeartPulse, AlertTriangle, CheckCircle, XCircle, 
  Sparkles, ArrowRight, RefreshCw, Loader2, ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCatalogHealthEngine } from '@/hooks/catalog/useCatalogHealthEngine'
import { useNavigate } from 'react-router-dom'

const GRADE_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', ring: 'ring-emerald-500/30' },
  B: { bg: 'bg-blue-500/10', text: 'text-blue-600', ring: 'ring-blue-500/30' },
  C: { bg: 'bg-amber-500/10', text: 'text-amber-600', ring: 'ring-amber-500/30' },
  D: { bg: 'bg-orange-500/10', text: 'text-orange-600', ring: 'ring-orange-500/30' },
  F: { bg: 'bg-red-500/10', text: 'text-red-600', ring: 'ring-red-500/30' },
}

export function CatalogHealthBanner() {
  const { summary, fixableIssuesCount, runBatchScan, isScanningBatch, isLoading } = useCatalogHealthEngine()
  const navigate = useNavigate()

  if (isLoading || !summary || summary.totalProducts === 0) return null

  const gradeStyle = GRADE_STYLES[summary.grade] || GRADE_STYLES.F

  return (
    <Card className="border-border/50 bg-gradient-to-r from-card via-card to-card/80 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Grade Circle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center ring-2 shrink-0 transition-all",
                  gradeStyle.bg, gradeStyle.ring
                )}>
                  <span className={cn("text-2xl font-black", gradeStyle.text)}>
                    {summary.grade}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Score santé catalogue : {summary.averageScore}%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Score & Label */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Santé Catalogue</span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={cn("text-2xl font-bold tabular-nums", gradeStyle.text)}>
                {summary.averageScore}%
              </span>
              <span className="text-xs text-muted-foreground">
                sur {summary.totalProducts} produits
              </span>
            </div>
          </div>

          {/* Distribution Bars */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <DistributionPill
              icon={CheckCircle}
              count={summary.distribution.excellent}
              label="Excellent"
              className="text-emerald-600 bg-emerald-500/10"
            />
            <DistributionPill
              icon={ShieldCheck}
              count={summary.distribution.good}
              label="Bon"
              className="text-blue-600 bg-blue-500/10"
            />
            <DistributionPill
              icon={AlertTriangle}
              count={summary.distribution.warning}
              label="Attention"
              className="text-amber-600 bg-amber-500/10"
            />
            <DistributionPill
              icon={XCircle}
              count={summary.distribution.critical}
              label="Critique"
              className="text-red-600 bg-red-500/10"
            />
          </div>

          {/* Pillar Mini Progress */}
          <div className="hidden lg:flex items-center gap-1.5">
            {summary.pillarAverages.map(pillar => (
              <TooltipProvider key={pillar.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-8 space-y-0.5">
                      <div className="text-[9px] text-center text-muted-foreground font-medium truncate">
                        {pillar.label.slice(0, 3)}
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pillar.avg >= 70 ? "bg-emerald-500" :
                            pillar.avg >= 50 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${pillar.avg}%` }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{pillar.label} : {pillar.avg}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0 shrink-0">
            {fixableIssuesCount > 0 && (
              <Badge variant="outline" className="text-xs gap-1 hidden sm:flex">
                <Sparkles className="h-3 w-3" />
                {fixableIssuesCount} auto-fix
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={runBatchScan}
              disabled={isScanningBatch}
              className="gap-1"
            >
              {isScanningBatch ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Scanner</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/catalog/health')}
              className="gap-1"
            >
              Détails
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Marketplace Readiness Bar */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Prêt marketplace
          </span>
          <Progress 
            value={summary.readinessPercent} 
            className="h-1.5 flex-1" 
          />
          <span className="text-xs font-medium tabular-nums">
            {summary.readinessPercent}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function DistributionPill({ 
  icon: Icon, 
  count, 
  label, 
  className 
}: { 
  icon: any; 
  count: number; 
  label: string; 
  className: string 
}) {
  if (count === 0) return null
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium", className)}>
            <Icon className="h-3 w-3" />
            {count}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{count} produits — {label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
