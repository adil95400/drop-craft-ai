import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  TrendingUp,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react'
import { ProductImportDialog } from '@/components/stores/ProductImportDialog'
import { ProductExportDialog } from '@/components/stores/ProductExportDialog'
import { useParams } from 'react-router-dom'
import { useStores } from '@/hooks/useStores'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  status: 'active' | 'draft' | 'archived'
  image?: string
  category: string
  sales: number
  lastUpdated: string
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'T-shirt Coton Bio',
    sku: 'TSH001',
    price: 29.99,
    stock: 45,
    status: 'active',
    image: 'https://via.placeholder.com/60x60/10b981/ffffff?text=T',
    category: 'Vêtements',
    sales: 127,
    lastUpdated: '2024-01-10T10:30:00Z'
  },
  {
    id: '2',
    name: 'Chaussures Running Pro',
    sku: 'RUN002',
    price: 89.99,
    stock: 3, // Stock faible
    status: 'active',
    image: 'https://via.placeholder.com/60x60/3b82f6/ffffff?text=R',
    category: 'Chaussures',
    sales: 89,
    lastUpdated: '2024-01-09T15:20:00Z'
  },
  {
    id: '3',
    name: 'Sac à dos Urbain',
    sku: 'BAG003',
    price: 49.99,
    stock: 0, // Rupture de stock
    status: 'active',
    image: 'https://via.placeholder.com/60x60/f97316/ffffff?text=B',
    category: 'Accessoires',
    sales: 234,
    lastUpdated: '2024-01-08T09:15:00Z'
  }
]

const statusColors = {
  active: 'bg-success text-success-foreground',
  draft: 'bg-warning text-warning-foreground',
  archived: 'bg-muted text-muted-foreground'
}

const statusLabels = {
  active: 'Actif',
  draft: 'Brouillon',
  archived: 'Archivé'
}

export function StoreProducts() {
  const { storeId } = useParams()
  const { stores } = useStores()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const store = stores.find(s => s.id === storeId)

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Rupture', color: 'text-destructive' }
    if (stock <= 5) return { label: 'Stock faible', color: 'text-warning' }
    return { label: 'En stock', color: 'text-success' }
  }

  const categories = ['all', ...Array.from(new Set(mockProducts.map(p => p.category)))]

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total produits</p>
                <p className="text-2xl font-bold">{mockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Produits actifs</p>
                <p className="text-2xl font-bold text-success">
                  {mockProducts.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Stock faible</p>
                <p className="text-2xl font-bold text-warning">
                  {mockProducts.filter(p => p.stock <= 5).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Rupture stock</p>
                <p className="text-2xl font-bold text-destructive">
                  {mockProducts.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produits</CardTitle>
            <div className="flex items-center space-x-2">
              {store && (
                <>
                  <ProductImportDialog 
                    storeId={store.id}
                    storeName={store.name}
                    platform={store.platform}
                  />
                  <ProductExportDialog 
                    storeId={store.id}
                    storeName={store.name}
                    platform={store.platform}
                  />
                </>
              )}
              <Button>Ajouter un produit</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Catégorie
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {categories.map(category => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'all' ? 'Toutes les catégories' : category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Ventes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock)
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{product.sku}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={stockStatus.color}>
                            {product.stock}
                          </span>
                          {product.stock <= 5 && (
                            <Badge variant="outline" className={stockStatus.color}>
                              {stockStatus.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[product.status]}>
                          {statusLabels[product.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.sales} ventes</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}