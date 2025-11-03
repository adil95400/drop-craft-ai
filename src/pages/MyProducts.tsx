import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportInterface } from '@/components/import/ImportInterface'
import { ExportInterface } from '@/components/export/ExportInterface'
import {
  Package,
  Search,
  Plus,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  TrendingUp
} from 'lucide-react'
import { PublishStatsCard } from '@/components/products/PublishStatsCard'
import { PublishProductButton } from '@/components/products/PublishProductButton'
import { usePublishProducts } from '@/hooks/usePublishProducts'

export default function MyProducts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedImportedProducts, setSelectedImportedProducts] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('products')
  const { bulkPublish } = usePublishProducts()

  // Fetch user's products
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['my-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  // Fetch imported products
  const { data: importedProducts = [] } = useQuery({
    queryKey: ['my-imported-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    setSelectedProducts(
      selectedProducts.length === filteredProducts.length 
        ? [] 
        : filteredProducts.map(p => p.id)
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, color: 'text-green-600' },
      draft: { variant: 'secondary' as const, color: 'text-yellow-600' },
      inactive: { variant: 'outline' as const, color: 'text-gray-600' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.draft
    
    return (
      <Badge variant={config.variant}>
        {status}
      </Badge>
    )
  }

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    draft: products.filter(p => p.status === 'draft').length,
    imported: importedProducts.length,
    pending: importedProducts.filter(p => p.status === 'pending').length
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Mes Produits
          </h1>
          <p className="text-muted-foreground">
            Gérez votre catalogue de produits et exportez vers vos plateformes de vente
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Brouillons</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              </div>
              <Edit className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Importés</p>
                <p className="text-2xl font-bold text-blue-600">{stats.imported}</p>
              </div>
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Mes Produits</TabsTrigger>
          <TabsTrigger value="imported">
            Produits Importés ({importedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans mes produits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSelectAll}>
                {selectedProducts.length === filteredProducts.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau produit
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Aucun produit ne correspond à votre recherche" 
                    : "Commencez par importer ou créer des produits"
                  }
                </p>
                <Button onClick={() => setActiveTab('import')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer des produits
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className={`group hover:shadow-lg transition-shadow cursor-pointer ${
                    selectedProducts.includes(product.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleProductSelect(product.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </CardTitle>
                        {product.sku && (
                          <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
                        )}
                      </div>
                      {getStatusBadge(product.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Product Image */}
                    {product.image_url && (
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg'
                          }}
                        />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-primary">
                          {product.price}€
                        </span>
                        {product.cost_price && (
                          <span className="text-sm text-muted-foreground">
                            Coût: {product.cost_price}€
                          </span>
                        )}
                      </div>
                      
                      {product.category && (
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      )}

                      {product.supplier && (
                        <p className="text-sm text-muted-foreground">
                          Fournisseur: {product.supplier}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''} sélectionné{selectedProducts.length > 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('export')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Exporter
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="imported" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans les produits importés..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {selectedImportedProducts.length > 0 && (
                  <Button 
                    onClick={() => bulkPublish(selectedImportedProducts)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Publier ({selectedImportedProducts.length})
                  </Button>
                )}
              </div>

              {/* Imported Products Grid */}
              {importedProducts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun produit importé</h3>
                    <p className="text-muted-foreground mb-4">
                      Commencez par importer des produits depuis l'onglet Import
                    </p>
                    <Button onClick={() => setActiveTab('import')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importer des produits
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {importedProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className={`group hover:shadow-lg transition-shadow ${
                        selectedImportedProducts.includes(product.id) ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedImportedProducts.includes(product.id)}
                              onChange={(e) => {
                                e.stopPropagation()
                                setSelectedImportedProducts(prev =>
                                  prev.includes(product.id)
                                    ? prev.filter(id => id !== product.id)
                                    : [...prev, product.id]
                                )
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <CardTitle className="text-base line-clamp-2">
                                {product.name}
                              </CardTitle>
                              {product.sku && (
                                <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(product.status || 'draft')}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Product Image */}
                        {product.image_urls?.[0] && (
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                              src={product.image_urls[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg'
                              }}
                            />
                          </div>
                        )}

                        {/* Product Info */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-primary">
                              {product.price}€
                            </span>
                            {product.cost_price && (
                              <span className="text-sm text-muted-foreground">
                                Coût: {product.cost_price}€
                              </span>
                            )}
                          </div>
                          
                          {product.category && (
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          )}

                          {product.supplier_name && (
                            <p className="text-sm text-muted-foreground">
                              Fournisseur: {product.supplier_name}
                            </p>
                          )}

                          {product.stock_quantity !== null && (
                            <p className="text-sm text-muted-foreground">
                              Stock: {product.stock_quantity}
                            </p>
                          )}
                        </div>

                        {/* Publish Button */}
                        <PublishProductButton
                          productId={product.id}
                          isPublished={!!product.published_product_id}
                          syncStatus={product.sync_status as 'pending' | 'synced' | 'error' | 'outdated' | null}
                          compact={false}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Sidebar */}
            <div className="lg:col-span-1">
              <PublishStatsCard />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="import">
          <ImportInterface onImportComplete={() => {
            refetch()
            setActiveTab('imported')
          }} />
        </TabsContent>

        <TabsContent value="export">
          <ExportInterface 
            selectedProducts={selectedProducts}
            onExportComplete={() => {
              setSelectedProducts([])
              refetch()
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}