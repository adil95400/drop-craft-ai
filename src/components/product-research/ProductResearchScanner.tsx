import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResearchHeader } from './ResearchHeader';
import { ProductFilters, ProductFiltersState } from './ProductFilters';
import { QuickCategories } from './QuickCategories';
import { ProductGrid } from './ProductGrid';
import { FavoritesPanel } from './FavoritesPanel';
import { TrendScanner } from './TrendScanner';
import { ViralProductsScraper } from './ViralProductsScraper';
import { SaturationAnalyzer } from './SaturationAnalyzer';
import { TrendPredictor } from './TrendPredictor';
import { WinnerProduct } from './WinnerProductCard';
import { 
  useRealProductResearch,
  useFavoriteProducts,
  useImportProduct,
  useResearchStats
} from '@/hooks/useRealProductResearch';
import { 
  Search, 
  TrendingUp, 
  Zap, 
  Activity, 
  Sparkles,
  Star,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function ProductResearchScanner() {
  const [activeTab, setActiveTab] = useState('browse');
  const [filters, setFilters] = useState<ProductFiltersState>({
    search: '',
    category: 'all',
    platform: 'all',
    sortBy: 'score',
    priceRange: [0, 500],
    minScore: 0,
    saturation: 'all',
  });
  const { toast } = useToast();

  // Real data hooks
  const { 
    data: products = [], 
    isLoading, 
    refetch,
    isFetching 
  } = useRealProductResearch({
    search: filters.search,
    category: filters.category,
    platform: filters.platform,
    minScore: filters.minScore,
    maxPrice: filters.priceRange[1],
    saturation: filters.saturation,
    sources: ['trends', 'amazon']
  });

  const { favorites, toggleFavorite, removeFavorite } = useFavoriteProducts();
  const importMutation = useImportProduct();
  const { data: stats } = useResearchStats();

  // Local products state with favorite status
  const [localProducts, setLocalProducts] = useState<WinnerProduct[]>([]);

  // Sync products with favorites
  useEffect(() => {
    const syncedProducts = products.map(p => ({
      ...p,
      isFavorite: favorites.some(f => f.id === p.id)
    }));
    setLocalProducts(syncedProducts);
  }, [products, favorites]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return localProducts
      .filter(product => {
        if (product.winnerScore < filters.minScore) return false;
        if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) return false;
        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'score':
            return b.winnerScore - a.winnerScore;
          case 'trending':
            return b.trendScore - a.trendScore;
          case 'engagement':
            return b.engagementRate - a.engagementRate;
          case 'profit':
            return (b.price - b.costPrice) - (a.price - a.costPrice);
          case 'recent':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
  }, [localProducts, filters]);

  const handleSearch = async () => {
    await refetch();
    toast({
      title: "Recherche terminée",
      description: `${products.length} produits trouvés`,
    });
  };

  const handleToggleFavorite = (id: string) => {
    const product = localProducts.find(p => p.id === id);
    if (product) {
      toggleFavorite(product);
      setLocalProducts(prev => prev.map(p => 
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      ));
    }
  };

  const handleImport = async (product: WinnerProduct) => {
    await importMutation.mutateAsync(product);
  };

  const handleViewDetails = (product: WinnerProduct) => {
    toast({
      title: product.name,
      description: `Score: ${product.winnerScore}% | Prix: ${product.price}€ | Profit: ${Math.round(product.estimatedProfit)}€`,
    });
  };

  const handleCategorySelect = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const handleLoadMore = async () => {
    await refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header with Real Stats */}
      <ResearchHeader stats={stats} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 h-auto p-1.5 bg-muted/50">
          <TabsTrigger 
            value="browse" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Parcourir</span>
          </TabsTrigger>
          <TabsTrigger 
            value="trends"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden md:inline">Tendances</span>
          </TabsTrigger>
          <TabsTrigger 
            value="viral"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden md:inline">Viral</span>
          </TabsTrigger>
          <TabsTrigger 
            value="saturation"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden md:inline">Saturation</span>
          </TabsTrigger>
          <TabsTrigger 
            value="prediction"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Prédiction IA</span>
          </TabsTrigger>
          <TabsTrigger 
            value="favorites"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Star className="w-4 h-4" />
            <span className="hidden md:inline">Favoris ({favorites.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Browse Tab - Main Product Discovery */}
        <TabsContent value="browse" className="space-y-6 mt-6">
          {/* Filters */}
          <ProductFilters 
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
            isSearching={isFetching}
          />

          {/* Quick Categories */}
          <QuickCategories 
            selectedCategory={filters.category}
            onSelectCategory={handleCategorySelect}
          />

          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ProductGrid
                products={filteredProducts}
                isLoading={isLoading}
                onToggleFavorite={handleToggleFavorite}
                onImport={handleImport}
                onViewDetails={handleViewDetails}
                onLoadMore={handleLoadMore}
                hasMore={filteredProducts.length >= 20}
              />
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-6">
                <FavoritesPanel
                  favorites={favorites}
                  onRemoveFavorite={removeFavorite}
                  onImport={handleImport}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <TrendScanner />
        </TabsContent>

        {/* Viral Tab */}
        <TabsContent value="viral" className="mt-6">
          <ViralProductsScraper />
        </TabsContent>

        {/* Saturation Tab */}
        <TabsContent value="saturation" className="mt-6">
          <SaturationAnalyzer />
        </TabsContent>

        {/* Prediction Tab */}
        <TabsContent value="prediction" className="mt-6">
          <TrendPredictor />
        </TabsContent>

        {/* Favorites Tab - Mobile View */}
        <TabsContent value="favorites" className="mt-6">
          <div className="lg:hidden">
            <FavoritesPanel
              favorites={favorites}
              onRemoveFavorite={removeFavorite}
              onImport={handleImport}
            />
          </div>
          <div className="hidden lg:block">
            <ProductGrid
              products={favorites}
              isLoading={false}
              onToggleFavorite={handleToggleFavorite}
              onImport={handleImport}
              onViewDetails={handleViewDetails}
              hasMore={false}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
