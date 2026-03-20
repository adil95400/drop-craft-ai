/**
 * ProductsQuickFilters - Filtres rapides avec "À traiter" prioritaire (Sprint 4)
 */
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
  X,
  Zap,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  color?: string;
  isPrimary?: boolean;
  emoji?: string;
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
    toProcess?: number; // Sprint 4: À traiter
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
  // Sprint 4: Primary "À traiter" filter first
  const toProcessCount = counts.toProcess || counts.toOptimize + counts.lowStock;
  
  const filters: QuickFilter[] = [
    { 
      id: 'toProcess', 
      label: 'À traiter maintenant', 
      icon: Zap, 
      count: toProcessCount,
      color: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 border-amber-500/40 hover:from-amber-500/30 hover:to-orange-500/30',
      isPrimary: true,
      emoji: '🎯'
    },
    { 
      id: 'all', 
      label: 'Tous', 
      icon: Package, 
      count: counts.all,
      color: 'bg-muted text-foreground hover:bg-muted/80'
    },
    { 
      id: 'active', 
      label: 'Actifs', 
      icon: CheckCircle, 
      count: counts.active,
      color: 'bg-success/10 text-success hover:bg-success/20'
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
      color: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
      emoji: '⚠️'
    },
    { 
      id: 'winners', 
      label: 'Winners', 
      icon: Star, 
      count: counts.winners,
      color: 'bg-warning/10 text-warning hover:bg-warning/20',
      emoji: '⭐'
    },
    { 
      id: 'trending', 
      label: 'Tendance', 
      icon: TrendingUp, 
      count: counts.trending,
      color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
      emoji: '📈'
    },
    { 
      id: 'toOptimize', 
      label: 'Opportunités', 
      icon: Sparkles, 
      count: counts.toOptimize,
      color: 'bg-success/10 text-success hover:bg-success/20',
      emoji: '💰'
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
      {/* Sprint 4: AI Decision header */}
      <div className="flex items-center gap-2 text-sm">
        <Brain className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">Filtres décisionnels</span>
        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30">
          IA
        </Badge>
      </div>
      
      {/* Filtres principaux */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          
          return (
            <motion.div
              key={filter.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "gap-2 transition-all duration-200",
                  filter.isPrimary && !isActive && "ring-2 ring-amber-500/30 ring-offset-1 ring-offset-background font-bold",
                  !isActive && filter.color
                )}
              >
                {/* Emoji for instant recognition */}
                {filter.emoji && <span className="text-sm">{filter.emoji}</span>}
                {!filter.emoji && <Icon className="h-3.5 w-3.5" />}
                
                <span className={cn(
                  "hidden sm:inline",
                  filter.isPrimary && "inline" // Always show primary label
                )}>
                  {filter.isPrimary ? filter.label : filter.label}
                </span>
                
                {filter.count !== undefined && filter.count > 0 && (
                  <Badge 
                    variant={isActive ? 'secondary' : 'outline'} 
                    className={cn(
                      "h-5 min-w-[20px] px-1.5 text-xs font-bold",
                      filter.isPrimary && !isActive && "bg-warning/20 text-amber-700 border-amber-500/30"
                    )}
                  >
                    {filter.count}
                  </Badge>
                )}
                
                {/* Pulse for primary with items */}
                {filter.isPrimary && filter.count && filter.count > 0 && !isActive && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-warning"
                  />
                )}
              </Button>
            </motion.div>
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
