import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Star, 
  TrendingUp,
  Sparkles,
  ShoppingCart,
  Globe,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  color?: string;
}

interface ProductsQuickFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: {
    all: number;
    active: number;
    inactive: number;
    lowStock: number;
    winners: number;
    trending: number;
    toOptimize: number;
  };
  sources?: string[];
  activeSource?: string;
  onSourceChange?: (source: string) => void;
}

export function ProductsQuickFilters({
  activeFilter,
  onFilterChange,
  counts,
  sources = [],
  activeSource,
  onSourceChange
}: ProductsQuickFiltersProps) {
  const filters: QuickFilter[] = [
    { 
      id: 'all', 
      label: 'Tous', 
      icon: Package, 
      count: counts.all,
      color: 'bg-primary/10 text-primary hover:bg-primary/20'
    },
    { 
      id: 'active', 
      label: 'Actifs', 
      icon: CheckCircle, 
      count: counts.active,
      color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
    },
    { 
      id: 'inactive', 
      label: 'Inactifs', 
      icon: XCircle, 
      count: counts.inactive,
      color: 'bg-muted text-muted-foreground hover:bg-muted/80'
    },
    { 
      id: 'lowStock', 
      label: 'Stock faible', 
      icon: AlertTriangle, 
      count: counts.lowStock,
      color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
    },
    { 
      id: 'winners', 
      label: 'Winners', 
      icon: Star, 
      count: counts.winners,
      color: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
    },
    { 
      id: 'trending', 
      label: 'Tendance', 
      icon: TrendingUp, 
      count: counts.trending,
      color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20'
    },
    { 
      id: 'toOptimize', 
      label: 'À optimiser', 
      icon: Sparkles, 
      count: counts.toOptimize,
      color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
    }
  ];

  const sourceFilters: QuickFilter[] = [
    { id: 'all', label: 'Toutes sources', icon: Globe },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'shopify', label: 'Shopify', icon: ShoppingCart },
    { id: 'imported', label: 'Importés', icon: TrendingUp }
  ];

  return (
    <div className="space-y-3">
      {/* Filtres principaux */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          
          return (
            <Button
              key={filter.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "gap-2 transition-all duration-200",
                !isActive && filter.color
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{filter.label}</span>
              {filter.count !== undefined && filter.count > 0 && (
                <Badge 
                  variant={isActive ? 'secondary' : 'outline'} 
                  className="h-5 min-w-[20px] px-1.5 text-xs"
                >
                  {filter.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Filtres par source */}
      {sources.length > 0 && onSourceChange && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-muted-foreground shrink-0">Source:</span>
          <div className="flex gap-1">
            {sourceFilters.filter(s => s.id === 'all' || sources.includes(s.id)).map((source) => {
              const Icon = source.icon;
              const isActive = activeSource === source.id;
              
              return (
                <Badge
                  key={source.id}
                  variant={isActive ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-105",
                    isActive && "bg-primary"
                  )}
                  onClick={() => onSourceChange(source.id)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {source.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Indicateur de filtre actif */}
      {(activeFilter !== 'all' || (activeSource && activeSource !== 'all')) && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtres actifs:</span>
          <div className="flex gap-1">
            {activeFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {filters.find(f => f.id === activeFilter)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onFilterChange('all')}
                />
              </Badge>
            )}
            {activeSource && activeSource !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {sourceFilters.find(s => s.id === activeSource)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onSourceChange?.('all')}
                />
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs"
            onClick={() => {
              onFilterChange('all');
              onSourceChange?.('all');
            }}
          >
            Effacer tout
          </Button>
        </div>
      )}
    </div>
  );
}
