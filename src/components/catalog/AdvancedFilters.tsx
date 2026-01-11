import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Filter, 
  X, 
  DollarSign, 
  Star, 
  Package, 
  TrendingUp,
  Crown,
  Zap,
  RotateCcw
} from "lucide-react"

interface AdvancedFiltersProps {
  filters: any
  onFiltersChange: (filters: any) => void
  categories: string[]
  suppliers: { id: string; name: string }[]
}

export const AdvancedFilters = ({ 
  filters, 
  onFiltersChange, 
  categories, 
  suppliers 
}: AdvancedFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      supplier: '',
      minPrice: 0,
      maxPrice: 1000,
      minRating: 0,
      minMargin: 0,
      minStock: 0,
      isWinner: false,
      isTrending: false,
      isBestseller: false,
      sortBy: 'created_at',
      sortOrder: 'desc'
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const activeFilterCount = Object.values(localFilters).filter(value => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value !== ''
    if (typeof value === 'number') return value > 0
    return false
  }).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres avancés
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Masquer' : 'Afficher'}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Catégorie</Label>
            <Select 
              value={localFilters.category || 'all'} 
              onValueChange={(value) => updateFilter('category', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category || `cat_${Math.random()}`}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fournisseur</Label>
            <Select 
              value={localFilters.supplier || 'all'} 
              onValueChange={(value) => updateFilter('supplier', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les fournisseurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id || `sup_${Math.random()}`}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Trier par</Label>
            <Select 
              value={`${localFilters.sortBy}-${localFilters.sortOrder}`} 
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-')
                updateFilter('sortBy', sortBy)
                updateFilter('sortOrder', sortOrder)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Plus récents</SelectItem>
                <SelectItem value="price-asc">Prix croissant</SelectItem>
                <SelectItem value="price-desc">Prix décroissant</SelectItem>
                <SelectItem value="rating-desc">Mieux notés</SelectItem>
                <SelectItem value="profit_margin-desc">Meilleure marge</SelectItem>
                <SelectItem value="sales_count-desc">Plus vendus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Status Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={localFilters.isWinner ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter('isWinner', !localFilters.isWinner)}
          >
            <Crown className="w-4 h-4 mr-1" />
            Winners
          </Button>
          <Button
            variant={localFilters.isTrending ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter('isTrending', !localFilters.isTrending)}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Trending
          </Button>
          <Button
            variant={localFilters.isBestseller ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter('isBestseller', !localFilters.isBestseller)}
          >
            <Zap className="w-4 h-4 mr-1" />
            Bestsellers
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-6 pt-4 border-t">
            {/* Price Range */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4" />
                Fourchette de prix: {localFilters.minPrice}€ - {localFilters.maxPrice}€
              </Label>
              <div className="px-3">
                <Slider
                  value={[localFilters.minPrice || 0, localFilters.maxPrice || 1000]}
                  onValueChange={([min, max]) => {
                    updateFilter('minPrice', min)
                    updateFilter('maxPrice', max)
                  }}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4" />
                Note minimum: {localFilters.minRating || 0}/5
              </Label>
              <div className="px-3">
                <Slider
                  value={[localFilters.minRating || 0]}
                  onValueChange={([value]) => updateFilter('minRating', value)}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Profit Margin */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" />
                Marge minimum: {localFilters.minMargin || 0}%
              </Label>
              <div className="px-3">
                <Slider
                  value={[localFilters.minMargin || 0]}
                  onValueChange={([value]) => updateFilter('minMargin', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            {/* Stock */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4" />
                Stock minimum: {localFilters.minStock || 0} unités
              </Label>
              <div className="px-3">
                <Slider
                  value={[localFilters.minStock || 0]}
                  onValueChange={([value]) => updateFilter('minStock', value)}
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-2 block">Filtres actifs:</Label>
            <div className="flex flex-wrap gap-2">
              {localFilters.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {localFilters.category}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('category', '')}
                  />
                </Badge>
              )}
              {localFilters.supplier && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {suppliers.find(s => s.id === localFilters.supplier)?.name}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('supplier', '')}
                  />
                </Badge>
              )}
              {localFilters.isWinner && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Winners
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('isWinner', false)}
                  />
                </Badge>
              )}
              {localFilters.isTrending && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Trending
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('isTrending', false)}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}