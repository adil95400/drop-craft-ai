import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Filter, 
  SortAsc, 
  Grid, 
  List, 
  Download, 
  Upload, 
  Plus, 
  X, 
  Sparkles, 
  Star,
  TrendingUp,
  AlertTriangle,
  LayoutGrid,
  Table2,
  Save,
  Clock,
  ChevronDown,
  Sliders,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SavedView {
  id: string
  name: string
  filters: Record<string, any>
}

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
  categories?: string[]
  onCategoryChange?: (category: string) => void
  onStatusChange?: (status: string) => void
  onSortChange?: (sort: string) => void
  hasActiveFilters?: boolean
  onResetFilters?: () => void
  savedViews?: SavedView[]
  onSaveView?: (name: string) => void
  onLoadView?: (view: SavedView) => void
}

const QUICK_FILTERS = [
  { id: 'all', label: 'Tous', icon: LayoutGrid, color: 'bg-muted' },
  { id: 'active', label: 'Actifs', icon: Sparkles, color: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'winners', label: 'Winners', icon: Star, color: 'bg-amber-500/10 text-amber-600' },
  { id: 'trending', label: 'Trending', icon: TrendingUp, color: 'bg-purple-500/10 text-purple-600' },
  { id: 'low_stock', label: 'Stock faible', icon: AlertTriangle, color: 'bg-orange-500/10 text-orange-600' },
]

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Plus récent', icon: Clock },
  { value: 'created_at_asc', label: 'Plus ancien', icon: Clock },
  { value: 'name_asc', label: 'Nom A-Z', icon: SortAsc },
  { value: 'name_desc', label: 'Nom Z-A', icon: SortAsc },
  { value: 'price_asc', label: 'Prix croissant', icon: SortAsc },
  { value: 'price_desc', label: 'Prix décroissant', icon: SortAsc },
  { value: 'stock_asc', label: 'Stock croissant', icon: SortAsc },
  { value: 'score_desc', label: 'Meilleur score', icon: Sparkles },
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
  categories = [],
  onCategoryChange,
  onStatusChange,
  onSortChange,
  hasActiveFilters = false,
  onResetFilters,
  savedViews = [],
  onSaveView,
  onLoadView
}: ProductActionsBarProps) {
  const [activeQuickFilter, setActiveQuickFilter] = useState('all')
  const [showSaveViewPopover, setShowSaveViewPopover] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [selectedSort, setSelectedSort] = useState('created_at_desc')

  const handleQuickFilter = (filterId: string) => {
    setActiveQuickFilter(filterId)
    
    // Apply filter based on selection
    switch (filterId) {
      case 'active':
        onStatusChange?.('active')
        break
      case 'winners':
        // Would need to add winner filter
        break
      case 'trending':
        // Would need to add trending filter
        break
      case 'low_stock':
        // Would need to add low stock filter
        break
      default:
        onResetFilters?.()
    }
  }

  const handleSortChange = (value: string) => {
    setSelectedSort(value)
    onSortChange?.(value)
  }

  const handleSaveView = () => {
    if (newViewName.trim() && onSaveView) {
      onSaveView(newViewName.trim())
      setNewViewName('')
      setShowSaveViewPopover(false)
    }
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-top duration-300">
      {/* Barre principale */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        {/* Recherche et filtres */}
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          {/* Recherche améliorée */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par nom, SKU, description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 h-10 bg-background/50 backdrop-blur border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          
          {/* Filtre catégorie */}
          {onCategoryChange && categories.length > 0 && (
            <Select defaultValue="all" onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[160px] h-10 bg-background/50 backdrop-blur border-border/50">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <Separator className="my-1" />
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Tri amélioré */}
          {onSortChange && (
            <Select value={selectedSort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[160px] h-10 bg-background/50 backdrop-blur border-border/50">
                <Sliders className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Vues sauvegardées */}
          {savedViews.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-2">
                  <Clock className="h-4 w-4" />
                  Vues
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="start">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Vues sauvegardées</p>
                  {savedViews.map(view => (
                    <Button
                      key={view.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => onLoadView?.(view)}
                    >
                      {view.name}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle vue */}
          <div className="flex border border-border/50 rounded-lg overflow-hidden bg-background/50 backdrop-blur p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                "rounded-md h-8 px-3",
                viewMode === 'grid' && "shadow-sm"
              )}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={cn(
                "rounded-md h-8 px-3",
                viewMode === 'list' && "shadow-sm"
              )}
            >
              <Table2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 bg-background/50 backdrop-blur border-border/50 hover:bg-accent/50"
            onClick={onImport}
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Importer</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 bg-background/50 backdrop-blur border-border/50 hover:bg-accent/50"
            onClick={onExport}
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>

          {/* Sauvegarder la vue */}
          {onSaveView && (
            <Popover open={showSaveViewPopover} onOpenChange={setShowSaveViewPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Save className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sauvegarder</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Sauvegarder la vue</p>
                  <Input
                    placeholder="Nom de la vue..."
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveView()}
                  />
                  <Button size="sm" className="w-full" onClick={handleSaveView}>
                    Sauvegarder
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          <Button 
            onClick={onCreateNew}
            size="sm"
            className="h-9 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Filtres rapides */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {QUICK_FILTERS.map(filter => {
          const Icon = filter.icon
          const isActive = activeQuickFilter === filter.id
          
          return (
            <Button
              key={filter.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-8 rounded-full shrink-0 transition-all",
                isActive 
                  ? "bg-primary shadow-md" 
                  : "bg-background/50 hover:bg-accent/50 border-border/50"
              )}
              onClick={() => handleQuickFilter(filter.id)}
            >
              <Icon className={cn("h-3.5 w-3.5 mr-1.5", !isActive && "text-muted-foreground")} />
              {filter.label}
            </Button>
          )
        })}
        
        {hasActiveFilters && onResetFilters && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => {
                setActiveQuickFilter('all')
                onResetFilters()
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Réinitialiser
            </Button>
          </>
        )}
      </div>
      
      {/* Infos résultats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{totalCount}</span> produit{totalCount > 1 ? 's' : ''}
          </span>
          {selectedCount > 0 && (
            <Badge 
              variant="secondary" 
              className="bg-primary/10 text-primary border-primary/20 animate-in zoom-in duration-200"
            >
              {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
            </Badge>
          )}
          {hasActiveFilters && (
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
              Filtres actifs
            </Badge>
          )}
        </div>
        
        {searchTerm && (
          <p className="text-xs text-muted-foreground">
            Recherche: "<span className="font-medium">{searchTerm}</span>"
          </p>
        )}
      </div>
    </div>
  )
}