import { useState, useEffect } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnResizeMode,
  RowSelectionState,
  PaginationState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings2, Trash2, Edit, History } from 'lucide-react'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { createProductsColumns } from './ProductsTableColumns'
import { cn } from '@/lib/utils'
import { TablePagination } from './TablePagination'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'
import { ProductHistoryDialog } from './ProductHistoryDialog'

interface ProductsTableViewProps {
  products: UnifiedProduct[]
  onEdit: (product: UnifiedProduct) => void
  onDelete: (id: string) => void
  onView: (product: UnifiedProduct) => void
  onBulkDelete?: (ids: string[]) => void
  onBulkEdit?: (ids: string[]) => void
  onProductUpdate?: () => void
}

export function ProductsTableView({
  products,
  onEdit,
  onDelete,
  onView,
  onBulkDelete,
  onBulkEdit,
  onProductUpdate,
}: ProductsTableViewProps) {
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; productId: string; productName: string }>({
    open: false,
    productId: '',
    productName: '',
  })
  const { defaultPageSize, setDefaultPageSize } = useUserPreferencesStore()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  // Synchroniser pageSize avec les préférences utilisateur
  useEffect(() => {
    if (pagination.pageSize !== defaultPageSize) {
      setPagination(prev => ({ ...prev, pageSize: defaultPageSize }))
    }
  }, [defaultPageSize])

  const handleShowHistory = (product: UnifiedProduct) => {
    setHistoryDialog({
      open: true,
      productId: product.id,
      productName: product.name,
    })
  }

  const handleRestoreProduct = async (snapshot: any) => {
    if (onProductUpdate) {
      onProductUpdate()
    }
  }

  const columns = createProductsColumns({ 
    onEdit, 
    onDelete, 
    onView,
    onShowHistory: handleShowHistory,
  })

  const table = useReactTable({
    data: products,
    columns,
    getRowId: (row) => `${row.source}-${row.id}`,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    columnResizeMode,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  const handlePageChange = (page: number) => {
    table.setPageIndex(page - 1)
  }

  const handlePageSizeChange = (pageSize: number) => {
    setDefaultPageSize(pageSize)
    table.setPageSize(pageSize)
  }

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.map(row => row.original.id)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedRows.length} sélectionné(s)
              </span>
              {onBulkEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkEdit(selectedIds)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier en masse
                </Button>
              )}
              {onBulkDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Supprimer ${selectedRows.length} produit(s) ?`)) {
                      onBulkDelete(selectedIds)
                      setRowSelection({})
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </>
          )}
        </div>

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="h-4 w-4 mr-2" />
              Colonnes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="relative"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    
                    {/* Resize handle */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                          'hover:bg-primary/50',
                          header.column.getIsResizing() && 'bg-primary'
                        )}
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucun produit trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <TablePagination
        currentPage={table.getState().pagination.pageIndex + 1}
        totalPages={table.getPageCount()}
        pageSize={table.getState().pagination.pageSize}
        totalItems={table.getFilteredRowModel().rows.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* History Dialog */}
      <ProductHistoryDialog
        open={historyDialog.open}
        onOpenChange={(open) => setHistoryDialog(prev => ({ ...prev, open }))}
        productId={historyDialog.productId}
        productName={historyDialog.productName}
        onRestore={handleRestoreProduct}
      />
    </div>
  )
}
