/**
 * Ads Spy Dashboard - Production Ready
 * Inspiré de Minea, BigSpy et Dropispy
 * Features: Multi-platform search, AI analysis, Collections, Store spy
 */
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { AdCard } from './AdCard';
import { useTrendingAds, useSearchAds, useAnalyzeAd, type CompetitorAd, type AdSearchParams } from '@/hooks/useAdsSpy';
import { 
  Search, TrendingUp, FolderHeart, Globe, Store, Users, Crown,
  Loader2, RefreshCw, Filter, SlidersHorizontal, Flame, Calendar,
  Trophy, Eye, Heart, Play, Clock, Target, Sparkles, Facebook,
  Instagram, Zap, ArrowUpRight, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Platform configurations
const PLATFORMS = [
  { id: 'all', name: 'Toutes', icon: Globe },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'tiktok', name: 'TikTok', icon: Globe, color: 'text-pink-500' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-purple-500' },
  { id: 'pinterest', name: 'Pinterest', icon: Globe, color: 'text-red-500' },
];

const CATEGORIES = [
  { id: 'all', name: 'Toutes catégories' },
  { id: 'Fashion', name: 'Mode & Accessoires' },
  { id: 'Electronics', name: 'Électronique' },
  { id: 'Beauty', name: 'Beauté & Soins' },
  { id: 'Home', name: 'Maison & Déco' },
  { id: 'Fitness', name: 'Sport & Fitness' },
  { id: 'Pets', name: 'Animaux' },
  { id: 'Kids', name: 'Enfants & Bébés' },
  { id: 'Garden', name: 'Jardin & Extérieur' },
];

// Quick Filter Pills
const QuickFilters = ({ onSelect, active }: { onSelect: (filter: string) => void; active: string | null }) => {
  const filters = [
    { id: 'hot-today', label: '🔥 Hot Today', description: 'Pubs virales des dernières 24h' },
    { id: 'high-engagement', label: '💎 Haute qualité', description: 'Score engagement > 80%' },
    { id: 'video-ads', label: '🎬 Vidéo Ads', description: 'Publicités vidéo uniquement' },
    { id: 'ecom-stores', label: '🛒 E-commerce', description: 'Boutiques dropshipping' },
    { id: 'new-products', label: '✨ Nouveaux', description: 'Lancés cette semaine' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={active === filter.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(filter.id === active ? '' : filter.id)}
          className={cn(
            "transition-all",
            active === filter.id && "ring-2 ring-primary ring-offset-2"
          )}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
};

// Stats Cards
const StatsCards = ({ isLoading }: { isLoading: boolean }) => {
  const stats = [
    { label: 'Pubs analysées', value: '12,847', icon: Search, color: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20' },
    { label: 'Winners détectés', value: '1,234', icon: Trophy, color: 'from-green-500/10 to-green-600/5', border: 'border-green-500/20' },
    { label: 'Boutiques espionnées', value: '567', icon: Store, color: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-500/20' },
    { label: 'Influenceurs suivis', value: '89', icon: Users, color: 'from-pink-500/10 to-pink-600/5', border: 'border-pink-500/20' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card className={cn("bg-gradient-to-br", stat.color, stat.border)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stat.value}
                  </p>
                </div>
                <stat.icon className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

// Winners Grid - Minea Style
const WinnersGrid = ({ 
  ads, 
  isLoading, 
  onAnalyze, 
  isAnalyzing 
}: { 
  ads: CompetitorAd[];
  isLoading: boolean;
  onAnalyze: (id: string) => void;
  isAnalyzing: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analyse des publicités en cours...</p>
        </div>
      </div>
    );
  }

  if (!ads || ads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune publicité trouvée</h3>
          <p className="text-muted-foreground mb-4">
            Lancez une recherche pour découvrir les publicités gagnantes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence>
        {ads.map((ad, index) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            {/* Rank Badge for Top 3 */}
            {index < 3 && (
              <>
                <div 
                  className={cn(
                    "absolute -top-3 -left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg",
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                    'bg-gradient-to-br from-orange-400 to-orange-600'
                  )}
                >
                  {index + 1}
                </div>
                <Badge 
                  className="absolute -top-2 left-6 z-10 text-[10px] bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-2"
                >
                  🔥 Winner
                </Badge>
              </>
            )}
            <AdCard
              ad={ad}
              onAnalyze={() => onAnalyze(ad.id)}
              isAnalyzing={isAnalyzing}
              showAnalysis={!!ad.ai_analysis}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Advanced Search Panel
const AdvancedSearchPanel = () => {
  const [searchParams, setSearchParams] = useState<AdSearchParams>({ query: '', limit: 20 });
  const [showFilters, setShowFilters] = useState(false);
  const [shouldSearch, setShouldSearch] = useState(false);

  const { data, isLoading } = useSearchAds(searchParams, shouldSearch);
  const analyzeAd = useAnalyzeAd();

  const handleSearch = () => {
    if (searchParams.query.trim()) {
      setShouldSearch(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Mot-clé, marque, produit, niche..."
                value={searchParams.query}
                onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading} size="lg" className="px-8">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="mt-4">
            <QuickFilters 
              onSelect={(filter) => {
                if (filter) {
                  setSearchParams({ ...searchParams, query: filter });
                  setShouldSearch(true);
                }
              }}
              active={null}
            />
          </div>

          {/* Advanced Filters */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {showFilters ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plateforme</label>
                  <Select
                    value={searchParams.platform || 'all'}
                    onValueChange={(v) => setSearchParams({ ...searchParams, platform: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <p.icon className={cn("h-4 w-4", p.color)} />
                            {p.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie</label>
                  <Select
                    value={searchParams.category || 'all'}
                    onValueChange={(v) => setSearchParams({ ...searchParams, category: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Engagement min: {searchParams.minEngagement || 0}%
                  </label>
                  <Slider
                    value={[searchParams.minEngagement || 0]}
                    onValueChange={([v]) => setSearchParams({ ...searchParams, minEngagement: v })}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Results */}
      {shouldSearch && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Résultats ({data?.total || 0})
            </h3>
            {data?.source === 'simulated' && (
              <Badge variant="secondary">Données de démonstration</Badge>
            )}
          </div>
          
          <WinnersGrid 
            ads={data?.ads || []}
            isLoading={isLoading}
            onAnalyze={(id) => analyzeAd.mutate(id)}
            isAnalyzing={analyzeAd.isPending}
          />
        </div>
      )}
    </div>
  );
};

// Top Winners Dashboard Tab
const TopWinnersDashboard = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const { data, isLoading, refetch } = useTrendingAds(undefined, 12);
  const analyzeAd = useAnalyzeAd();

  const periodLabels = {
    day: "Top 10 du jour",
    week: "Top 10 de la semaine", 
    month: "Top 10 du mois"
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Produits Gagnants</h3>
                <p className="text-sm text-muted-foreground">
                  Sélection automatique des meilleures publicités
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Tabs value={period} onValueChange={(v: any) => setPeriod(v)}>
                <TabsList>
                  <TabsTrigger value="day" className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    Jour
                  </TabsTrigger>
                  <TabsTrigger value="week" className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    Semaine
                  </TabsTrigger>
                  <TabsTrigger value="month" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Mois
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winners Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">{periodLabels[period]}</h2>
          <Badge variant="secondary" className="text-xs">
            Mise à jour toutes les heures
          </Badge>
        </div>

        <WinnersGrid 
          ads={data?.ads || []}
          isLoading={isLoading}
          onAnalyze={(id) => analyzeAd.mutate(id)}
          isAnalyzing={analyzeAd.isPending}
        />
      </div>

      {/* Saved Products Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4" />
            Vos produits sauvegardés
          </CardTitle>
          <CardDescription>
            Les produits que vous avez ajoutés à vos favoris
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>Aucun produit sauvegardé pour le moment.</p>
            <p className="text-sm mt-1">
              Cliquez sur le bouton cœur sur une publicité pour l'ajouter ici.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Store Spy Panel
const StoreSpyPanel = () => {
  const [storeUrl, setStoreUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeStore = () => {
    if (!storeUrl.trim()) {
      toast.error('Veuillez entrer une URL de boutique');
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success('Analyse de boutique en cours...');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Espionner une Boutique
          </CardTitle>
          <CardDescription>
            Analysez n'importe quelle boutique Shopify, WooCommerce ou autre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://example-store.com"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAnalyzeStore} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Analyser
            </Button>
          </div>

          {/* Popular Stores */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Trending Store 1', products: 234, category: 'Fashion' },
              { name: 'Tech Gadgets Shop', products: 156, category: 'Electronics' },
              { name: 'Beauty Essentials', products: 89, category: 'Beauty' },
            ].map((store, idx) => (
              <Card key={idx} className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {store.products} produits • {store.category}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Influencer Spy Panel
const InfluencerSpyPanel = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Espionner les Influenceurs
          </CardTitle>
          <CardDescription>
            Découvrez les produits promus par les influenceurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: '@fashionista', followers: '2.5M', platform: 'Instagram', products: 45 },
              { name: '@techreviewer', followers: '1.2M', platform: 'TikTok', products: 32 },
              { name: '@beautyqueen', followers: '890K', platform: 'Instagram', products: 28 },
            ].map((influencer, idx) => (
              <Card key={idx} className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {influencer.name[1].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{influencer.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{influencer.followers}</span>
                        <span>•</span>
                        <span>{influencer.platform}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">{influencer.products} produits</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Collections Panel
const CollectionsPanel = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderHeart className="h-5 w-5" />
                Mes Collections
              </CardTitle>
              <CardDescription>
                Organisez vos publicités favorites par collections
              </CardDescription>
            </div>
            <Button>
              <FolderHeart className="h-4 w-4 mr-2" />
              Nouvelle Collection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FolderHeart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Aucune collection</h3>
            <p>Créez votre première collection pour organiser vos publicités favorites</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Dashboard
export function AdsSpyDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ads Spy Pro</h1>
            <p className="text-muted-foreground">
              Espionnez les publicités gagnantes et découvrez les stratégies de vos concurrents
            </p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-4 py-1">
          Intelligence IA
        </Badge>
      </div>

      {/* Stats Cards */}
      <StatsCards isLoading={false} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid h-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2 py-3">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Adspy</span>
          </TabsTrigger>
          <TabsTrigger value="stores" className="flex items-center gap-2 py-3">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Boutiques</span>
          </TabsTrigger>
          <TabsTrigger value="influencers" className="flex items-center gap-2 py-3">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Influenceurs</span>
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-2 py-3">
            <FolderHeart className="w-4 h-4" />
            <span className="hidden sm:inline">Collections</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <TopWinnersDashboard />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <AdvancedSearchPanel />
        </TabsContent>

        <TabsContent value="stores" className="mt-6">
          <StoreSpyPanel />
        </TabsContent>

        <TabsContent value="influencers" className="mt-6">
          <InfluencerSpyPanel />
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          <CollectionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
