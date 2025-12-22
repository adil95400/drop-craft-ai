import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Loader2, Search, TrendingUp, DollarSign, Target, Zap, Import, Sparkles } from 'lucide-react';
import { useAIProductResearch } from '@/hooks/useAIProductResearch';
import { useToast } from '@/hooks/use-toast';

const NICHES = [
  'Fitness & Sport',
  'Beauté & Soins',
  'Maison & Cuisine',
  'Tech & Gadgets',
  'Mode & Accessoires',
  'Bébé & Enfants',
  'Auto & Moto',
  'Animaux',
  'Jardin & Extérieur',
  'Santé & Bien-être'
];

const MARKETPLACES = [
  { value: 'all', label: 'Tous' },
  { value: 'aliexpress', label: 'AliExpress' },
  { value: 'cjdropshipping', label: 'CJDropshipping' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'temu', label: 'Temu' }
];

export function AIWinnersFinder() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [budgetMin, setBudgetMin] = useState('5');
  const [budgetMax, setBudgetMax] = useState('50');
  
  const { findWinningProducts, isLoading } = useAIProductResearch();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery && !selectedNiche) {
      toast({
        title: 'Recherche requise',
        description: 'Entrez une recherche ou sélectionnez une niche',
        variant: 'destructive'
      });
      return;
    }

    findWinningProducts.mutate({
      query: searchQuery || undefined,
      niche: selectedNiche || undefined,
      marketplace: selectedMarketplace !== 'all' ? selectedMarketplace : undefined,
      budget: { min: parseFloat(budgetMin), max: parseFloat(budgetMax) }
    });
  };

  const results = findWinningProducts.data;

  const getSaturationColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recherche de Produits Gagnants IA
          </CardTitle>
          <CardDescription>
            L'IA analyse les tendances des marketplaces et réseaux sociaux pour identifier les meilleurs produits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche libre</label>
              <Input
                placeholder="Ex: lampe LED, accessoire yoga, gadget cuisine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Niche</label>
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une niche" />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map(niche => (
                    <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Marketplace</label>
              <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARKETPLACES.map(mp => (
                    <SelectItem key={mp.value} value={mp.value}>{mp.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Budget min (€)</label>
              <Input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Budget max (€)</label>
              <Input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse IA en cours...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Trouver des Produits Gagnants
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results?.market_insights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Insights Marché</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Niches Tendance</h4>
                <div className="flex flex-wrap gap-1">
                  {results.market_insights.trending_niches?.map((niche: string, i: number) => (
                    <Badge key={i} variant="secondary">{niche}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Tendances Émergentes</h4>
                <div className="flex flex-wrap gap-1">
                  {results.market_insights.emerging_trends?.map((trend: string, i: number) => (
                    <Badge key={i} variant="outline">{trend}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">À Éviter</h4>
                <div className="flex flex-wrap gap-1">
                  {results.market_insights.avoid_categories?.map((cat: string, i: number) => (
                    <Badge key={i} variant="destructive">{cat}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {results?.products && (
        <div className="grid gap-4 md:grid-cols-2">
          {results.products.map((product, index) => (
            <Card key={index} className="relative overflow-hidden">
              {product.winning_score >= 80 && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    🔥 Top Winner
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg pr-20">{product.title}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-bold text-lg">{product.winning_score}</div>
                    <div className="text-xs text-muted-foreground">Score Winner</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-bold text-lg">{product.profit_margin}%</div>
                    <div className="text-xs text-muted-foreground">Marge</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-bold text-lg">{product.viral_potential}</div>
                    <div className="text-xs text-muted-foreground">Viral</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Coût: {product.estimated_cost}€</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>Vente: {product.suggested_price}€</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Saturation</span>
                    <Badge className={getSaturationColor(product.saturation_level)}>
                      {product.saturation_level}
                    </Badge>
                  </div>
                  <Progress 
                    value={product.saturation_level === 'low' ? 25 : product.saturation_level === 'medium' ? 50 : 75} 
                    className="h-1" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {product.source_platforms?.map((platform, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{platform}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.hashtags?.slice(0, 4).map((tag, i) => (
                      <span key={i} className="text-xs text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-medium flex items-center gap-1">
                    <Target className="h-3 w-3" /> Angles Marketing
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {product.marketing_angles?.map((angle, i) => (
                      <li key={i}>• {angle}</li>
                    ))}
                  </ul>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Import className="mr-2 h-4 w-4" />
                  Importer ce Produit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
