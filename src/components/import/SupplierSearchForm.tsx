import React, { useState } from 'react'
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SearchFilters } from '@/hooks/useSearchAllSuppliers'

interface Platform {
  id: string
  name: string
  icon: string
  searchable: boolean
}

interface SupplierSearchFormProps {
  onSearch: (query: string, filters?: SearchFilters) => void
  isSearching: boolean
  supportedPlatforms: Platform[]
}

export function SupplierSearchForm({ 
  onSearch, 
  isSearching, 
  supportedPlatforms 
}: SupplierSearchFormProps) {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [maxShipping, setMaxShipping] = useState<number>(50)
  const [minRating, setMinRating] = useState<number>(0)
  const [inStockOnly, setInStockOnly] = useState(false)

  const handleSearch = () => {
    const filters: SearchFilters = {
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 100 ? priceRange[1] : undefined,
      maxShipping: maxShipping < 50 ? maxShipping : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      inStockOnly: inStockOnly || undefined
    }
    onSearch(query, filters)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch()
    }
  }

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const selectAllPlatforms = () => {
    setSelectedPlatforms(supportedPlatforms.filter(p => p.searchable).map(p => p.id))
  }

  const clearPlatforms = () => {
    setSelectedPlatforms([])
  }

  const resetFilters = () => {
    setSelectedPlatforms([])
    setPriceRange([0, 100])
    setMaxShipping(50)
    setMinRating(0)
    setInStockOnly(false)
  }

  const hasActiveFilters = selectedPlatforms.length > 0 || 
    priceRange[0] > 0 || 
    priceRange[1] < 100 || 
    maxShipping < 50 || 
    minRating > 0 || 
    inStockOnly

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit sur toutes les plateformes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 h-12 text-base"
            disabled={isSearching}
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-12 w-12"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className={`h-4 w-4 ${hasActiveFilters ? 'text-primary' : ''}`} />
        </Button>
        <Button 
          onClick={handleSearch} 
          disabled={isSearching || !query.trim()}
          className="h-12 px-6"
        >
          {isSearching ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Recherche...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </>
          )}
        </Button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filtres actifs:</span>
          {selectedPlatforms.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {selectedPlatforms.length} plateformes
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={clearPlatforms}
              />
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 100) && (
            <Badge variant="secondary">
              ${priceRange[0]} - ${priceRange[1]}
            </Badge>
          )}
          {maxShipping < 50 && (
            <Badge variant="secondary">
              Livraison max: ${maxShipping}
            </Badge>
          )}
          {minRating > 0 && (
            <Badge variant="secondary">
              Note min: {minRating}★
            </Badge>
          )}
          {inStockOnly && (
            <Badge variant="secondary">
              En stock uniquement
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Réinitialiser
          </Button>
        </div>
      )}

      {/* Filters Panel */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleContent className="space-y-6 pt-4 border-t">
          {/* Platform Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Plateformes</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllPlatforms}>
                  Tout sélectionner
                </Button>
                <Button variant="ghost" size="sm" onClick={clearPlatforms}>
                  Tout désélectionner
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {supportedPlatforms.filter(p => p.searchable).map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-lg border transition-all
                    ${selectedPlatforms.includes(platform.id) 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border hover:border-primary/50 hover:bg-muted'}
                  `}
                >
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="text-xs font-medium truncate w-full text-center">
                    {platform.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Prix (USD)</Label>
            <div className="px-2">
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}{priceRange[1] === 100 ? '+' : ''}</span>
              </div>
            </div>
          </div>

          {/* Shipping Cost */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Livraison max (USD)</Label>
            <div className="px-2">
              <Slider
                value={[maxShipping]}
                onValueChange={(value) => setMaxShipping(value[0])}
                max={50}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>$0</span>
                <span>${maxShipping}{maxShipping === 50 ? '+' : ''}</span>
              </div>
            </div>
          </div>

          {/* Min Rating */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Note minimale</Label>
            <div className="flex gap-2">
              {[0, 3, 3.5, 4, 4.5].map((rating) => (
                <Button
                  key={rating}
                  variant={minRating === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMinRating(rating)}
                >
                  {rating === 0 ? 'Toutes' : `${rating}★+`}
                </Button>
              ))}
            </div>
          </div>

          {/* In Stock Only */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="inStock" 
              checked={inStockOnly}
              onCheckedChange={(checked) => setInStockOnly(!!checked)}
            />
            <Label htmlFor="inStock" className="cursor-pointer">
              Afficher uniquement les produits en stock
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
