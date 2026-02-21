/**
 * Page Catalogue Produits - Vue simple de gestion
 * 100% connecté FastAPI : toutes les mutations passent par les hooks API
 * Jobs/Job_items affichés via ActiveJobsBanner + JobTrackerPanel
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
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
import { Card, CardContent } from '@/components/ui/card'
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
  ChevronDown, LayoutGrid, List, DollarSign, TrendingUp,
  BarChart3, AlertTriangle, ArrowUpDown
} from 'lucide-react'

// Product components
import { ResponsiveProductsTable } from '@/components/products/ResponsiveProductsTable'
import { ProductsGridView } from '@/components/products/ProductsGridView'
import { ProductsPagination } from '@/components/products/ProductsPagination'
import { BulkEditPanel } from '@/components/products/BulkEditPanel'
import { ProductViewModal } from '@/components/modals/ProductViewModal'
import { PlatformExportDialog } from '@/components/products/export/PlatformExportDialog'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

// ============= Types =============
type StatusFilter = 'all' | 'active' | 'paused' | 'draft' | 'archived'
type ViewMode = 'table' | 'grid'
type SortField = 'name' | 'price' | 'stock_quantity' | 'margin' | 'created_at'
type SortDirection = 'asc' | 'desc'

export default function CatalogProductsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // === FILTERS ===
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  // Debounce search for performance
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(searchTimerRef.current)
  }, [search])
  
  // === VIEW & SORT STATE ===
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
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

  const sources = useMemo(() => {
    const srcs = new Set(products.map(p => p.source).filter(Boolean))
    return Array.from(srcs).sort() as string[]
  }, [products])

  // === KPI CALCULATIONS ===
  const kpis = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0)
    const productsWithMargin = products.filter(p => p.cost_price && p.price > 0)
    const avgMargin = productsWithMargin.length > 0
      ? productsWithMargin.reduce((sum, p) => {
          const margin = ((p.price - (p.cost_price || 0)) / p.price) * 100
          return sum + margin
        }, 0) / productsWithMargin.length
      : 0
    const lowStockCount = products.filter(p => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0).length

    return { totalStock, totalValue, avgMargin, lowStockCount }
  }, [products])

  // Helper: compute margin for a product
  const getMargin = (p: UnifiedProduct) => {
    if (!p.cost_price || p.price <= 0) return null
    return ((p.price - p.cost_price) / p.price) * 100
  }

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter)
    }
    if (sourceFilter !== 'all') {
      result = result.filter(p => p.source === sourceFilter)
    }

    // Sort
    result.sort((a, b) => {
      let valA: number | string = 0
      let valB: number | string = 0

      switch (sortField) {
        case 'name':
          valA = a.name.toLowerCase()
          valB = b.name.toLowerCase()
          break
        case 'price':
          valA = a.price || 0
          valB = b.price || 0
          break
        case 'stock_quantity':
          valA = a.stock_quantity || 0
          valB = b.stock_quantity || 0
          break
        case 'margin':
          valA = getMargin(a) ?? -999
          valB = getMargin(b) ?? -999
          break
        case 'created_at':
          valA = a.created_at || ''
          valB = b.created_at || ''
          break
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [products, debouncedSearch, statusFilter, categoryFilter, sourceFilter, sortField, sortDirection])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  const hasActiveFilters = search !== '' || statusFilter !== 'all' || categoryFilter !== 'all' || sourceFilter !== 'all'

  // Sort handler
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }, [sortField])

  // === HANDLERS (100% FastAPI) ===
  const handleRefresh = useCallback(() => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
    toast({ title: 'Catalogue actualisé' })
  }, [refetch, queryClient, toast])

  const handleEdit = useCallback((product: any) => {
    navigate(`/products/${product.id}`, { state: { openEdit: true } })
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
      await productsApi.bulkUpdate(selectedProducts, { status: 'archived' } as any)
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
      const headers = ['Nom', 'SKU', 'Prix', 'Coût', 'Marge %', 'Stock', 'Statut', 'Catégorie', 'Marque', 'Source']
      const esc = (v: string | number | null | undefined) => {
        const s = String(v ?? '')
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
      }
      const rows = items.map(p => {
        const margin = getMargin(p)
        return [esc(p.name), esc(p.sku), p.price || 0, p.cost_price || '', margin !== null ? margin.toFixed(1) : '', p.stock_quantity || 0, p.status || '', esc(p.category), esc(p.brand), p.source || '']
      })
      const bom = '\uFEFF'
      const csv = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `produits-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast({ title: 'Export terminé', description: `${items.length} produit(s) exporté(s)` })
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
    setSourceFilter('all')
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

        {/* === KPI STAT CARDS === */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate('/products?status=active')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Produits total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => { setStatusFilter('all'); setSearch(''); }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{kpis.totalStock.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Stock total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate('/analytics')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{kpis.totalValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
                <p className="text-xs text-muted-foreground mt-1">Valeur stock</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate('/products/scoring')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                kpis.avgMargin >= 30 ? 'bg-primary/10' : kpis.avgMargin >= 15 ? 'bg-accent/50' : 'bg-destructive/10'
              )}>
                <TrendingUp className={cn(
                  "h-5 w-5",
                  kpis.avgMargin >= 30 ? 'text-primary' : kpis.avgMargin >= 15 ? 'text-accent-foreground' : 'text-destructive'
                )} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{kpis.avgMargin.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Marge moyenne</p>
              </div>
              {kpis.lowStockCount > 0 && (
                <Badge variant="destructive" className="ml-auto text-[10px] shrink-0">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {kpis.lowStockCount}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* === TOOLBAR === */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Actions principales */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/products/cockpit')}>
                <BarChart3 className="h-4 w-4" />
                Cockpit
              </Button>
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
              {/* View Toggle */}
              <div className="inline-flex items-center rounded-lg border bg-background p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`h-7 px-2.5 ${viewMode === 'table' ? 'bg-muted' : ''}`}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-7 px-2.5 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
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
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Feature #6: Source Filter */}
            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                {sources.map(src => (
                  <SelectItem key={src} value={src}>{src}</SelectItem>
                ))}
                {sources.length === 0 && (
                  <>
                    <SelectItem value="manual">Manuel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 shrink-0">
                <X className="h-4 w-4" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Résultats count + Sort indicator */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredProducts.length === stats.total 
                ? `${stats.total} produit(s)` 
                : `${filteredProducts.length} sur ${stats.total} produit(s)`
              }
            </span>
            <div className="flex items-center gap-2">
              {sortField !== 'created_at' && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <ArrowUpDown className="h-3 w-3" />
                  {sortField === 'name' ? 'Nom' : sortField === 'price' ? 'Prix' : sortField === 'stock_quantity' ? 'Stock' : 'Marge'}
                  {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                </Badge>
              )}
              {hasActiveFilters && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  Filtres actifs
                </Badge>
              )}
            </div>
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

        {/* === EMPTY STATE (no products at all) === */}
        {!isLoading && products.length === 0 && !hasActiveFilters ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit dans votre catalogue</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Commencez par importer des produits depuis AliExpress, Amazon, ou ajoutez-les manuellement.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => navigate('/import/quick')} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Importer des produits
                </Button>
                <Button variant="outline" onClick={() => navigate('/products/create')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer manuellement
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !isLoading && filteredProducts.length === 0 && hasActiveFilters ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground mb-4">
                Aucun produit ne correspond à vos filtres actuels.
              </p>
              <Button variant="outline" onClick={resetFilters} className="gap-2">
                <X className="h-4 w-4" />
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* === TABLE OR GRID === */}
            {viewMode === 'table' ? (
              <ResponsiveProductsTable
                products={paginatedProducts}
                isLoading={isLoading}
                selectedProducts={selectedProducts}
                onSelectionChange={setSelectedProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onDuplicate={handleDuplicate}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            ) : (
              <ProductsGridView
                products={paginatedProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                selectedProducts={selectedProducts}
                onSelectionChange={setSelectedProducts}
              />
            )}
          </>
        )}

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
