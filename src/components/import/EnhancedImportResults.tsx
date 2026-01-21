import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  Share,
  ShoppingCart,
  Facebook,
  Instagram,
  Twitter,
  Zap,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Target,
  TrendingUp,
  Package
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useImportUltraPro, type ImportedProduct } from '@/hooks/useImportUltraPro'
import { PlatformExportDialog } from '@/components/products/export/PlatformExportDialog'

export const EnhancedImportResults = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [editingProduct, setEditingProduct] = useState<ImportedProduct | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showShopifyExport, setShowShopifyExport] = useState(false)

  // Use real data from useImportUltraPro hook
  const { importedProducts } = useImportUltraPro()
  
  const filteredProducts = importedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || (product.category && product.category === categoryFilter)
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }, [selectedProducts.length, filteredProducts])

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }, [])

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Veuillez sélectionner au moins un produit')
      return
    }

    setIsProcessing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulation

      switch (action) {
        case 'publish':
          toast.success(`${selectedProducts.length} produit(s) publié(s) avec succès`)
          break
        case 'delete':
          toast.success(`${selectedProducts.length} produit(s) supprimé(s)`)
          break
        case 'optimize':
          toast.success(`${selectedProducts.length} produit(s) optimisé(s) par IA`)
          break
        case 'export-store':
          setShowShopifyExport(true)
          return // Don't clear selection, let dialog handle it
        case 'export-marketplace':
          toast.success(`${selectedProducts.length} produit(s) envoyé(s) vers les marketplaces`)
          break
        case 'share-facebook':
          toast.success(`${selectedProducts.length} produit(s) partagé(s) sur Facebook`)
          break
        case 'share-instagram':
          toast.success(`${selectedProducts.length} produit(s) partagé(s) sur Instagram`)
          break
        case 'export-csv':
          toast.success(`Export CSV de ${selectedProducts.length} produit(s) généré`)
          break
      }
      setSelectedProducts([])
    } catch (error) {
      toast.error('Erreur lors de l\'action groupée')
    } finally {
      setIsProcessing(false)
    }
  }, [selectedProducts])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Publié</Badge>
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>
      case 'archived':
        return <Badge variant="destructive">Archivé</Badge>
      default:
        return <Badge variant="outline">En attente</Badge>
    }
  }

  const getProfitMarginBadge = (product: ImportedProduct) => {
    if (!product.cost_price || !product.price) return null
    
    const margin = ((product.price - product.cost_price) / product.cost_price * 100)
    
    if (margin >= 40) {
      return <Badge className="bg-green-100 text-green-800">+{margin.toFixed(1)}%</Badge>
    } else if (margin >= 25) {
      return <Badge className="bg-yellow-100 text-yellow-800">+{margin.toFixed(1)}%</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">+{margin.toFixed(1)}%</Badge>
    }
  }

  const stats = {
    total: importedProducts.length,
    published: importedProducts.filter(p => p.status === 'published').length,
    draft: importedProducts.filter(p => p.status === 'draft').length,
    rejected: importedProducts.filter(p => p.review_status === 'rejected').length,
    optimized: importedProducts.filter(p => p.ai_optimized).length
  }

  const categories = [...new Set(importedProducts.map(p => p.category).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
                <p className="text-sm text-muted-foreground">Publié</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
                <p className="text-sm text-muted-foreground">Brouillon</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-sm text-muted-foreground">Rejeté</p>
              </div>
              <Trash2 className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.optimized}</div>
                <p className="text-sm text-muted-foreground">IA Optimisé</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, description ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {selectedProducts.length > 0 ? `${selectedProducts.length} sélectionné(s)` : 'Tout sélectionner'}
              </span>
              
              {selectedProducts.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isProcessing}>
                      {isProcessing ? 'Traitement...' : 'Actions groupées'}
                      <MoreHorizontal className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem onClick={() => handleBulkAction('publish')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Publier les produits
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('optimize')}>
                      <Zap className="w-4 h-4 mr-2" />
                      Optimiser avec IA
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('export-store')}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Exporter vers une boutique
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('export-marketplace')}>
                      <Target className="w-4 h-4 mr-2" />
                      Envoyer vers Marketplace
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('share-facebook')}>
                      <Facebook className="w-4 h-4 mr-2" />
                      Partager sur Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('share-instagram')}>
                      <Instagram className="w-4 h-4 mr-2" />
                      Partager sur Instagram
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('export-csv')}>
                      <Download className="w-4 h-4 mr-2" />
                      Exporter en CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => handleSelectProduct(product.id)}
                  className="mt-1"
                />
                
                {product.image_urls?.[0] && (
                  <img 
                    src={product.image_urls[0]} 
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg leading-tight mb-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {product.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="font-semibold text-lg">
                      {product.currency} {product.price.toFixed(2)}
                    </div>
                    {product.cost_price && (
                      <div className="text-sm text-muted-foreground">
                        Coût: {product.currency} {product.cost_price.toFixed(2)}
                      </div>
                    )}
                    {getProfitMarginBadge(product)}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    {getStatusBadge(product.status)}
                    {product.ai_optimized && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                        <Zap className="w-3 h-3 mr-1" />
                        IA Optimisé
                      </Badge>
                    )}
                    {product.sku && (
                      <Badge variant="outline" className="text-xs">
                        SKU: {product.sku}
                      </Badge>
                    )}
                    {product.category && (
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Importé le {new Date(product.created_at).toLocaleDateString('fr-FR')} • 
                      Fournisseur: {product.supplier_name}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Aperçu du produit</DialogTitle>
                            <DialogDescription>
                              Détails complets du produit importé
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              {product.image_urls?.[0] && (
                                <img 
                                  src={product.image_urls[0]} 
                                  alt={product.name}
                                  className="w-full h-64 object-cover rounded-lg mb-4"
                                />
                              )}
                              <h3 className="font-semibold text-xl mb-2">{product.name}</h3>
                              <p className="text-muted-foreground mb-4">{product.description}</p>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <Label>Prix de vente</Label>
                                <div className="text-2xl font-bold">{product.currency} {product.price}</div>
                              </div>
                              {product.cost_price && (
                                <div>
                                  <Label>Prix d'achat</Label>
                                  <div className="text-lg">{product.currency} {product.cost_price}</div>
                                </div>
                              )}
                              <div>
                                <Label>SKU</Label>
                                <div>{product.sku}</div>
                              </div>
                              <div>
                                <Label>Catégorie</Label>
                                <div>{product.category}</div>
                              </div>
                              <div>
                                <Label>Tags</Label>
                                <div className="flex flex-wrap gap-1">
                                  {product.tags?.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                       <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Modifier le produit</DialogTitle>
                            <DialogDescription>
                              Modifiez les informations du produit avant publication
                            </DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="general" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="general">Général</TabsTrigger>
                              <TabsTrigger value="pricing">Prix</TabsTrigger>
                              <TabsTrigger value="seo">SEO</TabsTrigger>
                            </TabsList>
                            <TabsContent value="general" className="space-y-4">
                              <div>
                                <Label htmlFor="edit-name">Nom du produit</Label>
                                <Input id="edit-name" defaultValue={product.name} />
                              </div>
                              <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea id="edit-description" defaultValue={product.description} rows={4} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-sku">SKU</Label>
                                  <Input id="edit-sku" defaultValue={product.sku} />
                                </div>
                                <div>
                                  <Label htmlFor="edit-category">Catégorie</Label>
                                  <Input id="edit-category" defaultValue={product.category} />
                                </div>
                              </div>
                            </TabsContent>
                            <TabsContent value="pricing" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-price">Prix de vente</Label>
                                  <Input id="edit-price" type="number" defaultValue={product.price} />
                                </div>
                                <div>
                                  <Label htmlFor="edit-cost">Prix d'achat</Label>
                                  <Input id="edit-cost" type="number" defaultValue={product.cost_price} />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="edit-currency">Devise</Label>
                                <Select defaultValue={product.currency}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                    <SelectItem value="USD">Dollar US (USD)</SelectItem>
                                    <SelectItem value="GBP">Livre Sterling (GBP)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TabsContent>
                            <TabsContent value="seo" className="space-y-4">
                              <div>
                                <Label htmlFor="edit-meta-title">Titre SEO</Label>
                                <Input id="edit-meta-title" placeholder="Titre optimisé pour les moteurs de recherche" />
                              </div>
                              <div>
                                <Label htmlFor="edit-meta-description">Description SEO</Label>
                                <Textarea 
                                  id="edit-meta-description" 
                                  placeholder="Description optimisée pour les moteurs de recherche"
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-tags">Tags (séparés par des virgules)</Label>
                                <Input 
                                  id="edit-tags" 
                                  defaultValue={product.tags?.join(', ')}
                                  placeholder="tag1, tag2, tag3"
                                />
                              </div>
                            </TabsContent>
                          </Tabs>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline">Annuler</Button>
                            <Button 
                              onClick={async () => {
                                // Simuler la mise à jour du produit avec validation
                                const tagsInput = document.getElementById('edit-tags') as HTMLInputElement;
                                const nameInput = document.getElementById('edit-name') as HTMLInputElement;
                                const priceInput = document.getElementById('edit-price') as HTMLInputElement;
                                
                                if (nameInput?.value && priceInput?.value) {
                                  // Simuler une sauvegarde asynchrone
                                  await new Promise(resolve => setTimeout(resolve, 500));
                                  toast.success('Produit mis à jour avec succès');
                                } else {
                                  toast.error('Veuillez remplir tous les champs obligatoires');
                                }
                              }}
                            >
                              Sauvegarder
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Exporter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Envoyer vers Shopify
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Target className="w-4 h-4 mr-2" />
                            Envoyer vers Marketplace
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Facebook className="w-4 h-4 mr-2" />
                            Partager sur Facebook
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Instagram className="w-4 h-4 mr-2" />
                            Partager sur Instagram
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Twitter className="w-4 h-4 mr-2" />
                            Partager sur Twitter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              Aucun produit ne correspond à vos critères de recherche. 
              Essayez de modifier vos filtres ou d'importer de nouveaux produits.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Platform Export Dialog */}
      <PlatformExportDialog
        open={showShopifyExport}
        onOpenChange={setShowShopifyExport}
        productIds={selectedProducts}
        productNames={importedProducts
          .filter(p => selectedProducts.includes(p.id))
          .map(p => p.name)}
        onSuccess={() => {
          setSelectedProducts([])
          toast.success('Export terminé')
        }}
      />
    </div>
  )
}