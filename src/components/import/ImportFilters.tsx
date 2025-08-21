import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Filter,
  X,
  Calendar,
  DollarSign,
  Package,
  Star,
  TrendingUp
} from 'lucide-react';

interface ImportFiltersProps {
  filters: {
    search: string;
    status: string[];
    category: string[];
    supplier: string[];
    priceRange: [number, number];
    dateRange: {
      from: string;
      to: string;
    };
    aiOptimized: boolean | null;
    hasImages: boolean | null;
    hasDescription: boolean | null;
    stockStatus: string;
  };
  onFiltersChange: (filters: any) => void;
  categories: string[];
  suppliers: string[];
}

export const ImportFilters = ({ 
  filters, 
  onFiltersChange, 
  categories, 
  suppliers 
}: ImportFiltersProps) => {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      category: [],
      supplier: [],
      priceRange: [0, 1000],
      dateRange: { from: '', to: '' },
      aiOptimized: null,
      hasImages: null,
      hasDescription: null,
      stockStatus: 'all'
    });
  };

  const activeFiltersCount = [
    filters.status.length > 0,
    filters.category.length > 0,
    filters.supplier.length > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 1000,
    filters.dateRange.from || filters.dateRange.to,
    filters.aiOptimized !== null,
    filters.hasImages !== null,
    filters.hasDescription !== null,
    filters.stockStatus !== 'all'
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres avancés
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <Label htmlFor="search" className="text-sm font-medium">
            Recherche globale
          </Label>
          <Input
            id="search"
            placeholder="Nom, SKU, description, fournisseur..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Status Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Statut</Label>
          <div className="flex flex-wrap gap-2">
            {['draft', 'published', 'archived'].map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.status.includes(status)}
                  onCheckedChange={(checked) => {
                    const newStatus = checked
                      ? [...filters.status, status]
                      : filters.status.filter(s => s !== status);
                    updateFilter('status', newStatus);
                  }}
                />
                <Label htmlFor={`status-${status}`} className="text-sm">
                  {status === 'draft' ? 'Brouillon' : 
                   status === 'published' ? 'Publié' : 'Archivé'}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Catégories</Label>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${category}`}
                  checked={filters.category.includes(category)}
                  onCheckedChange={(checked) => {
                    const newCategories = checked
                      ? [...filters.category, category]
                      : filters.category.filter(c => c !== category);
                    updateFilter('category', newCategories);
                  }}
                />
                <Label htmlFor={`cat-${category}`} className="text-sm">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Suppliers */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Fournisseurs</Label>
          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
            {suppliers.slice(0, 10).map((supplier) => (
              <div key={supplier} className="flex items-center space-x-2">
                <Checkbox
                  id={`sup-${supplier}`}
                  checked={filters.supplier.includes(supplier)}
                  onCheckedChange={(checked) => {
                    const newSuppliers = checked
                      ? [...filters.supplier, supplier]
                      : filters.supplier.filter(s => s !== supplier);
                    updateFilter('supplier', newSuppliers);
                  }}
                />
                <Label htmlFor={`sup-${supplier}`} className="text-sm truncate">
                  {supplier}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Fourchette de prix: €{filters.priceRange[0]} - €{filters.priceRange[1]}
          </Label>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
              max={1000}
              min={0}
              step={10}
              className="mt-2"
            />
          </div>
        </div>

        {/* Date Range */}
        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Période d'import
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={filters.dateRange.from}
              onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, from: e.target.value })}
            />
            <Input
              type="date"
              value={filters.dateRange.to}
              onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, to: e.target.value })}
            />
          </div>
        </div>

        {/* Quality Filters */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Qualité du contenu</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ai-optimized"
                checked={filters.aiOptimized === true}
                onCheckedChange={(checked) => updateFilter('aiOptimized', checked ? true : null)}
              />
              <Label htmlFor="ai-optimized" className="text-sm flex items-center gap-1">
                <Star className="w-4 h-4" />
                Optimisé par IA
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-images"
                checked={filters.hasImages === true}
                onCheckedChange={(checked) => updateFilter('hasImages', checked ? true : null)}
              />
              <Label htmlFor="has-images" className="text-sm">
                Avec images
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-description"
                checked={filters.hasDescription === true}
                onCheckedChange={(checked) => updateFilter('hasDescription', checked ? true : null)}
              />
              <Label htmlFor="has-description" className="text-sm">
                Avec description
              </Label>
            </div>
          </div>
        </div>

        {/* Stock Status */}
        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-1">
            <Package className="w-4 h-4" />
            Statut du stock
          </Label>
          <Select value={filters.stockStatus} onValueChange={(value) => updateFilter('stockStatus', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="in-stock">En stock</SelectItem>
              <SelectItem value="low-stock">Stock faible</SelectItem>
              <SelectItem value="out-of-stock">Rupture</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};