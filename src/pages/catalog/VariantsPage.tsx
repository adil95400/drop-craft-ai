/**
 * VariantsPage - Gestion des anomalies variantes avec données réelles
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layers, Package, DollarSign, RefreshCw, CheckCircle, Zap, Search, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useVariantAnalysis, VariantIssue } from '@/hooks/catalog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VariantsAIPanel } from '@/components/catalog/VariantsAIPanel'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } }

export default function VariantsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'issues' | 'ai'>('ai')
  const { stats, issues, totalIssues, isLoading } = useVariantAnalysis()

  const filteredIssues = useMemo(() => {
    let filtered = issues
    if (activeTab !== 'all') {
      const typeMap: Record<string, string> = { 'no-stock': 'no_stock', 'no-price': 'no_price', 'not-synced': 'not_synced', 'inconsistent': 'inconsistent' }
      filtered = filtered.filter(i => i.issueType === typeMap[activeTab])
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(i => i.product.name.toLowerCase().includes(query) || i.product.sku?.toLowerCase().includes(query))
    }
    return filtered.slice(0, 20)
  }, [issues, activeTab, searchQuery])

  const issueCategories = [
    { id: 'no-stock', label: 'Sans stock', icon: Package, count: stats.noStockCount, color: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500' },
    { id: 'no-price', label: 'Sans prix', icon: DollarSign, count: stats.noPriceCount, color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500' },
    { id: 'not-synced', label: 'Non synchronisées', icon: RefreshCw, count: stats.notSyncedCount, color: 'text-blue-500', bg: 'bg-blue-500/10', ring: 'ring-blue-500' },
    { id: 'inconsistent', label: 'Incohérentes', icon: AlertTriangle, count: stats.inconsistentCount, color: 'text-purple-500', bg: 'bg-purple-500/10', ring: 'ring-purple-500' },
  ]

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return { label: '⚠️ Critique', variant: 'destructive' as const }
      case 'warning': return { label: '⏳ À corriger', variant: 'secondary' as const }
      default: return { label: '💡 Info', variant: 'outline' as const }
    }
  }

  return (
    <ChannablePageWrapper
      title="Variantes"
      subtitle="Gestion des anomalies"
      description="Identifiez et corrigez les problèmes de variantes produits"
      heroImage="products"
      badge={{ label: `${totalIssues} problèmes`, variant: totalIssues > 0 ? 'destructive' : 'secondary' }}
      actions={
        <Button onClick={() => navigate('/products')} className="gap-2 shadow-lg shadow-primary/20">
          <Zap className="h-4 w-4" />Corriger en masse
        </Button>
      }
    >
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'issues' | 'ai')} className="mb-6">
        <TabsList className="bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="ai" className="gap-2 data-[state=active]:shadow-md"><Sparkles className="h-4 w-4" />Intelligence IA</TabsTrigger>
          <TabsTrigger value="issues" className="gap-2 data-[state=active]:shadow-md"><AlertTriangle className="h-4 w-4" />Problèmes ({totalIssues})</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === 'ai' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><VariantsAIPanel /></motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          {/* Stats globales */}
          {stats.productsWithVariants > 0 && (
            <motion.div variants={fadeUp}>
              <Card className="bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-violet-500/5 border-violet-500/20 overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-400/5 to-transparent" />
                <CardContent className="p-5 flex items-center justify-between relative">
                  <div>
                    <p className="text-sm text-muted-foreground">Produits avec variantes</p>
                    <p className="text-3xl font-black">{stats.productsWithVariants} <span className="text-base font-normal text-muted-foreground">/ {stats.totalProducts}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total variantes</p>
                    <p className="text-3xl font-black text-violet-600">{stats.totalVariants}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Catégories */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {issueCategories.map((cat) => (
              <Card
                key={cat.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group",
                  activeTab === cat.id && `ring-2 ${cat.ring} shadow-lg`
                )}
                onClick={() => setActiveTab(activeTab === cat.id ? 'all' : cat.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-2xl transition-transform group-hover:scale-110", cat.bg)}>
                      <cat.icon className={cn("h-5 w-5", cat.color)} />
                    </div>
                    <div>
                      <p className={cn("text-2xl font-black tabular-nums", cat.color)}>{cat.count}</p>
                      <p className="text-xs text-muted-foreground">{cat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Recherche */}
          <motion.div variants={fadeUp} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher une variante..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-background/80 backdrop-blur-sm" />
          </motion.div>

          {/* Liste */}
          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Variantes à corriger ({filteredIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="divide-y">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-4"><Skeleton className="h-16 rounded-xl" /></div>
                    ))}
                  </div>
                ) : filteredIssues.length === 0 ? (
                  <div className="text-center py-16">
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                      <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-semibold">Toutes les variantes sont conformes</h3>
                    <p className="text-muted-foreground">Aucun problème détecté</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    <AnimatePresence>
                      {filteredIssues.map((issue: VariantIssue, idx) => {
                        const badge = getSeverityBadge(issue.severity)
                        return (
                          <motion.div
                            key={`${issue.product.id}-${idx}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0 ring-1 ring-border shadow-sm group-hover:shadow-md transition-shadow">
                                {issue.product.image_url ? (
                                  <img src={issue.product.image_url} alt={issue.product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold line-clamp-1">{issue.product.name}</p>
                                <p className="text-sm text-muted-foreground">{issue.description}</p>
                                {issue.product.sku && <p className="text-xs text-muted-foreground mt-0.5">SKU: {issue.product.sku}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={badge.variant} className="shadow-sm">{badge.label}</Badge>
                              <Button size="sm" variant="outline" onClick={() => navigate(`/products?id=${issue.product.id}`)} className="gap-1.5 opacity-80 group-hover:opacity-100">
                                Corriger <ArrowRight className="h-3 w-3" />
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
      )}
    </ChannablePageWrapper>
  )
}
