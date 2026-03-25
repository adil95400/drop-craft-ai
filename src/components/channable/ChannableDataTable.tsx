/**
 * Table de données style Channable — Pro-level density & polish
 */

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ChannableEmptyState } from './ChannableEmptyState'

interface Column<T> {
  id: string
  header: string | ReactNode
  accessor: keyof T | ((row: T) => ReactNode)
  className?: string
  sortable?: boolean
}

interface ChannableDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  description?: string
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  getRowId?: (row: T) => string
  onRowClick?: (row: T) => void
  emptyState?: {
    title: string
    description?: string
    action?: { label: string; onClick: () => void }
  }
  loading?: boolean
  className?: string
  toolbar?: ReactNode
}

export function ChannableDataTable<T>({
  data,
  columns,
  title,
  description,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  getRowId = (row: any) => row.id,
  onRowClick,
  emptyState,
  loading,
  className,
  toolbar
}: ChannableDataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds.length === data.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length

  const toggleAll = () => {
    if (!onSelectionChange) return
    onSelectionChange(allSelected ? [] : data.map(getRowId))
  }

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
    )
  }

  const renderCell = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') return column.accessor(row)
    return (row as any)[column.accessor]
  }

  return (
    <Card className={cn("overflow-hidden border-border/50", className)}>
      {(title || description || toolbar) && (
        <CardHeader className="border-b border-border/40 bg-muted/20 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              {title && <CardTitle className="text-base">{title}</CardTitle>}
              {description && <CardDescription className="text-[13px] mt-0.5">{description}</CardDescription>}
            </div>
            {toolbar}
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mt-2 text-sm text-primary font-medium">
              <span>{selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {loading ? (
          <div className="divide-y divide-border/30">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                {selectable && <Skeleton className="h-4 w-4 rounded" />}
                {columns.map((col) => (
                  <Skeleton key={col.id} className="h-4 flex-1 rounded" />
                ))}
              </div>
            ))}
          </div>
        ) : data.length === 0 && emptyState ? (
          <ChannableEmptyState
            title={emptyState.title}
            description={emptyState.description}
            action={emptyState.action}
            variant="search"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
                  {selectable && (
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Tout sélectionner"
                        {...(someSelected ? { 'data-state': 'indeterminate' } : {})}
                      />
                    </TableHead>
                  )}
                  {columns.map((column) => (
                    <TableHead 
                      key={column.id} 
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 py-2.5",
                        column.className
                      )}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => {
                  const rowId = getRowId(row)
                  const isSelected = selectedIds.includes(rowId)

                  return (
                    <motion.tr
                      key={rowId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.3) }}
                      className={cn(
                        "border-b border-border/30 transition-colors duration-150",
                        onRowClick && "cursor-pointer hover:bg-muted/40",
                        isSelected && "bg-primary/5 hover:bg-primary/8"
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRow(rowId)}
                            aria-label={`Sélectionner la ligne ${rowId}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell 
                          key={column.id} 
                          className={cn("py-2.5 text-[13px]", column.className)}
                        >
                          {renderCell(row, column)}
                        </TableCell>
                      ))}
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
