import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePlan } from '@/hooks/usePlan'
import { useRealProducts } from '@/hooks/useRealProducts'
import { CatalogUltraProInterface } from '@/components/catalog/CatalogUltraProInterface'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlanGatedButton } from '@/components/plan/PlanGatedButton'
import { PlanGuard } from '@/components/plan/PlanGuard'
import { Crown, Zap, BarChart3, Package, Search, Filter, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SEO } from '@/components/SEO'

export default function Catalogue() {
  const { user } = useAuth()
  const { hasPlan, plan } = usePlan(user)
  const [searchTerm, setSearchTerm] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  
  const isUltraPro = hasPlan('ultra_pro')
  const isPro = hasPlan('pro')

  // Hook pour les données réelles
  const { 
    products, 
    stats, 
    isLoading, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    isAdding,
    isUpdating,
    isDeleting
  } = useRealProducts({
    search: searchTerm,
    status: 'active'
  })

  // Fonctions pratiques pour les actions
  const handleEditProduct = (product: any) => {
    console.log('Édition du produit:', product)
    // Ici on pourrait ouvrir une modal d'édition
  }

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId)
  }

  const handleDuplicateProduct = (product: any) => {
    const newProduct = {
      ...product,
      name: `${product.name} (Copie)`,
      sku: `${product.sku}_copy_${Date.now()}`
    }
    delete newProduct.id
    delete newProduct.created_at
    delete newProduct.updated_at
    delete newProduct.user_id
    
    addProduct(newProduct)
  }

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleViewAnalytics = (productId: string) => {
    console.log('Analytics pour le produit:', productId)
    // Navigation vers page analytics du produit
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <SEO
        title="Catalogue Produits | Shopopti+"
        description="Gérez votre catalogue de produits avec Shopopti+. Outils avancés pour l'import, l'analyse et l'optimisation de vos produits e-commerce."
        path="/catalogue"
        keywords="catalogue produits, gestion produits, e-commerce, Shopopti"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      {/* Header unifié */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Catalogue Produits
                {isUltraPro && <Badge variant="secondary">Ultra Pro</Badge>}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isUltraPro 
                  ? "Gestion avancée avec analytics et IA"
                  : "Gérez votre catalogue de produits"
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => console.log('Nouveau produit')}
                disabled={isAdding}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAdding ? 'Ajout...' : 'Nouveau Produit'}
              </Button>
              
              <PlanGatedButton
                requiredPlan="ultra_pro"
                variant="outline"
                to="/catalogue-ultra-pro"
              >
                <Crown className="h-4 w-4 mr-2" />
                Ultra Pro
              </PlanGatedButton>
              
              <PlanGatedButton
                requiredPlan="pro"
                variant="outline"
                showUpgradeModal={true}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics Pro
              </PlanGatedButton>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="analytics" disabled={!isPro}>
              Analytics {!isPro && "🔒"}
            </TabsTrigger>
            <TabsTrigger value="ai-features" disabled={!isUltraPro}>
              IA Avancée {!isUltraPro && "🔒"}
            </TabsTrigger>
            <TabsTrigger value="ultra-pro" disabled={!isUltraPro}>
              Ultra Pro {!isUltraPro && "🔒"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Stats rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total produits</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Actifs</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
                  <div className="text-sm text-muted-foreground">Stock faible</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.totalValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Valeur totale</div>
                </CardContent>
              </Card>
            </div>

            {/* Search and filters */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des produits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <div className="text-sm text-muted-foreground">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Loading state */}
            {isLoading && (
              <div className="text-center py-8">
                <Package className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Chargement des produits...</p>
              </div>
            )}

            {/* Products grid avec données réelles */}
            {!isLoading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    onDuplicate={handleDuplicateProduct}
                    onToggleFavorite={handleToggleFavorite}
                    onViewAnalytics={handleViewAnalytics}
                    isFavorite={favorites.includes(product.id)}
                    variant="default"
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Aucun produit ne correspond à votre recherche.' : 'Commencez par ajouter des produits à votre catalogue.'}
                </p>
                <Button onClick={() => console.log('Ajouter un produit')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un produit
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <PlanGuard requiredPlan="pro">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Analytics Catalogue</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Produits Populaires</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Analytics des ventes et tendances</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Métriques de performance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Suivi des revenus par produit</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </PlanGuard>
          </TabsContent>

          <TabsContent value="ai-features">
            <PlanGuard requiredPlan="ultra_pro">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-purple-600" />
                  <h2 className="text-2xl font-bold">Fonctionnalités IA Avancées</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Optimisation IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Optimisation automatique des titres et descriptions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Prédictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Prédictions de ventes et tendances</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </PlanGuard>
          </TabsContent>

          <TabsContent value="ultra-pro">
            <PlanGuard requiredPlan="ultra_pro">
              <CatalogUltraProInterface />
            </PlanGuard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  )
}