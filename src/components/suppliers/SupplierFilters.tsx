/**
 * SupplierFilters - Filter bar for supplier catalog
 * Extracted from ChannableStyleSuppliersPage
 */

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Search, MapPin, Ship } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SUPPLIER_CATEGORIES, COUNTRY_OPTIONS, SHIPPING_ZONES, ALL_SUPPLIER_DEFINITIONS 
} from '@/data/supplierDefinitions';

interface SupplierFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  selectedCountry: string;
  onCountryChange: (value: string) => void;
  selectedShippingZone: string;
  onShippingZoneChange: (value: string) => void;
  sortBy: 'popular' | 'name' | 'rating' | 'products';
  onSortChange: (value: 'popular' | 'name' | 'rating' | 'products') => void;
  onResetFilters: () => void;
}

export const SupplierFilters = memo(function SupplierFilters({
  searchTerm,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  selectedCountry,
  onCountryChange,
  selectedShippingZone,
  onShippingZoneChange,
  sortBy,
  onSortChange,
  onResetFilters
}: SupplierFiltersProps) {
  const hasActiveFilters = selectedCountry !== 'all' || selectedShippingZone !== 'all' || activeCategory !== 'all';

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Country Filter */}
        <Select value={selectedCountry} onValueChange={onCountryChange}>
          <SelectTrigger className="w-48">
            <MapPin className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Pays" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_OPTIONS.map(country => (
              <SelectItem key={country.id} value={country.id}>
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Shipping Zone Filter */}
        <Select value={selectedShippingZone} onValueChange={onShippingZoneChange}>
          <SelectTrigger className="w-48">
            <Ship className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Zone d'expédition" />
          </SelectTrigger>
          <SelectContent>
            {SHIPPING_ZONES.map(zone => (
              <SelectItem key={zone.id} value={zone.id}>
                <span className="flex items-center gap-2">
                  <zone.icon className="w-4 h-4" />
                  {zone.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Plus populaires</SelectItem>
            <SelectItem value="rating">Meilleures notes</SelectItem>
            <SelectItem value="products">Plus de produits</SelectItem>
            <SelectItem value="name">Alphabétique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Filtres actifs:</span>
          {activeCategory !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {SUPPLIER_CATEGORIES.find(c => c.id === activeCategory)?.label}
              <button onClick={() => onCategoryChange('all')} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {selectedCountry !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {COUNTRY_OPTIONS.find(c => c.id === selectedCountry)?.label}
              <button onClick={() => onCountryChange('all')} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {selectedShippingZone !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {SHIPPING_ZONES.find(z => z.id === selectedShippingZone)?.label}
              <button onClick={() => onShippingZoneChange('all')} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onResetFilters}>
            Réinitialiser
          </Button>
        </div>
      )}

      {/* Categories */}
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-2">
          {SUPPLIER_CATEGORIES.map(category => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            const count = category.id === 'all' 
              ? ALL_SUPPLIER_DEFINITIONS.length 
              : ALL_SUPPLIER_DEFINITIONS.filter(d => d.category === category.id).length;
            
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                className={cn("whitespace-nowrap gap-2", isActive && "shadow-md")}
              >
                <Icon className="w-4 h-4" />
                {category.label}
                <Badge variant={isActive ? "secondary" : "outline"} className="ml-1 text-xs">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
});
