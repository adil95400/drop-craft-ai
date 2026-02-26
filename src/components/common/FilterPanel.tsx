import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterPanelProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  options?: {
    categories?: FilterOption[];
    statuses?: FilterOption[];
    suppliers?: FilterOption[];
    priorities?: FilterOption[];
    dateRange?: boolean;
    search?: boolean;
  };
  onReset?: () => void;
  loading?: boolean;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  options = {},
  onReset,
  loading = false
}: FilterPanelProps) {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value
    });
  };

  const handleDateRangeChange = (from?: Date, to?: Date) => {
    setDateFrom(from);
    setDateTo(to);
    onFiltersChange({
      ...filters,
      dateFrom: from?.toISOString(),
      dateTo: to?.toISOString()
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== "" && value !== "all"
    ).length;
  };

  const resetFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onReset?.();
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} actif{getActiveFiltersCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onFiltersChange(filters)}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Recherche */}
          {options.search && (
            <div>
              <Label htmlFor="search">Recherche</Label>
              <Input
                id="search"
                placeholder="Rechercher..."
                value={filters.search || ""}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>
          )}

          {/* Catégories */}
          {options.categories && (
            <div>
              <Label>Catégorie</Label>
              <Select 
                value={filters.category || "all"} 
                onValueChange={(value) => updateFilter("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {options.categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Statuts */}
          {options.statuses && (
            <div>
              <Label>Statut</Label>
              <Select 
                value={filters.status || "all"} 
                onValueChange={(value) => updateFilter("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {options.statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fournisseurs */}
          {options.suppliers && (
            <div>
              <Label>Fournisseur</Label>
              <Select 
                value={filters.supplier || "all"} 
                onValueChange={(value) => updateFilter("supplier", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {options.suppliers.map((supplier) => (
                    <SelectItem key={supplier.value} value={supplier.value}>
                      {supplier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priorités */}
          {options.priorities && (
            <div>
              <Label>Priorité</Label>
              <Select 
                value={filters.priority || "all"} 
                onValueChange={(value) => updateFilter("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {options.priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Plage de dates */}
          {options.dateRange && (
            <div className="col-span-2">
              <Label>Période</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: getDateFnsLocale() }) : "Du"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => handleDateRangeChange(date, dateTo)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: getDateFnsLocale() }) : "Au"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => handleDateRangeChange(dateFrom, date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}