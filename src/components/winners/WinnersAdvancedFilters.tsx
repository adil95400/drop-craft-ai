import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, X, TrendingUp, DollarSign, Star } from "lucide-react";

interface FilterState {
  priceMin: number;
  priceMax: number;
  minScore: number;
  minReviews: number;
  sortBy: 'score' | 'price' | 'reviews' | 'trending';
  sources: string[];
}

interface WinnersAdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  isOpen?: boolean;
}

export const WinnersAdvancedFilters = ({ onFilterChange, isOpen = false }: WinnersAdvancedFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    priceMin: 0,
    priceMax: 500,
    minScore: 60,
    minReviews: 50,
    sortBy: 'score',
    sources: ['trends', 'amazon']
  });

  const [expanded, setExpanded] = useState(isOpen);

  const sources = [
    { id: 'trends', name: 'Google Trends', color: 'bg-blue-500' },
    { id: 'amazon', name: 'Amazon', color: 'bg-orange-500' },
    { id: 'ebay', name: 'eBay', color: 'bg-yellow-500' }
  ];

  const handleFilterUpdate = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleSource = (sourceId: string) => {
    const newSources = filters.sources.includes(sourceId)
      ? filters.sources.filter(s => s !== sourceId)
      : [...filters.sources, sourceId];
    handleFilterUpdate('sources', newSources);
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      priceMin: 0,
      priceMax: 500,
      minScore: 60,
      minReviews: 50,
      sortBy: 'score',
      sources: ['trends', 'amazon']
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  if (!expanded) {
    return (
      <Button 
        variant="outline" 
        onClick={() => setExpanded(true)}
        className="w-full"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtres Avancés
      </Button>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Filtres Avancés</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Fourchette de Prix: €{filters.priceMin} - €{filters.priceMax}
        </Label>
        <div className="flex gap-4">
          <Input
            type="number"
            value={filters.priceMin}
            onChange={(e) => handleFilterUpdate('priceMin', parseFloat(e.target.value))}
            className="w-24"
            placeholder="Min"
          />
          <div className="flex-1">
            <Slider
              value={[filters.priceMax]}
              onValueChange={([value]) => handleFilterUpdate('priceMax', value)}
              max={1000}
              step={10}
            />
          </div>
          <Input
            type="number"
            value={filters.priceMax}
            onChange={(e) => handleFilterUpdate('priceMax', parseFloat(e.target.value))}
            className="w-24"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Score Minimum */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Score Minimum: {filters.minScore}/100
        </Label>
        <Slider
          value={[filters.minScore]}
          onValueChange={([value]) => handleFilterUpdate('minScore', value)}
          max={100}
          step={5}
        />
      </div>

      {/* Reviews Minimum */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Avis Minimum: {filters.minReviews}
        </Label>
        <Slider
          value={[filters.minReviews]}
          onValueChange={([value]) => handleFilterUpdate('minReviews', value)}
          max={500}
          step={10}
        />
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label>Trier par</Label>
        <Select value={filters.sortBy} onValueChange={(value: any) => handleFilterUpdate('sortBy', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Score le plus élevé</SelectItem>
            <SelectItem value="price">Prix croissant</SelectItem>
            <SelectItem value="reviews">Plus d'avis</SelectItem>
            <SelectItem value="trending">Plus tendance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sources */}
      <div className="space-y-2">
        <Label>Sources de données</Label>
        <div className="flex flex-wrap gap-2">
          {sources.map(source => (
            <Badge
              key={source.id}
              variant={filters.sources.includes(source.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleSource(source.id)}
            >
              <div className={`h-2 w-2 rounded-full mr-2 ${filters.sources.includes(source.id) ? source.color : 'bg-muted'}`} />
              {source.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" onClick={resetFilters} className="flex-1">
          Réinitialiser
        </Button>
        <Button onClick={() => setExpanded(false)} className="flex-1">
          Appliquer
        </Button>
      </div>
    </Card>
  );
};
