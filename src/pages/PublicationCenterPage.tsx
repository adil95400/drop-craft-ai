import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductPublisher } from '@/domains/marketplace/components/ProductPublisher'
import { BulkPublisher } from '@/domains/marketplace/components/BulkPublisher'
import { ConnectMarketplaceDialog } from '@/components/marketplace/ConnectMarketplaceDialog'
import { useMarketplaceConnections } from '@/hooks/useMarketplaceConnections'
import { useProductsUnified } from '@/hooks/unified'
import { seedSampleProducts } from '@/lib/seedProducts'
import { Search, Upload, Package, Loader2 } from 'lucide-react'

const MARKETPLACE_ICONS: Record<string, string> = {
  amazon: '🛒',
  shopify: '🛍️',
  woocommerce: '🌐',
  prestashop: '🏪',
  etsy: '🎨',
  cdiscount: '🛒',
  rakuten: '🔴',
  fnac: '📚',
  ebay: '🔨',
}

export default function PublicationCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedProductForPublish, setSelectedProductForPublish] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const { connections } = useMarketplaceConnections()
  const { products, isLoading } = useProductsUnified({ filters: { search: searchQuery, status: 'active' } })

  useEffect(() => {
    // Seed products if none exist
    if (!isLoading && products.length === 0 && !seeding) {
      setSeeding(true)
      seedSampleProducts().finally(() => setSeeding(false))
    }
  }, [isLoading, products.length, seeding])

  const availableMarketplaces = connections.map(conn => ({
    id: conn.id,
    name: conn.platform.charAt(0).toUpperCase() + conn.platform.slice(1),
    icon: MARKETPLACE_ICONS[conn.platform] || '🛍️',
    connected: conn.status === 'connected',
  }))

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  return (
    <>
      <Helmet>
        <title>Centre de Publication - ShopOpti</title>
        <meta 
          name="description" 
          content="Publiez vos produits sur plusieurs marketplaces simultanément"
        />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Upload className="h-8 w-8 text-primary" />
              Centre de Publication
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez et publiez vos produits sur toutes vos marketplaces
            </p>
          </div>
          <ConnectMarketplaceDialog />
        </div>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="single">Publication individuelle</TabsTrigger>
            <TabsTrigger value="bulk">Publication groupée</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun produit trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map(product => (
                      <div 
                        key={product.id}
                        className={`p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                          selectedProductForPublish === product.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedProductForPublish(product.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {product.sku && `SKU: ${product.sku} • `}
                              Prix: {product.price}€ • Stock: {product.stock_quantity}
                            </p>
                          </div>
                          {selectedProductForPublish === product.id && (
                            <span className="text-primary font-medium">Sélectionné</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {selectedProductForPublish && (
              <ProductPublisher
                productId={selectedProductForPublish}
                productName={products.find(p => p.id === selectedProductForPublish)?.name || ''}
                currentPrice={products.find(p => p.id === selectedProductForPublish)?.price || 0}
                availableMarketplaces={availableMarketplaces}
                onPublishComplete={() => setSelectedProductForPublish(null)}
              />
            )}
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Sélection de produits</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedProducts.length === products.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun produit disponible</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map(product => (
                      <label 
                        key={product.id}
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product.id])
                            } else {
                              setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.sku && `SKU: ${product.sku} • `}
                            Prix: {product.price}€ • Stock: {product.stock_quantity}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {selectedProducts.length > 0 && (
              <BulkPublisher
                selectedProducts={products
                  .filter(p => selectedProducts.includes(p.id))
                  .map(p => ({ id: p.id, name: p.name, price: p.price }))}
                availableMarketplaces={availableMarketplaces}
                onPublishComplete={() => setSelectedProducts([])}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
