/**
 * VariantsPage - Gestion des anomalies variantes avec données réelles
 * Hub d'exécution: stock, prix, synchronisation des variantes
 * Phase 2: Intégration panneau Intelligence IA
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layers, Package, DollarSign, RefreshCw, CheckCircle, Zap, Search, AlertTriangle, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useVariantAnalysis, VariantIssue } from '@/hooks/catalog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VariantsAIPanel } from '@/components/catalog/VariantsAIPanel'

export default function VariantsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'issues' | 'ai'>('ai')
  const { stats, issues, totalIssues, isLoading } = useVariantAnalysis()

  // Filtrer les problèmes
  const filteredIssues = useMemo(() => {
    let filtered = issues
    
    if (activeTab !== 'all') {
      const typeMap: Record<string, string> = {
        'no-stock': 'no_stock',
        'no-price': 'no_price',
        'not-synced': 'not_synced',
        'inconsistent': 'inconsistent'
      }
      filtered = filtered.filter(i => i.issueType === typeMap[activeTab])
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(i => 
        i.product.name.toLowerCase().includes(query) ||
        i.product.sku?.toLowerCase().includes(query)
      )
    }

    return filtered.slice(0, 20)
  }, [issues, activeTab, searchQuery])

  const issueCategories = [
    { id: 'no-stock', label: 'Sans stock', icon: Package, count: stats.noStockCount, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'no-price', label: 'Sans prix', icon: DollarSign, count: stats.noPriceCount, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'not-synced', label: 'Non synchronisées', icon: RefreshCw, count: stats.notSyncedCount, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'inconsistent', label: 'Incohérentes', icon: AlertTriangle, count: stats.inconsistentCount, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
        <Button onClick={() => navigate('/products')}>
          <Zap className="h-4 w-4 mr-2" />Corriger en masse
        </Button>
      }
    >
      {/* Mode selector */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'issues' | 'ai')} className="mb-6">
        <TabsList>
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Intelligence IA
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Problèmes ({totalIssues})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === 'ai' ? (
        <VariantsAIPanel />
      ) : (
      <div className="space-y-6">
        {/* Stats globales */}
        {stats.productsWithVariants > 0 && (
          <Card className="bg-gradient-to-r from-violet-500/5 to-purple-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits avec variantes</p>
                <p className="text-2xl font-bold">{stats.productsWithVariants} <span className="text-sm font-normal text-muted-foreground">/ {stats.totalProducts}</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total variantes</p>
                <p className="text-2xl font-bold">{stats.totalVariants}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Catégories de problèmes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {issueCategories.map((cat) => (
            <Card 
              key={cat.id} 
              className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === cat.id && "ring-2 ring-primary")} 
              onClick={() => setActiveTab(activeTab === cat.id ? 'all' : cat.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", cat.bg)}>
                    <cat.icon className={cn("h-5 w-5", cat.color)} />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-bold", cat.color)}>{cat.count}</p>
                    <p className="text-xs text-muted-foreground">{cat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une variante..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
        </div>

        {/* Liste des problèmes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Variantes à corriger ({filteredIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Toutes les variantes sont conformes</h3>
                <p className="text-muted-foreground">Aucun problème détecté</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIssues.map((issue: VariantIssue, idx) => {
                  const badge = getSeverityBadge(issue.severity)
                  return (
                    <div 
                      key={`${issue.product.id}-${idx}`} 
                      className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {issue.product.image_url ? (
                            <img src={issue.product.image_url} alt={issue.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{issue.product.name}</p>
                          <p className="text-sm text-muted-foreground">{issue.description}</p>
                          {issue.product.sku && (
                            <p className="text-xs text-muted-foreground">SKU: {issue.product.sku}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/products?id=${issue.product.id}`)}>
                          Corriger
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
      )}
    </ChannablePageWrapper>
  )
}
