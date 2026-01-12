/**
 * Table de données style Channable avec animations
 */

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
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
    action?: {
      label: string
      onClick: () => void
    }
  }
  loading?: boolean
  className?: string
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
  className
}: ChannableDataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds.length === data.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length

  const toggleAll = () => {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map(getRowId))
    }
  }

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const renderCell = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row)
    }
    return (row as any)[column.accessor]
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {(title || description) && (
        <CardHeader className="border-b bg-muted/30">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  {selectable && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Tout sélectionner"
                        {...(someSelected ? { 'data-state': 'indeterminate' } : {})}
                      />
                    </TableHead>
                  )}
                  {columns.map((column) => (
                    <TableHead key={column.id} className={column.className}>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={cn(
                        "border-b transition-colors",
                        onRowClick && "cursor-pointer hover:bg-muted/50",
                        isSelected && "bg-primary/5"
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRow(rowId)}
                            aria-label={`Sélectionner la ligne ${rowId}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell key={column.id} className={column.className}>
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
