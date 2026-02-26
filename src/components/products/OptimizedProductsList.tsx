import { useState, useCallback, useMemo, useTransition } from 'react'
import { usePaginatedProducts, ProductFilters } from '@/hooks/usePaginatedProducts'
import { VirtualizedProductTable } from './VirtualizedProductTable'
import { TablePagination } from './TablePagination'
import { ProductFilters as FiltersComponent } from './ProductFilters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, RefreshCw, Download, Filter, Package } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface OptimizedProductsListProps {
  onView?: (product: any) => void
  onEdit?: (product: any) => void
  onDelete?: (id: string) => void
  isPro?: boolean
}

export function OptimizedProductsList({
  onView,
  onEdit,
  onDelete,
  isPro = false
}: OptimizedProductsListProps) {
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(50)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ProductFilters>({})

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 300)

  // Combined filters
  const combinedFilters = useMemo((): ProductFilters => ({
    ...filters,
    search: debouncedSearch || undefined,
    sortBy: sortField,
    sortOrder: sortDirection
  }), [filters, debouncedSearch, sortField, sortDirection])

  // Use paginated products hook
  const {
    products,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isLoading,
    isFetching,
    refetch,
    goToPage,
    resetPage
  } = usePaginatedProducts({
    pageSize,
    filters: combinedFilters
  })

  // Handle sort
  const handleSort = useCallback((field: string) => {
    startTransition(() => {
      if (sortField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
      } else {
        setSortField(field)
        setSortDirection('desc')
      }
      resetPage()
    })
  }, [sortField, resetPage])

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      goToPage(page)
    })
  }, [goToPage])

  // Handle page size change
  const handlePageSizeChange = useCallback((size: number) => {
    startTransition(() => {
      setPageSize(size)
      resetPage()
    })
  }, [resetPage])

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }, [products])

  // Handle select one
  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }, [])

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: Partial<ProductFilters>) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, ...newFilters }))
      resetPage()
    })
  }, [resetPage])

  // Clear filters
  const clearFilters = useCallback(() => {
    startTransition(() => {
      setFilters({})
      setSearchInput('')
      resetPage()
    })
  }, [resetPage])

  // Handlers for product actions
  const handleView = useCallback((product: any) => {
    onView?.(product)
  }, [onView])

  const handleEdit = useCallback((product: any) => {
    onEdit?.(product)
  }, [onEdit])

  const handleDuplicate = useCallback(async (product: any) => {
    try {
      // Fetch full product data
      const { data: original, error: fetchErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single()

      if (fetchErr || !original) throw fetchErr || new Error('Product not found')

      // Remove fields that should be regenerated
      const { id, created_at, updated_at, ...duplicateData } = original
      duplicateData.title = `${duplicateData.title} (copie)`
      if (duplicateData.sku) duplicateData.sku = `${duplicateData.sku}-COPY-${Date.now()}`

      const { error: insertErr } = await supabase
        .from('products')
        .insert(duplicateData)

      if (insertErr) throw insertErr

      toast.success('Produit dupliqué avec succès')
      refetch()
    } catch (err: any) {
      toast.error('Erreur lors de la duplication', { description: err.message })
    }
  }, [refetch])

  const handleDelete = useCallback((id: string) => {
    onDelete?.(id)
    setSelectedIds(prev => prev.filter(i => i !== id))
  }, [onDelete])

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.status && filters.status !== 'all') count++
    if (filters.category) count++
    if (filters.low_stock) count++
    if (filters.minPrice !== undefined) count++
    if (filters.maxPrice !== undefined) count++
    return count
  }, [filters])

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">Produits</CardTitle>
            <Badge variant="secondary" className="font-mono">
              {totalCount.toLocaleString('fr-FR')}
            </Badge>
            {isFetching && !isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
              Actualiser
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Search and filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-2 h-5 w-5 p-0 justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Effacer
            </Button>
          )}
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Status filter */}
              <div>
                <label className="text-sm font-medium mb-1 block">Statut</label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={filters.status || 'all'}
                  onChange={(e) => handleFilterChange({ status: e.target.value as any })}
                >
                  <option value="all">Tous</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              {/* Category filter */}
              <div>
                <label className="text-sm font-medium mb-1 block">Catégorie</label>
                <Input
                  placeholder="Filtrer..."
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
                />
              </div>

              {/* Low stock filter */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.low_stock || false}
                    onChange={(e) => handleFilterChange({ low_stock: e.target.checked || undefined })}
                    className="rounded border"
                  />
                  <span className="text-sm">Stock faible (&lt;10)</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Loading skeleton */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-md">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">Aucun produit trouvé</p>
            <p className="text-sm">
              {debouncedSearch || activeFilterCount > 0
                ? "Essayez de modifier vos filtres"
                : "Commencez par importer des produits"}
            </p>
          </div>
        ) : (
          <>
            {/* Virtualized table */}
            <VirtualizedProductTable
              products={products}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
              onView={handleView}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              isPro={isPro}
            />

            {/* Pagination */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalCount}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}

        {/* Selected items indicator */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-3 z-50">
            <span className="font-medium">{selectedIds.length} sélectionné(s)</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              Désélectionner
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
