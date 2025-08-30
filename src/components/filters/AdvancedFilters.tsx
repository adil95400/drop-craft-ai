import React, { useState, useCallback } from 'react';
import { Filter, X, CalendarIcon, DollarSign, Tag, Users, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'range' | 'boolean';
  options?: { value: string; label: string; count?: number }[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface ActiveFilter {
  id: string;
  label: string;
  value: any;
  displayValue: string;
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  activeFilters: ActiveFilter[];
  onFiltersChange: (filters: ActiveFilter[]) => void;
  className?: string;
  showCount?: boolean;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  activeFilters,
  onFiltersChange,
  className,
  showCount = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Record<string, any>>({});

  const updateFilter = useCallback((filterId: string, value: any) => {
    setTempFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
  }, []);

  const applyFilters = useCallback(() => {
    const newActiveFilters: ActiveFilter[] = [];
    
    Object.entries(tempFilters).forEach(([filterId, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const filter = filters.find(f => f.id === filterId);
        if (filter) {
          let displayValue = '';
          
          switch (filter.type) {
            case 'select':
              const option = filter.options?.find(o => o.value === value);
              displayValue = option?.label || value;
              break;
            case 'multiselect':
              displayValue = Array.isArray(value) 
                ? value.map(v => filter.options?.find(o => o.value === v)?.label || v).join(', ')
                : '';
              break;
            case 'range':
              displayValue = Array.isArray(value) 
                ? `${value[0]} - ${value[1]}`
                : value;
              break;
            case 'date':
              displayValue = value instanceof Date ? value.toLocaleDateString() : value;
              break;
            case 'daterange':
              displayValue = Array.isArray(value) && value.length === 2
                ? `${value[0]?.toLocaleDateString()} - ${value[1]?.toLocaleDateString()}`
                : '';
              break;
            case 'boolean':
              displayValue = value ? 'Oui' : 'Non';
              break;
            default:
              displayValue = value.toString();
          }

          if (displayValue) {
            newActiveFilters.push({
              id: filterId,
              label: filter.label,
              value,
              displayValue
            });
          }
        }
      }
    });

    onFiltersChange(newActiveFilters);
    setIsOpen(false);
  }, [tempFilters, filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    setTempFilters({});
    onFiltersChange([]);
  }, [onFiltersChange]);

  const removeFilter = useCallback((filterId: string) => {
    const newFilters = activeFilters.filter(f => f.id !== filterId);
    onFiltersChange(newFilters);
    setTempFilters(prev => {
      const { [filterId]: removed, ...rest } = prev;
      return rest;
    });
  }, [activeFilters, onFiltersChange]);

  // Initialize temp filters with active filters
  React.useEffect(() => {
    const temp: Record<string, any> = {};
    activeFilters.forEach(filter => {
      temp[filter.id] = filter.value;
    });
    setTempFilters(temp);
  }, [activeFilters]);

  const renderFilterInput = (filter: FilterOption) => {
    const value = tempFilters[filter.id];

    switch (filter.type) {
      case 'text':
        return (
          <Input
            placeholder={filter.placeholder}
            value={value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(val) => updateFilter(filter.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || `Choisir ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {showCount && option.count && (
                      <Badge variant="secondary" className="ml-2">
                        {option.count}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filter.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.id}-${option.value}`}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      updateFilter(filter.id, [...currentValues, option.value]);
                    } else {
                      updateFilter(filter.id, currentValues.filter(v => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${filter.id}-${option.value}`} className="flex-1">
                  {option.label}
                  {showCount && option.count && (
                    <Badge variant="outline" className="ml-2">
                      {option.count}
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? value.toLocaleDateString() : filter.placeholder || "Sélectionner une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value}
                onSelect={(date) => updateFilter(filter.id, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'daterange':
        return (
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {Array.isArray(value) && value[0] ? value[0].toLocaleDateString() : "Date de début"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={Array.isArray(value) ? value[0] : null}
                  onSelect={(date) => {
                    const current = Array.isArray(value) ? value : [null, null];
                    updateFilter(filter.id, [date, current[1]]);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {Array.isArray(value) && value[1] ? value[1].toLocaleDateString() : "Date de fin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={Array.isArray(value) ? value[1] : null}
                  onSelect={(date) => {
                    const current = Array.isArray(value) ? value : [null, null];
                    updateFilter(filter.id, [current[0], date]);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={filter.placeholder}
            value={value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value ? Number(e.target.value) : '')}
            min={filter.min}
            max={filter.max}
          />
        );

      case 'range':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{filter.min || 0}</span>
              <span>{filter.max || 100}</span>
            </div>
            <Slider
              value={Array.isArray(value) ? value : [filter.min || 0, filter.max || 100]}
              onValueChange={(val) => updateFilter(filter.id, val)}
              min={filter.min || 0}
              max={filter.max || 100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm">
              <span>{Array.isArray(value) ? value[0] : filter.min || 0}</span>
              <span>{Array.isArray(value) ? value[1] : filter.max || 100}</span>
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={filter.id}
              checked={value || false}
              onCheckedChange={(checked) => updateFilter(filter.id, checked)}
            />
            <Label htmlFor={filter.id}>
              {filter.placeholder || filter.label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  const getFilterIcon = (type: FilterOption['type']) => {
    switch (type) {
      case 'date':
      case 'daterange':
        return CalendarIcon;
      case 'number':
      case 'range':
        return DollarSign;
      case 'select':
      case 'multiselect':
        return Tag;
      default:
        return Filter;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtres
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="start">
              <div className="p-4 border-b">
                <h3 className="font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres avancés
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto p-4 space-y-6">
                {filters.map((filter) => {
                  const Icon = getFilterIcon(filter.type);
                  return (
                    <div key={filter.id} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {filter.label}
                      </Label>
                      {renderFilterInput(filter)}
                    </div>
                  );
                })}
              </div>

              <Separator />
              
              <div className="p-4 flex justify-between">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  disabled={activeFilters.length === 0}
                >
                  Effacer tout
                </Button>
                <Button onClick={applyFilters}>
                  Appliquer les filtres
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground"
            >
              Effacer tout
            </Button>
          )}
        </div>

        {showCount && (
          <div className="text-sm text-muted-foreground">
            {activeFilters.length > 0 && `${activeFilters.length} filtre(s) actif(s)`}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="gap-2 pr-1"
            >
              <span>
                {filter.label}: {filter.displayValue}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeFilter(filter.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};