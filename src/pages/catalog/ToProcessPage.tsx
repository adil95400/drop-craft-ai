/**
 * ToProcessPage - Backlog intelligent avec données réelles
 * Hub d'exécution: priorisation IA des actions requises
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, TrendingUp, CheckCircle, Zap, Filter, ArrowUpDown, Package, Sparkles, Euro, Clock, Brain, FileEdit, Eye, ArrowRight } from 'lucide-react'
import { useProductBacklog, BacklogCategory, BacklogItem, useDraftProducts } from '@/hooks/catalog'
import { AdvancedFeatureGuide } from '@/components/guide'
import { ADVANCED_GUIDES } from '@/components/guide'
import { BacklogAIPanel, DraftProductsPanel } from '@/components/catalog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
}

export default function ToProcessPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<BacklogCategory | 'drafts'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'ai' | 'drafts'>('ai')
  const { backlogItems, counts, totalEstimatedImpact, filterByCategory, isLoading } = useProductBacklog()
  const { stats: draftStats, validateDraft, isValidating } = useDraftProducts()

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

  const statCards = [
    { id: 'all', label: 'Total à traiter', value: counts.total, icon: Filter, color: 'text-foreground', bg: 'bg-muted', ring: 'ring-primary' },
    { id: 'actions', label: 'Actions stock', value: counts.actions, icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', ring: 'ring-destructive', extra: counts.critical > 0 ? `⚠️ ${counts.critical}` : null },
    { id: 'opportunities', label: 'Opportunités marge', value: counts.opportunities, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-500/10', ring: 'ring-amber-500' },
    { id: 'optimization', label: 'Optimisations', value: counts.optimization, icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-500/10', ring: 'ring-violet-500' },
  ]

  return (
    <ChannablePageWrapper
      title="À traiter"
      subtitle="Backlog intelligent"
      description="Actions requises et opportunités triées par priorité IA"
      heroImage="products"
      badge={{ label: `${totalToProcess} produits`, variant: counts.critical > 0 || draftStats.total > 0 ? 'destructive' : 'secondary' }}
      actions={
        <Button onClick={() => navigate('/products')} className="gap-2 shadow-lg shadow-primary/20">
          <Zap className="h-4 w-4" />
          Traiter en masse
        </Button>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.catalog} />
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'ai' | 'drafts')} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="ai" className="flex items-center gap-2 data-[state=active]:shadow-md">
            <Brain className="h-4 w-4" />
            Intelligence IA
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2 data-[state=active]:shadow-md">
            <FileEdit className="h-4 w-4" />
            Brouillons
            {draftStats.total > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 animate-pulse">{draftStats.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:shadow-md">
            <Filter className="h-4 w-4" />
            Liste
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
            {totalEstimatedImpact > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5 border-emerald-500/20 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/5 to-transparent" />
                  <CardContent className="p-5 flex items-center justify-between relative">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 shadow-lg shadow-emerald-500/10">
                        <Euro className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Impact potentiel estimé</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tight">+{totalEstimatedImpact.toLocaleString()}€</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Estimation IA
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Stats rapides */}
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
                    </div>
                    {stat.extra && <Badge variant="destructive" className="ml-auto animate-pulse">{stat.extra}</Badge>}
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Liste des produits à traiter */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Produits à traiter ({filteredItems.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />Tri IA
                  </Button>
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
                        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                      </motion.div>
                      <h3 className="text-lg font-semibold">Tout est en ordre !</h3>
                      <p className="text-muted-foreground">Aucun produit ne nécessite d'action immédiate</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      <AnimatePresence>
                        {filteredItems.map((item: BacklogItem, idx) => {
                          const priorityBadge = getPriorityBadge(item.priority)
                          return (
                            <motion.div
                              key={item.product.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors group"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
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
                                  {item.estimatedImpact > 0 && (
                                    <p className="text-xs text-emerald-600 mt-1 font-medium">
                                      💰 +{item.estimatedImpact}€ potentiel
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <Badge variant={priorityBadge.variant} className={cn("shadow-sm", priorityBadge.glow && `shadow-lg ${priorityBadge.glow}`)}>
                                  {priorityBadge.label}
                                </Badge>
                                <Button size="sm" variant="outline" onClick={() => openPreview(item)} className="gap-1.5 opacity-80 group-hover:opacity-100">
                                  <Eye className="h-4 w-4" />
                                  Aperçu
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
