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
    <div className="space-y-4 animate-in slide-in-from-top duration-300">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px] bg-background/50 backdrop-blur border-border/50">
              <Filter className="h-4 w-4 mr-2" />
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
            <SelectTrigger className="w-[140px] bg-background/50 backdrop-blur border-border/50">
              <SortAsc className="h-4 w-4 mr-2" />
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
        
        <div className="flex items-center space-x-2 flex-wrap">
          <div className="flex border border-border/50 rounded-lg overflow-hidden bg-background/50 backdrop-blur">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-none border-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-none border-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onImport}
            className="bg-background/50 backdrop-blur border-border/50 hover:bg-accent/50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExport}
            className="bg-background/50 backdrop-blur border-border/50 hover:bg-accent/50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          
          <Button 
            onClick={onCreateNew}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>
      </div>
      
      {/* Results Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span className="font-medium">{totalCount} produit(s)</span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {selectedCount} sélectionné(s)
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline">Affichage:</span>
          <Select defaultValue="20">
            <SelectTrigger className="w-16 h-8 bg-background/50 backdrop-blur border-border/50">
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