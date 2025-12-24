/**
 * Composant de pagination réutilisable pour les tables de données
 * Optimisé pour les grandes listes avec cache React Query
 */
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react'

interface DataTablePaginationProps {
  currentPage: number
  pageSize: number
  totalCount: number
  hasMore?: boolean
  isLoading?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showTotalCount?: boolean
}

export function DataTablePagination({
  currentPage,
  pageSize,
  totalCount,
  hasMore,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showTotalCount = true
}: DataTablePaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = currentPage * pageSize + 1
  const endItem = Math.min((currentPage + 1) * pageSize, totalCount)
  
  const canGoPrevious = currentPage > 0
  const canGoNext = hasMore !== undefined ? hasMore : currentPage < totalPages - 1

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Info section */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {showTotalCount && totalCount > 0 && (
          <span>
            {startItem}-{endItem} sur {totalCount.toLocaleString('fr-FR')}
          </span>
        )}
        
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Par page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        {isLoading && (
          <Loader2 className="h-4 w-4 mr-2 animate-spin text-muted-foreground" />
        )}
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(0)}
          disabled={!canGoPrevious || isLoading}
          title="Première page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious || isLoading}
          title="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="px-3 text-sm font-medium">
          {currentPage + 1} / {totalPages || 1}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext || isLoading}
          title="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canGoNext || isLoading}
          title="Dernière page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default DataTablePagination