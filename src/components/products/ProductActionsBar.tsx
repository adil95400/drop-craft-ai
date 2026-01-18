import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Search, Filter, SortAsc, SortDesc, Grid, List, Download, Upload, Plus, X, 
  RefreshCw, Sparkles, Image, AlertTriangle, ChevronDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  onRefresh?: () => void
  categories?: string[]
  onCategoryChange?: (category: string) => void
  onStatusChange?: (status: string) => void
  onSortChange?: (sort: string) => void
  hasActiveFilters?: boolean
  onResetFilters?: () => void
  isLoading?: boolean
}

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Plus récent', icon: SortDesc },
  { value: 'created_at_asc', label: 'Plus ancien', icon: SortAsc },
  { value: 'name_asc', label: 'Nom A-Z', icon: SortAsc },
  { value: 'name_desc', label: 'Nom Z-A', icon: SortDesc },
  { value: 'price_asc', label: 'Prix croissant', icon: SortAsc },
  { value: 'price_desc', label: 'Prix décroissant', icon: SortDesc },
  { value: 'stock_quantity_asc', label: 'Stock faible', icon: AlertTriangle },
  { value: 'stock_quantity_desc', label: 'Stock élevé', icon: SortDesc },
  { value: 'ai_score_desc', label: 'Meilleur score IA', icon: Sparkles },
  { value: 'ai_score_asc', label: 'À optimiser', icon: AlertTriangle },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'archived', label: 'Archivé' },
]

export function ProductActionsBar({
  searchTerm,
  onSearchChange,
  selectedCount,
  totalCount,
  viewMode,
  onViewModeChange,
  onCreateNew,
  onImport,
  onExport,
  onRefresh,
  categories = [],
  onCategoryChange,
  onStatusChange,
  onSortChange,
  hasActiveFilters = false,
  onResetFilters,
  isLoading = false
}: ProductActionsBarProps) {
  return (
    <div className="space-y-4 animate-in slide-in-from-top duration-300">
      {/* Top Actions */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-stretch lg:items-center">
        {/* Search & Filters */}
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher produits, SKU..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur border-border/50 focus:border-primary/50 transition-colors"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {onCategoryChange && (
            <Select defaultValue="all" onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[160px] bg-background/50 backdrop-blur border-border/50">
                <Filter className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {onStatusChange && (
            <Select defaultValue="all" onValueChange={onStatusChange}>
              <SelectTrigger className="w-[150px] bg-background/50 backdrop-blur border-border/50">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-popover">
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {onSortChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-background/50 backdrop-blur border-border/50">
                  <SortAsc className="h-4 w-4" />
                  Trier
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {SORT_OPTIONS.map(option => {
                    const Icon = option.icon
                    return (
                      <DropdownMenuItem 
                        key={option.value} 
                        onClick={() => onSortChange(option.value)}
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {option.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <TooltipProvider>
            <div className="flex border border-border/50 rounded-lg overflow-hidden bg-background/50 backdrop-blur">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onViewModeChange('grid')}
                    className="rounded-none border-0"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vue grille</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onViewModeChange('list')}
                    className="rounded-none border-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vue tableau</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Refresh Button */}
          {onRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="bg-background/50 backdrop-blur border-border/50 hover:bg-accent/50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Actualiser</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
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
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>
      </div>
      
      {/* Results Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="font-medium">
            {totalCount.toLocaleString()} produit{totalCount > 1 ? 's' : ''}
          </span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        {hasActiveFilters && onResetFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onResetFilters}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
            Réinitialiser les filtres
          </Button>
        )}
      </div>
    </div>
  )
}