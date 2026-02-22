/**
 * AttributesPage - Enrichissement des attributs avec données réelles
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tag, AlertTriangle, CheckCircle, Sparkles, ShoppingBag, FileWarning, Wand2, TrendingUp, Check, X, ArrowRight, Loader2 } from 'lucide-react'
import { useAttributeAnalysis, MarketplaceRequirement, AttributeSuggestion } from '@/hooks/catalog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } }

export default function AttributesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [isEnriching, setIsEnriching] = useState(false)
  const { stats, marketplaceAnalysis, productIssues, enrichableProducts, aiSuggestions, isLoading, enrichProduct, bulkEnrich } = useAttributeAnalysis()

  const issueCategories = [
    { id: 'category', label: 'Sans catégorie', icon: Tag, count: stats.missingCategory, color: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500' },
    { id: 'brand', label: 'Sans marque', icon: ShoppingBag, count: stats.missingBrand, color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500' },
    { id: 'gtin', label: 'Sans GTIN/EAN', icon: FileWarning, count: stats.missingGTIN, color: 'text-blue-500', bg: 'bg-blue-500/10', ring: 'ring-blue-500' },
    { id: 'description', label: 'Description courte', icon: AlertTriangle, count: stats.missingDescription, color: 'text-purple-500', bg: 'bg-purple-500/10', ring: 'ring-purple-500' },
  ]

  const handleBulkEnrich = async () => {
    if (enrichableProducts.length === 0) return
    setIsEnriching(true)
    const productIds = enrichableProducts.slice(0, 50).map(p => p.product.id)
    await bulkEnrich(productIds, ['category', 'brand', 'description'])
    setIsEnriching(false)
  }

  return (
    <ChannablePageWrapper
      title="Attributs"
      subtitle="Enrichissement catalogue"
      description="Normalisez et enrichissez les attributs pour optimiser vos performances marketplaces"
      heroImage="products"
      badge={{ label: 'PRO', variant: 'default' }}
      actions={
        <Button onClick={handleBulkEnrich} disabled={isEnriching || enrichableProducts.length === 0} className="gap-2 shadow-lg shadow-primary/20">
          {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Enrichir {enrichableProducts.length} produits
        </Button>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Score de complétude */}
        <motion.div variants={fadeUp}>
          <Card className="bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-violet-500/5 border-violet-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-400/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Score de complétude catalogue</h3>
                  <p className="text-sm text-muted-foreground">{stats.complete} produits complets sur {stats.total}</p>
                </div>
                <div className="text-right">
                  <span className={cn("text-5xl font-black tracking-tight", stats.completenessScore >= 80 ? "text-emerald-500" : stats.completenessScore >= 60 ? "text-amber-500" : "text-red-500")}>
                    {stats.completenessScore}%
                  </span>
                  {stats.completenessScore < 80 && <p className="text-xs text-muted-foreground mt-1">Objectif: 80%</p>}
                </div>
              </div>
              <Progress value={stats.completenessScore} className="h-3" />

              {stats.completenessScore < 80 && (
                <div className="mt-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-600">+{Math.round((80 - stats.completenessScore) * 0.5)}% de visibilité potentielle</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Atteindre 80% de complétude améliore le classement sur Google Shopping et Amazon</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Catégories */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {issueCategories.map((cat) => (
            <Card key={cat.id} className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-2xl transition-transform group-hover:scale-110", cat.bg)}>
                    <cat.icon className={cn("h-5 w-5", cat.color)} />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-black tabular-nums", cat.color)}>{cat.count}</p>
                    <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div variants={fadeUp}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="overview" className="data-[state=active]:shadow-md">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="suggestions" className="data-[state=active]:shadow-md">Suggestions IA ({aiSuggestions.length})</TabsTrigger>
              <TabsTrigger value="marketplaces" className="data-[state=active]:shadow-md">Marketplaces</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {productIssues.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />Produits à corriger
                      </CardTitle>
                      <Badge variant="secondary">{productIssues.length} produits</Badge>
                    </div>
                    <CardDescription>Produits avec attributs manquants impactant vos ventes</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {productIssues.slice(0, 10).map((issue, idx) => (
                        <motion.div
                          key={issue.product.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/products?id=${issue.product.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden flex-shrink-0 ring-1 ring-border">
                              {issue.product.image_url ? (
                                <img src={issue.product.image_url} alt={issue.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Tag className="h-4 w-4 text-muted-foreground" /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm line-clamp-1">{issue.product.name}</p>
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {issue.missingAttributes.slice(0, 3).map((attr) => (
                                  <Badge key={attr} variant="outline" className="text-[10px]">{attr}</Badge>
                                ))}
                                {issue.missingAttributes.length > 3 && <Badge variant="outline" className="text-[10px]">+{issue.missingAttributes.length - 3}</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {issue.estimatedImpact && <span className="text-xs text-muted-foreground hidden md:block">{issue.estimatedImpact}</span>}
                            <Badge variant={issue.criticality === 'high' ? 'destructive' : issue.criticality === 'medium' ? 'secondary' : 'outline'}>
                              {issue.criticality === 'high' ? '⚠️ Critique' : issue.criticality === 'medium' ? '⏳ Moyen' : '💡 Mineur'}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {productIssues.length > 10 && (
                      <div className="p-3 border-t">
                        <Button variant="ghost" className="w-full" onClick={() => navigate('/products')}>
                          Voir les {productIssues.length - 10} autres produits
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="mt-4 space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 border-b bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />Suggestions d'enrichissement IA
                  </CardTitle>
                  <CardDescription>Valeurs suggérées automatiquement basées sur l'analyse du nom et du contexte produit</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {aiSuggestions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-16 w-16 mx-auto mb-3 text-emerald-500" />
                      <p className="font-medium">Aucune suggestion disponible</p>
                      <p className="text-sm">Vos produits semblent bien enrichis</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion, idx) => (
                        <SuggestionCard key={`${suggestion.productId}-${suggestion.attribute}-${idx}`} suggestion={suggestion} idx={idx} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="marketplaces" className="mt-4 space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2"><ShoppingBag className="h-5 w-5" />Préparation marketplace</CardTitle>
                  <CardDescription>Vérifiez la conformité de votre catalogue par canal de vente</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="space-y-3 p-4">
                      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead>Marketplace</TableHead>
                          <TableHead>Attributs requis</TableHead>
                          <TableHead className="text-center">Prêt</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marketplaceAnalysis.map((mp: MarketplaceRequirement) => (
                          <TableRow key={mp.marketplace} className="hover:bg-accent/50">
                            <TableCell className="font-semibold">{mp.marketplace}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {mp.requiredAttributes.slice(0, 4).map((attr) => (
                                  <Badge key={attr} variant="outline" className="text-xs capitalize">{attr}</Badge>
                                ))}
                                {mp.requiredAttributes.length > 4 && <Badge variant="outline" className="text-xs">+{mp.requiredAttributes.length - 4}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Progress value={mp.readinessScore} className="w-16 h-2" />
                                <span className={cn("text-sm font-bold tabular-nums", mp.readinessScore >= 80 ? "text-emerald-500" : mp.readinessScore >= 50 ? "text-amber-500" : "text-red-500")}>
                                  {mp.readinessScore}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant={mp.readinessScore >= 80 ? "outline" : "default"} onClick={() => navigate('/products')} className="gap-1.5">
                                {mp.readinessScore >= 80 ? <><CheckCircle className="h-3 w-3" />Prêt</> : <><Sparkles className="h-3 w-3" />Enrichir</>}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </ChannablePageWrapper>
  )
}

function SuggestionCard({ suggestion, idx = 0 }: { suggestion: AttributeSuggestion; idx?: number }) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending')
  if (status === 'rejected') return null

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.03 }}
      className={cn(
        "flex items-center justify-between p-3 rounded-xl border transition-all",
        status === 'accepted' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-card hover:bg-accent/50"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("p-2 rounded-xl", status === 'accepted' ? "bg-emerald-500/20" : "bg-purple-500/10")}>
          {status === 'accepted' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Sparkles className="h-4 w-4 text-purple-500" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{suggestion.productName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs">{suggestion.attribute}</Badge>
            <span className="text-xs text-muted-foreground">→</span>
            <span className="text-xs font-semibold text-purple-600">{suggestion.suggestedValue}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs tabular-nums">{Math.round(suggestion.confidence * 100)}%</Badge>
        {status === 'pending' && (
          <>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-emerald-500/10" onClick={() => setStatus('accepted')}>
              <Check className="h-4 w-4 text-emerald-500" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-500/10" onClick={() => setStatus('rejected')}>
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
        {status === 'accepted' && <Badge className="bg-emerald-500 shadow-sm">Appliqué</Badge>}
      </div>
    </motion.div>
  )
}
