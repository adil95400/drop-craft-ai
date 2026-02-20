import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Flame, TrendingUp, DollarSign, Eye, ShoppingCart,
  Heart, ExternalLink, Loader2, RefreshCw, Target, Activity,
  ArrowUpRight, ArrowDownRight, Minus, LayoutGrid, List,
  Globe, Calendar, SlidersHorizontal, Star, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedProduct {
  product_name: string;
  category: string;
  image_url?: string;
  supplier_url?: string;
  platform: string;
  country: string;
  cost_price: number;
  selling_price: number;
  margin_percent: number;
  winner_score: number;
  trend_score: number;
  demand_score: number;
  competition_score: number;
  viral_score: number;
  saturation: string;
  estimated_daily_orders: number;
  estimated_monthly_revenue: number;
  views: number;
  engagement_rate: number;
  ad_count: number;
  first_seen: string;
  tags: string[];
  description: string;
}

const COUNTRIES = [
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'US', label: '🇺🇸 USA' },
  { value: 'UK', label: '🇬🇧 UK' },
  { value: 'DE', label: '🇩🇪 Allemagne' },
  { value: 'ES', label: '🇪🇸 Espagne' },
  { value: 'IT', label: '🇮🇹 Italie' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'AU', label: '🇦🇺 Australie' },
  { value: 'BR', label: '🇧🇷 Brésil' },
];

const PLATFORMS = [
  { value: 'all', label: 'Toutes' },
  { value: 'TikTok', label: '🎵 TikTok' },
  { value: 'Facebook', label: '📘 Facebook' },
  { value: 'Instagram', label: '📸 Instagram' },
  { value: 'Amazon', label: '📦 Amazon' },
  { value: 'AliExpress', label: '🛒 AliExpress' },
];

const CATEGORIES = [
  { value: 'all', label: 'Toutes catégories' },
  { value: 'fashion', label: '👗 Mode' },
  { value: 'electronics', label: '📱 Électronique' },
  { value: 'home', label: '🏠 Maison' },
  { value: 'beauty', label: '💄 Beauté' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'toys', label: '🎮 Jouets' },
  { value: 'pets', label: '🐕 Animaux' },
  { value: 'baby', label: '👶 Bébé' },
  { value: 'auto', label: '🚗 Auto' },
];

const SORT_OPTIONS = [
  { value: 'score', label: 'Winner Score' },
  { value: 'trending', label: 'Tendance' },
  { value: 'profit', label: 'Marge' },
  { value: 'recent', label: 'Récent' },
  { value: 'engagement', label: 'Engagement' },
];

const DATE_RANGES = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7j' },
  { value: '30d', label: '30j' },
  { value: '90d', label: '90j' },
];

export function DailyFeedPanel() {
  const { toast } = useToast();
  const [products, setProducts] = useState<FeedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filters
  const [country, setCountry] = useState('FR');
  const [platform, setPlatform] = useState('all');
  const [category, setCategory] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [sortBy, setSortBy] = useState('score');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-load on mount
  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-research-scanner', {
        body: {
          action: 'daily_feed',
          country,
          platform,
          category,
          dateRange,
          sortBy,
          limit: 20,
        },
      });
      if (error) throw error;
      setProducts(data.products || []);
      toast({ title: '✅ Flux mis à jour', description: `${data.products?.length || 0} produits gagnants trouvés` });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (name: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const filteredProducts = products.filter(p => {
    if (searchQuery && !p.product_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getSaturationBadge = (sat: string) => {
    switch (sat) {
      case 'low': return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-0 text-xs">🟢 Faible</Badge>;
      case 'medium': return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-0 text-xs">🟡 Modérée</Badge>;
      case 'high': return <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 border-0 text-xs">🔴 Élevée</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3">
            {/* Row 1: Search + Main Filters */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="text-sm">
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="text-sm">
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Button onClick={loadFeed} disabled={isLoading} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                {isLoading ? 'Chargement...' : 'Actualiser'}
              </Button>
            </div>

            {/* Row 2: Date chips + view mode */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {DATE_RANGES.map(d => (
                  <Button
                    key={d.value}
                    variant={dateRange === d.value ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setDateRange(d.value)}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{filteredProducts.length}</strong> produits
                </span>
                <div className="flex items-center gap-1 p-0.5 bg-muted rounded-md">
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('list')}>
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {filteredProducts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card><CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" /> Score moy.</p>
            <p className="text-xl font-bold">{Math.round(filteredProducts.reduce((s, p) => s + (p.winner_score || 0), 0) / filteredProducts.length)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Marge moy.</p>
            <p className="text-xl font-bold text-green-600">{Math.round(filteredProducts.reduce((s, p) => s + (p.margin_percent || 0), 0) / filteredProducts.length)}%</p>
          </CardContent></Card>
          <Card><CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="h-3 w-3" /> Winners 80+</p>
            <p className="text-xl font-bold text-orange-500">{filteredProducts.filter(p => p.winner_score >= 80).length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Ads actives</p>
            <p className="text-xl font-bold">{filteredProducts.reduce((s, p) => s + (p.ad_count || 0), 0)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Rev. moy./mois</p>
            <p className="text-xl font-bold">${formatNumber(Math.round(filteredProducts.reduce((s, p) => s + (p.estimated_monthly_revenue || 0), 0) / filteredProducts.length))}</p>
          </CardContent></Card>
        </div>
      )}

      {/* Loading */}
      {isLoading && filteredProducts.length === 0 && (
        <div className={cn("grid gap-4", viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : '')}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3">
              <Skeleton className="h-40 w-full rounded" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length > 0 && (
        <AnimatePresence mode="popLayout">
          <motion.div
            className={cn(
              "grid gap-4",
              viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''
            )}
            layout
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={`${product.product_name}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="group overflow-hidden hover:shadow-xl transition-all border-2 hover:border-primary/50 h-full">
                  {/* Image placeholder with gradient */}
                  <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                    )}
                    
                    {/* Top badges */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        {product.winner_score >= 80 && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 border-0 text-xs gap-1">
                            <Flame className="h-3 w-3" /> Winner
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs backdrop-blur-sm">{product.platform}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7 rounded-full backdrop-blur-sm",
                          favorites.has(product.product_name) ? "bg-red-500 text-white" : "bg-white/80 text-foreground"
                        )}
                        onClick={() => toggleFavorite(product.product_name)}
                      >
                        <Heart className={cn("h-3.5 w-3.5", favorites.has(product.product_name) && "fill-current")} />
                      </Button>
                    </div>

                    {/* Quick import button on hover */}
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                      <Button size="sm" className="w-full text-xs backdrop-blur-sm">
                        <ShoppingCart className="h-3 w-3 mr-1" /> Importer au catalogue
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-3 space-y-3">
                    {/* Title */}
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {product.product_name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        {getSaturationBadge(product.saturation)}
                      </div>
                    </div>

                    {/* Winner Score */}
                    <div className={cn("p-2 rounded-lg border", getScoreBg(product.winner_score))}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium flex items-center gap-1">
                          <Star className="h-3 w-3" /> Winner Score
                        </span>
                        <span className={cn("text-lg font-bold", getScoreColor(product.winner_score))}>
                          {product.winner_score}
                        </span>
                      </div>
                      <Progress value={product.winner_score} className="h-1.5" />
                    </div>

                    {/* Score breakdown */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="p-1 rounded bg-blue-500/10"><TrendingUp className="h-3 w-3 text-blue-500" /></div>
                        <div>
                          <p className="text-muted-foreground">Tendance</p>
                          <p className="font-semibold">{product.trend_score}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="p-1 rounded bg-purple-500/10"><Zap className="h-3 w-3 text-purple-500" /></div>
                        <div>
                          <p className="text-muted-foreground">Viralité</p>
                          <p className="font-semibold">{product.viral_score}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="p-1 rounded bg-green-500/10"><DollarSign className="h-3 w-3 text-green-500" /></div>
                        <div>
                          <p className="text-muted-foreground">Marge</p>
                          <p className="font-semibold text-green-600">{product.margin_percent}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="p-1 rounded bg-orange-500/10"><Eye className="h-3 w-3 text-orange-500" /></div>
                        <div>
                          <p className="text-muted-foreground">Vues</p>
                          <p className="font-semibold">{formatNumber(product.views)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-2 border-t text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Coût → Vente</p>
                        <p className="font-bold">${product.cost_price} → <span className="text-green-600">${product.selling_price}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Rev./mois</p>
                        <p className="font-bold">${formatNumber(product.estimated_monthly_revenue)}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px]">#{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty state */}
      {!isLoading && filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Flame className="h-12 w-12 mx-auto text-orange-500/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Découvrez les produits gagnants du jour</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              Sélectionnez votre marché cible et cliquez sur "Actualiser" pour découvrir les produits qui cartonnent en ce moment.
            </p>
            <Button onClick={loadFeed} className="bg-gradient-to-r from-orange-500 to-red-500">
              <Flame className="h-4 w-4 mr-2" /> Charger le flux
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
