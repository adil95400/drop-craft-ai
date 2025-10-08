import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Filter, TrendingUp } from 'lucide-react';
import { WinnersSearchParams } from '@/domains/winners/types';

interface WinnersAdvancedFiltersProps {
  filters: WinnersSearchParams;
  onFiltersChange: (filters: WinnersSearchParams) => void;
}

export const WinnersAdvancedFilters = ({ filters, onFiltersChange }: WinnersAdvancedFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<WinnersSearchParams>(filters);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(filters.sources || []);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [competitionLevel, setCompetitionLevel] = useState<string>('all');
  const [trendPeriod, setTrendPeriod] = useState<string>('7d');

  const handleApply = () => {
    onFiltersChange({
      ...localFilters,
      sources: selectedMarketplaces.length > 0 ? selectedMarketplaces : undefined,
    });
  };

  const handleReset = () => {
    const defaultFilters: WinnersSearchParams = { query: '', limit: 30 };
    setLocalFilters(defaultFilters);
    setSelectedMarketplaces([]);
    setSelectedCountries([]);
    setCompetitionLevel('all');
    setTrendPeriod('7d');
    onFiltersChange(defaultFilters);
  };

  const toggleMarketplace = (marketplace: string) => {
    setSelectedMarketplaces(prev =>
      prev.includes(marketplace)
        ? prev.filter(m => m !== marketplace)
        : [...prev, marketplace]
    );
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Filtres Avancés</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Prix Maximum (€)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[localFilters.maxPrice || 100]}
                onValueChange={([value]) => setLocalFilters({ ...localFilters, maxPrice: value })}
                max={500}
                step={5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16 text-right">{localFilters.maxPrice || 100}€</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Score Minimum</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[localFilters.minScore || 60]}
                onValueChange={([value]) => setLocalFilters({ ...localFilters, minScore: value })}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{localFilters.minScore || 60}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Marketplaces</Label>
            <div className="grid grid-cols-2 gap-2">
              {['trends', 'amazon', 'ebay', 'aliexpress', 'etsy', 'shopify'].map((marketplace) => (
                <div key={marketplace} className="flex items-center space-x-2">
                  <Checkbox
                    id={marketplace}
                    checked={selectedMarketplaces.includes(marketplace)}
                    onCheckedChange={() => toggleMarketplace(marketplace)}
                  />
                  <label
                    htmlFor={marketplace}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                  >
                    {marketplace}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Pays / Régions</Label>
            <div className="grid grid-cols-2 gap-2">
              {['US', 'FR', 'UK', 'DE', 'ES', 'IT', 'CA', 'AU'].map((country) => (
                <div key={country} className="flex items-center space-x-2">
                  <Checkbox
                    id={country}
                    checked={selectedCountries.includes(country)}
                    onCheckedChange={() => toggleCountry(country)}
                  />
                  <label
                    htmlFor={country}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {country}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Période de tendance</Label>
            <Select value={trendPeriod} onValueChange={setTrendPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Dernières 24h</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
                <SelectItem value="1y">Dernière année</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Niveau de concurrence</Label>
            <Select value={competitionLevel} onValueChange={setCompetitionLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous niveaux</SelectItem>
                <SelectItem value="low">Faible (meilleur)</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Saisonnalité</Label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="evergreen">Toute l'année</SelectItem>
                <SelectItem value="seasonal">Saisonnier</SelectItem>
                <SelectItem value="trending">En tendance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Input
              placeholder="Ex: Electronics, Fashion..."
              value={localFilters.category || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, category: e.target.value })}
            />
          </div>
        </div>

        {/* Active Filters */}
        {(localFilters.minScore || localFilters.maxPrice || localFilters.category || selectedMarketplaces.length > 0 || selectedCountries.length > 0) && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {localFilters.minScore && (
              <Badge variant="secondary">
                Score min: {localFilters.minScore}
                <X
                  className="ml-1 w-3 h-3 cursor-pointer"
                  onClick={() => setLocalFilters({ ...localFilters, minScore: undefined })}
                />
              </Badge>
            )}
            {localFilters.maxPrice && (
              <Badge variant="secondary">
                Prix max: {localFilters.maxPrice}€
                <X
                  className="ml-1 w-3 h-3 cursor-pointer"
                  onClick={() => setLocalFilters({ ...localFilters, maxPrice: undefined })}
                />
              </Badge>
            )}
            {localFilters.category && (
              <Badge variant="secondary">
                {localFilters.category}
                <X
                  className="ml-1 w-3 h-3 cursor-pointer"
                  onClick={() => setLocalFilters({ ...localFilters, category: undefined })}
                />
              </Badge>
            )}
            {selectedMarketplaces.map((marketplace) => (
              <Badge key={marketplace} variant="secondary" className="capitalize">
                {marketplace}
                <X
                  className="ml-1 w-3 h-3 cursor-pointer"
                  onClick={() => toggleMarketplace(marketplace)}
                />
              </Badge>
            ))}
            {selectedCountries.map((country) => (
              <Badge key={country} variant="secondary">
                {country}
                <X
                  className="ml-1 w-3 h-3 cursor-pointer"
                  onClick={() => toggleCountry(country)}
                />
              </Badge>
            ))}
            {trendPeriod !== '7d' && (
              <Badge variant="secondary">
                <TrendingUp className="w-3 h-3 mr-1" />
                {trendPeriod}
              </Badge>
            )}
            {competitionLevel !== 'all' && (
              <Badge variant="secondary" className="capitalize">
                Concurrence: {competitionLevel}
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Réinitialiser
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Appliquer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
