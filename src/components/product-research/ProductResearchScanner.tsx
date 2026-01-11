import { useState, useEffect, useMemo } from 'react';
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
  Search, 
  TrendingUp, 
  Zap, 
  Activity, 
  Target,
  Sparkles,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data generator for demo
const generateMockProducts = (count: number): WinnerProduct[] => {
  const categories = ['Mode', 'Électronique', 'Maison', 'Beauté', 'Sport', 'Jouets'];
  const platforms = ['TikTok', 'Facebook', 'Instagram', 'AliExpress', 'Amazon'];
  const names = [
    'LED Strip Lights RGB',
    'Portable Blender Pro',
    'Smart Watch Fitness',
    'Massage Gun Mini',
    'Phone Holder Car Mount',
    'Wireless Earbuds V5',
    'Ring Light Selfie',
    'Yoga Mat Premium',
    'Pet Hair Remover',
    'Solar Power Bank',
    'Neck Massager Electric',
    'Mini Projector HD',
    'Air Fryer Digital',
    'Smart Bulb WiFi',
    'Posture Corrector Pro'
  ];

  return Array.from({ length: count }, (_, i) => {
    const price = Math.floor(Math.random() * 80) + 15;
    const costPrice = price * (0.3 + Math.random() * 0.3);
    
    return {
      id: `product-${i}-${Date.now()}`,
      name: names[i % names.length],
      image: `https://picsum.photos/400/400?random=${i}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      winnerScore: Math.floor(Math.random() * 40) + 60,
      trendScore: Math.floor(Math.random() * 40) + 60,
      engagementRate: Math.floor(Math.random() * 20) + 5,
      estimatedProfit: price - costPrice,
      price,
      costPrice: Math.floor(costPrice),
      views: Math.floor(Math.random() * 5000000) + 100000,
      orders: Math.floor(Math.random() * 10000) + 500,
      saturation: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      tags: ['viral', 'tendance', 'bestseller'].slice(0, Math.floor(Math.random() * 3) + 1),
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      isFavorite: false,
      supplierUrl: 'https://aliexpress.com'
    };
  });
};

export function ProductResearchScanner() {
  const [activeTab, setActiveTab] = useState('browse');
  const [products, setProducts] = useState<WinnerProduct[]>([]);
  const [favorites, setFavorites] = useState<WinnerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Load initial products
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setProducts(generateMockProducts(12));
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category !== 'all' && product.category.toLowerCase() !== filters.category) {
        return false;
      }
      if (filters.platform !== 'all' && product.platform.toLowerCase() !== filters.platform) {
        return false;
      }
      if (filters.saturation !== 'all' && product.saturation !== filters.saturation) {
        return false;
      }
      if (product.winnerScore < filters.minScore) {
        return false;
      }
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }
      return true;
    }).sort((a, b) => {
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
  }, [products, filters]);

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setProducts(generateMockProducts(16));
      setIsLoading(false);
      toast({
        title: "Recherche terminée",
        description: `${16} produits trouvés`,
      });
    }, 1500);
  };

  const handleToggleFavorite = (id: string) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
    
    const product = products.find(p => p.id === id);
    if (product) {
      if (product.isFavorite) {
        setFavorites(prev => prev.filter(p => p.id !== id));
        toast({ title: "Retiré des favoris" });
      } else {
        setFavorites(prev => [...prev, { ...product, isFavorite: true }]);
        toast({ title: "Ajouté aux favoris", description: product.name });
      }
    }
  };

  const handleImport = (product: WinnerProduct) => {
    toast({
      title: "Produit importé",
      description: `${product.name} a été ajouté à votre catalogue`,
    });
  };

  const handleViewDetails = (product: WinnerProduct) => {
    toast({
      title: "Détails",
      description: `Affichage des détails de ${product.name}`,
    });
  };

  const handleCategorySelect = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setProducts(prev => [...prev, ...generateMockProducts(8)]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <ResearchHeader />

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
          />

          {/* Quick Categories */}
          <QuickCategories 
            selectedCategory={filters.category}
            onSelectCategory={handleCategorySelect}
          />

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
                hasMore={true}
              />
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-6">
                <FavoritesPanel
                  favorites={favorites}
                  onRemoveFavorite={(id) => {
                    setFavorites(prev => prev.filter(p => p.id !== id));
                    setProducts(prev => prev.map(p => 
                      p.id === id ? { ...p, isFavorite: false } : p
                    ));
                  }}
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
              onRemoveFavorite={(id) => {
                setFavorites(prev => prev.filter(p => p.id !== id));
                setProducts(prev => prev.map(p => 
                  p.id === id ? { ...p, isFavorite: false } : p
                ));
              }}
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
