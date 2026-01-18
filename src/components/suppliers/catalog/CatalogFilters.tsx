/**
 * CatalogFilters - Filtres avancés pour le catalogue
 * Recherche, filtres par fournisseur, connecteur, catégorie, prix, stock
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Truck,
  Plug,
  Tag,
  DollarSign,
  Package,
  Crown,
  TrendingUp,
  Sparkles,
  Clock,
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectorInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface SupplierInfo {
  id: string;
  name: string;
  country?: string;
}

export interface CatalogFiltersState {
  searchQuery: string;
  selectedSupplier: string;
  selectedConnector: string;
  selectedCategory: string;
  stockFilter: string;
  sortBy: string;
  priceRange: [number, number];
  marginRange: [number, number];
  onlyWinners: boolean;
  onlyTrending: boolean;
  onlyInStock: boolean;
}

interface CatalogFiltersProps {
  filters: CatalogFiltersState;
  suppliers: SupplierInfo[];
  connectors: ConnectorInfo[];
  categories: string[];
  onFiltersChange: (filters: Partial<CatalogFiltersState>) => void;
  onReset: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  totalProducts: number;
  filteredCount: number;
}

export function CatalogFilters({
  filters,
  suppliers,
  connectors,
  categories,
  onFiltersChange,
  onReset,
  onSync,
  isSyncing,
  totalProducts,
  filteredCount
}: CatalogFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const activeFiltersCount = [
    filters.selectedSupplier !== 'all',
    filters.selectedConnector !== 'all',
    filters.selectedCategory !== 'all',
    filters.stockFilter !== 'all',
    filters.onlyWinners,
    filters.onlyTrending,
    filters.onlyInStock,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 1000,
    filters.marginRange[0] > 0 || filters.marginRange[1] < 100,
  ].filter(Boolean).length;

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, SKU, description..."
              value={filters.searchQuery}
              onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
              className="pl-10 pr-10"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFiltersChange({ searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Supplier */}
            <Select
              value={filters.selectedSupplier}
              onValueChange={(v) => onFiltersChange({ selectedSupplier: v })}
            >
              <SelectTrigger className="w-[160px]">
                <Truck className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous fournisseurs</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Connector */}
            <Select
              value={filters.selectedConnector}
              onValueChange={(v) => onFiltersChange({ selectedConnector: v })}
            >
              <SelectTrigger className="w-[160px]">
                <Plug className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Connecteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous connecteurs</SelectItem>
                {connectors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category */}
            <Select
              value={filters.selectedCategory}
              onValueChange={(v) => onFiltersChange({ selectedCategory: v })}
            >
              <SelectTrigger className="w-[160px]">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'Toutes catégories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Trier
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onFiltersChange({ sortBy: 'ai_score' })}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Score IA
                  {filters.sortBy === 'ai_score' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFiltersChange({ sortBy: 'profit' })}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Meilleure marge
                  {filters.sortBy === 'profit' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFiltersChange({ sortBy: 'bestseller' })}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Best-sellers
                  {filters.sortBy === 'bestseller' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFiltersChange({ sortBy: 'price_asc' })}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Prix croissant
                  {filters.sortBy === 'price_asc' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFiltersChange({ sortBy: 'price_desc' })}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Prix décroissant
                  {filters.sortBy === 'price_desc' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onFiltersChange({ sortBy: 'newest' })}>
                  <Clock className="h-4 w-4 mr-2" />
                  Plus récents
                  {filters.sortBy === 'newest' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Advanced Filters */}
            <Sheet open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:max-w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtres avancés
                  </SheetTitle>
                  <SheetDescription>
                    {filteredCount} produits sur {totalProducts}
                  </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  {/* Quick toggles */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Filtres rapides</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span className="text-sm">Winners uniquement</span>
                        </div>
                        <Switch
                          checked={filters.onlyWinners}
                          onCheckedChange={(v) => onFiltersChange({ onlyWinners: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">Tendances uniquement</span>
                        </div>
                        <Switch
                          checked={filters.onlyTrending}
                          onCheckedChange={(v) => onFiltersChange({ onlyTrending: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm">En stock uniquement</span>
                        </div>
                        <Switch
                          checked={filters.onlyInStock}
                          onCheckedChange={(v) => onFiltersChange({ onlyInStock: v })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Prix de vente</Label>
                      <span className="text-sm text-muted-foreground">
                        {filters.priceRange[0]}€ - {filters.priceRange[1]}€
                      </span>
                    </div>
                    <Slider
                      value={filters.priceRange}
                      min={0}
                      max={1000}
                      step={10}
                      onValueChange={(v) => onFiltersChange({ priceRange: v as [number, number] })}
                      className="w-full"
                    />
                  </div>

                  {/* Margin Range */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Marge minimum</Label>
                      <span className="text-sm text-muted-foreground">
                        {filters.marginRange[0]}% - {filters.marginRange[1]}%
                      </span>
                    </div>
                    <Slider
                      value={filters.marginRange}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(v) => onFiltersChange({ marginRange: v as [number, number] })}
                      className="w-full"
                    />
                  </div>

                  {/* Stock Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Statut de stock</Label>
                    <Select
                      value={filters.stockFilter}
                      onValueChange={(v) => onFiltersChange({ stockFilter: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les stocks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les stocks</SelectItem>
                        <SelectItem value="in_stock">En stock (&gt;10)</SelectItem>
                        <SelectItem value="low_stock">Stock faible (1-10)</SelectItem>
                        <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SheetFooter className="flex gap-2">
                  <Button variant="outline" onClick={onReset} className="flex-1">
                    Réinitialiser
                  </Button>
                  <Button onClick={() => setIsAdvancedOpen(false)} className="flex-1">
                    Appliquer
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Sync Button */}
            {onSync && (
              <Button
                variant="outline"
                onClick={onSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
                Synchroniser
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
            {filters.selectedSupplier !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                <Truck className="h-3 w-3" />
                {suppliers.find(s => s.id === filters.selectedSupplier)?.name}
                <button onClick={() => onFiltersChange({ selectedSupplier: 'all' })}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {filters.selectedConnector !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                <Plug className="h-3 w-3" />
                {connectors.find(c => c.id === filters.selectedConnector)?.name}
                <button onClick={() => onFiltersChange({ selectedConnector: 'all' })}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {filters.selectedCategory !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                <Tag className="h-3 w-3" />
                {filters.selectedCategory}
                <button onClick={() => onFiltersChange({ selectedCategory: 'all' })}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {filters.onlyWinners && (
              <Badge variant="secondary" className="gap-1">
                <Crown className="h-3 w-3" />
                Winners
                <button onClick={() => onFiltersChange({ onlyWinners: false })}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {filters.onlyTrending && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                Tendances
                <button onClick={() => onFiltersChange({ onlyTrending: false })}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-6 text-xs"
            >
              Tout effacer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
