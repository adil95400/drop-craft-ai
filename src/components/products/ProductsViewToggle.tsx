import { Button } from '@/components/ui/button'
import { LayoutGrid, Table } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'table'

interface ProductsViewToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}

export function ProductsViewToggle({ view, onViewChange }: ProductsViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-background p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('grid')}
        className={cn(
          'h-8 px-3',
          view === 'grid' && 'bg-muted'
        )}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Grille
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('table')}
        className={cn(
          'h-8 px-3',
          view === 'table' && 'bg-muted'
        )}
      >
        <Table className="h-4 w-4 mr-2" />
        Tableau
      </Button>
    </div>
  )
}
