/**
 * Page Catalogue Produits - Vue simple de gestion
 * 100% connecté FastAPI : toutes les mutations passent par les hooks API
 * Jobs/Job_items affichés via ActiveJobsBanner + JobTrackerPanel
 */

import { useState, useCallback, useMemo } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

// API hooks (FastAPI)
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified/useProductsUnified'
import { useApiProducts } from '@/hooks/api/useApiProducts'
import { useApiSync } from '@/hooks/api/useApiSync'
import { useApiAI } from '@/hooks/api/useApiAI'
import { useApiJobs } from '@/hooks/api/useApiJobs'
import { productsApi } from '@/services/api/client'

// Job tracking UI
import { ActiveJobsBanner } from '@/components/jobs/ActiveJobsBanner'
import { JobTrackerPanel } from '@/components/jobs/JobTrackerPanel'

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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Plus, Search, Upload, Download, RefreshCw, Trash2, 
  Edit3, Loader2, Package, Filter, X, Brain, Zap,
  ChevronDown
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
  const [isExporting, setIsExporting] = useState(false)
  const [viewModalProduct, setViewModalProduct] = useState<UnifiedProduct | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [showJobTracker, setShowJobTracker] = useState(false)

  // === DATA (reads via Supabase, mutations via FastAPI) ===
  const { products, stats, isLoading, refetch } = useProductsUnified()
  const { deleteProduct, createProduct } = useApiProducts()
  const { triggerSync, isSyncing } = useApiSync()
  const { bulkEnrich, isBulkEnriching } = useApiAI()
  const { activeJobs } = useApiJobs({ limit: 5 })

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return Array.from(cats).sort() as string[]
  }, [products])

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter)
    }
    return result
  }, [products, search, statusFilter, categoryFilter])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  const hasActiveFilters = search !== '' || statusFilter !== 'all' || categoryFilter !== 'all'

  // === HANDLERS (100% FastAPI) ===
  const handleRefresh = useCallback(() => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
    toast({ title: 'Catalogue actualisé' })
  }, [refetch, queryClient, toast])

  const handleEdit = useCallback((product: any) => {
    navigate(`/products/${product.id}/edit`)
  }, [navigate])

  const handleView = useCallback((product: any) => {
    const unified = products.find(p => p.id === product.id)
    if (unified) setViewModalProduct(unified)
  }, [products])

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmId(id)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteConfirmId) return
    deleteProduct.mutate(deleteConfirmId, {
      onSuccess: () => handleRefresh(),
    })
    setDeleteConfirmId(null)
  }, [deleteConfirmId, deleteProduct, handleRefresh])

  const handleDuplicate = useCallback((product: any) => {
    const p = products.find(x => x.id === product.id)
    if (!p) return
    createProduct.mutate({
      title: `${p.name} (copie)`,
      salePrice: p.price || 0,
      costPrice: p.cost_price,
      sku: p.sku ? `${p.sku}-COPY` : undefined,
      stock: p.stock_quantity || 0,
    }, {
      onSuccess: () => handleRefresh(),
    })
  }, [products, createProduct, handleRefresh])

  // Bulk delete via Supabase
  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0) return
    setIsBulkDeleting(true)
    try {
      await productsApi.bulkUpdate(selectedProducts, { status: 'deleted' } as any)
      toast({ 
        title: 'Produits supprimés', 
        description: `${selectedProducts.length} produit(s) supprimé(s)` 
      })
      setSelectedProducts([])
      setBulkDeleteOpen(false)
      handleRefresh()
    } catch {
      toast({ title: 'Erreur de suppression', variant: 'destructive' })
    } finally {
      setIsBulkDeleting(false)
    }
  }, [selectedProducts, toast, handleRefresh])

  // Export CSV client-side
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true)
    try {
      const items = products || []
      const headers = ['Nom', 'SKU', 'Prix', 'Stock', 'Statut', 'Catégorie']
      const rows = items.map(p => [p.name || '', p.sku || '', p.price || 0, p.stock_quantity || 0, p.status || '', p.category || ''])
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `produits-export-${Date.now()}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast({ title: 'Export terminé' })
    } catch {
      toast({ title: 'Erreur d\'export', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }, [toast, products])

  // Sync via FastAPI
  const handleSync = useCallback(() => {
    triggerSync.mutate({ syncType: 'products' })
  }, [triggerSync])

  // Enrichir IA via FastAPI
  const handleEnrichAI = useCallback(() => {
    const ids = selectedProducts.length > 0 ? selectedProducts : filteredProducts.map(p => p.id)
    bulkEnrich.mutate({
      filterCriteria: selectedProducts.length > 0 ? { product_ids: ids } : {},
      enrichmentTypes: ['seo', 'description'],
      limit: ids.length,
    })
  }, [selectedProducts, filteredProducts, bulkEnrich])

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
        {/* === ACTIVE JOBS BANNER === */}
        <ActiveJobsBanner />

        {/* === TOOLBAR === */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Actions principales */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => navigate('/products/create')} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau produit
              </Button>
              <Button 
                variant="outline" size="sm" className="gap-2 border-primary/50 text-primary hover:bg-primary/10" 
                onClick={handleEnrichAI}
                disabled={isBulkEnriching}
              >
                {isBulkEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                Enrichir IA
              </Button>
              <Button 
                variant="outline" size="sm" className="gap-2" 
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/import/quick')}>
                <Upload className="h-4 w-4" />
                Importer
              </Button>
              <Button 
                variant="outline" size="sm" className="gap-2" 
                onClick={handleExportCSV}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Exporter
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {/* Jobs tracker toggle */}
              {activeJobs.length > 0 && (
                <Button 
                  variant="ghost" size="sm" className="gap-1.5 text-primary"
                  onClick={() => setShowJobTracker(!showJobTracker)}
                >
                  <Zap className="h-4 w-4" />
                  {activeJobs.length} job{activeJobs.length > 1 ? 's' : ''}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showJobTracker ? 'rotate-180' : ''}`} />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Job Tracker Panel (collapsible) */}
          {showJobTracker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <JobTrackerPanel />
            </motion.div>
          )}

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
            <Button 
              variant="outline" size="sm" className="gap-2" 
              onClick={handleEnrichAI}
              disabled={isBulkEnriching}
            >
              <Brain className="h-4 w-4" />
              Enrichir IA
            </Button>
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

        {/* === JOB TRACKER (always visible at bottom) === */}
        <Collapsible open={showJobTracker} onOpenChange={setShowJobTracker}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" />
              Historique des jobs ({activeJobs.length} actif{activeJobs.length !== 1 ? 's' : ''})
              <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${showJobTracker ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <JobTrackerPanel />
          </CollapsibleContent>
        </Collapsible>
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
              Cette action est irréversible. Tous les produits sélectionnés seront définitivement supprimés via le backend.
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

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
        title="Supprimer ce produit ?"
        description="Cette action est irréversible."
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </ChannablePageWrapper>
  )
}
