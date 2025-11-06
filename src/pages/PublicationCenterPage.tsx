import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductPublisher } from '@/components/publication/ProductPublisher'
import { BulkPublisher } from '@/components/publication/BulkPublisher'
import { useMarketplaceConnections } from '@/hooks/useMarketplaceConnections'
import { Search, Upload, Package, Store } from 'lucide-react'

export default function PublicationCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const { connections } = useMarketplaceConnections()

  // Mock products - à remplacer par vraies données
  const mockProducts = [
    { id: '1', title: 'Produit 1', sku: 'SKU001' },
    { id: '2', title: 'Produit 2', sku: 'SKU002' },
    { id: '3', title: 'Produit 3', sku: 'SKU003' },
  ]

  const availableMarketplaces = connections.map(conn => ({
    id: conn.id,
    platform: conn.platform,
    name: conn.platform.charAt(0).toUpperCase() + conn.platform.slice(1),
    isConnected: conn.status === 'connected',
  }))

  return (
    <>
      <Helmet>
        <title>Centre de Publication - DropCraft AI</title>
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
          <Button>
            <Store className="mr-2 h-4 w-4" />
            Connecter une marketplace
          </Button>
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

                <div className="space-y-2">
                  {mockProducts
                    .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(product => (
                      <div 
                        key={product.id}
                        className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => {/* Sélectionner produit */}}
                      >
                        <h3 className="font-semibold">{product.title}</h3>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                    ))}
                </div>
              </div>
            </Card>

            <ProductPublisher
              productId="1"
              productTitle="Produit sélectionné"
              availableMarketplaces={availableMarketplaces}
            />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Sélection de produits</h3>
                  </div>
                  <Button variant="outline" size="sm">
                    Tout sélectionner
                  </Button>
                </div>

                <div className="space-y-2">
                  {mockProducts.map(product => (
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
                        <h3 className="font-semibold">{product.title}</h3>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </Card>

            {selectedProducts.length > 0 && (
              <BulkPublisher
                productIds={selectedProducts}
                availableMarketplaces={availableMarketplaces}
                onComplete={() => setSelectedProducts([])}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
