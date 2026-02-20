import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Eye, Heart, ThumbsUp, MessageCircle, Share2,
  ExternalLink, Calendar, TrendingUp, Loader2, Megaphone,
  ArrowUpRight, Minus, ArrowDownRight, Clock, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ad {
  ad_id: string;
  product_name: string;
  advertiser: string;
  platform: string;
  country: string;
  ad_type: string;
  landing_page?: string;
  category: string;
  cost_price_estimate: number;
  selling_price: number;
  margin_estimate: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  running_days: number;
  first_seen: string;
  last_seen: string;
  ad_copy: string;
  cta: string;
  score: number;
  tags: string[];
  trend: string;
}

interface AdsSpyStats {
  total_ads_found: number;
  avg_engagement: number;
  top_category: string;
  avg_running_days: number;
}

const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'pinterest', label: 'Pinterest', icon: '📌' },
];

const COUNTRIES = [
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'US', label: '🇺🇸 États-Unis' },
  { value: 'UK', label: '🇬🇧 Royaume-Uni' },
  { value: 'DE', label: '🇩🇪 Allemagne' },
  { value: 'ES', label: '🇪🇸 Espagne' },
  { value: 'IT', label: '🇮🇹 Italie' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'AU', label: '🇦🇺 Australie' },
];

const DATE_RANGES = [
  { value: '24h', label: '24 heures' },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
];

export function AdsSpyPanel() {
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [stats, setStats] = useState<AdsSpyStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [country, setCountry] = useState('FR');
  const [dateRange, setDateRange] = useState('7d');
  const [category, setCategory] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-research-scanner', {
        body: {
          action: 'ads_spy',
          platform,
          country,
          category,
          dateRange,
          keyword,
          limit: 15,
        },
      });
      if (error) throw error;
      setAds(data.ads || []);
      setStats(data.stats || null);
      toast({ title: '✅ Analyse terminée', description: `${data.ads?.length || 0} publicités trouvées` });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (adId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(adId) ? next.delete(adId) : next.add(adId);
      return next;
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const trendIcon = (trend: string) => {
    if (trend === 'rising') return <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />;
    if (trend === 'declining') return <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Mot-clé, niche, produit..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} disabled={isLoading} className="bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4 mr-2" />}
              {isLoading ? 'Analyse...' : 'Espionner'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Megaphone className="h-3 w-3" /> Ads trouvées</p>
              <p className="text-2xl font-bold">{stats.total_ads_found}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Engagement moy.</p>
              <p className="text-2xl font-bold">{stats.avg_engagement}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" /> Top catégorie</p>
              <p className="text-2xl font-bold truncate">{stats.top_category}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Durée moy.</p>
              <p className="text-2xl font-bold">{stats.avg_running_days}j</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && ads.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* Ads Grid */}
      {ads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {ads.map((ad, i) => (
              <motion.div
                key={ad.ad_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm leading-tight line-clamp-2">{ad.product_name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">par {ad.advertiser}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleFavorite(ad.ad_id)}
                        >
                          <Heart className={cn("h-3.5 w-3.5", favorites.has(ad.ad_id) && "fill-red-500 text-red-500")} />
                        </Button>
                        <Badge variant="outline" className={cn(
                          "font-bold text-xs",
                          ad.score >= 80 ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                          ad.score >= 60 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                          'bg-red-500/10 text-red-500 border-red-500/30'
                        )}>
                          {ad.score}/100
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">{ad.platform}</Badge>
                      <Badge variant="outline" className="text-xs">{ad.category}</Badge>
                      <Badge variant="outline" className="text-xs">{ad.ad_type}</Badge>
                      {trendIcon(ad.trend)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Engagement Stats */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <Eye className="h-3 w-3 mx-auto text-muted-foreground" />
                        <p className="text-xs font-semibold mt-0.5">{formatNumber(ad.impressions)}</p>
                      </div>
                      <div>
                        <ThumbsUp className="h-3 w-3 mx-auto text-muted-foreground" />
                        <p className="text-xs font-semibold mt-0.5">{formatNumber(ad.likes)}</p>
                      </div>
                      <div>
                        <MessageCircle className="h-3 w-3 mx-auto text-muted-foreground" />
                        <p className="text-xs font-semibold mt-0.5">{formatNumber(ad.comments)}</p>
                      </div>
                      <div>
                        <Share2 className="h-3 w-3 mx-auto text-muted-foreground" />
                        <p className="text-xs font-semibold mt-0.5">{formatNumber(ad.shares)}</p>
                      </div>
                    </div>

                    {/* Price & Margin */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <span className="text-muted-foreground block">Coût</span>
                        <p className="font-semibold">${ad.cost_price_estimate}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <span className="text-muted-foreground block">Vente</span>
                        <p className="font-semibold text-green-600">${ad.selling_price}</p>
                      </div>
                      <div className="p-2 rounded bg-green-500/10 text-center">
                        <span className="text-muted-foreground block">Marge</span>
                        <p className="font-bold text-green-600">{ad.margin_estimate}%</p>
                      </div>
                    </div>

                    {/* Ad Copy */}
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">"{ad.ad_copy}"</p>

                    {/* Running time */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Active depuis {ad.running_days}j
                      </span>
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                        {ad.engagement_rate}% eng.
                      </Badge>
                    </div>

                    {/* Tags */}
                    {ad.tags && ad.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ad.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {ad.landing_page && (
                      <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                        <a href={ad.landing_page} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Voir la landing page
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && ads.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Espionnez les publicités de vos concurrents</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Sélectionnez une plateforme et un pays, puis lancez l'analyse pour découvrir les publicités e-commerce les plus performantes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
