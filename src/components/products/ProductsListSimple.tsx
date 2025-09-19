import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRealProducts } from '@/hooks/useRealProducts'
import { Search, Package, Eye, Edit, MoreHorizontal } from 'lucide-react'

interface ProductsListSimpleProps {
  selectedProducts: string[]
  onSelectionChange: (products: string[]) => void
  onProductSelect?: (productId: string) => void
}

export function ProductsListSimple({ selectedProducts, onSelectionChange, onProductSelect }: ProductsListSimpleProps) {
  const { products, isLoading } = useRealProducts()
  const [searchTerm, setSearchTerm] = useState('')

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
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredProducts.length} produit(s)
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
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
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {product.sku || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>{product.price}€</TableCell>
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
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}