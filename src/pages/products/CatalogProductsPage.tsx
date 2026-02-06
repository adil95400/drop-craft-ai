/**
 * Page Catalogue Produits - Vue simple de gestion
 * Table par défaut, filtres, actions bulk, import/export
 * Aucun KPI, aucun cockpit business (→ /products/cockpit)
 */

import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Data hooks
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified/useProductsUnified'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { 
  Plus, Search, Upload, Download, RefreshCw, Trash2, 
  Edit3, Loader2, Package, Filter, X 
} from 'lucide-react'

// Product components
import { ResponsiveProductsTable } from '@/components/products/ResponsiveProductsTable'
import { ProductsPagination } from '@/components/products/ProductsPagination'
import { BulkEditPanel } from '@/components/products/BulkEditPanel'
import { ProductViewModal } from '@/components/modals/ProductViewModal'
import { PlatformExportDialog } from '@/components/products/export/PlatformExportDialog'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

// ============= Types =============
type StatusFilter = 'all' | 'active' | 'inactive' | 'draft' | 'archived'

export default function CatalogProductsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // === FILTERS ===
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  // === UI STATE ===
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showPlatformExport, setShowPlatformExport] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [viewModalProduct, setViewModalProduct] = useState<UnifiedProduct | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  // === DATA ===
  const { products, stats, isLoading, refetch } = useProductsUnified()

  // === DERIVED DATA ===
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return Array.from(cats).sort() as string[]
  }, [products])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    }

    // Status
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }

    // Category
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter)
    }

    return result
  }, [products, search, statusFilter, categoryFilter])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  const hasActiveFilters = search !== '' || statusFilter !== 'all' || categoryFilter !== 'all'

  // === HANDLERS ===
  const handleRefresh = useCallback(() => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    toast({ title: 'Catalogue actualisé' })
  }, [refetch, queryClient, toast])

  const handleEdit = useCallback((product: any) => {
    navigate(`/products/${product.id}/edit`)
  }, [navigate])

  const handleView = useCallback((product: any) => {
    const unified = products.find(p => p.id === product.id)
    if (unified) setViewModalProduct(unified)
  }, [products])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      await Promise.all([
        supabase.from('products').delete().eq('id', id).eq('user_id', user.id),
        supabase.from('imported_products').delete().eq('id', id).eq('user_id', user.id)
      ])
      
      toast({ title: 'Produit supprimé' })
      handleRefresh()
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' })
    }
  }, [toast, handleRefresh])

  const handleDuplicate = useCallback(async (product: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      const p = products.find(x => x.id === product.id)
      if (!p) return

      await supabase.from('products').insert([{
        user_id: user.id,
        title: `${p.name} (copie)`,
        name: `${p.name} (copie)`,
        description: p.description || null,
        price: p.price || 0,
        cost_price: p.cost_price || 0,
        sku: p.sku ? `${p.sku}-COPY` : null,
        category: p.category || null,
        image_url: p.image_url || null,
        stock_quantity: p.stock_quantity || 0,
        status: 'draft',
      }])
      
      toast({ title: 'Produit dupliqué' })
      handleRefresh()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }, [products, toast, handleRefresh])

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0) return
    setIsBulkDeleting(true)
    try {
      const { importExportService } = await import('@/services/importExportService')
      await importExportService.bulkDelete(selectedProducts)
      toast({ title: `${selectedProducts.length} produit(s) supprimé(s)` })
      setSelectedProducts([])
      setBulkDeleteOpen(false)
      handleRefresh()
    } catch {
      toast({ title: 'Erreur de suppression', variant: 'destructive' })
    } finally {
      setIsBulkDeleting(false)
    }
  }, [selectedProducts, toast, handleRefresh])

  const handleExportCSV = useCallback(async () => {
    try {
      const { importExportService } = await import('@/services/importExportService')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      await importExportService.exportAllProducts(user.id)
      toast({ title: 'Export CSV téléchargé' })
    } catch {
      toast({ title: 'Erreur d\'export', variant: 'destructive' })
    }
  }, [toast])

  const resetFilters = useCallback(() => {
    setSearch('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setCurrentPage(1)
  }, [])

  // === RENDER ===
  return (
    <ChannablePageWrapper
      title="Catalogue Produits"
      subtitle="Gestion"
      description="Gérez, filtrez et organisez tous vos produits depuis une interface centralisée."
      heroImage="products"
      badge={{ label: `${stats.total} produits`, icon: Package }}
    >
      <div className="space-y-4">
        {/* === TOOLBAR === */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Actions principales */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => navigate('/products/create')} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau produit
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/import/quick')}>
                <Upload className="h-4 w-4" />
                Importer
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                Exporter
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="gap-2" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Row 2: Filtres */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, SKU, catégorie..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setCurrentPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 shrink-0">
                <X className="h-4 w-4" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Résultats count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredProducts.length === stats.total 
                ? `${stats.total} produit(s)` 
                : `${filteredProducts.length} sur ${stats.total} produit(s)`
              }
            </span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                Filtres actifs
              </Badge>
            )}
          </div>
        </div>

        {/* === BULK ACTIONS === */}
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg"
          >
            <Badge variant="secondary" className="bg-primary/20 text-primary font-medium">
              {selectedProducts.length} sélectionné(s)
            </Badge>
            <div className="flex-1" />
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowPlatformExport(true)}>
              <Upload className="h-4 w-4" />
              Exporter
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowBulkEdit(true)}>
              <Edit3 className="h-4 w-4" />
              Éditer
            </Button>
            <Button variant="destructive" size="sm" className="gap-2" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedProducts([])}>
              Désélectionner
            </Button>
          </motion.div>
        )}

        {/* === TABLE === */}
        <ResponsiveProductsTable
          products={paginatedProducts}
          isLoading={isLoading}
          selectedProducts={selectedProducts}
          onSelectionChange={setSelectedProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onDuplicate={handleDuplicate}
        />

        {/* === PAGINATION === */}
        {totalPages > 1 && (
          <ProductsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1) }}
          />
        )}
      </div>

      {/* === DIALOGS === */}
      
      {/* Bulk Edit Sheet */}
      <Sheet open={showBulkEdit} onOpenChange={setShowBulkEdit}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <BulkEditPanel
            selectedProducts={products.filter(p => selectedProducts.includes(p.id)) as any}
            onComplete={() => { setShowBulkEdit(false); setSelectedProducts([]); handleRefresh() }}
            onCancel={() => setShowBulkEdit(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Product View Modal */}
      <ProductViewModal
        open={!!viewModalProduct}
        onOpenChange={(open) => !open && setViewModalProduct(null)}
        product={viewModalProduct}
        onEdit={() => { if (viewModalProduct) { handleEdit(viewModalProduct); setViewModalProduct(null) } }}
        onDelete={() => { if (viewModalProduct) { handleDelete(viewModalProduct.id); setViewModalProduct(null) } }}
        onDuplicate={async () => { if (viewModalProduct) { await handleDuplicate(viewModalProduct); setViewModalProduct(null) } }}
      />

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedProducts.length} produit(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les produits sélectionnés seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Suppression...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Supprimer</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Platform Export Dialog */}
      <PlatformExportDialog
        open={showPlatformExport}
        onOpenChange={setShowPlatformExport}
        productIds={selectedProducts}
        productNames={products.filter(p => selectedProducts.includes(p.id)).map(p => p.name)}
        onSuccess={() => { setShowPlatformExport(false); toast({ title: 'Export réussi' }) }}
      />
    </ChannablePageWrapper>
  )
}
