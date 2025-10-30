import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Package, Eye, Edit, Search } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductActionMenu } from './ProductActionMenu'
import { useRealProducts } from '@/hooks/useRealProducts'

interface ProductsListSimpleProps {
  selectedProducts: string[]
  onSelectionChange: (products: string[]) => void
  onProductSelect?: (productId: string) => void
  searchTerm?: string
}

export function ProductsListSimple({ selectedProducts, onSelectionChange, onProductSelect, searchTerm: externalSearchTerm }: ProductsListSimpleProps) {
  const { products, isLoading } = useRealProducts()
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  
  const searchTerm = externalSearchTerm ?? localSearchTerm

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'secondary'
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'destructive', label: 'Rupture' }
    if (stock < 10) return { color: 'warning', label: 'Faible' }
    return { color: 'success', label: 'En stock' }
  }

  if (isLoading) {
    return <div className="p-6 text-center">Chargement...</div>
  }

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardContent className="p-6">
        {!externalSearchTerm && (
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher des produits..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10 w-80 border-primary/20 focus:border-primary"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredProducts.length} produit(s)
            </div>
          </div>
        )}

        <div className="rounded-lg border border-primary/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/70">
                <TableHead className="w-12">
                <Checkbox 
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectionChange(filteredProducts.map(p => p.id))
                    } else {
                      onSelectionChange([])
                    }
                  }}
                />
              </TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock_quantity || 0)
              return (
                <TableRow 
                  key={product.id}
                  className="hover:bg-primary/5 transition-colors duration-200"
                >
                  <TableCell>
                    <Checkbox 
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectionChange([...selectedProducts, product.id])
                        } else {
                          onSelectionChange(selectedProducts.filter(id => id !== product.id))
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-12 h-12 rounded-lg object-cover shadow-md ring-2 ring-primary/10" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center shadow-md ring-2 ring-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono">
                      {product.sku || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-foreground">{product.price}€</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stockStatus.color as any}>
                      {product.stock_quantity || 0} - {stockStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(product.status) as any}>
                      {product.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onProductSelect?.(product.id)}
                        className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-info/10 hover:text-info transition-all duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <ProductActionMenu product={product} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  )
}