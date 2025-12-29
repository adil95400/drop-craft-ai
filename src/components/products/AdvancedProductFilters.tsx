import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Filter,
  ChevronDown,
  X,
  RotateCcw,
  DollarSign,
  Package,
  Tag,
  TrendingUp,
  Star,
  AlertTriangle,
  Zap,
  Image,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProductFilterValues {
  search: string;
  categories: string[];
  status: 'all' | 'active' | 'inactive';
  sources: string[];
  priceRange: [number, number];
  marginRange: [number, number];
  stockRange: [number, number];
  hasImages: boolean | null;
  hasDescription: boolean | null;
  isBestseller: boolean | null;
  isTrending: boolean | null;
  isLowStock: boolean | null;
  qualityScoreMin: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedProductFiltersProps {
  filters: ProductFilterValues;
  onFiltersChange: (filters: ProductFilterValues) => void;
  categories: string[];
  sources: string[];
  maxPrice: number;
  totalProducts: number;
  filteredCount: number;
  onReset: () => void;
}

export function AdvancedProductFilters({
  filters,
  onFiltersChange,
  categories,
  sources,
  maxPrice,
  totalProducts,
  filteredCount,
  onReset
}: AdvancedProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof ProductFilterValues>(
    key: K, 
    value: ProductFilterValues[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFiltersCount = [
    filters.categories.length > 0,
    filters.status !== 'all',
    filters.sources.length > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice,
    filters.marginRange[0] > 0 || filters.marginRange[1] < 100,
    filters.hasImages !== null,
    filters.hasDescription !== null,
    filters.isBestseller !== null,
    filters.isTrending !== null,
    filters.isLowStock !== null,
    filters.qualityScoreMin > 0
  ].filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filtres avancés</span>
            <Badge variant="outline">
              {filteredCount}/{totalProducts}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] pr-4 mt-4">
          <div className="space-y-6">
            {/* Statut */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Statut
              </Label>
              <div className="flex gap-2">
                {['all', 'active', 'inactive'].map((status) => (
                  <Button
                    key={status}
                    variant={filters.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('status', status as any)}
                    className="flex-1"
                  >
                    {status === 'all' ? 'Tous' : status === 'active' ? 'Actifs' : 'Inactifs'}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Catégories */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Tag className="h-4 w-4" />
                  Catégories
                  {filters.categories.length > 0 && (
                    <Badge variant="secondary">{filters.categories.length}</Badge>
                  )}
                </Label>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 12).map((cat) => (
                    <Button
                      key={cat}
                      variant={filters.categories.includes(cat) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newCategories = filters.categories.includes(cat)
                          ? filters.categories.filter(c => c !== cat)
                          : [...filters.categories, cat];
                        updateFilter('categories', newCategories);
                      }}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Prix */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Prix (€)
              </Label>
              <div className="flex gap-4 items-center">
                <Input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => updateFilter('priceRange', [Number(e.target.value), filters.priceRange[1]])}
                  placeholder="Min"
                  className="w-24"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], Number(e.target.value)])}
                  placeholder="Max"
                  className="w-24"
                />
              </div>
              <Slider
                value={filters.priceRange}
                min={0}
                max={maxPrice}
                step={1}
                onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
              />
            </div>

            <Separator />

            {/* Marge */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Marge (%)
              </Label>
              <div className="flex gap-4 items-center">
                <span className="text-sm">{filters.marginRange[0]}%</span>
                <Slider
                  value={filters.marginRange}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => updateFilter('marginRange', value as [number, number])}
                  className="flex-1"
                />
                <span className="text-sm">{filters.marginRange[1]}%</span>
              </div>
            </div>

            <Separator />

            {/* Score qualité */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Score qualité minimum
              </Label>
              <div className="flex gap-4 items-center">
                <span className="text-sm">{filters.qualityScoreMin}%</span>
                <Slider
                  value={[filters.qualityScoreMin]}
                  min={0}
                  max={100}
                  step={10}
                  onValueChange={([value]) => updateFilter('qualityScoreMin', value)}
                  className="flex-1"
                />
              </div>
            </div>

            <Separator />

            {/* Toggles */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Filtres rapides
              </Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasImages" className="flex items-center gap-2 text-sm cursor-pointer">
                    <Image className="h-4 w-4 text-blue-500" />
                    Avec images
                  </Label>
                  <Switch
                    id="hasImages"
                    checked={filters.hasImages === true}
                    onCheckedChange={(checked) => updateFilter('hasImages', checked ? true : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="hasDescription" className="flex items-center gap-2 text-sm cursor-pointer">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Avec description
                  </Label>
                  <Switch
                    id="hasDescription"
                    checked={filters.hasDescription === true}
                    onCheckedChange={(checked) => updateFilter('hasDescription', checked ? true : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isLowStock" className="flex items-center gap-2 text-sm cursor-pointer">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Stock faible
                  </Label>
                  <Switch
                    id="isLowStock"
                    checked={filters.isLowStock === true}
                    onCheckedChange={(checked) => updateFilter('isLowStock', checked ? true : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isBestseller" className="flex items-center gap-2 text-sm cursor-pointer">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Bestsellers
                  </Label>
                  <Switch
                    id="isBestseller"
                    checked={filters.isBestseller === true}
                    onCheckedChange={(checked) => updateFilter('isBestseller', checked ? true : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isTrending" className="flex items-center gap-2 text-sm cursor-pointer">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Tendance
                  </Label>
                  <Switch
                    id="isTrending"
                    checked={filters.isTrending === true}
                    onCheckedChange={(checked) => updateFilter('isTrending', checked ? true : null)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Tri */}
            <div className="space-y-3">
              <Label>Trier par</Label>
              <div className="flex gap-2">
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilter('sortBy', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="price">Prix</SelectItem>
                    <SelectItem value="stock_quantity">Stock</SelectItem>
                    <SelectItem value="profit_margin">Marge</SelectItem>
                    <SelectItem value="created_at">Date création</SelectItem>
                    <SelectItem value="updated_at">Dernière modification</SelectItem>
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
          </div>
        </ScrollArea>

        <SheetFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Appliquer ({filteredCount})
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
