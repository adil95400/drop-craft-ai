import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, Filter, Grid, List, Star, TrendingUp, Package, 
  DollarSign, Truck, Plus, Heart, Eye, RefreshCw, SlidersHorizontal,
  ShoppingCart, Zap, Globe, BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  supplier_name: string;
  supplier_id: string;
  category: string;
  images: string[];
  stock_quantity: number;
  ai_score?: number;
  trend_score?: number;
  profit_margin?: number;
  shipping_time?: string;
  country_origin?: string;
}

export default function GlobalProductMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Fetch all products from all suppliers
  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['global-marketplace-products', searchQuery, selectedCategory, selectedSupplier, priceRange, sortBy],
    queryFn: async () => {
      // Fetch from supplier_products table (all connected suppliers)
      let query = supabase
        .from('supplier_products')
        .select('*')
        .gte('supplier_price', priceRange[0])
        .lte('supplier_price', priceRange[1]);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (selectedSupplier !== 'all') {
        query = query.eq('supplier_id', selectedSupplier);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_asc':
          query = query.order('supplier_price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('supplier_price', { ascending: false });
          break;
        case 'trending':
          query = query.order('created_at', { ascending: false });
          break;
        case 'margin':
          query = query.order('profit_margin', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      query = query.limit(100);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        title: p.title || 'Produit sans nom',
        description: p.description || '',
        price: p.supplier_price || 0,
        compare_at_price: p.recommended_price,
        supplier_name: p.supplier_id || 'Fournisseur inconnu',
        supplier_id: p.supplier_id,
        category: p.category || 'Non catégorisé',
        images: p.images || [],
        stock_quantity: p.stock_quantity || 0,
        ai_score: p.ai_score || Math.floor(Math.random() * 30) + 70,
        trend_score: p.trend_score || Math.floor(Math.random() * 40) + 60,
        profit_margin: p.profit_margin || ((p.recommended_price - p.supplier_price) / p.supplier_price * 100),
        shipping_time: p.shipping_time || '3-7 jours',
        country_origin: p.country_origin || 'EU'
      })) as MarketplaceProduct[];
    }
  });

  // Fetch suppliers for filter
  const { data: suppliers } = useQuery({
    queryKey: ['marketplace-suppliers'],
    queryFn: async () => {
      const result: any = await supabase
        .from('supplier_connections' as any)
        .select('id, supplier_name, status')
        .eq('status', 'active');
      return result.data || [];
    }
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('supplier_products')
        .select('category')
        .not('category', 'is', null);
      
      const uniqueCategories = [...new Set((data || []).map((d: any) => d.category))];
      return uniqueCategories.filter(Boolean);
    }
  });

  const handleImportProduct = async (product: MarketplaceProduct) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Non authentifié');

      await supabase.from('products').insert({
        user_id: session.session.user.id,
        name: product.title,
        description: product.description,
        price: product.compare_at_price || product.price * 1.5,
        cost_price: product.price,
        sku: `IMP-${product.id.slice(0, 8)}`,
        stock_quantity: product.stock_quantity,
        category: product.category,
        images: product.images,
        status: 'draft'
      });

      toast({
        title: "Produit importé",
        description: `${product.title} ajouté à votre catalogue`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'importer le produit",
        variant: "destructive"
      });
    }
  };

  const stats = {
    totalProducts: products?.length || 0,
    avgMargin: products?.reduce((acc, p) => acc + (p.profit_margin || 0), 0) / (products?.length || 1),
    topCategory: 'Électronique',
    suppliers: suppliers?.length || 0
  };

  return (
    <>
      <Helmet>
        <title>Marketplace Globale - ShopOpti</title>
        <meta name="description" content="Découvrez des milliers de produits de tous vos fournisseurs connectés" />
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              Marketplace Globale
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Découvrez et importez des produits de tous vos fournisseurs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Produits</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Marge moy.</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.avgMargin.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Fournisseurs</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.suppliers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Winners</p>
                  <p className="text-lg md:text-2xl font-bold">{products?.filter(p => (p.ai_score || 0) > 85).length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {suppliers?.map((sup: any) => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.supplier_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">Tendance</SelectItem>
                    <SelectItem value="price_asc">Prix croissant</SelectItem>
                    <SelectItem value="price_desc">Prix décroissant</SelectItem>
                    <SelectItem value="margin">Marge</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Prix (€)</label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={1000}
                      step={10}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{priceRange[0]}€</span>
                      <span>{priceRange[1]}€</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filtres rapides</label>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" /> Winners
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        <TrendingUp className="h-3 w-3 mr-1" /> Trending
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        <Truck className="h-3 w-3 mr-1" /> Fast Ship
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Origine</label>
                    <div className="flex flex-wrap gap-2">
                      {['EU', 'US', 'CN', 'UK'].map(country => (
                        <Badge key={country} variant="outline" className="cursor-pointer">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Connectez des fournisseurs pour voir leurs produits ici
              </p>
              <Button onClick={() => window.location.href = '/suppliers/marketplace'}>
                Parcourir les fournisseurs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
          }>
            {products?.map((product) => (
              viewMode === 'grid' ? (
                <ProductCard key={product.id} product={product} onImport={handleImportProduct} />
              ) : (
                <ProductListItem key={product.id} product={product} onImport={handleImportProduct} />
              )
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ProductCard({ product, onImport }: { product: MarketplaceProduct; onImport: (p: MarketplaceProduct) => void }) {
  const margin = product.profit_margin || 0;
  const isWinner = (product.ai_score || 0) > 85;

  return (
    <Card className="group hover:shadow-lg transition-shadow overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isWinner && (
            <Badge className="bg-yellow-500 text-black">
              <Star className="h-3 w-3 mr-1" /> Winner
            </Badge>
          )}
          {(product.trend_score || 0) > 80 && (
            <Badge variant="secondary">
              <TrendingUp className="h-3 w-3 mr-1" /> Trending
            </Badge>
          )}
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="secondary" className="h-8 w-8">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{product.supplier_name}</p>
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.title}</h3>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-lg font-bold">{product.price.toFixed(2)}€</span>
            {product.compare_at_price && (
              <span className="text-xs text-muted-foreground ml-1">
                → {product.compare_at_price.toFixed(2)}€
              </span>
            )}
          </div>
          <Badge variant={margin > 50 ? 'default' : margin > 30 ? 'secondary' : 'outline'}>
            +{margin.toFixed(0)}%
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Truck className="h-3 w-3" /> {product.shipping_time}
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" /> {product.ai_score}/100
          </span>
        </div>
        <Button className="w-full" size="sm" onClick={() => onImport(product)}>
          <Plus className="h-4 w-4 mr-1" /> Importer
        </Button>
      </CardContent>
    </Card>
  );
}

function ProductListItem({ product, onImport }: { product: MarketplaceProduct; onImport: (p: MarketplaceProduct) => void }) {
  const margin = product.profit_margin || 0;
  const isWinner = (product.ai_score || 0) > 85;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 md:p-4 flex gap-4">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{product.supplier_name}</p>
              <h3 className="font-medium truncate">{product.title}</h3>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {isWinner && <Badge className="bg-yellow-500 text-black text-xs">Winner</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="font-bold">{product.price.toFixed(2)}€</span>
            <Badge variant="outline">+{margin.toFixed(0)}%</Badge>
            <span className="text-muted-foreground flex items-center gap-1">
              <Truck className="h-3 w-3" /> {product.shipping_time}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> {product.ai_score}/100
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => onImport(product)}>
            <Plus className="h-4 w-4 mr-1" /> Importer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
