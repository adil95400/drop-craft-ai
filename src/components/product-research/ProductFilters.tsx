import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  X,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Globe
} from 'lucide-react';

export interface ProductFiltersState {
  search: string;
  category: string;
  platform: string;
  sortBy: string;
  priceRange: [number, number];
  minScore: number;
  saturation: string;
}

interface ProductFiltersProps {
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
  onSearch: () => void;
}

const categories = [
  { value: 'all', label: 'Toutes catégories' },
  { value: 'fashion', label: '👗 Mode & Accessoires' },
  { value: 'electronics', label: '📱 Électronique' },
  { value: 'home', label: '🏠 Maison & Jardin' },
  { value: 'beauty', label: '💄 Beauté & Santé' },
  { value: 'sports', label: '⚽ Sport & Fitness' },
  { value: 'toys', label: '🎮 Jouets & Loisirs' },
  { value: 'pets', label: '🐕 Animaux' },
  { value: 'baby', label: '👶 Bébé & Enfants' },
  { value: 'auto', label: '🚗 Auto & Moto' },
];

const platforms = [
  { value: 'all', label: 'Toutes plateformes' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'aliexpress', label: 'AliExpress' },
];

const sortOptions = [
  { value: 'score', label: 'Score Winner' },
  { value: 'trending', label: 'Plus tendance' },
  { value: 'recent', label: 'Plus récent' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'profit', label: 'Marge profit' },
];

const saturationOptions = [
  { value: 'all', label: 'Toutes saturations' },
  { value: 'low', label: '🟢 Faible (Opportunité)' },
  { value: 'medium', label: '🟡 Modérée' },
  { value: 'high', label: '🔴 Élevée' },
];

export function ProductFilters({ filters, onFiltersChange, onSearch }: ProductFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof ProductFiltersState>(
    key: K, 
    value: ProductFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFiltersCount = [
    filters.category !== 'all',
    filters.platform !== 'all',
    filters.saturation !== 'all',
    filters.minScore > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 500,
  ].filter(Boolean).length;

  const resetFilters = () => {
    onFiltersChange({
      search: '',
      category: 'all',
      platform: 'all',
      sortBy: 'score',
      priceRange: [0, 500],
      minScore: 0,
      saturation: 'all',
    });
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit, niche, mot-clé..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="pl-10 h-11"
          />
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={filters.category} 
            onValueChange={(v) => updateFilter('category', v)}
          >
            <SelectTrigger className="w-[180px] h-11">
              <ShoppingBag className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.platform} 
            onValueChange={(v) => updateFilter('platform', v)}
          >
            <SelectTrigger className="w-[160px] h-11">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Plateforme" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet open={showAdvanced} onOpenChange={setShowAdvanced}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtres avancés
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trier par</label>
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(v) => updateFilter('sortBy', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Saturation */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Niveau de saturation</label>
                  <Select 
                    value={filters.saturation} 
                    onValueChange={(v) => updateFilter('saturation', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {saturationOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Score */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Score minimum</label>
                    <Badge variant="outline">{filters.minScore}%</Badge>
                  </div>
                  <Slider
                    value={[filters.minScore]}
                    onValueChange={([v]) => updateFilter('minScore', v)}
                    max={100}
                    step={5}
                  />
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Fourchette de prix
                    </label>
                    <Badge variant="outline">
                      {filters.priceRange[0]}€ - {filters.priceRange[1]}€
                    </Badge>
                  </div>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(v) => updateFilter('priceRange', v as [number, number])}
                    max={500}
                    step={10}
                  />
                </div>

                {/* Reset Button */}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={resetFilters}
                >
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button className="h-11 gap-2" onClick={onSearch}>
            <TrendingUp className="w-4 h-4" />
            Rechercher
          </Button>
        </div>
      </div>

      {/* Quick Filter Tags */}
      <div className="flex flex-wrap gap-2">
        {['🔥 Viral cette semaine', '💎 High Profit', '📈 Tendance', '🆕 Nouveautés', '⭐ Top Winners'].map((tag) => (
          <Badge 
            key={tag}
            variant="outline" 
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
