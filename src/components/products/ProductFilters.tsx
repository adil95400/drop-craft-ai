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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

export interface ProductFiltersState {
  search: string
  category: string
  status: string
  priceMin: string
  priceMax: string
  stockMin: string
  lowStock: boolean
  source: string
}

interface ProductFiltersProps {
  filters: ProductFiltersState
  onFiltersChange: (filters: ProductFiltersState) => void
  categories: string[]
  className?: string
}

export function ProductFilters({ 
  filters, 
  onFiltersChange, 
  categories,
  className 
}: ProductFiltersProps) {
  const [open, setOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const isMobile = useIsMobile()

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return false
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
      source: 'all'
    })
  }

  const updateFilter = (key: keyof ProductFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Catégorie */}
      <div className="space-y-2">
        <Label className="text-sm">Catégorie</Label>
        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statut */}
      <div className="space-y-2">
        <Label className="text-sm">Statut</Label>
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Source */}
      <div className="space-y-2">
        <Label className="text-sm">Source</Label>
        <Select value={filters.source} onValueChange={(value) => updateFilter('source', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes sources</SelectItem>
            <SelectItem value="products">Manuels</SelectItem>
            <SelectItem value="imported">Importés</SelectItem>
            <SelectItem value="catalog">Catalogue</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prix */}
      <div className="space-y-2">
        <Label className="text-sm">Prix (€)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => updateFilter('priceMin', e.target.value)}
            className="flex-1"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => updateFilter('priceMax', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Stock */}
      <div className="space-y-2">
        <Label className="text-sm">Stock minimum</Label>
        <Input
          type="number"
          placeholder="Ex: 10"
          value={filters.stockMin}
          onChange={(e) => updateFilter('stockMin', e.target.value)}
        />
      </div>

      {/* Stock faible */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="lowStock"
          checked={filters.lowStock}
          onChange={(e) => updateFilter('lowStock', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="lowStock" className="cursor-pointer text-sm">
          Stock faible uniquement (&lt; 10)
        </Label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {activeFiltersCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReset}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        )}
        <Button 
          className="flex-1" 
          size="sm"
          onClick={() => {
            setOpen(false)
            setSheetOpen(false)
          }}
        >
          Appliquer
        </Button>
      </div>
    </div>
  )

  // Mobile Layout
  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="default" 
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader className="pb-4">
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-full pb-20">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Desktop Layout
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Barre de recherche */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, SKU, catégorie..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Catégorie */}
      <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
        <SelectTrigger className="w-[150px]">
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
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous statuts</SelectItem>
          <SelectItem value="active">Actif</SelectItem>
          <SelectItem value="inactive">Inactif</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtres avancés */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="default" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Plus
            {activeFiltersCount > 0 && (
              <Badge 
                variant="default" 
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <FilterContent />
        </PopoverContent>
      </Popover>

      {/* Badge compteur actif */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleReset}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Effacer ({activeFiltersCount})
        </Button>
      )}
    </div>
  )
}