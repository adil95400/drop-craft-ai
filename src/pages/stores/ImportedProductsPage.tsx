import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Package, Search, ExternalLink, RefreshCw, Filter, X, Trash2, Download, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { BackButton } from '@/components/navigation/BackButton'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useModalContext } from '@/hooks/useModalHelpers'
import { ProductDetailsModal } from '@/components/products/ProductDetailsModal'
import Papa from 'papaparse'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ImportedProduct {
  id: string
  name: string
  description: string
  price: number
  cost_price: number
  currency: string
  sku: string
  category: string
  brand: string
  stock_quantity: number
  status: string
  supplier_name: string
  supplier_product_id: string
  image_urls: string[]
  tags: string[]
  created_at: string
  updated_at: string
}

export default function ImportedProductsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const { modalStates, openModal, closeModal } = useModalContext()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  
  const debouncedSearch = useDebouncedValue(searchTerm, 300)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, platformFilter, categoryFilter, statusFilter])

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['imported-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as any[]
    },
    enabled: !!user?.id
  })

  const filteredProducts = products.filter(product => {
    const matchesSearch = !debouncedSearch || 
      product.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      product.category?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      product.brand?.toLowerCase().includes(debouncedSearch.toLowerCase())
    
    const matchesPlatform = platformFilter === 'all' || product.supplier_name === platformFilter
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    
    return matchesSearch && matchesPlatform && matchesCategory && matchesStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const platforms = Array.from(new Set(products.map(p => p.supplier_name).filter(Boolean)))
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))
  const statuses = Array.from(new Set(products.map(p => p.status).filter(Boolean)))
  
  const hasActiveFilters = platformFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || searchTerm !== ''
  
  const clearFilters = () => {
    setSearchTerm('')
    setPlatformFilter('all')
    setCategoryFilter('all')
    setStatusFilter('all')
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length && paginatedProducts.every(p => selectedProducts.has(p.id))) {
      // Deselect all on current page
      const newSet = new Set(selectedProducts)
      paginatedProducts.forEach(p => newSet.delete(p.id))
      setSelectedProducts(newSet)
    } else {
      // Select all on current page
      const newSet = new Set(selectedProducts)
      paginatedProducts.forEach(p => newSet.add(p.id))
      setSelectedProducts(newSet)
    }
  }

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize))
    setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const clearSelection = () => {
    setSelectedProducts(new Set())
  }

  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const { error } = await supabase
        .from('imported_products')
        .delete()
        .in('id', productIds)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: "Produits supprimés",
        description: `${selectedProducts.size} produit(s) supprimé(s) avec succès`
      })
      clearSelection()
      setShowDeleteDialog(false)
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les produits",
        variant: "destructive"
      })
    }
  })

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ productIds, status }: { productIds: string[], status: string }) => {
      const { error } = await supabase
        .from('imported_products')
        .update({ status })
        .in('id', productIds)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: "Statut mis à jour",
        description: `${selectedProducts.size} produit(s) mis à jour`
      })
      clearSelection()
      setBulkStatus('')
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les produits",
        variant: "destructive"
      })
    }
  })

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedProducts))
  }

  const handleBulkStatusChange = (status: string) => {
    bulkStatusMutation.mutate({ 
      productIds: Array.from(selectedProducts), 
      status 
    })
  }

  const handleExportCSV = () => {
    const selectedProductsData = products.filter(p => selectedProducts.has(p.id))
    
    const csvData = selectedProductsData.map(product => ({
      'ID': product.id,
      'Nom': product.name,
      'Description': product.description || '',
      'Prix': product.price,
      'Prix de revient': product.cost_price || '',
      'Devise': product.currency,
      'SKU': product.sku || '',
      'Catégorie': product.category || '',
      'Marque': product.brand || '',
      'Stock': product.stock_quantity || 0,
      'Statut': product.status,
      'Plateforme': product.supplier_name || '',
      'ID Externe': product.supplier_product_id || '',
      'Tags': product.tags?.join(', ') || '',
      'Date de création': new Date(product.created_at).toLocaleDateString('fr-FR')
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `produits_importes_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export réussi",
      description: `${selectedProducts.size} produit(s) exporté(s)`
    })
  }

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    outOfStock: products.filter(p => (p.stock_quantity || 0) === 0).length,
    totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock_quantity || 0)), 0)
  }

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const handleRefresh = async () => {
    await refetch()
    toast({
      title: "Actualisation réussie",
      description: "La liste des produits a été mise à jour"
    })
  }

  if (isLoading) {
    return (
      <ChannablePageWrapper
        title="Produits Importés"
        description="Chargement…"
        heroImage="products"
        badge={{ label: 'Imports', icon: Package }}
      >
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ChannablePageWrapper>
    )
  }

  return (
    <ChannablePageWrapper
      title="Produits Importés"
      description={`${filteredProducts.length} produits synchronisés depuis vos intégrations`}
      heroImage="products"
      badge={{ label: 'Imports', icon: Package }}
      actions={
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      }
    >

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">En rupture</p>
                <p className="text-3xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Valeur Stock</p>
                <p className="text-2xl font-bold text-foreground">{formatPrice(stats.totalValue)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedProducts.size > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">
                    {selectedProducts.size} produit(s) sélectionné(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={bulkStatus} onValueChange={(status) => {
                    setBulkStatus(status)
                    handleBulkStatusChange(status)
                  }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Changer le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Recherche et Filtres</h3>
                <div className="ml-auto flex items-center gap-2">
                  {paginatedProducts.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                    >
                      {paginatedProducts.every(p => selectedProducts.has(p.id)) ? 'Désélectionner la page' : 'Sélectionner la page'}
                    </Button>
                  )}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Effacer les filtres
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, SKU, catégorie ou marque..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Plateforme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les plateformes</SelectItem>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform} className="capitalize">
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-4 ml-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Afficher:</span>
                    <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} au total
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Products Grid */}
      {paginatedProducts.length === 0 && filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {products.length === 0 ? 'Aucun produit importé' : 'Aucun résultat'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {products.length === 0 
                ? 'Synchronisez vos intégrations pour importer des produits' 
                : 'Essayez de modifier vos critères de recherche'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProducts.map((product) => (
            <Card 
              key={product.id} 
              className="hover:shadow-lg transition-shadow relative cursor-pointer"
              onClick={() => {
                navigate('/import/preview', {
                  state: {
                    product: {
                      title: product.name,
                      description: product.description || '',
                      price: product.price || 0,
                      images: product.image_urls || (product.image_url ? [product.image_url] : []),
                      category: product.category || '',
                      sku: product.sku || '',
                    },
                    returnTo: '/stores/imported-products',
                  }
                })
              }}
            >
              <div 
                className="absolute top-4 left-4 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selectedProducts.has(product.id)}
                  onCheckedChange={() => toggleProductSelection(product.id)}
                  className="bg-background border-2"
                />
              </div>
              <CardHeader className="pb-3">
                {product.image_urls && product.image_urls.length > 0 && (
                  <div className="w-full h-48 mb-3 overflow-hidden rounded-lg bg-muted">
                    <img 
                      src={product.image_urls[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg'
                      }}
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{product.name || 'Sans nom'}</CardTitle>
                  <Badge 
                    variant={product.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize shrink-0"
                  >
                    {product.status || 'inconnu'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prix:</span>
                  <span className="font-semibold">{formatPrice(product.price || 0, product.currency || 'EUR')}</span>
                </div>
                
                {product.cost_price && product.cost_price > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Coût:</span>
                    <span>{formatPrice(product.cost_price, product.currency || 'EUR')}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stock:</span>
                  <Badge variant={(product.stock_quantity || 0) > 0 ? 'default' : 'destructive'}>
                    {product.stock_quantity || 0} unités
                  </Badge>
                </div>

                {product.sku && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-mono text-xs">{product.sku}</span>
                  </div>
                )}

                {product.supplier_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Source:</span>
                    <Badge variant="outline" className="capitalize">
                      {product.supplier_name}
                    </Badge>
                  </div>
                )}

                {product.category && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Catégorie:</span>
                    <span className="text-xs">{product.category}</span>
                  </div>
                )}

                {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Affichage de {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} sur {filteredProducts.length} produits
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {currentPage > 2 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(1)}
                        >
                          1
                        </Button>
                        {currentPage > 3 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                      </>
                    )}
                    
                    {currentPage > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                      >
                        {currentPage - 1}
                      </Button>
                    )}
                    
                    <Button
                      variant="default"
                      size="sm"
                    >
                      {currentPage}
                    </Button>
                    
                    {currentPage < totalPages && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                      >
                        {currentPage + 1}
                      </Button>
                    )}
                    
                    {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedProducts.size} produit(s) ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProductDetailsModal
        product={selectedProduct}
        open={modalStates.productDetails}
        onOpenChange={(open) => {
          if (!open) {
            closeModal('productDetails')
            setSelectedProduct(null)
          }
        }}
      />
    </ChannablePageWrapper>
  )
}
