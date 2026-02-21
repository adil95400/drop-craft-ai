import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Search, Filter, Star, 
  Heart, ShoppingCart, Grid, List 
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const CategoryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { category } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('products') as any)
        .select('*')
        .eq('category', category)
        .limit(50);

      if (error) throw error;

      const mappedProducts = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.original_price,
        rating: p.rating || 4.0,
        reviewsCount: p.reviews_count || 0,
        image: p.image_url || 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400',
        brand: p.brand || 'Non spécifié',
        inStock: p.availability_status === 'in_stock',
        discount: p.profit_margin ? Math.round(p.profit_margin) : null
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortOptions = [
    { value: 'popular', label: 'Plus populaires' },
    { value: 'price-low', label: 'Prix croissant' },
    { value: 'price-high', label: 'Prix décroissant' },
    { value: 'rating', label: 'Mieux notés' },
    { value: 'newest', label: 'Plus récents' }
  ];

  const priceRanges = [
    { value: 'all', label: 'Tous les prix' },
    { value: '0-50', label: 'Moins de 50€' },
    { value: '50-100', label: '50€ - 100€' },
    { value: '100-200', label: '100€ - 200€' },
    { value: '200+', label: 'Plus de 200€' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category} - ShopOpti Marketplace</title>
        <meta name="description" content={`Découvrez notre sélection de produits ${category} avec les meilleurs prix et fournisseurs.`} />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">{category}</h1>
            <p className="text-muted-foreground">
              {filteredProducts.length} produits disponibles
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher dans cette catégorie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                {viewMode === 'grid' ? (
                  <div onClick={() => navigate(`/marketplace/product/${product.id}`)}>
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {product.discount && (
                        <Badge className="absolute top-2 left-2 bg-red-500">
                          -{product.discount}%
                        </Badge>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="secondary">Rupture de stock</Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 space-y-2">
                      <Badge variant="outline" className="text-xs">{product.brand}</Badge>
                      <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-sm">{product.rating}</span>
                        <span className="text-xs text-muted-foreground">({product.reviewsCount})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{product.price}€</span>
                            {product.originalPrice && (
                              <span className="text-sm line-through text-muted-foreground">
                                {product.originalPrice}€
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" disabled={!product.inStock}>
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 p-4" onClick={() => navigate(`/marketplace/product/${product.id}`)}>
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded"
                      />
                      {product.discount && (
                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-xs">
                          -{product.discount}%
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="text-xs mb-1">{product.brand}</Badge>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg">{product.price}€</span>
                            {product.originalPrice && (
                              <span className="text-sm line-through text-muted-foreground">
                                {product.originalPrice}€
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 justify-end mb-2">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-sm">{product.rating}</span>
                            <span className="text-xs text-muted-foreground">({product.reviewsCount})</span>
                          </div>
                          <Button size="sm" disabled={!product.inStock}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {product.inStock ? 'Ajouter' : 'Rupture'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center">
          <Button variant="outline" size="lg">
            Charger plus de produits
          </Button>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;