/**
 * Panneau de filtres avancés style Channable/AutoDS
 * Filtres multiples avec sauvegarde et presets
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Filter, X, Save, RotateCcw, ChevronDown, ChevronUp,
  Star, TrendingUp, Package, DollarSign, AlertTriangle,
  Target, Sparkles, Search, Bookmark, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export interface AdvancedFilterState {
  search: string
  categories: string[]
  suppliers: string[]
  sources: string[]
  status: string[]
  priceMin: number
  priceMax: number
  marginMin: number
  marginMax: number
  stockMin: number
  stockMax: number
  ratingMin: number
  scoreMin: number
  scoreMax: number
  hasImages: boolean | null
  hasSEO: boolean | null
  isBestseller: boolean | null
  isTrending: boolean | null
  isWinner: boolean | null
  hasLowStock: boolean | null
  needsOptimization: boolean | null
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilterState = {
  search: '',
  categories: [],
  suppliers: [],
  sources: [],
  status: [],
  priceMin: 0,
  priceMax: 10000,
  marginMin: 0,
  marginMax: 100,
  stockMin: 0,
  stockMax: 10000,
  ratingMin: 0,
  scoreMin: 0,
  scoreMax: 100,
  hasImages: null,
  hasSEO: null,
  isBestseller: null,
  isTrending: null,
  isWinner: null,
  hasLowStock: null,
  needsOptimization: null,
  sortBy: 'created_at',
  sortOrder: 'desc'
}

interface SavedFilter {
  id: string
  name: string
  filters: AdvancedFilterState
  createdAt: string
}

interface AdvancedFiltersPanelProps {
  filters: AdvancedFilterState
  onFiltersChange: (filters: AdvancedFilterState) => void
  categories: string[]
  suppliers: string[]
  sources: string[]
  productCount: number
  filteredCount: number
  className?: string
}

export function AdvancedFiltersPanel({
  filters,
  onFiltersChange,
  categories,
  suppliers,
  sources,
  productCount,
  filteredCount,
  className
}: AdvancedFiltersPanelProps) {
  const { toast } = useToast()
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [filterName, setFilterName] = useState('')
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'quality'])

  // Charger les filtres sauvegardés depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('shopopti_saved_filters')
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading saved filters:', e)
      }
    }
  }, [])

  const updateFilter = <K extends keyof AdvancedFilterState>(
    key: K, 
    value: AdvancedFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleArrayFilter = (key: 'categories' | 'suppliers' | 'sources' | 'status', value: string) => {
    const current = filters[key]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    updateFilter(key, updated)
  }

  const resetFilters = () => {
    onFiltersChange(DEFAULT_ADVANCED_FILTERS)
    toast({ title: 'Filtres réinitialisés' })
  }

  const saveCurrentFilters = () => {
    if (!filterName.trim()) {
      toast({ title: 'Veuillez entrer un nom pour ce filtre', variant: 'destructive' })
      return
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: { ...filters },
      createdAt: new Date().toISOString()
    }

    const updated = [...savedFilters, newFilter]
    setSavedFilters(updated)
    localStorage.setItem('shopopti_saved_filters', JSON.stringify(updated))
    setFilterName('')
    toast({ title: 'Filtre sauvegardé', description: filterName })
  }

  const loadSavedFilter = (saved: SavedFilter) => {
    onFiltersChange(saved.filters)
    toast({ title: 'Filtre chargé', description: saved.name })
  }

  const deleteSavedFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id)
    setSavedFilters(updated)
    localStorage.setItem('shopopti_saved_filters', JSON.stringify(updated))
    toast({ title: 'Filtre supprimé' })
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'sortBy' || key === 'sortOrder') return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'boolean') return value !== null
    if (typeof value === 'number') {
      const defaults = DEFAULT_ADVANCED_FILTERS[key as keyof AdvancedFilterState]
      return value !== defaults
    }
    if (typeof value === 'string') return value !== ''
    return false
  }).length

  const FilterSection = ({ 
    id, 
    title, 
    icon: Icon, 
    children 
  }: { 
    id: string
    title: string
    icon: React.ElementType
    children: React.ReactNode 
  }) => (
    <Collapsible 
      open={expandedSections.includes(id)} 
      onOpenChange={() => toggleSection(id)}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 h-auto">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{title}</span>
          </div>
          {expandedSections.includes(id) ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-4 space-y-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Filtres Avancés</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtres sauvegardés</h4>
                  {savedFilters.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun filtre sauvegardé</p>
                  ) : (
                    <div className="space-y-2">
                      {savedFilters.map(saved => (
                        <div key={saved.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 justify-start"
                            onClick={() => loadSavedFilter(saved)}
                          >
                            {saved.name}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteSavedFilter(saved.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Separator />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nom du filtre..."
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={saveCurrentFilters}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredCount} sur {productCount} produits
        </p>
      </CardHeader>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <CardContent className="space-y-1 pt-0">
          {/* Recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9"
            />
          </div>

          <Separator />

          {/* Section Basique */}
          <FilterSection id="basic" title="Catégories & Sources" icon={Package}>
            {/* Catégories */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Catégories</Label>
              <div className="flex flex-wrap gap-1">
                {categories.slice(0, 10).map(cat => (
                  <Badge
                    key={cat}
                    variant={filters.categories.includes(cat) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleArrayFilter('categories', cat)}
                  >
                    {cat}
                  </Badge>
                ))}
                {categories.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{categories.length - 10}
                  </Badge>
                )}
              </div>
            </div>

            {/* Sources */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sources</Label>
              <div className="flex flex-wrap gap-1">
                {sources.map(src => (
                  <Badge
                    key={src}
                    variant={filters.sources.includes(src) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleArrayFilter('sources', src)}
                  >
                    {src}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Statut</Label>
              <div className="flex flex-wrap gap-1">
                {['active', 'inactive', 'draft', 'published'].map(status => (
                  <Badge
                    key={status}
                    variant={filters.status.includes(status) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs capitalize"
                    onClick={() => toggleArrayFilter('status', status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>
          </FilterSection>

          <Separator />

          {/* Section Prix & Marge */}
          <FilterSection id="price" title="Prix & Marge" icon={DollarSign}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Prix (€)</Label>
                  <span className="text-xs text-muted-foreground">
                    {filters.priceMin} - {filters.priceMax}
                  </span>
                </div>
                <Slider
                  value={[filters.priceMin, filters.priceMax]}
                  min={0}
                  max={10000}
                  step={10}
                  onValueChange={([min, max]) => {
                    updateFilter('priceMin', min)
                    updateFilter('priceMax', max)
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Marge (%)</Label>
                  <span className="text-xs text-muted-foreground">
                    {filters.marginMin} - {filters.marginMax}
                  </span>
                </div>
                <Slider
                  value={[filters.marginMin, filters.marginMax]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([min, max]) => {
                    updateFilter('marginMin', min)
                    updateFilter('marginMax', max)
                  }}
                />
              </div>
            </div>
          </FilterSection>

          <Separator />

          {/* Section Qualité & Score IA */}
          <FilterSection id="quality" title="Score IA & Qualité" icon={Sparkles}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Score IA</Label>
                  <span className="text-xs text-muted-foreground">
                    {filters.scoreMin} - {filters.scoreMax}
                  </span>
                </div>
                <Slider
                  value={[filters.scoreMin, filters.scoreMax]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([min, max]) => {
                    updateFilter('scoreMin', min)
                    updateFilter('scoreMax', max)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Note minimum</Label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map(rating => (
                    <Button
                      key={rating}
                      variant={filters.ratingMin === rating ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateFilter('ratingMin', rating)}
                    >
                      {rating === 0 ? 'Tous' : <Star className={cn("h-3 w-3", rating <= filters.ratingMin && "fill-current")} />}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <Label className="text-xs">A optimiser</Label>
                  <Switch
                    checked={filters.needsOptimization === true}
                    onCheckedChange={(checked) => updateFilter('needsOptimization', checked ? true : null)}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <Label className="text-xs">Stock faible</Label>
                  <Switch
                    checked={filters.hasLowStock === true}
                    onCheckedChange={(checked) => updateFilter('hasLowStock', checked ? true : null)}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <Label className="text-xs">Avec images</Label>
                  <Switch
                    checked={filters.hasImages === true}
                    onCheckedChange={(checked) => updateFilter('hasImages', checked ? true : null)}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <Label className="text-xs">SEO complété</Label>
                  <Switch
                    checked={filters.hasSEO === true}
                    onCheckedChange={(checked) => updateFilter('hasSEO', checked ? true : null)}
                  />
                </div>
              </div>
            </div>
          </FilterSection>

          <Separator />

          {/* Section Badges */}
          <FilterSection id="badges" title="Badges & Performance" icon={TrendingUp}>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <Label className="text-xs">Bestseller</Label>
                </div>
                <Switch
                  checked={filters.isBestseller === true}
                  onCheckedChange={(checked) => updateFilter('isBestseller', checked ? true : null)}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <Label className="text-xs">Tendance</Label>
                </div>
                <Switch
                  checked={filters.isTrending === true}
                  onCheckedChange={(checked) => updateFilter('isTrending', checked ? true : null)}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <Label className="text-xs">Winner</Label>
                </div>
                <Switch
                  checked={filters.isWinner === true}
                  onCheckedChange={(checked) => updateFilter('isWinner', checked ? true : null)}
                />
              </div>
            </div>
          </FilterSection>

          <Separator />

          {/* Tri */}
          <div className="p-3 space-y-3">
            <Label className="text-xs text-muted-foreground">Trier par</Label>
            <div className="flex gap-2">
              <Select value={filters.sortBy} onValueChange={(v) => updateFilter('sortBy', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date de création</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                  <SelectItem value="stock_quantity">Stock</SelectItem>
                  <SelectItem value="ai_score">Score IA</SelectItem>
                  <SelectItem value="margin">Marge</SelectItem>
                  <SelectItem value="sales_count">Ventes</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
