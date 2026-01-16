/**
 * Winning Products Page - Production Ready
 * Inspiré de Minea, Spocket et AutoDS
 * Features: AI Analysis, Real-time trends, Product scoring, Import rapide
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWinnersActions } from '@/hooks/useWinnersActions';
import { useWinnersRealData, useRefreshWinners } from '@/hooks/useWinnersRealData';
import { 
  Trophy, TrendingUp, Sparkles, Search, 
  Star, DollarSign, BarChart3,
  RefreshCw, Target, Download, Loader2,
  Crown, Flame, ArrowUpRight, Eye,
  ShoppingCart, Heart, ExternalLink,
  Filter, SlidersHorizontal, Globe, 
  Facebook, Instagram
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

// Platform icons
const PlatformIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, React.ReactNode> = {
    tiktok: <Globe className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    amazon: <ShoppingCart className="h-4 w-4" />,
    catalog: <Target className="h-4 w-4" />,
  };
  return icons[platform] || <Globe className="h-4 w-4" />;
};

// Score Badge with gradient
const ScoreBadge = ({ score }: { score: number }) => {
  const getColor = () => {
    if (score >= 90) return 'from-emerald-500 to-green-600';
    if (score >= 75) return 'from-yellow-500 to-orange-500';
    if (score >= 60) return 'from-blue-500 to-indigo-500';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className={cn(
      "px-3 py-1.5 rounded-full bg-gradient-to-r text-white font-bold text-sm shadow-lg",
      getColor()
    )}>
      {score}
    </div>
  );
};

// Competition Badge
const CompetitionBadge = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
  const config = {
    low: { label: 'Faible', color: 'bg-green-100 text-green-700 border-green-300' },
    medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    high: { label: 'Élevée', color: 'bg-red-100 text-red-700 border-red-300' },
  };
  return (
    <Badge variant="outline" className={config[level].color}>
      Concurrence {config[level].label}
    </Badge>
  );
};

// Product Card - Minea Style
const WinnerProductCard = ({ 
  product, 
  rank, 
  onImport, 
  isImporting 
}: { 
  product: any; 
  rank: number; 
  onImport: () => void;
  isImporting: boolean;
}) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30">
        {/* Image Header */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img 
            src={product.image} 
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Rank Badge */}
          {rank <= 3 && (
            <div className={cn(
              "absolute top-2 left-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg",
              rank === 1 ? "bg-gradient-to-br from-yellow-400 to-yellow-600" :
              rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-500" :
              "bg-gradient-to-br from-orange-400 to-orange-600"
            )}>
              #{rank}
            </div>
          )}

          {/* Winner Badge */}
          {rank <= 3 && (
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
              🔥 Winner
            </Badge>
          )}

          {/* Score */}
          <div className="absolute bottom-2 right-2">
            <ScoreBadge score={product.score} />
          </div>

          {/* Save Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
            onClick={handleSave}
          >
            <Heart className={cn("h-5 w-5", isSaved ? "fill-red-500 text-red-500" : "text-gray-600")} />
          </Button>

          {/* Platform Badge */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-700">
              <PlatformIcon platform={product.source} />
              <span className="ml-1 capitalize">{product.source}</span>
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Title & Category */}
          <div>
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">{product.category}</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{product.trend}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Tendance
              </p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold">{product.avgPrice.toFixed(2)}€</p>
              <p className="text-xs text-muted-foreground">Prix moyen</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold text-purple-600">{product.profit.toFixed(2)}€</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <DollarSign className="h-3 w-3" />
                Profit est.
              </p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold">{product.orders.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Commandes</p>
            </div>
          </div>

          {/* Rating & Competition */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{product.rating.toFixed(1)}</span>
            </div>
            <CompetitionBadge level={product.competition} />
          </div>

          {/* Social Proof */}
          {product.socialProof && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {product.socialProof.tiktokViews && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {(product.socialProof.tiktokViews / 1000000).toFixed(1)}M vues
                </span>
              )}
              {product.socialProof.facebookAds && (
                <span className="flex items-center gap-1">
                  <Facebook className="h-3 w-3" />
                  {product.socialProof.facebookAds} ads
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={onImport}
              disabled={isImporting}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Importer
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(product.name)}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Analyser
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function WinnersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [sortBy, setSortBy] = useState<'score' | 'trend' | 'profit' | 'orders'>('score');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { importWinner, isImporting } = useWinnersActions();
  
  const { data: winnersData, isLoading } = useWinnersRealData(selectedCategory, 30);
  const { mutate: refreshWinners, isPending: isRefreshing } = useRefreshWinners();

  const handleImport = async (product: any) => {
    await importWinner(product);
  };

  const handleRefresh = () => {
    refreshWinners({ category: selectedCategory, limit: 30 });
  };

  const winningProducts = winnersData?.products || [];
  const metricsData = winnersData?.metrics;

  // Filter and sort products
  const filteredProducts = winningProducts
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'trend': return parseInt(b.trend) - parseInt(a.trend);
        case 'profit': return b.profit - a.profit;
        case 'orders': return b.orders - a.orders;
        default: return b.score - a.score;
      }
    });

  const categories = metricsData?.categories || [];

  return (
    <ChannablePageWrapper
      title="Winning Products"
      description="Découvrez les produits à fort potentiel avec l'analyse IA et les données de tendances en temps réel"
      heroImage="analytics"
      badge={{ label: "Intelligence IA", icon: Sparkles }}
      actions={
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing || isLoading}
          className="bg-gradient-to-r from-primary to-primary/80"
          size="lg"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyse IA en cours...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Analyser avec IA
            </>
          )}
        </Button>
      }
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Winners</CardTitle>
            <Trophy className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold text-yellow-600">{metricsData?.totalWinners || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Analysés ce mois
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            <Star className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-600">{metricsData?.avgScore || 0}/100</div>
                <Progress value={metricsData?.avgScore || 0} className="h-2 mt-2" />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendance Moyenne</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold text-green-600">{metricsData?.avgTrend || '+0%'}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Croissance hebdomadaire
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Potentiel</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold text-purple-600">
                  €{((metricsData?.potentialProfit || 0) / 1000).toFixed(1)}K
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimation mensuelle
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Sources */}
      {metricsData?.sources && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sources de données</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe className="h-3 w-3" /> TikTok: {metricsData.sources.tiktok}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Instagram className="h-3 w-3" /> Instagram: {metricsData.sources.instagram}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <ShoppingCart className="h-3 w-3" /> Amazon: {metricsData.sources.amazon}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" /> Catalogue: {metricsData.sources.catalog}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Search */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit gagnant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[150px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score IA</SelectItem>
                <SelectItem value="trend">Tendance</SelectItem>
                <SelectItem value="profit">Profit</SelectItem>
                <SelectItem value="orders">Commandes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Tous ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Tendances
          </TabsTrigger>
          <TabsTrigger value="best" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Meilleurs Scores
          </TabsTrigger>
          <TabsTrigger value="low-competition" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Faible Concurrence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <WinnerProductCard
                  key={product.id}
                  product={product}
                  rank={index + 1}
                  onImport={() => handleImport(product)}
                  isImporting={isImporting}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  Lancez une analyse IA pour découvrir des produits gagnants
                </p>
                <Button onClick={handleRefresh}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Lancer l'analyse IA
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trending">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts
              .sort((a, b) => parseInt(b.trend) - parseInt(a.trend))
              .slice(0, 12)
              .map((product, index) => (
                <WinnerProductCard
                  key={product.id}
                  product={product}
                  rank={index + 1}
                  onImport={() => handleImport(product)}
                  isImporting={isImporting}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="best">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts
              .filter(p => p.score >= 80)
              .slice(0, 12)
              .map((product, index) => (
                <WinnerProductCard
                  key={product.id}
                  product={product}
                  rank={index + 1}
                  onImport={() => handleImport(product)}
                  isImporting={isImporting}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="low-competition">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts
              .filter(p => p.competition === 'low')
              .slice(0, 12)
              .map((product, index) => (
                <WinnerProductCard
                  key={product.id}
                  product={product}
                  rank={index + 1}
                  onImport={() => handleImport(product)}
                  isImporting={isImporting}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Meta Info */}
      {winnersData?.meta && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Source: {winnersData.meta.dataSource === 'firecrawl+db' ? 'Données temps réel + Base' : 'Base de données'}
              </span>
              <span>
                Dernière mise à jour: {new Date(winnersData.meta.timestamp).toLocaleString('fr-FR')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </ChannablePageWrapper>
  );
}
