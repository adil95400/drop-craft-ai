import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProductsOverview } from '@/components/products/ProductsOverview'
import { ProductsUpgradeBanner } from '@/components/products/ProductsUpgradeBanner'
import { ProductsListSimple } from '@/components/products/ProductsListSimple'
import { ProductCategories } from '@/components/products/ProductCategories'
import ProductAnalytics from '@/components/products/ProductAnalytics'
import { ProductBulkOperations } from '@/components/products/ProductBulkOperations'
import { ProductSettings } from '@/components/products/ProductSettings'
import { ProductTemplates } from '@/components/products/ProductTemplates'
import { ProductInventory } from '@/components/products/ProductInventory'
import { ProductActionsBar } from '@/components/products/ProductActionsBar'
import { ProductSEO } from '@/components/products/ProductSEO'
import { ProductDetails } from '@/components/products/ProductDetails'
import { CreateProductDialog } from '@/components/modals/CreateProductDialog'
import { useProducts } from '@/hooks/useProducts'
import { useNavigate } from 'react-router-dom'
import { 
  Package, BarChart3, Grid3X3, Settings, 
  Tag, Warehouse, Search, FileText, Plus, TrendingUp, AlertCircle, DollarSign 
} from 'lucide-react'

export default function ModernProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const { stats, isLoading } = useProducts()
  const navigate = useNavigate()

  if (selectedProductId) {
    return (
      <ProductDetails 
        productId={selectedProductId} 
        onClose={() => setSelectedProductId(null)} 
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <ProductsUpgradeBanner />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Header with gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 border border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Gestion des Produits
                </h1>
                <p className="text-muted-foreground text-lg">
                  Gérez votre catalogue avec des outils professionnels intelligents
                </p>
              </div>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouveau produit
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards with animations */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total produits</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-success/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Produits actifs</p>
                    <p className="text-3xl font-bold text-success">{stats.active}</p>
                  </div>
                  <div className="p-3 bg-success/10 rounded-xl group-hover:bg-success/20 transition-colors">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-warning/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Stock faible</p>
                    <p className="text-3xl font-bold text-warning">{stats.lowStock}</p>
                  </div>
                  <div className="p-3 bg-warning/10 rounded-xl group-hover:bg-warning/20 transition-colors">
                    <AlertCircle className="h-6 w-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-info/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valeur totale</p>
                    <p className="text-3xl font-bold text-info">{Math.round(stats.totalValue)}€</p>
                  </div>
                  <div className="p-3 bg-info/10 rounded-xl group-hover:bg-info/20 transition-colors">
                    <DollarSign className="h-6 w-6 text-info" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Actions Bar */}
        <ProductActionsBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCount={selectedProducts.length}
          totalCount={stats.total}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateNew={() => setCreateDialogOpen(true)}
          onImport={() => navigate('/import/advanced')}
          onExport={async () => {
            try {
              const { importExportService } = await import('@/services/importExportService')
              const userId = localStorage.getItem('userId') || ''
              await importExportService.exportAllProducts(userId)
            } catch (error) {
              console.error('Export error:', error)
            }
          }}
        />

        {/* Bulk Operations */}
        {selectedProducts.length > 0 && (
          <ProductBulkOperations 
            selectedProducts={selectedProducts}
            onClearSelection={() => setSelectedProducts([])}
          />
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-card/50 backdrop-blur-sm p-1 rounded-xl border border-border">
            <TabsTrigger 
              value="products" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Package className="h-4 w-4" />
              Produits
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Tag className="h-4 w-4" />
              Catégories
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Warehouse className="h-4 w-4" />
              Stock
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="seo" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Search className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <FileText className="h-4 w-4" />
              Modèles
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Grid3X3 className="h-4 w-4" />
              Actions
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductsListSimple 
              selectedProducts={selectedProducts}
              onSelectionChange={setSelectedProducts}
              onProductSelect={setSelectedProductId}
              searchTerm={searchTerm}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductCategories />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductInventory />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductAnalytics productId="" />
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductSEO />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductTemplates />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductBulkOperations 
              selectedProducts={selectedProducts}
              onClearSelection={() => setSelectedProducts([])}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductSettings />
          </TabsContent>
        </Tabs>
      </div>

      <CreateProductDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  )
}