'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SlidersHorizontal, Filter } from 'lucide-react';

interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
}

interface OptimizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  rowKey: keyof T;
  emptyState?: React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  actions?: (row: T) => React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
}

export function OptimizedTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  searchable = true,
  searchPlaceholder = 'Rechercher...',
  onRowClick,
  rowKey,
  emptyState,
  pagination,
  actions,
  className,
  stickyHeader = true,
}: OptimizedTableProps<T>) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const value = col.accessorKey ? row[col.accessorKey] : '';
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const visibleColumns = isMobile ? columns.filter((col) => !col.hideOnMobile) : columns;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {searchable && <Skeleton className="h-10 w-full max-w-sm" />}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className={cn('space-y-4', className)}>
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {sortedData.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {emptyState || (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Aucun résultat trouvé
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              {sortedData.map((row, index) => (
                <motion.div
                  key={String(row[rowKey])}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className={cn(
                      'overflow-hidden transition-all',
                      onRowClick && 'cursor-pointer hover:shadow-md hover:border-primary/30'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    <CardContent className="p-4 space-y-3">
                      {visibleColumns.map((col) => (
                        <div key={col.id} className="flex justify-between items-center gap-2">
                          <span className="text-sm text-muted-foreground flex-shrink-0">{col.header}</span>
                          <span className="text-sm font-medium text-right truncate">
                            {col.cell ? col.cell(row) : String(col.accessorKey ? row[col.accessorKey] : '-')}
                          </span>
                        </div>
                      ))}
                      {actions && (
                        <div className="pt-2 border-t flex justify-end gap-2">
                          {actions(row)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {pagination && pagination.total > pagination.pageSize && (
          <MobilePagination {...pagination} />
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn('space-y-4', className)}>
      {searchable && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="text-xs">
            {sortedData.length} résultat{sortedData.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className={cn('overflow-auto', stickyHeader && 'max-h-[600px]')}>
          <Table>
            <TableHeader className={cn(stickyHeader && 'sticky top-0 bg-card z-10')}>
              <TableRow className="hover:bg-transparent">
                {visibleColumns.map((col) => (
                  <TableHead
                    key={col.id}
                    className={cn(
                      col.className,
                      col.sortable && 'cursor-pointer select-none hover:bg-muted/50 transition-colors'
                    )}
                    onClick={() => col.sortable && handleSort(col.accessorKey as string)}
                  >
                    <div className="flex items-center gap-2">
                      {col.header}
                      {col.sortable && sortConfig?.key === col.accessorKey && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + (actions ? 1 : 0)} className="h-32 text-center">
                      {emptyState || 'Aucun résultat trouvé'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((row, index) => (
                    <motion.tr
                      key={String(row[rowKey])}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        'border-b transition-colors hover:bg-muted/50',
                        onRowClick && 'cursor-pointer'
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {visibleColumns.map((col) => (
                        <TableCell key={col.id} className={col.className}>
                          {col.cell ? col.cell(row) : String(col.accessorKey ? row[col.accessorKey] : '-')}
                        </TableCell>
                      ))}
                      {actions && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">{actions(row)}</div>
                        </TableCell>
                      )}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && pagination.total > pagination.pageSize && (
        <DesktopPagination {...pagination} />
      )}
    </div>
  );
}

// Pagination components
function MobilePagination({ page, pageSize, total, onPageChange }: NonNullable<OptimizedTableProps<any>['pagination']>) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function DesktopPagination({ page, pageSize, total, onPageChange }: NonNullable<OptimizedTableProps<any>['pagination']>) {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        Affichage {startItem}-{endItem} sur {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? 'default' : 'outline'}
                size="sm"
                className="w-9"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Suivant
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
