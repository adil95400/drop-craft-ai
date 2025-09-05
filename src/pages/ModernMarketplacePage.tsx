import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Store, 
  TrendingUp, 
  Star, 
  Heart, 
  ShoppingCart, 
  Filter, 
  Search, 
  SlidersHorizontal,
  Grid3X3,
  List,
  MapPin,
  Truck,
  Shield,
  Award,
  Eye,
  Share2,
  MessageCircle,
  Users,
  Clock,
  Zap,
  Sparkles,
  Crown,
  Gem
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// import { useSupabaseData } from '@/hooks/useSupabaseData';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  category: string;
  brand: string;
  location: string;
  delivery: string;
  inStock: boolean;
  trending: boolean;
  featured: boolean;
  discount?: number;
  tags: string[];
  seller: {
    name: string;
    rating: number;
    verified: boolean;
  };
}

export default function ModernMarketplacePage() {
  const { toast } = useToast();
  const { loading } = { loading: false };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    inStock: false,
    freeShipping: false,
    fastDelivery: false,
    verifiedSeller: false,
    minRating: 0
  });

  // Mock marketplace products
  const marketplaceProducts: Product[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro Max 256GB',
      description: 'Le dernier iPhone avec processeur A17 Pro, appareil photo 48MP et écran Super Retina XDR',
      price: 1229,
      originalPrice: 1299,
      rating: 4.8,
      reviewsCount: 2847,
      image: '📱',
      category: 'Électronique',
      brand: 'Apple',
      location: 'Paris, France',
      delivery: 'Livraison gratuite',
      inStock: true,
      trending: true,
      featured: true,
      discount: 5,
      tags: ['Nouveau', 'Premium', 'Livraison Rapide'],
      seller: {
        name: 'TechStore Pro',
        rating: 4.9,
        verified: true
      }
    },
    {
      id: '2',
      name: 'MacBook Air M2 13" 256GB',
      description: 'Ultrabook puissant avec puce M2, écran Liquid Retina et autonomie exceptionnelle',
      price: 1199,
      originalPrice: 1349,
      rating: 4.7,
      reviewsCount: 1532,
      image: '💻',
      category: 'Informatique',
      brand: 'Apple',
      location: 'Lyon, France',
      delivery: 'Expédition sous 24h',
      inStock: true,
      trending: true,
      featured: false,
      discount: 11,
      tags: ['Populaire', 'Étudiant', 'Professionnel'],
      seller: {
        name: 'ComputerWorld',
        rating: 4.8,
        verified: true
      }
    },
    {
      id: '3',
      name: 'Nike Air Max 90 - Edition Limitée',
      description: 'Baskets iconiques Nike avec technologie Air Max et design vintage remis au goût du jour',
      price: 139,
      originalPrice: 179,
      rating: 4.6,
      reviewsCount: 924,
      image: '👟',
      category: 'Mode',
      brand: 'Nike',
      location: 'Marseille, France',
      delivery: 'Livraison standard',
      inStock: true,
      trending: false,
      featured: true,
      discount: 22,
      tags: ['Sport', 'Lifestyle', 'Confort'],
      seller: {
        name: 'SportStyle Boutique',
        rating: 4.7,
        verified: true
      }
    },
    {
      id: '4',
      name: 'Sony WH-1000XM5 - Casque Audio',
      description: 'Casque sans fil haut de gamme avec réduction de bruit active et son Hi-Res',
      price: 329,
      originalPrice: 399,
      rating: 4.9,
      reviewsCount: 1876,
      image: '🎧',
      category: 'Audio',
      brand: 'Sony',
      location: 'Toulouse, France',
      delivery: 'Livraison express',
      inStock: true,
      trending: true,
      featured: false,
      discount: 18,
      tags: ['Audiophile', 'Voyage', 'Bluetooth'],
      seller: {
        name: 'AudioTech Experts',
        rating: 4.8,
        verified: true
      }
    },
    {
      id: '5',
      name: 'Samsung Galaxy Watch 6 Classic',
      description: 'Montre connectée élégante avec suivi santé avancé et autonomie longue durée',
      price: 429,
      originalPrice: 479,
      rating: 4.5,
      reviewsCount: 653,
      image: '⌚',
      category: 'Wearables',
      brand: 'Samsung',
      location: 'Nice, France',
      delivery: 'Livraison gratuite',
      inStock: false,
      trending: false,
      featured: true,
      discount: 10,
      tags: ['Santé', 'Sport', 'Connecté'],
      seller: {
        name: 'WearableTech',
        rating: 4.6,
        verified: false
      }
    },
    {
      id: '6',
      name: 'Canon EOS R50 - Kit Objectif',
      description: 'Appareil photo hybride 24MP avec objectif 18-45mm, parfait pour débuter en photographie',
      price: 699,
      originalPrice: 799,
      rating: 4.7,
      reviewsCount: 412,
      image: '📷',
      category: 'Photo',
      brand: 'Canon',
      location: 'Bordeaux, France',
      delivery: 'Livraison sous 48h',
      inStock: true,
      trending: false,
      featured: false,
      discount: 13,
      tags: ['Photographie', 'Créatif', 'Débutant'],
      seller: {
        name: 'Photo Pro Shop',
        rating: 4.9,
        verified: true
      }
    }
  ];

  const categories = [
    { id: 'all', name: 'Tous les produits', count: marketplaceProducts.length },
    { id: 'Électronique', name: 'Électronique', count: 1 },
    { id: 'Informatique', name: 'Informatique', count: 1 },
    { id: 'Mode', name: 'Mode & Accessoires', count: 1 },
    { id: 'Audio', name: 'Audio & Vidéo', count: 1 },
    { id: 'Wearables', name: 'Objets Connectés', count: 1 },
    { id: 'Photo', name: 'Photo & Caméra', count: 1 }
  ];

  const filteredProducts = marketplaceProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    const matchesFilters = 
      (!filters.inStock || product.inStock) &&
      (!filters.freeShipping || product.delivery.includes('gratuite')) &&
      (!filters.fastDelivery || product.delivery.includes('24h') || product.delivery.includes('express')) &&
      (!filters.verifiedSeller || product.seller.verified) &&
      (product.rating >= filters.minRating);

    return matchesSearch && matchesCategory && matchesPrice && matchesFilters;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return b.trending ? 1 : -1;
      case 'popularity':
      default:
        return (b.reviewsCount + (b.trending ? 1000 : 0) + (b.featured ? 500 : 0)) - 
               (a.reviewsCount + (a.trending ? 1000 : 0) + (a.featured ? 500 : 0));
    }
  });

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className={`group hover:shadow-xl transition-all duration-300 cursor-pointer ${
      product.featured ? 'ring-2 ring-yellow-400' : ''
    } ${!product.inStock ? 'opacity-75' : ''}`}>
      <CardContent className="p-0">
        {/* Image and badges */}
        <div className="relative">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl rounded-t-lg">
            {product.image}
          </div>
          
          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {product.featured && (
              <Badge className="bg-yellow-500 text-black font-semibold">
                <Crown className="w-3 h-3 mr-1" />
                Vedette
              </Badge>
            )}
            {product.trending && (
              <Badge className="bg-red-500 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Tendance
              </Badge>
            )}
            {product.discount && (
              <Badge variant="destructive">
                -{product.discount}%
              </Badge>
            )}
          </div>

          {/* Action buttons overlay */}
          <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
              <Heart className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Stock indicator */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
              <Badge variant="destructive" className="text-lg">
                Rupture de stock
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Brand and category */}
          <div className="flex items-center justify-between text-sm">
            <Badge variant="outline">{product.brand}</Badge>
            <span className="text-gray-500">{product.category}</span>
          </div>

          {/* Product name */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating and reviews */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-gray-500">({product.reviewsCount})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              {product.price.toLocaleString('fr-FR')}€
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {product.originalPrice.toLocaleString('fr-FR')}€
              </span>
            )}
          </div>

          {/* Seller info */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{product.seller.name}</span>
              {product.seller.verified && (
                <Shield className="w-4 h-4 text-green-500" />
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs">{product.seller.rating}</span>
            </div>
          </div>

          {/* Delivery info */}
          <div className="flex items-center text-sm text-gray-600">
            <Truck className="w-4 h-4 mr-1" />
            {product.delivery}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Add to cart button */}
          <Button 
            className="w-full mt-4" 
            disabled={!product.inStock}
            onClick={() => {
              toast({
                title: "Produit ajouté",
                description: `${product.name} ajouté au panier`,
              });
            }}
          >
            {product.inStock ? (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ajouter au panier
              </>
            ) : (
              'Indisponible'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>Marketplace - Plateforme E-commerce</title>
        <meta name="description" content="Découvrez notre marketplace avec des milliers de produits de qualité" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full px-6 py-2 border">
                <Store className="w-5 h-5 text-blue-600" />
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Marketplace Premium
                </span>
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Découvrez nos meilleures offres
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Plus de 10 000 produits sélectionnés avec soin, des vendeurs vérifiés 
                et une livraison rapide partout en France
              </p>
            </div>

            {/* Search bar */}
            <div className="max-w-2xl mx-auto mt-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Rechercher un produit, une marque, une catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg border-2 focus:border-blue-500 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-80 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    <span>Filtres</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Categories */}
                  <div>
                    <Label className="text-base font-semibold">Catégories</Label>
                    <div className="mt-3 space-y-2">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{category.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {category.count}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="text-base font-semibold">Prix</Label>
                    <div className="mt-3 space-y-4">
                      <div className="px-3">
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={2000}
                          step={10}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{priceRange[0]}€</span>
                        <span>{priceRange[1]}€</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div>
                    <Label className="text-base font-semibold">Options</Label>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="inStock">En stock uniquement</Label>
                        <Switch
                          id="inStock"
                          checked={filters.inStock}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, inStock: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="freeShipping">Livraison gratuite</Label>
                        <Switch
                          id="freeShipping"
                          checked={filters.freeShipping}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, freeShipping: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="fastDelivery">Livraison rapide</Label>
                        <Switch
                          id="fastDelivery"
                          checked={filters.fastDelivery}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, fastDelivery: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="verifiedSeller">Vendeur vérifié</Label>
                        <Switch
                          id="verifiedSeller"
                          checked={filters.verifiedSeller}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, verifiedSeller: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <Label className="text-base font-semibold">Note minimum</Label>
                    <Select 
                      value={filters.minRating.toString()} 
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, minRating: parseFloat(value) }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Toutes les notes</SelectItem>
                        <SelectItem value="3">3 étoiles et plus</SelectItem>
                        <SelectItem value="4">4 étoiles et plus</SelectItem>
                        <SelectItem value="4.5">4.5 étoiles et plus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Featured Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gem className="w-5 h-5 text-purple-500" />
                    <span>Produits Premium</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketplaceProducts.filter(p => p.featured).slice(0, 2).map((product) => (
                      <div key={product.id} className="flex space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-2xl">
                          {product.image}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-lg font-bold text-blue-600">{product.price}€</p>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs">{product.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Results header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                <div>
                  <p className="text-lg font-semibold">
                    {sortedProducts.length} produits trouvés
                  </p>
                  {searchTerm && (
                    <p className="text-sm text-gray-600">
                      pour "{searchTerm}"
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {/* Sort */}
                  <div className="flex items-center space-x-2">
                    <Label>Trier par:</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity">Popularité</SelectItem>
                        <SelectItem value="price-low">Prix croissant</SelectItem>
                        <SelectItem value="price-high">Prix décroissant</SelectItem>
                        <SelectItem value="rating">Meilleures notes</SelectItem>
                        <SelectItem value="newest">Plus récents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* View Mode */}
                  <div className="flex border rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {sortedProducts.length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {sortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Aucun produit trouvé
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Essayez d'ajuster vos filtres ou votre recherche
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setFilters({
                        inStock: false,
                        freeShipping: false,
                        fastDelivery: false,
                        verifiedSeller: false,
                        minRating: 0
                      });
                      setPriceRange([0, 1000]);
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}