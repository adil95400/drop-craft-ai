import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductsOverview } from '@/components/products/ProductsOverview'
import { ProductsList } from '@/components/products/ProductsList'
import { ProductCategories } from '@/components/products/ProductCategories'
import ProductAnalytics from '@/components/products/ProductAnalytics'
import { ProductBulkOperations } from '@/components/products/ProductBulkOperations'
import { ProductSettings } from '@/components/products/ProductSettings'
import { ProductTemplates } from '@/components/products/ProductTemplates'
import { ProductInventory } from '@/components/products/ProductInventory'
import { ProductSEO } from '@/components/products/ProductSEO'
import { 
  Package, BarChart3, Grid3X3, Settings, 
  Tag, Warehouse, Search, FileText 
} from 'lucide-react'

export default function ModernProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Produits</h1>
            <p className="text-muted-foreground mt-1">
              Gérez votre catalogue produits avec des outils professionnels
            </p>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <ProductsOverview />

        {/* Bulk Operations */}
        {selectedProducts.length > 0 && (
          <ProductBulkOperations 
            selectedProducts={selectedProducts}
            onClearSelection={() => setSelectedProducts([])}
          />
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produits
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Catégories
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Stock
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Modèles
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Actions groupées
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <ProductsList 
              selectedProducts={selectedProducts}
              onSelectionChange={setSelectedProducts}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <ProductCategories />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <ProductInventory />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ProductAnalytics productId="" />
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <ProductSEO />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <ProductTemplates />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <ProductBulkOperations 
              selectedProducts={selectedProducts}
              onClearSelection={() => setSelectedProducts([])}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ProductSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}