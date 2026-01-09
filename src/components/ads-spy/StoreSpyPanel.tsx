import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  Store, 
  Search, 
  Loader2, 
  ExternalLink, 
  TrendingUp, 
  DollarSign,
  ShoppingBag,
  Globe,
  BarChart3,
  Eye,
  Activity
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SpyStore {
  id: string;
  name: string;
  domain: string;
  platform: 'shopify' | 'woocommerce' | 'magento' | 'other';
  category: string;
  engagementScore: number;
  growthScore: number;
  estimatedRevenue: string;
  activeAds: number;
  productsCount: number;
  countries: string[];
  facebookAds: number;
  tiktokAds: number;
  pinterestAds: number;
  lastUpdated: string;
}

const mockStores: SpyStore[] = [
  {
    id: '1',
    name: 'TrendyGadgets Store',
    domain: 'trendygadgets.com',
    platform: 'shopify',
    category: 'Electronics',
    engagementScore: 89,
    growthScore: 45,
    estimatedRevenue: '50K-100K€/mois',
    activeAds: 12,
    productsCount: 156,
    countries: ['FR', 'DE', 'ES'],
    facebookAds: 8,
    tiktokAds: 3,
    pinterestAds: 1,
    lastUpdated: '2024-01-15',
  },
  {
    id: '2',
    name: 'BeautyEssentials',
    domain: 'beautyessentials.fr',
    platform: 'shopify',
    category: 'Beauty',
    engagementScore: 76,
    growthScore: 67,
    estimatedRevenue: '100K-500K€/mois',
    activeAds: 24,
    productsCount: 89,
    countries: ['FR', 'BE', 'CH'],
    facebookAds: 15,
    tiktokAds: 7,
    pinterestAds: 2,
    lastUpdated: '2024-01-14',
  },
  {
    id: '3',
    name: 'FitLife Shop',
    domain: 'fitlifeshop.com',
    platform: 'woocommerce',
    category: 'Fitness',
    engagementScore: 92,
    growthScore: 78,
    estimatedRevenue: '10K-50K€/mois',
    activeAds: 6,
    productsCount: 45,
    countries: ['US', 'UK', 'CA'],
    facebookAds: 4,
    tiktokAds: 2,
    pinterestAds: 0,
    lastUpdated: '2024-01-15',
  },
];

export function StoreSpyPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [platform, setPlatform] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [minEngagement, setMinEngagement] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [stores, setStores] = useState<SpyStore[]>(mockStores);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 1500);
  };

  const platforms = [
    { value: 'all', label: 'Toutes plateformes' },
    { value: 'shopify', label: 'Shopify' },
    { value: 'woocommerce', label: 'WooCommerce' },
    { value: 'magento', label: 'Magento' },
  ];

  const categories = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'Electronics', label: 'Électronique' },
    { value: 'Beauty', label: 'Beauté' },
    { value: 'Fashion', label: 'Mode' },
    { value: 'Fitness', label: 'Fitness' },
    { value: 'Home', label: 'Maison' },
    { value: 'Pets', label: 'Animaux' },
  ];

  const platformColors: Record<string, string> = {
    shopify: 'bg-green-500',
    woocommerce: 'bg-purple-500',
    magento: 'bg-orange-500',
    other: 'bg-gray-500',
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Espionner les Boutiques
          </CardTitle>
          <CardDescription>
            Analysez les performances des boutiques concurrentes et leurs stratégies publicitaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Nom de domaine, marque, ou mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                {showFilters ? 'Masquer les filtres' : 'Afficher les filtres avancés'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plateforme e-commerce</Label>
                  <Select value={platform} onValueChange={setPlatform}>
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
                  <Select value={category} onValueChange={setCategory}>
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
                <Label>Score d'engagement minimum: {minEngagement}%</Label>
                <Slider
                  value={[minEngagement]}
                  onValueChange={([v]) => setMinEngagement(v)}
                  max={100}
                  step={5}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Stores Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Boutiques trouvées ({stores.length})</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {store.name}
                      <Badge className={`${platformColors[store.platform]} text-white text-[10px] px-1.5`}>
                        {store.platform}
                      </Badge>
                    </CardTitle>
                    <a 
                      href={`https://${store.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      {store.domain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <Badge variant="secondary">{store.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Activity className="w-3 h-3" />
                      <span>Engagement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={store.engagementScore} className="h-2 flex-1" />
                      <span className="font-medium">{store.engagementScore}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      <span>Croissance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={store.growthScore} className="h-2 flex-1" />
                      <span className="font-medium text-green-600">+{store.growthScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <DollarSign className="w-4 h-4 mx-auto text-green-600" />
                    <p className="font-medium mt-1">{store.estimatedRevenue}</p>
                    <p className="text-muted-foreground">CA estimé</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <ShoppingBag className="w-4 h-4 mx-auto text-blue-600" />
                    <p className="font-medium mt-1">{store.productsCount}</p>
                    <p className="text-muted-foreground">Produits</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <BarChart3 className="w-4 h-4 mx-auto text-purple-600" />
                    <p className="font-medium mt-1">{store.activeAds}</p>
                    <p className="text-muted-foreground">Pubs actives</p>
                  </div>
                </div>

                {/* Ads by platform */}
                <div className="flex gap-2 flex-wrap">
                  {store.facebookAds > 0 && (
                    <Badge variant="outline" className="text-xs">
                      📘 {store.facebookAds} Facebook
                    </Badge>
                  )}
                  {store.tiktokAds > 0 && (
                    <Badge variant="outline" className="text-xs">
                      🎵 {store.tiktokAds} TikTok
                    </Badge>
                  )}
                  {store.pinterestAds > 0 && (
                    <Badge variant="outline" className="text-xs">
                      📌 {store.pinterestAds} Pinterest
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="default" size="sm" className="flex-1">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Analyser
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
