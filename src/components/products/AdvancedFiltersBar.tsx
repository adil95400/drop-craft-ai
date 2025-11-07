import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Filter, 
  X, 
  Search, 
  Save, 
  ChevronDown,
  Star,
  TrendingUp,
  Clock,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AdvancedFiltersState {
  search: string
  category: string
  status: string
  priceMin: string
  priceMax: string
  stockMin: string
  lowStock: boolean
  source: string
  marginMin: string
  hasImages: boolean
  sortBy: string
}

interface SavedFilter {
  id: string
  name: string
  filters: AdvancedFiltersState
  icon?: React.ElementType
}

interface AdvancedFiltersBarProps {
  filters: AdvancedFiltersState
  onFiltersChange: (filters: AdvancedFiltersState) => void
  categories: string[]
  className?: string
}

const SAVED_FILTERS: SavedFilter[] = [
  {
    id: 'trending',
    name: 'Produits tendance',
    icon: TrendingUp,
    filters: {
      search: '',
      category: 'all',
      status: 'active',
      priceMin: '20',
      priceMax: '100',
      stockMin: '',
      lowStock: false,
      source: 'all',
      marginMin: '30',
      hasImages: true,
      sortBy: 'price-desc'
    }
  },
  {
    id: 'best-sellers',
    name: 'Meilleures ventes',
    icon: Star,
    filters: {
      search: '',
      category: 'all',
      status: 'active',
      priceMin: '',
      priceMax: '',
      stockMin: '50',
      lowStock: false,
      source: 'all',
      marginMin: '25',
      hasImages: true,
      sortBy: 'name-asc'
    }
  },
  {
    id: 'new-products',
    name: 'Nouveaux produits',
    icon: Clock,
    filters: {
      search: '',
      category: 'all',
      status: 'active',
      priceMin: '',
      priceMax: '',
      stockMin: '',
      lowStock: false,
      source: 'imported',
      marginMin: '',
      hasImages: false,
      sortBy: 'name-asc'
    }
  }
]

export function AdvancedFiltersBar({ 
  filters, 
  onFiltersChange, 
  categories,
  className 
}: AdvancedFiltersBarProps) {
  const [open, setOpen] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search' || key === 'sortBy') return false
    if (typeof value === 'boolean') return value
    return value && value !== 'all' && value !== ''
  }).length

  const handleReset = () => {
    onFiltersChange({
      search: '',
      category: 'all',
      status: 'all',
      priceMin: '',
      priceMax: '',
      stockMin: '',
      lowStock: false,
      source: 'all',
      marginMin: '',
      hasImages: false,
      sortBy: 'name-asc'
    })
  }

  const updateFilter = (key: keyof AdvancedFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    onFiltersChange(savedFilter.filters)
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Première ligne : Recherche et filtres rapides */}
      <div className="flex items-center gap-2">
        {/* Barre de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, SKU, description..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Catégorie */}
        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Statut */}
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-[140px] h-10">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Actif
              </div>
            </SelectItem>
            <SelectItem value="inactive">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                Inactif
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Source */}
        <Select value={filters.source} onValueChange={(value) => updateFilter('source', value)}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes sources</SelectItem>
            <SelectItem value="products">Manuel</SelectItem>
            <SelectItem value="imported">Importé</SelectItem>
            <SelectItem value="catalog">Catalogue</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>

        {/* Tri */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nom (Z-A)</SelectItem>
            <SelectItem value="price-asc">Prix (croissant)</SelectItem>
            <SelectItem value="price-desc">Prix (décroissant)</SelectItem>
            <SelectItem value="stock-asc">Stock (croissant)</SelectItem>
            <SelectItem value="stock-desc">Stock (décroissant)</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtres avancés */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default" className="relative h-10">
              <Filter className="h-4 w-4 mr-2" />
              Filtres avancés
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="default" 
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base">Filtres avancés</h4>
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleReset}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Prix */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fourchette de prix (€)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin}
                      onChange={(e) => updateFilter('priceMin', e.target.value)}
                      className="h-9"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax}
                      onChange={(e) => updateFilter('priceMax', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Stock minimum</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 10"
                    value={filters.stockMin}
                    onChange={(e) => updateFilter('stockMin', e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Marge */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Marge minimale (%)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 30"
                    value={filters.marginMin}
                    onChange={(e) => updateFilter('marginMin', e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Options booléennes */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lowStock"
                      checked={filters.lowStock}
                      onChange={(e) => updateFilter('lowStock', e.target.checked)}
                      className="rounded border-gray-300 h-4 w-4"
                    />
                    <Label htmlFor="lowStock" className="cursor-pointer text-sm">
                      Uniquement stock faible (&lt; 10)
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasImages"
                      checked={filters.hasImages}
                      onChange={(e) => updateFilter('hasImages', e.target.checked)}
                      className="rounded border-gray-300 h-4 w-4"
                    />
                    <Label htmlFor="hasImages" className="cursor-pointer text-sm">
                      Uniquement avec images
                    </Label>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setOpen(false)}
              >
                Appliquer les filtres
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Vues sauvegardées */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="default" className="h-10">
              <Save className="h-4 w-4 mr-2" />
              Vues
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Vues sauvegardées</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SAVED_FILTERS.map((savedFilter) => {
              const Icon = savedFilter.icon || Star
              return (
                <DropdownMenuItem 
                  key={savedFilter.id}
                  onClick={() => loadSavedFilter(savedFilter)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {savedFilter.name}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Sauvegarder la vue actuelle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Badge compteur actif */}
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground h-10"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer ({activeFiltersCount})
          </Button>
        )}
      </div>
    </div>
  )
}
