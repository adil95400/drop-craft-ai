import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Search, Filter, SortAsc, SortDesc, Grid, List, Download, Upload, Plus, X, 
  RefreshCw, Sparkles, AlertTriangle, ChevronDown, ArrowUpDown
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
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

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
  { value: 'name_asc', label: 'Nom A → Z', icon: SortAsc },
  { value: 'name_desc', label: 'Nom Z → A', icon: SortDesc },
  { value: 'price_asc', label: 'Prix ↑', icon: SortAsc },
  { value: 'price_desc', label: 'Prix ↓', icon: SortDesc },
  { value: 'stock_quantity_asc', label: 'Stock faible', icon: AlertTriangle },
  { value: 'stock_quantity_desc', label: 'Stock élevé', icon: SortDesc },
  { value: 'ai_score_desc', label: 'Meilleur score', icon: Sparkles },
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
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Actions Row */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-stretch lg:items-center">
        {/* Search & Filters */}
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md group">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Rechercher produits, SKU, catégorie..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 h-10 bg-background/80 backdrop-blur border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all rounded-xl"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => onSearchChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {onCategoryChange && categories.length > 0 && (
            <Select defaultValue="all" onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[160px] h-10 bg-background/80 backdrop-blur border-border/50 rounded-xl">
                <Filter className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {onStatusChange && (
            <Select defaultValue="all" onValueChange={onStatusChange}>
              <SelectTrigger className="w-[140px] h-10 bg-background/80 backdrop-blur border-border/50 rounded-xl">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="z-[100] rounded-xl">
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
                <Button variant="outline" size="sm" className="h-10 gap-2 bg-background/80 backdrop-blur border-border/50 rounded-xl px-4">
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Trier</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px] rounded-xl">
                <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {SORT_OPTIONS.map(option => {
                    const Icon = option.icon
                    return (
                      <DropdownMenuItem 
                        key={option.value} 
                        onClick={() => onSortChange(option.value)}
                        className="gap-3 cursor-pointer"
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
          <TooltipProvider delayDuration={300}>
            <div className="flex border border-border/50 rounded-xl overflow-hidden bg-background/80 backdrop-blur">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onViewModeChange('grid')}
                    className={cn(
                      "rounded-none h-10 w-10 border-0",
                      viewMode === 'grid' && "shadow-sm"
                    )}
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
                    className={cn(
                      "rounded-none h-10 w-10 border-0",
                      viewMode === 'list' && "shadow-sm"
                    )}
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
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="h-10 w-10 bg-background/80 backdrop-blur border-border/50 hover:bg-accent/50 rounded-xl"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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
            className="h-10 bg-background/80 backdrop-blur border-border/50 hover:bg-accent/50 rounded-xl gap-2"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importer</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExport}
            className="h-10 bg-background/80 backdrop-blur border-border/50 hover:bg-accent/50 rounded-xl gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
          
          <Button 
            onClick={onCreateNew}
            className="h-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau</span>
          </Button>
        </div>
      </div>
      
      {/* Results Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">
            {totalCount.toLocaleString()} produit{totalCount > 1 ? 's' : ''}
          </span>
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </Badge>
            </motion.div>
          )}
        </div>
        
        {hasActiveFilters && onResetFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onResetFilters}
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
            >
              <X className="h-4 w-4" />
              Réinitialiser les filtres
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
