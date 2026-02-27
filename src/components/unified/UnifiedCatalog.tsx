/**
 * Catalogue unifié qui remplace les versions Standard/Ultra-Pro dupliquées
 * Utilise le rendu conditionnel selon le plan utilisateur
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  TrendingUp,
  Zap,
  Brain,
  Package,
  BarChart3,
  Settings
} from 'lucide-react'

import { useAuthWithPlan } from '@/components/unified/UnifiedProvider'
import { usePlanConditionalRender, ConditionalFeature } from '@/components/unified/UnifiedComponent'
import { ProFeature, UltraProFeature } from '@/components/unified/UnifiedFeatureGate'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'
export type Product = UnifiedProduct

// Import des composants existants
import { AdvancedProductCatalog } from '@/components/catalog/AdvancedProductCatalog'
import { ProductCard } from '@/components/catalog/ProductCard'

export function UnifiedCatalog() {
  const { effectivePlan, hasFeature, isPro, isUltraPro, loading: planLoading } = useAuthWithPlan()
  const { renderByPlan, renderIf } = usePlanConditionalRender()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('products')

  // Hook pour les données réelles
  const { 
    products, 
    isLoading: productsLoading, 
    error, 
    stats 
  } = useProductsUnified()

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    // La recherche sera implémentée avec les filtres du hook
  }

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const safePrev = prev || []
      return safePrev.includes(productId) 
        ? safePrev.filter(id => id !== productId)
        : [...safePrev, productId]
    })
  }

  const handleViewAnalytics = (productId: string) => {
    console.log('View analytics for product:', productId)
    // Redirection vers analytics du produit
  }

  const handleDuplicateProduct = (product: Product) => {
    console.log('Duplicate product:', product.id)
    // Logique de duplication
  }

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (planLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const planBadge = renderByPlan({
    standard: <Badge variant="outline">Standard</Badge>,
    pro: <Badge variant="default" className="bg-info"><Zap className="w-3 h-3 mr-1" />Pro</Badge>,
    ultra_pro: <Badge variant="default" className="bg-gradient-to-r from-primary to-accent">
      <Brain className="w-3 h-3 mr-1" />Ultra Pro
    </Badge>
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header unifié */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {renderByPlan({
                standard: 'Catalogue Produits',
                pro: 'Catalogue Pro',
                ultra_pro: 'Catalogue Intelligence'
              })}
            </h1>
            {planBadge}
          </div>
          <p className="text-muted-foreground">
            {renderByPlan({
              standard: "Gérez votre catalogue de produits",
              pro: "Catalogue avec analytics avancés et IA",
              ultra_pro: "Catalogue intelligent avec automation complète"
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
          
          <ProFeature>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtres avancés
            </Button>
          </ProFeature>
          
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Barre de recherche unifiée */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={
              effectivePlan === 'ultra_pro' ? "Recherche sémantique avancée..." :
              effectivePlan === 'pro' ? "Recherche intelligente avec IA..." :
              "Rechercher des produits..."
            }
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <UltraProFeature>
          <Button className="gap-2">
            <Brain className="w-4 h-4" />
            Recherche IA
          </Button>
        </UltraProFeature>
      </div>

      {/* Stats rapides - Pro+ */}
      <ConditionalFeature feature="advanced-analytics">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                +12% ce mois
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favoris</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favorites.length}</div>
              <p className="text-xs text-muted-foreground">
                Produits sélectionnés
              </p>
            </CardContent>
          </Card>
          
          <ProFeature>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">
                  Produits gagnants IA
                </p>
              </CardContent>
            </Card>
          </ProFeature>
          
          <UltraProFeature>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auto-Optimisés</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">
                  Par l'IA ce mois
                </p>
              </CardContent>
            </Card>
          </UltraProFeature>
        </div>
      </ConditionalFeature>

      {/* Tabs avec accès conditionnel */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produits
          </TabsTrigger>
          
          <ConditionalFeature feature="advanced-filters">
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Avancé
            </TabsTrigger>
          </ConditionalFeature>
          
          <ConditionalFeature feature="advanced-analytics">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </ConditionalFeature>
          
          <ConditionalFeature feature="ai-analysis">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              IA Insights
            </TabsTrigger>
          </ConditionalFeature>
          
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Favoris
          </TabsTrigger>
          
          <ConditionalFeature feature="predictive-analytics">
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tendances
            </TabsTrigger>
          </ConditionalFeature>
        </TabsList>

        {/* Contenu principal des produits */}
        <TabsContent value="products" className="space-y-4">
          {renderByPlan({
            standard: (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onDuplicate={handleDuplicateProduct}
                    onToggleFavorite={handleToggleFavorite}
                    onViewAnalytics={handleViewAnalytics}
                    isFavorite={favorites.includes(product.id || '')}
                    variant="compact"
                  />
                ))}
              </div>
            ),
            pro: (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onDuplicate={handleDuplicateProduct}
                    onToggleFavorite={handleToggleFavorite}
                    onViewAnalytics={handleViewAnalytics}
                    isFavorite={favorites.includes(product.id || '')}
                    variant="default"
                  />
                ))}
              </div>
            ),
            ultra_pro: <AdvancedProductCatalog />
          })}
        </TabsContent>

        {/* Interface avancée - Pro+ */}
        <TabsContent value="advanced">
          <ProFeature>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Filtres Avancés</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtres avancés ici */}
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Catégories</h4>
                  <div className="space-y-2">
                    {/* Options de filtre */}
                  </div>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Prix</h4>
                  <div className="space-y-2">
                    {/* Range de prix */}
                  </div>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Performance</h4>
                  <div className="space-y-2">
                    {/* Filtres de performance */}
                  </div>
                </Card>
              </div>
            </div>
          </ProFeature>
        </TabsContent>

        {/* Analytics - Pro+ */}
        <TabsContent value="analytics">
          <ProFeature>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analytics Catalogue</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="font-medium mb-4">Performance des Produits</h4>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Graphique des performances
                  </div>
                </Card>
                <Card className="p-6">
                  <h4 className="font-medium mb-4">Tendances de Vente</h4>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Graphique des tendances
                  </div>
                </Card>
              </div>
            </div>
          </ProFeature>
        </TabsContent>

        {/* IA Insights - Pro+ */}
        <TabsContent value="ai">
          <ProFeature>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Insights IA du Catalogue
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-5 h-5 text-success" />
                    <h4 className="font-medium">Opportunités Détectées</h4>
                    <Badge variant="outline">3 nouvelles</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded">
                      <p className="text-sm font-medium">Produit sous-exploité</p>
                      <p className="text-xs text-muted-foreground">
                        "Montre Sport" a un potentiel de +150% avec meilleure description
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </ProFeature>
        </TabsContent>

        {/* Favoris */}
        <TabsContent value="favorites">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Produits Favoris</h3>
            {favorites.length === 0 ? (
              <Card className="p-12 text-center">
                <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Aucun favori</h4>
                <p className="text-muted-foreground">
                  Ajoutez des produits à vos favoris pour les retrouver facilement
                </p>
              </Card>
            ) : (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredProducts
                  .filter(product => favorites.includes(product.id || ''))
                  .map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onDuplicate={handleDuplicateProduct}
                      onToggleFavorite={handleToggleFavorite}
                      onViewAnalytics={handleViewAnalytics}
                      isFavorite={true}
                      variant="default"
                    />
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tendances - Ultra Pro */}
        <TabsContent value="trends">
          <UltraProFeature>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tendances Prédictives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="font-medium mb-4">Produits Émergents</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                      <span className="text-sm font-medium">Accessoires Tech</span>
                      <Badge variant="default">+245%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                      <span className="text-sm font-medium">Mode Durable</span>
                      <Badge variant="default">+189%</Badge>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <h4 className="font-medium mb-4">Prédictions 30 jours</h4>
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Graphique prédictif IA
                  </div>
                </Card>
              </div>
            </div>
          </UltraProFeature>
        </TabsContent>
      </Tabs>
    </div>
  )
}