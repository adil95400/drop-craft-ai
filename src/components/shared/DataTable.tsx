/**
 * DataTable — Composant socle générique pour listes de données
 * Design Channable : compact, header sticky, actions par ligne
 */
import { memo, ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  /** Clé unique */
  key: string;
  /** Label affiché dans le header */
  header: string;
  /** Rendu personnalisé de la cellule */
  render: (row: T, index: number) => ReactNode;
  /** Classe CSS pour la colonne */
  className?: string;
  /** Alignement */
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  /** Données à afficher */
  data: T[];
  /** Colonnes */
  columns: DataTableColumn<T>[];
  /** Clé unique par ligne */
  rowKey: (row: T, index: number) => string;
  /** Chargement */
  isLoading?: boolean;
  /** Message vide */
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Clic sur une ligne */
  onRowClick?: (row: T) => void;
  /** Classes */
  className?: string;
}

function DataTableInner<T>({
  data,
  columns,
  rowKey,
  isLoading,
  emptyIcon,
  emptyTitle = 'Aucune donnée',
  emptyDescription,
  emptyAction,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          {emptyIcon && <div className="mb-3">{emptyIcon}</div>}
          <h3 className="text-base font-semibold mb-1">{emptyTitle}</h3>
          {emptyDescription && <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">{emptyDescription}</p>}
          {emptyAction}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wider whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow
                key={rowKey(row, i)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/30'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      'py-3',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className
                    )}
                  >
                    {col.render(row, i)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
