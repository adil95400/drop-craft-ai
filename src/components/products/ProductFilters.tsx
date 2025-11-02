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
import { Badge } from '@/components/ui/badge'
import { Filter, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProductFiltersState {
  search: string
  category: string
  status: string
  priceMin: string
  priceMax: string
  stockMin: string
  lowStock: boolean
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

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return false // Ne pas compter la recherche
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
      lowStock: false
    })
  }

  const updateFilter = (key: keyof ProductFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Barre de recherche */}
      <div className="relative flex-1 max-w-sm">
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
        <SelectTrigger className="w-[180px]">
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
        <SelectTrigger className="w-[150px]">
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
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Filtres avancés</h4>
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

            <div className="space-y-3">
              {/* Prix */}
              <div className="space-y-2">
                <Label>Prix (€)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) => updateFilter('priceMin', e.target.value)}
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) => updateFilter('priceMax', e.target.value)}
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <Label>Stock minimum</Label>
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
                <Label htmlFor="lowStock" className="cursor-pointer">
                  Afficher uniquement les produits à stock faible (&lt; 10)
                </Label>
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
