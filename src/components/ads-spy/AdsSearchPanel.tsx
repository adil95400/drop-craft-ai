import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useSearchAds, useAnalyzeAd, type CompetitorAd, type AdSearchParams } from '@/hooks/useAdsSpy';
import { AdCard } from './AdCard';
import { Search, Loader2, Filter, SlidersHorizontal } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AdsSearchPanelProps {
  initialFilter?: string | null;
  onClearFilter?: () => void;
}

export function AdsSearchPanel({ initialFilter, onClearFilter }: AdsSearchPanelProps = {}) {
  const [searchParams, setSearchParams] = useState<AdSearchParams>({
    query: '',
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [shouldSearch, setShouldSearch] = useState(false);

  const { data, isLoading } = useSearchAds(searchParams, shouldSearch);
  const analyzeAd = useAnalyzeAd();

  const handleSearch = () => {
    setShouldSearch(true);
  };

  const handleAnalyze = (ad: CompetitorAd) => {
    analyzeAd.mutate(ad.id);
  };

  const platforms = [
    { value: 'all', label: 'Toutes plateformes' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'google', label: 'Google' },
    { value: 'pinterest', label: 'Pinterest' },
  ];

  const categories = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'Fashion', label: 'Mode' },
    { value: 'Electronics', label: 'Électronique' },
    { value: 'Beauty', label: 'Beauté' },
    { value: 'Home', label: 'Maison' },
    { value: 'Fitness', label: 'Fitness' },
    { value: 'Pets', label: 'Animaux' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Rechercher des Publicités
          </CardTitle>
          <CardDescription>
            Trouvez les meilleures publicités de vos concurrents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Mot-clé, marque, produit..."
                value={searchParams.query}
                onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plateforme</Label>
                  <Select
                    value={searchParams.platform || 'all'}
                    onValueChange={(v) => setSearchParams({ ...searchParams, platform: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={searchParams.category || 'all'}
                    onValueChange={(v) => setSearchParams({ ...searchParams, category: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Score d'engagement minimum: {searchParams.minEngagement || 0}%</Label>
                <Slider
                  value={[searchParams.minEngagement || 0]}
                  onValueChange={([v]) => setSearchParams({ ...searchParams, minEngagement: v })}
                  max={100}
                  step={5}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {data?.ads && data.ads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Résultats ({data.total})
            </h3>
            {data.source === 'simulated' && (
              <Badge variant="outline">Données simulées</Badge>
            )}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                onAnalyze={() => handleAnalyze(ad)}
                isAnalyzing={analyzeAd.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {shouldSearch && !isLoading && (!data?.ads || data.ads.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucune publicité trouvée. Essayez d'autres mots-clés.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
