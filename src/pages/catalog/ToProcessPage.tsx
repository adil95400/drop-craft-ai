/**
 * ToProcessPage - Backlog intelligent avec données réelles
 * Hub d'exécution: priorisation IA, actions en masse, dashboard d'impact
 * Audit v2: bulk actions, transparence IA, tracking d'impact
 */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertCircle, TrendingUp, CheckCircle, Zap, Filter, ArrowUpDown, Package,
  Sparkles, Euro, Clock, Brain, FileEdit, Eye, ArrowRight, CheckCheck,
  XCircle, BarChart3, Info, Loader2
} from 'lucide-react'
import { useProductBacklog, BacklogCategory, BacklogItem, useDraftProducts } from '@/hooks/catalog'
import { AdvancedFeatureGuide } from '@/components/guide'
import { ADVANCED_GUIDES } from '@/components/guide'
import { BacklogAIPanel, DraftProductsPanel } from '@/components/catalog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
}

// Critères IA avec poids et explication
const AI_CRITERIA = [
  { key: 'stock', label: 'Stock critique', weight: 40, description: 'Produits en rupture ou stock < 3 unités' },
  { key: 'margin', label: 'Marge insuffisante', weight: 25, description: 'Marge bénéficiaire < 15%' },
  { key: 'image', label: 'Image manquante', weight: 20, description: 'Produits sans visuel (−30% conversion)' },
  { key: 'category', label: 'Catégorie manquante', weight: 15, description: 'Classification absente = SEO faible' },
]

export default function ToProcessPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<BacklogCategory | 'drafts'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'ai' | 'drafts'>('ai')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'score' | 'impact' | 'stock'>('score')
  const [showCriteria, setShowCriteria] = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const { backlogItems, counts, totalEstimatedImpact, filterByCategory, isLoading } = useProductBacklog()
  const { stats: draftStats, validateDraft, isValidating } = useDraftProducts()
  const { t: tPages } = useTranslation('pages')

  const filteredItems = useMemo(() => {
    if (activeTab === 'drafts') return []
    let items = filterByCategory(activeTab as BacklogCategory)

    // Tri
    if (sortBy === 'impact') items = [...items].sort((a, b) => b.estimatedImpact - a.estimatedImpact)
    else if (sortBy === 'stock') items = [...items].sort((a, b) => (a.product.stock_quantity || 0) - (b.product.stock_quantity || 0))

    return items.slice(0, 30)
  }, [activeTab, filterByCategory, sortBy])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.product.id)))
    }
  }, [filteredItems, selectedIds.size])

  const handleBulkAction = useCallback(async (action: 'navigate' | 'ignore') => {
    if (selectedIds.size === 0) return
    setBulkProcessing(true)
    if (action === 'navigate') {
      navigate(`/products?ids=${Array.from(selectedIds).join(',')}`)
    } else {
      // Ignore = mark as reviewed (client-side only for now)
      toast.success(`${selectedIds.size} produits marqués comme vérifiés`)
      setSelectedIds(new Set())
    }
    setBulkProcessing(false)
  }, [selectedIds, navigate])

  const openPreview = (item: BacklogItem) => {
    const p = item.product as any
    navigate('/import/preview', {
      state: {
        product: {
          title: p.name,
          description: p.description || '',
          price: p.price || 0,
          images: p.image_url ? [p.image_url] : p.images || [],
          category: p.category || '',
          sku: p.sku || '',
        },
        returnTo: '/catalog/to-process',
      }
    })
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return { label: '⚠️ Critique', variant: 'destructive' as const, glow: 'shadow-red-500/20' }
      case 'high': return { label: '🔥 Urgent', variant: 'destructive' as const, glow: 'shadow-orange-500/20' }
      case 'medium': return { label: '⏳ À traiter', variant: 'secondary' as const, glow: '' }
      default: return { label: '💡 Suggestion', variant: 'outline' as const, glow: '' }
    }
  }

  const totalToProcess = counts.total + draftStats.total

  // Statistiques d'impact par catégorie
  const impactByCategory = useMemo(() => {
    const actions = backlogItems.filter(i => i.reasons.some(r => r.includes('stock') || r.includes('Rupture')))
    const opportunities = backlogItems.filter(i => i.reasons.some(r => r.includes('Marge')))
    const optimizations = backlogItems.filter(i => i.reasons.some(r => r.includes('Image') || r.includes('Catégorie')))
    return {
      actionsImpact: actions.reduce((s, i) => s + i.estimatedImpact, 0),
      opportunitiesImpact: opportunities.reduce((s, i) => s + i.estimatedImpact, 0),
      optimizationsImpact: optimizations.reduce((s, i) => s + i.estimatedImpact, 0),
    }
  }, [backlogItems])

  const statCards = [
    { id: 'all', label: 'Total à traiter', value: counts.total, icon: Filter, color: 'text-foreground', bg: 'bg-muted', ring: 'ring-primary', impact: totalEstimatedImpact },
    { id: 'actions', label: 'Actions stock', value: counts.actions, icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', ring: 'ring-destructive', extra: counts.critical > 0 ? `⚠️ ${counts.critical}` : null, impact: impactByCategory.actionsImpact },
    { id: 'opportunities', label: 'Opportunités marge', value: counts.opportunities, icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10', ring: 'ring-amber-500', impact: impactByCategory.opportunitiesImpact },
    { id: 'optimization', label: 'Optimisations', value: counts.optimization, icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-500/10', ring: 'ring-violet-500', impact: impactByCategory.optimizationsImpact },
  ]

  return (
    <ChannablePageWrapper
      title={tPages('aTraiter.title')}
      subtitle={tPages('backlogIntelligent.title')}
      description="Actions requises et opportunités triées par priorité IA"
      heroImage="products"
      badge={{ label: `${totalToProcess} produits`, variant: counts.critical > 0 || draftStats.total > 0 ? 'destructive' : 'secondary' }}
      actions={
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowCriteria(!showCriteria)} className="gap-2">
                  <Info className="h-4 w-4" />
                  Critères IA
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voir les critères de priorisation</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button onClick={() => navigate('/products')} className="gap-2 shadow-lg shadow-primary/20">
            <Zap className="h-4 w-4" />
            Traiter en masse
          </Button>
        </div>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.catalog} />

      {/* Panneau Transparence IA */}
      <AnimatePresence>
        {showCriteria && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Critères de priorisation IA
                </CardTitle>
                <CardDescription className="text-xs">
                  Score = somme pondérée des critères ci-dessous. Les produits avec score ≥ 50 sont marqués « Critique ».
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {AI_CRITERIA.map((c) => (
                    <div key={c.key} className="p-3 rounded-xl bg-background/80 border space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{c.label}</span>
                        <Badge variant="outline" className="text-[10px] tabular-nums">{c.weight}pts</Badge>
                      </div>
                      <Progress value={c.weight} max={40} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">{c.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'ai' | 'drafts')} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="ai" className="flex items-center gap-2 data-[state=active]:shadow-md">
            <Brain className="h-4 w-4" />Intelligence IA
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2 data-[state=active]:shadow-md">
            <FileEdit className="h-4 w-4" />Brouillons
            {draftStats.total > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 animate-pulse">{draftStats.total}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:shadow-md">
            <Filter className="h-4 w-4" />Liste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <BacklogAIPanel />
          </motion.div>
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <DraftProductsPanel />
          </motion.div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            {/* Impact potentiel avec répartition */}
            {totalEstimatedImpact > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5 border-emerald-500/20 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/5 to-transparent" />
                  <CardContent className="p-5 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-success/10 shadow-lg shadow-emerald-500/10">
                          <Euro className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Impact potentiel total</p>
                          <p className="text-3xl font-black text-success tracking-tight">+{totalEstimatedImpact.toLocaleString()}€</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-success border-emerald-500/30 backdrop-blur-sm">
                        <Sparkles className="h-3 w-3 mr-1" />Estimation IA
                      </Badge>
                    </div>
                    {/* Répartition impact */}
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-emerald-500/10">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Stock</p>
                        <p className="text-sm font-bold text-destructive">+{impactByCategory.actionsImpact.toLocaleString()}€</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Marge</p>
                        <p className="text-sm font-bold text-warning">+{impactByCategory.opportunitiesImpact.toLocaleString()}€</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Optimisation</p>
                        <p className="text-sm font-bold text-violet-600">+{impactByCategory.optimizationsImpact.toLocaleString()}€</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Stats rapides avec impact */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((stat) => (
                <Card
                  key={stat.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group",
                    activeTab === stat.id && `ring-2 ${stat.ring} shadow-lg`
                  )}
                  onClick={() => setActiveTab(stat.id as any)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", stat.bg)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                    <div>
                      <p className={cn("text-2xl font-black tabular-nums", stat.color)}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      {stat.impact > 0 && <p className="text-[10px] text-success font-semibold">+{stat.impact.toLocaleString()}€</p>}
                    </div>
                    {stat.extra && <Badge variant="destructive" className="ml-auto animate-pulse">{stat.extra}</Badge>}
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Liste avec bulk actions */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Produits à traiter ({filteredItems.length})
                    </CardTitle>
                    {selectedIds.size > 0 && (
                      <Badge variant="default" className="gap-1">
                        <CheckCheck className="h-3 w-3" />{selectedIds.size} sélectionné(s)
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Bulk actions */}
                    {selectedIds.size > 0 && (
                      <div className="flex items-center gap-1.5 mr-2">
                        <Button size="sm" onClick={() => handleBulkAction('navigate')} disabled={bulkProcessing} className="gap-1.5 h-8 text-xs">
                          <Zap className="h-3 w-3" />Traiter ({selectedIds.size})
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('ignore')} disabled={bulkProcessing} className="gap-1.5 h-8 text-xs">
                          <XCircle className="h-3 w-3" />Ignorer
                        </Button>
                      </div>
                    )}
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <ArrowUpDown className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">Tri IA (score)</SelectItem>
                        <SelectItem value="impact">Impact €</SelectItem>
                        <SelectItem value="stock">Stock ↑</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="space-y-0 divide-y">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4"><Skeleton className="h-16 rounded-xl" /></div>
                      ))}
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-16">
                      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                      </motion.div>
                      <h3 className="text-lg font-semibold">Tout est en ordre !</h3>
                      <p className="text-muted-foreground">Aucun produit ne nécessite d'action immédiate</p>
                    </div>
                  ) : (
                    <>
                      {/* Select all row */}
                      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/10">
                        <Checkbox
                          checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                          onCheckedChange={selectAll}
                        />
                        <span className="text-xs text-muted-foreground">
                          {selectedIds.size === filteredItems.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </span>
                      </div>
                      <div className="divide-y">
                        <AnimatePresence>
                          {filteredItems.map((item: BacklogItem, idx) => {
                            const priorityBadge = getPriorityBadge(item.priority)
                            const isSelected = selectedIds.has(item.product.id)
                            return (
                              <motion.div
                                key={item.product.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className={cn(
                                  "flex items-center justify-between p-4 hover:bg-accent/50 transition-colors group",
                                  isSelected && "bg-primary/5"
                                )}
                              >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelect(item.product.id)}
                                  />
                                  <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 ring-1 ring-border shadow-sm group-hover:shadow-md transition-shadow">
                                    {item.product.image_url ? (
                                      <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold line-clamp-1">{item.product.name}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.reasons.slice(0, 2).map((reason, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">{reason}</Badge>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                      {item.estimatedImpact > 0 && (
                                        <p className="text-xs text-success font-medium">💰 +{item.estimatedImpact}€</p>
                                      )}
                                      <p className="text-[10px] text-muted-foreground tabular-nums">Score: {item.score}/100</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <Badge variant={priorityBadge.variant} className={cn("shadow-sm", priorityBadge.glow && `shadow-lg ${priorityBadge.glow}`)}>
                                    {priorityBadge.label}
                                  </Badge>
                                  <Button size="sm" variant="outline" onClick={() => openPreview(item)} className="gap-1.5 opacity-80 group-hover:opacity-100">
                                    <Eye className="h-4 w-4" />Aperçu
                                  </Button>
                                  <Button size="sm" onClick={() => navigate(`/products?id=${item.product.id}`)} className="gap-1.5 shadow-sm">
                                    {item.suggestedAction}
                                    <ArrowRight className="h-3 w-3" />
                                  </Button>
                                </div>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
