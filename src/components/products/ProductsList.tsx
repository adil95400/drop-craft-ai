import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  AlertTriangle,
  TrendingUp,
  MoreHorizontal,
  Plus,
  Upload,
  Star
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useProductsUnified } from '@/hooks/unified'
import { ProductCreateDialog } from './ProductCreateDialog'
import { ProductEditDialog } from './ProductEditDialog'
import { ProductImportDialog } from './ProductImportDialog'
import { ProductExportDialog } from './ProductExportDialog'
import { ProductBulkOperations } from './ProductBulkOperations'
import { useToast } from '@/hooks/use-toast'

export function ProductsList() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const { products, stats, isLoading, update: updateProduct, delete: deleteProduct } = useProductsUnified()

  const filteredProducts = products.filter(product => {
    const matchesSearch = !search || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(search.toLowerCase()))
    
    const matchesStatus = !statusFilter || statusFilter === 'all' || 
      (statusFilter === 'active' && product.status === 'active') ||
      (statusFilter === 'inactive' && product.status !== 'active') ||
      (statusFilter === 'low_stock' && (product.stock_quantity || 0) < 10)
    
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || 
      product.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setShowEditDialog(true)
  }

  const handleDelete = (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteProduct(productId)
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
      })
    }
  }

  const handleView = (productId: string) => {
    const product = products?.find((p: any) => p.id === productId)
    navigate('/import/preview', {
      state: {
        product: product ? {
          title: product.name || product.title,
          description: product.description || '',
          price: product.price || 0,
          images: product.image_urls || (product.image_url ? [product.image_url] : []),
          category: product.category || '',
          sku: product.sku || '',
        } : undefined,
        returnTo: window.location.pathname,
      }
    })
  }

  const formatPrice = (price: number) => `${price.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  })}`

  const getStatusBadge = (product: any) => {
    const stock = product.stock_quantity || 0
    
    if (stock === 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Rupture
      </Badge>
    }
    
    if (stock < 10) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Stock faible
      </Badge>
    }
    
    return product.status === 'active' ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">En stock</Badge>
    ) : (
      <Badge variant="secondary">Inactif</Badge>
    )
  }

  const getMarginBadge = (price: number, costPrice: number) => {
    if (!costPrice || costPrice === 0) return null
    
    const margin = ((price - costPrice) / costPrice) * 100
    
    if (margin < 10) {
      return <Badge variant="destructive">{margin.toFixed(1)}%</Badge>
    } else if (margin < 30) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{margin.toFixed(1)}%</Badge>
    } else {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">{margin.toFixed(1)}%</Badge>
    }
  }

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tous les Produits ({filteredProducts.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau produit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Actifs</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">{stats.lowStock}</div>
              <div className="text-sm text-muted-foreground">Stock faible</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(stats.totalValue)}
              </div>
              <div className="text-sm text-muted-foreground">Valeur stock</div>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom ou SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="low_stock">Stock faible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category!}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Indicateur de filtres actifs */}
            {(search || (statusFilter && statusFilter !== 'all') || (categoryFilter && categoryFilter !== 'all')) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('')
                  setCategoryFilter('')
                }}
                className="text-destructive hover:text-destructive"
              >
                Réinitialiser filtres
              </Button>
            )}
          </div>

          {/* Actions en lot */}
          {selectedProducts.length > 0 && (
            <ProductBulkOperations 
              selectedProducts={selectedProducts}
              onClearSelection={() => setSelectedProducts([])}
            />
          )}

          {/* Tableau des produits */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Marge</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleSelectProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium hover:text-primary cursor-pointer" 
                               onClick={() => handleView(product.id)}>
                            {product.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {product.supplier || (product.tags && product.tags[0])}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.sku || '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.cost_price ? formatPrice(product.cost_price) : '-'}
                    </TableCell>
                    <TableCell>
                      {product.cost_price && getMarginBadge(product.price, product.cost_price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={`${(product.stock_quantity || 0) < 10 ? 'text-orange-600 font-medium' : ''}`}>
                          {product.stock_quantity || 0}
                        </span>
                        {(product.stock_quantity || 0) < 10 && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(product)}
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="outline">{product.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(product.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter || categoryFilter 
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Commencez par ajouter votre premier produit"
                }
              </p>
              {!search && !statusFilter && !categoryFilter && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un produit
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProductCreateDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onProductCreated={() => setShowCreateDialog(false)}
      />

      <ProductEditDialog 
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        product={editingProduct}
        onProductUpdated={() => {
          setShowEditDialog(false)
          setEditingProduct(null)
        }}
      />

      <ProductImportDialog 
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />

      <ProductExportDialog 
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </>
  )
}