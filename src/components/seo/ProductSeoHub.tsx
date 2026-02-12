/**
 * ProductSeoHub — Professional SaaS SEO Dashboard (AutoDS/Channable level)
 * Structured scores, business impact, history timeline, quota enforcement
 */
import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Search, Play, TrendingUp, AlertTriangle, CheckCircle2,
  BarChart3, Sparkles, Clock, XCircle, AlertCircle,
  Target, Zap, History, ShieldAlert, Gauge, Globe,
  FileText, Image, Database, Bot, ArrowUpRight, ArrowDownRight,
  Activity, Eye, Layers
} from 'lucide-react'
import {
  useProductSeoScores, useAuditProductsSeo, useGenerateProductSeo,
  useProductSeoHistory
} from '@/hooks/useProductSeoScoring'
import type { ProductSeoResult, ProductSeoHistoryItem } from '@/services/api/seoApi'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useUnifiedQuotas } from '@/hooks/useUnifiedQuotas'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

// ── Score Helpers ────────────────────────────────────────────

function getScoreConfig(score: number) {
  if (score >= 70) return { label: 'Optimisé', icon: CheckCircle2, variant: 'optimized' as const, textClass: 'text-emerald-600', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-200' }
  if (score >= 40) return { label: 'À améliorer', icon: AlertCircle, variant: 'needs_work' as const, textClass: 'text-amber-600', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-200' }
  return { label: 'Critique', icon: XCircle, variant: 'critical' as const, textClass: 'text-red-600', bgClass: 'bg-red-500/10', borderClass: 'border-red-200' }
}

function StatusBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const c = getScoreConfig(score)
  const Icon = c.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border font-medium', c.bgClass, c.textClass, c.borderClass, size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1')}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {c.label}
    </span>
  )
}

function ScoreRing({ score }: { score: number }) {
  const c = getScoreConfig(score)
  const circumference = 2 * Math.PI * 22
  const strokeDashoffset = circumference - (score / 100) * circumference
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="22" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/20" />
        <circle cx="25" cy="25" r="22" fill="none" strokeWidth="3" strokeLinecap="round"
          className={c.textClass}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className={cn('absolute text-lg font-bold', c.textClass)}>{score}</span>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; class: string }> = {
    urgent: { label: '🔥 Urgent', class: 'bg-red-100 text-red-700 border-red-200' },
    high: { label: '⚡ High priority', class: 'bg-amber-100 text-amber-700 border-amber-200' },
    normal: { label: '📋 Normal', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  }
  const c = config[priority] ?? config.normal
  return <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', c.class)}>{c.label}</span>
}

function RankingBadge({ potential }: { potential?: string }) {
  if (!potential) return null
  const config: Record<string, { label: string; class: string }> = {
    top10: { label: 'Top 10', class: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    top20: { label: 'Top 20', class: 'text-blue-700 bg-blue-50 border-blue-200' },
    top50: { label: 'Top 50', class: 'text-amber-700 bg-amber-50 border-amber-200' },
    low: { label: 'Low', class: 'text-muted-foreground bg-muted border-border' },
  }
  const c = config[potential] ?? config.low
  return <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', c.class)}>{c.label}</span>
}

// ── Score Criteria Row ───────────────────────────────────────

const SCORE_CRITERIA = [
  { key: 'seo', label: 'SEO', icon: Search, description: 'Title, meta, slug optimization' },
  { key: 'content', label: 'Content', icon: FileText, description: 'Description quality & density' },
  { key: 'images', label: 'Images', icon: Image, description: 'Alt text, compression, count' },
  { key: 'data', label: 'Data', icon: Database, description: 'Structured data completeness' },
  { key: 'ai_readiness', label: 'AI Ready', icon: Bot, description: 'AI optimization potential' },
] as const

function ScoreCriteriaBar({ criteria }: { criteria: { key: string; value: number }[] }) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-5 gap-2">
        {SCORE_CRITERIA.map(({ key, label, icon: Icon, description }) => {
          const value = criteria.find(c => c.key === key)?.value ?? 0
          const c = getScoreConfig(value)
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Icon className="h-3 w-3" />{label}
                    </span>
                    <span className={cn('text-[10px] font-semibold', c.textClass)}>{value}</span>
                  </div>
                  <Progress value={value} className={cn('h-1.5', value >= 70 ? '[&>div]:bg-emerald-500' : value >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500')} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{description}: {value}/100</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

// ── Product Card ─────────────────────────────────────────────

function ProductSeoCard({ product, onAudit, onGenerate, onViewHistory }: {
  product: ProductSeoResult
  onAudit: () => void
  onGenerate: () => void
  onViewHistory: () => void
}) {
  const criticalCount = product.issues.filter(i => i.severity === 'critical').length
  const warningCount = product.issues.filter(i => i.severity === 'warning').length
  const totalIssues = product.issues.length

  const scoreCriteria = [
    { key: 'seo', value: product.score.seo },
    { key: 'content', value: product.score.content },
    { key: 'images', value: product.score.images },
    { key: 'data', value: product.score.data },
    { key: 'ai_readiness', value: product.score.ai_readiness },
  ]

  return (
    <Card className="hover:shadow-md transition-all border-l-4" style={{
      borderLeftColor: product.score.global >= 70 ? 'hsl(var(--chart-2))' : product.score.global >= 40 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))'
    }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Score Ring */}
          <ScoreRing score={product.score.global} />

          <div className="flex-1 min-w-0 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate max-w-[280px]">{product.product_name}</h3>
              <StatusBadge score={product.score.global} size="sm" />
              <PriorityBadge priority={product.business_impact.priority} />
            </div>

            {/* Structured Score Breakdown */}
            <ScoreCriteriaBar criteria={scoreCriteria} />

            {/* Issues + Business Impact */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-3 text-xs">
                {criticalCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3.5 w-3.5" />{criticalCount} critical
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />{warningCount} warning{warningCount > 1 ? 's' : ''}
                  </span>
                )}
                {totalIssues > 0 && (
                  <span className="text-muted-foreground">{totalIssues} recommendation{totalIssues > 1 ? 's' : ''}</span>
                )}
                {product.strengths.length > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />{product.strengths.length} strength{product.strengths.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Business Impact Metrics */}
              <div className="flex items-center gap-3 text-[10px]">
                {product.business_impact.estimated_traffic_gain_percent > 0 && (
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <ArrowUpRight className="h-3 w-3" />
                    +{product.business_impact.estimated_traffic_gain_percent}% traffic
                  </span>
                )}
                {product.business_impact.estimated_conversion_gain_percent > 0 && (
                  <span className="flex items-center gap-0.5 text-blue-600">
                    <Zap className="h-3 w-3" />
                    +{product.business_impact.estimated_conversion_gain_percent.toFixed(0)}% CTR
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onAudit}>
              <Search className="h-3 w-3 mr-1" />Audit
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={onGenerate}>
              <Sparkles className="h-3 w-3 mr-1" />Optimize AI
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onViewHistory}>
              <History className="h-3 w-3 mr-1" />History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── History Dialog ────────────────────────────────────────────

function HistoryDialog({ productId, productName, open, onOpenChange }: {
  productId: string; productName: string; open: boolean; onOpenChange: (open: boolean) => void
}) {
  const { data } = useProductSeoHistory(open ? productId : undefined)
  const items = data?.items ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />SEO History — {productName}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No history available yet</p>
          ) : (
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={item.id} className="relative">
                    {/* Timeline dot */}
                    <div className={cn(
                      'absolute -left-4 top-1 w-3 h-3 rounded-full border-2',
                      idx === 0 ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'
                    )} />
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[10px]">{item.source}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          v{item.version} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      {item.fields?.score && (
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>Global: <span className="font-semibold">{item.fields.score.global}</span></div>
                          <div>SEO: <span className="font-semibold">{item.fields.score.seo}</span></div>
                          <div>Content: <span className="font-semibold">{item.fields.score.content}</span></div>
                          <div>Issues: <span className="font-semibold">{item.fields.issues_count ?? '—'}</span></div>
                        </div>
                      )}
                      {item.fields?.seo_title && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">Title: {item.fields.seo_title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ── Quota Section ────────────────────────────────────────────

function QuotaBar({ label, icon: Icon, quota }: {
  label: string; icon: any; quota: { current: number; limit: number; percentage: number; isUnlimited: boolean }
}) {
  if (quota.isUnlimited) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground"><Icon className="h-3 w-3" />{label}</span>
          <span className="font-medium text-emerald-600">∞</span>
        </div>
      </div>
    )
  }
  if (quota.limit === 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground"><Icon className="h-3 w-3" />{label}</span>
          <span className="text-[10px] text-muted-foreground">Not included</span>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground"><Icon className="h-3 w-3" />{label}</span>
        <span className="font-medium">{quota.current}/{quota.limit}</span>
      </div>
      <Progress
        value={quota.percentage}
        className={cn('h-1.5',
          quota.percentage >= 100 && '[&>div]:bg-destructive',
          quota.percentage >= 80 && quota.percentage < 100 && '[&>div]:bg-yellow-500'
        )}
      />
    </div>
  )
}

// ── Main Hub ─────────────────────────────────────────────────

export function ProductSeoHub() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<string>('score_asc')
  const [historyProduct, setHistoryProduct] = useState<{ id: string; name: string } | null>(null)
  const navigate = useNavigate()

  const { data, isLoading } = useProductSeoScores({
    per_page: 50,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sort: sortOrder,
  })

  const auditMutation = useAuditProductsSeo()
  const generateMutation = useGenerateProductSeo()
  const { getQuotaInfo, canPerformAction, currentPlan } = useUnifiedQuotas()

  const quotas = {
    audits: getQuotaInfo('seo_audits'),
    catAudits: getQuotaInfo('seo_category_audits'),
    siteAudits: getQuotaInfo('seo_site_audits'),
    generations: getQuotaInfo('seo_generations'),
    applies: getQuotaInfo('seo_applies'),
    bulk: getQuotaInfo('seo_bulk_limit'),
    languages: getQuotaInfo('seo_languages'),
    history: getQuotaInfo('seo_history_days'),
  }

  const items = data?.items ?? []
  const stats = data?.stats ?? { avg_score: 0, critical: 0, needs_work: 0, optimized: 0, total: 0 }

  const handleAuditAll = useCallback(() => {
    const ids = items.slice(0, 50).map(p => p.product_id)
    if (ids.length > 0) auditMutation.mutate(ids)
  }, [items, auditMutation])

  const handleBulkGenerate = useCallback(() => {
    const bulkMax = quotas.bulk.isUnlimited ? 50 : Math.min(quotas.bulk.limit, 50)
    if (bulkMax <= 0) return
    const targets = items.filter(p => p.status !== 'optimized').slice(0, bulkMax)
    targets.forEach(p => generateMutation.mutate({ productId: p.product_id }))
  }, [items, generateMutation, quotas.bulk])

  const showQuotaWarning = !quotas.audits.isUnlimited && quotas.audits.percentage >= 80 ||
    !quotas.generations.isUnlimited && quotas.generations.percentage >= 80

  return (
    <div className="space-y-6">
      {/* ── Quota Overview ── */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">SEO Quotas — {currentPlan.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              {showQuotaWarning && (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/dashboard/consumption')}>
                  Buy credits
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/dashboard/subscription')}>
                <Zap className="h-3 w-3 mr-1" />Upgrade
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <QuotaBar label="SEO audits" icon={Search} quota={quotas.audits} />
            <QuotaBar label="Category audits" icon={Layers} quota={quotas.catAudits} />
            <QuotaBar label="Site audits" icon={Globe} quota={quotas.siteAudits} />
            <QuotaBar label="AI generations" icon={Sparkles} quota={quotas.generations} />
            <QuotaBar label="Applied optimizations" icon={CheckCircle2} quota={quotas.applies} />
            <QuotaBar label="Bulk operations" icon={Target} quota={quotas.bulk} />
            <QuotaBar label="Languages" icon={Globe} quota={quotas.languages} />
            <QuotaBar label="History retention" icon={Clock} quota={quotas.history} />
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Products', value: stats.total, icon: Target, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
          { label: 'Avg. Score', value: stats.avg_score, icon: BarChart3, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500', scoreColor: true },
          { label: 'Optimized', value: stats.optimized, icon: CheckCircle2, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', valueColor: 'text-emerald-500' },
          { label: 'Needs work', value: stats.needs_work, icon: AlertCircle, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500', valueColor: 'text-amber-500' },
          { label: 'Critical', value: stats.critical, icon: XCircle, iconBg: 'bg-red-500/10', iconColor: 'text-red-500', valueColor: 'text-red-500' },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, scoreColor, valueColor }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', iconBg)}><Icon className={cn('h-5 w-5', iconColor)} /></div>
              <div>
                <p className={cn('text-xl font-bold', valueColor, scoreColor && (value >= 70 ? 'text-emerald-500' : value >= 40 ? 'text-amber-500' : 'text-red-500'))}>
                  {value}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="critical">❌ Critical</SelectItem>
              <SelectItem value="needs_work">⚠️ Needs work</SelectItem>
              <SelectItem value="optimized">✅ Optimized</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score_asc">Score ↑ (worst first)</SelectItem>
              <SelectItem value="score_desc">Score ↓ (best first)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={handleBulkGenerate}
            disabled={generateMutation.isPending || items.filter(p => p.status !== 'optimized').length === 0 || !canPerformAction('seo_generations') || (!quotas.bulk.isUnlimited && quotas.bulk.limit === 0)}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            {generateMutation.isPending ? 'Generating...' : 'Bulk AI Optimize'}
          </Button>
          <Button
            onClick={handleAuditAll}
            disabled={auditMutation.isPending || items.length === 0 || !canPerformAction('seo_audits')}
            size="sm"
          >
            <Play className="h-4 w-4 mr-1.5" />
            {auditMutation.isPending ? 'Auditing...' : 'Audit all'}
          </Button>
        </div>
      </div>

      {/* ── Quota Warning ── */}
      {showQuotaWarning && (
        <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-yellow-600" />
              <span>
                Quota usage at{' '}
                {Math.round(Math.max(quotas.audits.percentage, quotas.generations.percentage))}%
                — Upgrade or buy additional credits
              </span>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/dashboard/consumption')}>
              Buy credits
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Product List ── */}
      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading SEO scores...</CardContent></Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No products found</h3>
            <p className="text-sm text-muted-foreground">Add products to your catalog to start SEO auditing</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {items.map(product => (
              <ProductSeoCard
                key={product.product_id}
                product={product}
                onAudit={() => auditMutation.mutate([product.product_id])}
                onGenerate={() => generateMutation.mutate({ productId: product.product_id })}
                onViewHistory={() => setHistoryProduct({ id: product.product_id, name: product.product_name })}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* History Dialog */}
      {historyProduct && (
        <HistoryDialog
          productId={historyProduct.id}
          productName={historyProduct.name}
          open={!!historyProduct}
          onOpenChange={(open) => !open && setHistoryProduct(null)}
        />
      )}
    </div>
  )
}
