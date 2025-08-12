import { memo, useCallback, useMemo, useState } from 'react';
import { Search, X, Filter, SortAsc, SortDesc } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

export interface SortOption {
  id: string;
  label: string;
  value: string;
}

interface SmartTableFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterOptions?: FilterOption[];
  selectedFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  sortOptions?: SortOption[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, direction: 'asc' | 'desc') => void;
  totalCount?: number;
  filteredCount?: number;
  className?: string;
  placeholder?: string;
}

export const SmartTableFilters = memo(function SmartTableFilters({
  searchQuery,
  onSearchChange,
  filterOptions = [],
  selectedFilters,
  onFiltersChange,
  sortOptions = [],
  sortBy,
  sortDirection = 'asc',
  onSortChange,
  totalCount,
  filteredCount,
  className,
  placeholder = 'Rechercher...',
}: SmartTableFiltersProps) {

  const [filterOpen, setFilterOpen] = useState(false);

  const activeFiltersCount = useMemo(() => selectedFilters.length, [selectedFilters]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const handleFilterToggle = useCallback((filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(id => id !== filterId)
      : [...selectedFilters, filterId];
    onFiltersChange(newFilters);
  }, [selectedFilters, onFiltersChange]);

  const handleClearAllFilters = useCallback(() => {
    onFiltersChange([]);
  }, [onFiltersChange]);

  const handleSortChange = useCallback((value: string) => {
    if (onSortChange) {
      const newDirection = sortBy === value && sortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(value, newDirection);
    }
  }, [sortBy, sortDirection, onSortChange]);

  const resultsText = useMemo(() => {
    if (totalCount === undefined || filteredCount === undefined) return null;
    
    if (filteredCount === totalCount) {
      return `${totalCount} résultat${totalCount > 1 ? 's' : ''}`;
    }
    
    return `${filteredCount} sur ${totalCount} résultat${totalCount > 1 ? 's' : ''}`;
  }, [totalCount, filteredCount]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and actions row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {/* Filters */}
          {filterOptions.length > 0 && (
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Filtres</Label>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAllFilters}
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Tout effacer
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filterOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={selectedFilters.includes(option.id)}
                          onCheckedChange={() => handleFilterToggle(option.id)}
                        />
                        <Label
                          htmlFor={option.id}
                          className="text-sm flex-1 cursor-pointer flex items-center justify-between"
                        >
                          <span>{option.label}</span>
                          {option.count !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {option.count}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Sort */}
          {sortOptions.length > 0 && onSortChange && (
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-auto gap-2">
                {sortDirection === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
                <SelectValue placeholder="Trier par..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Active filters and results */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {selectedFilters.length > 0 && (
            <>
              {selectedFilters.map((filterId) => {
                const option = filterOptions.find(opt => opt.id === filterId);
                if (!option) return null;
                
                return (
                  <Badge
                    key={filterId}
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleFilterToggle(filterId)}
                  >
                    {option.label}
                    <X className="h-3 w-3" />
                  </Badge>
                );
              })}
            </>
          )}
        </div>

        {resultsText && (
          <div className="text-sm text-muted-foreground">
            {resultsText}
          </div>
        )}
      </div>
    </div>
  );
});

SmartTableFilters.displayName = 'SmartTableFilters';