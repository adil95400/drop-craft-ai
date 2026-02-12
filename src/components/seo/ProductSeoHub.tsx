/**
 * ProductSeoHub — Channable-style SEO product dashboard
 * Shows product cards with scores, badges, filters, actions, timeline, and quota usage
 */
import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Search, Play, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  BarChart3, Sparkles, Eye, Clock, ArrowRight, XCircle, AlertCircle,
  Target, Zap, ChevronRight, History, ShieldAlert, Gauge
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

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const config = score >= 70
    ? { label: 'Optimisé', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' }
    : score >= 40
    ? { label: 'À améliorer', icon: AlertCircle, color: 'bg-amber-500/10 text-amber-600 border-amber-200' }
    : { label: 'Critique', icon: XCircle, color: 'bg-red-500/10 text-red-600 border-red-200' }

  const Icon = config.icon
  const sizeClasses = size === 'lg' ? 'text-sm px-3 py-1.5' : size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeClasses}`}>
      <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} />
      {config.label}
    </span>
  )
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500'
  const bg = score >= 70 ? 'bg-emerald-500/10' : score >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10'
  return (
    <div className={`flex items-center justify-center w-14 h-14 rounded-full ${bg}`}>
      <span className={`text-xl font-bold ${color}`}>{score}</span>
    </div>
  )
}

function ImpactBadge({ level }: { level: string }) {
  const config: Record<string, { label: string; color: string }> = {
    urgent: { label: '🔥 Urgent', color: 'bg-red-100 text-red-700 border-red-200' },
    high: { label: '⚡ Haute', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    normal: { label: '📋 Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  }
  const c = config[level] ?? config.normal
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${c.color}`}>{c.label}</span>
}

function ProductSeoCard({ product, onAudit, onGenerate, onViewHistory }: {
  product: ProductSeoResult
  onAudit: () => void
  onGenerate: () => void
  onViewHistory: () => void
}) {
  const criticalCount = product.issues.filter(i => i.severity === 'critical').length
  const warningCount = product.issues.filter(i => i.severity === 'warning').length

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <ScoreCircle score={product.score.global} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{product.product_name}</h3>
              <ScoreBadge score={product.score.global} size="sm" />
              <ImpactBadge level={product.business_impact.priority} />
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-5 gap-3 mt-3">
              {[
                { label: 'SEO', value: product.score.seo },
                { label: 'Contenu', value: product.score.content },
                { label: 'Images', value: product.score.images },
                { label: 'Données', value: product.score.data },
                { label: 'AI Ready', value: product.score.ai_readiness },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <Progress value={item.value} className="h-1.5 mb-1" />
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  <span className="text-[10px] font-medium ml-1">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Issues + Impact */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t">
              <div className="flex items-center gap-3 text-xs">
                {criticalCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3.5 w-3.5" />{criticalCount} critique(s)
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />{warningCount} avertissement(s)
                  </span>
                )}
                {product.strengths.length > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />{product.strengths.length} point(s) fort(s)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {product.business_impact.estimated_traffic_gain_percent > 0 && (
                  <span className="flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    +{product.business_impact.estimated_traffic_gain_percent}% trafic
                  </span>
                )}
                {product.business_impact.estimated_conversion_gain_percent > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Zap className="h-3 w-3 text-blue-500" />
                    +{product.business_impact.estimated_conversion_gain_percent.toFixed(0)}% conversion
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onAudit}>
              <Search className="h-3 w-3 mr-1" />Auditer
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={onGenerate}>
              <Sparkles className="h-3 w-3 mr-1" />Optimiser IA
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onViewHistory}>
              <History className="h-3 w-3 mr-1" />Historique
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HistoryDialog({ productId, productName, open, onOpenChange }: {
  productId: string
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data } = useProductSeoHistory(open ? productId : undefined)
  const items = data?.items ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Historique SEO — {productName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun historique disponible</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-1.5 bg-muted rounded-full mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{item.source}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    {item.fields?.score && (
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div>Global: <span className="font-medium">{item.fields.score.global}</span></div>
                        <div>SEO: <span className="font-medium">{item.fields.score.seo}</span></div>
                        <div>Issues: <span className="font-medium">{item.fields.issues_count ?? '—'}</span></div>
                      </div>
                    )}
                    {item.fields?.seo_title && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">Title: {item.fields.seo_title}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export function ProductSeoHub() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<string>('score_asc')
  const [historyProduct, setHistoryProduct] = useState<{ id: string; name: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  const { data, isLoading } = useProductSeoScores({
    per_page: 50,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sort: sortOrder,
  })

  const auditMutation = useAuditProductsSeo()
  const generateMutation = useGenerateProductSeo()
  const { getQuotaInfo, canPerformAction, currentPlan } = useUnifiedQuotas()

  const seoAuditsQuota = getQuotaInfo('seo_audits')
  const seoGensQuota = getQuotaInfo('seo_generations')
  const seoAppliesQuota = getQuotaInfo('seo_applies')
  const seoCatAuditsQuota = getQuotaInfo('seo_category_audits')
  const seoSiteAuditsQuota = getQuotaInfo('seo_site_audits')
  const seoBulkQuota = getQuotaInfo('seo_bulk_limit')

  const items = data?.items ?? []
  const stats = data?.stats ?? { avg_score: 0, critical: 0, needs_work: 0, optimized: 0, total: 0 }

  const handleAuditAll = useCallback(() => {
    const ids = items.slice(0, 50).map(p => p.product_id)
    if (ids.length > 0) auditMutation.mutate(ids)
  }, [items, auditMutation])

  const handleAuditOne = useCallback((id: string) => {
    auditMutation.mutate([id])
  }, [auditMutation])

  const handleGenerate = useCallback((id: string) => {
    generateMutation.mutate({ productId: id })
  }, [generateMutation])

  const handleBulkGenerate = useCallback(() => {
    const bulkMax = seoBulkQuota.isUnlimited ? 50 : Math.min(seoBulkQuota.limit, 50)
    if (bulkMax <= 0) return
    const ids = statusFilter === 'all' 
      ? items.filter(p => p.status !== 'optimized').slice(0, bulkMax).map(p => p.product_id)
      : items.slice(0, bulkMax).map(p => p.product_id)
    ids.forEach(id => generateMutation.mutate({ productId: id }))
  }, [items, generateMutation, statusFilter, seoBulkQuota])

  return (
    <div className="space-y-6">
      {/* SEO Quota Usage Bar */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Quotas SEO — Plan {currentPlan}</span>
            </div>
            {(seoAuditsQuota.percentage >= 80 || seoGensQuota.percentage >= 80) && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/dashboard/subscription')}>
                <Zap className="h-3 w-3 mr-1" />Upgrader
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Audits produits', quota: seoAuditsQuota, icon: Search },
              { label: 'Audits catégories', quota: seoCatAuditsQuota, icon: Search },
              { label: 'Audits site', quota: seoSiteAuditsQuota, icon: Search },
              { label: 'Générations IA', quota: seoGensQuota, icon: Sparkles },
              { label: 'Applications', quota: seoAppliesQuota, icon: CheckCircle2 },
              { label: 'Bulk', quota: seoBulkQuota, icon: Target },
            ].map(({ label, quota, icon: Icon }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground"><Icon className="h-3 w-3" />{label}</span>
                  <span className="font-medium">
                    {quota.isUnlimited ? '∞' : quota.limit === 0 ? '—' : `${quota.current}/${quota.limit}`}
                  </span>
                </div>
                {!quota.isUnlimited && quota.limit > 0 && (
                  <Progress 
                    value={quota.percentage} 
                    className={cn('h-1.5', 
                      quota.percentage >= 100 && '[&>div]:bg-destructive',
                      quota.percentage >= 80 && quota.percentage < 100 && '[&>div]:bg-yellow-500'
                    )} 
                  />
                )}
                {quota.limit === 0 && !quota.isUnlimited && (
                  <span className="text-[10px] text-muted-foreground">Non inclus</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg"><Target className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Produits</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg"><BarChart3 className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className={`text-xl font-bold ${stats.avg_score >= 70 ? 'text-emerald-500' : stats.avg_score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{stats.avg_score}</p>
              <p className="text-xs text-muted-foreground">Score moyen</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-xl font-bold text-emerald-500">{stats.optimized}</p>
              <p className="text-xs text-muted-foreground">Optimisés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg"><AlertCircle className="h-5 w-5 text-amber-500" /></div>
            <div>
              <p className="text-xl font-bold text-amber-500">{stats.needs_work}</p>
              <p className="text-xs text-muted-foreground">À améliorer</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg"><XCircle className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-xl font-bold text-red-500">{stats.critical}</p>
              <p className="text-xs text-muted-foreground">Critiques</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="critical">❌ Critique</SelectItem>
              <SelectItem value="needs_work">⚠️ À améliorer</SelectItem>
              <SelectItem value="optimized">✅ Optimisé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score_asc">Score ↑ (pire en premier)</SelectItem>
              <SelectItem value="score_desc">Score ↓ (meilleur en premier)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" size="sm" 
            onClick={handleBulkGenerate} 
            disabled={generateMutation.isPending || items.filter(p => p.status !== 'optimized').length === 0 || !canPerformAction('seo_generations') || (!seoBulkQuota.isUnlimited && seoBulkQuota.limit === 0)}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            {generateMutation.isPending ? 'Génération...' : 'Bulk Optimiser IA'}
          </Button>
          <Button 
            onClick={handleAuditAll} 
            disabled={auditMutation.isPending || items.length === 0 || !canPerformAction('seo_audits')} 
            size="sm"
          >
            <Play className="h-4 w-4 mr-1.5" />
            {auditMutation.isPending ? 'Audit en cours...' : 'Auditer tous'}
          </Button>
        </div>
      </div>

      {/* Quota warning */}
      {!seoAuditsQuota.isUnlimited && seoAuditsQuota.percentage >= 80 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-yellow-600" />
              <span>Quota audits SEO à {Math.round(seoAuditsQuota.percentage)}% — {Math.max(0, seoAuditsQuota.limit - seoAuditsQuota.current)} restants</span>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/dashboard/consumption')}>
              Acheter des crédits
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product List */}
      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Chargement des scores SEO...</CardContent></Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Aucun produit trouvé</h3>
            <p className="text-sm text-muted-foreground">Ajoutez des produits à votre catalogue pour commencer l'audit SEO</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {items.map(product => (
              <ProductSeoCard
                key={product.product_id}
                product={product}
                onAudit={() => handleAuditOne(product.product_id)}
                onGenerate={() => handleGenerate(product.product_id)}
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
