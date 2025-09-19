import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, SortAsc, Grid, List, Download, Upload, Plus } from 'lucide-react'

interface ProductActionsBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCount: number
  totalCount: number
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onCreateNew: () => void
  onImport: () => void
  onExport: () => void
}

export function ProductActionsBar({
  searchTerm,
  onSearchChange,
  selectedCount,
  totalCount,
  viewMode,
  onViewModeChange,
  onCreateNew,
  onImport,
  onExport
}: ProductActionsBarProps) {
  return (
    <div className="space-y-4">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
              <SelectItem value="low-stock">Stock faible</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="created_at">
            <SelectTrigger className="w-[140px]">
              <SortAsc className="h-4 w-4" />
              <SelectValue placeholder="Trier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Plus récent</SelectItem>
              <SelectItem value="name">Nom A-Z</SelectItem>
              <SelectItem value="price">Prix croissant</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>
      </div>
      
      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>{totalCount} produit(s)</span>
          {selectedCount > 0 && (
            <Badge variant="secondary">
              {selectedCount} sélectionné(s)
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span>Affichage:</span>
          <Select defaultValue="20">
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>par page</span>
        </div>
      </div>
    </div>
  )
}