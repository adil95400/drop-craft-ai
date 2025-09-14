import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRealProducts } from '@/hooks/useRealProducts'
import { 
  Warehouse, AlertTriangle, Package, TrendingUp, 
  Search, RefreshCw, Edit, History, Plus, Minus
} from 'lucide-react'

export function ProductInventory() {
  const { products, isLoading, updateProduct } = useRealProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const stock = product.stock_quantity || 0
    
    let matchesFilter = true
    if (stockFilter === 'low') {
      matchesFilter = stock > 0 && stock < 10
    } else if (stockFilter === 'out') {
      matchesFilter = stock === 0
    }
    
    return matchesSearch && matchesFilter
  })

  const stockStats = {
    total: products.length,
    lowStock: products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 10).length,
    outOfStock: products.filter(p => (p.stock_quantity || 0) === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0)
  }

  const updateStock = (productId: string, newStock: number) => {
    updateProduct({ 
      id: productId, 
      updates: { stock_quantity: Math.max(0, newStock) }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Warehouse className="h-6 w-6" />
            Gestion des Stocks
          </h2>
          <p className="text-muted-foreground">
            Surveillez et gérez vos niveaux de stock en temps réel
          </p>
        </div>
        <Button>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stock Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stockStats.total}</div>
            <div className="text-sm text-muted-foreground">Produits totaux</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stockStats.lowStock}</div>
            <div className="text-sm text-muted-foreground">Stock faible</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stockStats.outOfStock}</div>
            <div className="text-sm text-muted-foreground">Rupture stock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stockStats.totalValue.toLocaleString()}€</div>
            <div className="text-sm text-muted-foreground">Valeur stock</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des produits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={stockFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStockFilter('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button
                variant={stockFilter === 'low' ? 'default' : 'outline'}
                onClick={() => setStockFilter('low')}
                size="sm"
              >
                Stock faible
              </Button>
              <Button
                variant={stockFilter === 'out' ? 'default' : 'outline'}
                onClick={() => setStockFilter('out')}
                size="sm"
              >
                Rupture
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire ({filteredProducts.length} produits)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock actuel</TableHead>
                <TableHead>Stock minimum</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Valeur stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stock = product.stock_quantity || 0
                const stockValue = stock * product.price
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.category}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.sku || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStock(product.id, stock - 1)}
                          disabled={stock <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium min-w-[40px] text-center">
                          {stock}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStock(product.id, stock + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>10</TableCell>
                    <TableCell>
                      {stock === 0 ? (
                        <Badge variant="destructive">Rupture</Badge>
                      ) : stock < 10 ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Stock faible
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          En stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {stockValue.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground">
                Ajustez vos filtres ou créez de nouveaux produits.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}