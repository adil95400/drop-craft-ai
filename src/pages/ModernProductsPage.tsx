/**
 * Page Produits moderne - Gestion du catalogue complet
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { ActionButton } from '@/components/common/ActionButton'
import { Helmet } from 'react-helmet-async'
import { useToast } from '@/hooks/use-toast'
import { ProductCreateDialog } from '@/components/products/ProductCreateDialog'
import { ProductEditDialog } from '@/components/products/ProductEditDialog'
import { 
  Package, Search, Filter, MoreHorizontal, 
  Eye, Edit, Trash, Plus, Download, Upload
} from 'lucide-react'

const ModernProductsPage: React.FC = () => {
  const { user, loading, getProducts, deleteProduct } = useUnifiedSystem()
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    if (!user?.id) return
    setLoadingProducts(true)
    try {
      const productsData = await getProducts()
      setProducts(productsData)
    } catch (error) {
      console.error('Erreur chargement produits:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return
    
    try {
      const { error } = await deleteProduct(productId)
      if (error) throw error
      
      toast({
        title: "Succès",
        description: "Produit supprimé avec succès"
      })
      
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive"
      })
    }
  }

  const filteredProducts = products.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Produits - Drop Craft AI | Gestion Catalogue</title>
        <meta name="description" content="Gérez votre catalogue de produits dropshipping. Import, modification, optimisation SEO." />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
            <p className="text-muted-foreground">
              Gérez votre catalogue de {products.length} produits
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/import'}>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <Button className="btn-gradient" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Produit
            </Button>
          </div>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des produits */}
        <Card>
          <CardHeader>
            <CardTitle>Catalogue ({filteredProducts.length})</CardTitle>
            <CardDescription>
              Gestion complète de vos produits importés
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement des produits...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>
                        <div className="font-medium">{product.price}€</div>
                        {product.cost_price && (
                          <div className="text-sm text-muted-foreground">
                            Coût: {product.cost_price}€
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.stock_quantity > 0 ? 'default' : 'secondary'}>
                          {product.stock_quantity || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                          {product.status === 'published' ? 'Publié' : 'Brouillon'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product)
                              setEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Aucun produit ne correspond à votre recherche.' : 'Commencez par importer des produits.'}
                </p>
                <Button onClick={() => window.location.href = '/import'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Importer des produits
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ProductCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onProductCreated={loadProducts}
      />
      
      <ProductEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        product={selectedProduct}
        onProductUpdated={loadProducts}
      />
    </>
  )
}

export default ModernProductsPage