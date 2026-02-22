/**
 * ToProcessPage - Backlog intelligent avec données réelles
 * Hub d'exécution: priorisation IA des actions requises
 * Phase 4: Modal de prévisualisation produit intégrée
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, TrendingUp, CheckCircle, Zap, Filter, ArrowUpDown, Package, Sparkles, Euro, Clock, Brain, FileEdit, Eye } from 'lucide-react'
import { useProductBacklog, BacklogCategory, BacklogItem, useDraftProducts } from '@/hooks/catalog'
import { AdvancedFeatureGuide } from '@/components/guide'
import { ADVANCED_GUIDES } from '@/components/guide'
import { BacklogAIPanel, DraftProductsPanel, ProductQuickPreviewModal } from '@/components/catalog'
import type { QuickPreviewProduct } from '@/components/catalog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export default function ToProcessPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<BacklogCategory | 'drafts'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'ai' | 'drafts'>('ai')
  const { backlogItems, counts, totalEstimatedImpact, filterByCategory, isLoading } = useProductBacklog()
  const { stats: draftStats, validateDraft, isValidating } = useDraftProducts()

  // Preview modal state
  const [previewProduct, setPreviewProduct] = useState<QuickPreviewProduct | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Filtrer selon l'onglet actif
  const filteredItems = useMemo(() => {
    if (activeTab === 'drafts') return []
    return filterByCategory(activeTab as BacklogCategory).slice(0, 20)
  }, [activeTab, filterByCategory])

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
    return
    setPreviewProduct({
      id: p.id,
      name: p.name,
      description: p.description || null,
      price: p.price || 0,
      cost_price: p.cost_price || null,
      sku: p.sku || null,
      image_urls: p.image_url ? [p.image_url] : p.images || [],
      category: p.category || null,
      brand: p.brand || null,
      status: p.status || null,
      source_url: p.source_url || null,
      source_platform: p.source_platform || null,
      created_at: p.created_at,
    })
    setPreviewOpen(true)
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return { label: '⚠️ Critique', variant: 'destructive' as const }
      case 'high': return { label: '🔥 Urgent', variant: 'destructive' as const }
      case 'medium': return { label: '⏳ À traiter', variant: 'secondary' as const }
      default: return { label: '💡 Suggestion', variant: 'outline' as const }
    }
  }

  const totalToProcess = counts.total + draftStats.total

  return (
    <ChannablePageWrapper
      title="À traiter"
      subtitle="Backlog intelligent"
      description="Actions requises et opportunités triées par priorité IA"
      heroImage="products"
      badge={{ label: `${totalToProcess} produits`, variant: counts.critical > 0 || draftStats.total > 0 ? 'destructive' : 'secondary' }}
      actions={
        <Button onClick={() => navigate('/products')}>
          <Zap className="h-4 w-4 mr-2" />
          Traiter en masse
        </Button>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.catalog} />
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'ai' | 'drafts')} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Intelligence IA
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <FileEdit className="h-4 w-4" />
            Brouillons
            {draftStats.total > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{draftStats.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Liste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-6">
          <BacklogAIPanel />
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          <DraftProductsPanel />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="space-y-6">
        {totalEstimatedImpact > 0 && (
          <Card className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <Euro className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Impact potentiel estimé</p>
                  <p className="text-2xl font-bold text-emerald-600">+{totalEstimatedImpact.toLocaleString()}€</p>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Estimation IA
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card 
            className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === 'all' && "ring-2 ring-primary")} 
            onClick={() => setActiveTab('all')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted"><Filter className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-2xl font-bold">{counts.total}</p>
                <p className="text-sm text-muted-foreground">Total à traiter</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === 'actions' && "ring-2 ring-destructive")} 
            onClick={() => setActiveTab('actions')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10"><AlertCircle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold text-destructive">{counts.actions}</p>
                <p className="text-sm text-muted-foreground">Actions stock</p>
              </div>
              {counts.critical > 0 && <Badge variant="destructive" className="ml-auto">⚠️ {counts.critical}</Badge>}
            </CardContent>
          </Card>

          <Card 
            className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === 'opportunities' && "ring-2 ring-amber-500")} 
            onClick={() => setActiveTab('opportunities')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{counts.opportunities}</p>
                <p className="text-sm text-muted-foreground">Opportunités marge</p>
              </div>
              <Badge className="ml-auto bg-amber-500">💰</Badge>
            </CardContent>
          </Card>

          <Card 
            className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === 'optimization' && "ring-2 ring-violet-500")} 
            onClick={() => setActiveTab('optimization')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10"><Sparkles className="h-5 w-5 text-violet-600" /></div>
              <div>
                <p className="text-2xl font-bold text-violet-600">{counts.optimization}</p>
                <p className="text-sm text-muted-foreground">Optimisations</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des produits à traiter */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Produits à traiter ({filteredItems.length})
            </CardTitle>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />Tri IA
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Tout est en ordre !</h3>
                <p className="text-muted-foreground">Aucun produit ne nécessite d'action immédiate</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item: BacklogItem) => {
                  const priorityBadge = getPriorityBadge(item.priority)
                  return (
                    <div 
                      key={item.product.id} 
                      className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {item.product.image_url ? (
                            <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-1">{item.product.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.reasons.slice(0, 2).map((reason, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{reason}</Badge>
                            ))}
                          </div>
                          {item.estimatedImpact > 0 && (
                            <p className="text-xs text-emerald-600 mt-1">
                              Impact potentiel: +{item.estimatedImpact}€
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={priorityBadge.variant}>{priorityBadge.label}</Badge>
                        <Button size="sm" variant="outline" onClick={() => openPreview(item)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Aperçu
                        </Button>
                        <Button size="sm" onClick={() => navigate(`/products?id=${item.product.id}`)}>
                          {item.suggestedAction}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <ProductQuickPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        product={previewProduct}
        onValidate={(id) => {
          validateDraft(id)
          setPreviewOpen(false)
        }}
        onNavigateToProduct={(id) => navigate(`/products?id=${id}`)}
        isValidating={isValidating}
      />
    </ChannablePageWrapper>
  )
}
