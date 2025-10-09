import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Package, TrendingDown, TrendingUp, Bell, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export default function InventoryManagement() {
  const [lowStockThreshold, setLowStockThreshold] = useState(10)

  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  const lowStockProducts = products?.filter(p => (p.stock_quantity || 0) < lowStockThreshold) || []
  const outOfStockProducts = products?.filter(p => (p.stock_quantity || 0) === 0) || []
  const totalValue = products?.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0) || 0
  
  const getProductImage = (product: any) => {
    if (product.image_urls && product.image_urls.length > 0) return product.image_urls[0]
    return product.images?.[0] || ''
  }

  const handleBulkUpdate = async () => {
    toast.info('Mise à jour en masse à implémenter avec votre fournisseur')
  }

  const exportInventory = () => {
    const csv = [
    ['SKU', 'Nom', 'Stock', 'Prix Coût', 'Valeur'],
      ...(products || []).map(p => [
        p.sku || '',
        p.name || '',
        p.stock_quantity || 0,
        p.cost_price || 0,
        (p.cost_price || 0) * (p.stock_quantity || 0)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString()}.csv`
    a.click()
    toast.success('Export réussi')
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion d'Inventaire</h1>
          <p className="text-muted-foreground">Suivez et optimisez votre stock en temps réel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportInventory}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleBulkUpdate}>
            Synchroniser Stock
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Totaux</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {products?.filter(p => p.published_at).length || 0} publiés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Seuil: {lowStockThreshold} unités
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rupture de Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Nécessite réapprovisionnement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">
              Valeur d'inventaire
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres d'Alerte</CardTitle>
          <CardDescription>Configurez vos alertes de stock automatiques</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Seuil Stock Bas</label>
              <Input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <Button className="mt-6">
              <Bell className="w-4 h-4 mr-2" />
              Activer Alertes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="low-stock" className="w-full">
        <TabsList>
          <TabsTrigger value="low-stock">Stock Bas ({lowStockProducts.length})</TabsTrigger>
          <TabsTrigger value="out-stock">Rupture ({outOfStockProducts.length})</TabsTrigger>
          <TabsTrigger value="all">Tous les Produits</TabsTrigger>
        </TabsList>

        <TabsContent value="low-stock" className="space-y-4">
          {lowStockProducts.map(product => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getProductImage(product) && (
                      <img src={getProductImage(product)} alt={product.name || ''} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div>
                      <h3 className="font-semibold">{product.name || ''}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant="destructive">Stock: {product.stock_quantity || 0}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Prix: {product.cost_price || 0} €
                      </p>
                    </div>
                    <Button size="sm">Réapprovisionner</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {lowStockProducts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun produit en stock bas
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="out-stock" className="space-y-4">
          {outOfStockProducts.map(product => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getProductImage(product) && (
                      <img src={getProductImage(product)} alt={product.name || ''} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div>
                      <h3 className="font-semibold">{product.name || ''}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="destructive">Rupture</Badge>
                    <Button size="sm">Commander</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {outOfStockProducts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun produit en rupture
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {products?.map(product => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getProductImage(product) && (
                      <img src={getProductImage(product)} alt={product.name || ''} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div>
                      <h3 className="font-semibold">{product.name || ''}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant={(product.stock_quantity || 0) === 0 ? 'destructive' : (product.stock_quantity || 0) < lowStockThreshold ? 'secondary' : 'default'}>
                        Stock: {product.stock_quantity || 0}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Valeur: {((product.cost_price || 0) * (product.stock_quantity || 0)).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
