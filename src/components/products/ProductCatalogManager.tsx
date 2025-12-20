import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  ShoppingCart, 
  Eye, 
  Heart,
  Plus,
  Zap,
  Target,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  supplier_name: string;
  image_url: string;
  rating: number;
  reviews_count: number;
  is_trending: boolean;
  is_bestseller: boolean;
  availability_status: string;
  delivery_time: string;
  profit_margin?: number;
  competition_score?: number;
}

interface ProductCatalogManagerProps {
  onImport?: (products: CatalogProduct[]) => void;
}

// Mock catalog products data
const mockCatalogProducts: CatalogProduct[] = [
  {
    id: '1',
    name: 'Casque Audio Bluetooth Premium',
    price: 79.99,
    category: 'Électronique',
    supplier_name: 'TechSupply Co',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
    rating: 4.5,
    reviews_count: 128,
    is_trending: true,
    is_bestseller: false,
    availability_status: 'in_stock',
    delivery_time: '3-5j',
    profit_margin: 35,
    competition_score: 72
  },
  {
    id: '2',
    name: 'Montre Connectée Sport',
    price: 129.99,
    category: 'Électronique',
    supplier_name: 'GadgetWorld',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
    rating: 4.8,
    reviews_count: 256,
    is_trending: true,
    is_bestseller: true,
    availability_status: 'in_stock',
    delivery_time: '2-4j',
    profit_margin: 42,
    competition_score: 85
  },
  {
    id: '3',
    name: 'Sac à Dos Voyage',
    price: 49.99,
    category: 'Mode & Accessoires',
    supplier_name: 'FashionDirect',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
    rating: 4.2,
    reviews_count: 89,
    is_trending: false,
    is_bestseller: false,
    availability_status: 'in_stock',
    delivery_time: '5-7j',
    profit_margin: 28,
    competition_score: 60
  }
];

export function ProductCatalogManager({ onImport }: ProductCatalogManagerProps) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const categories = [
    'Électronique',
    'Mode & Accessoires',
    'Maison & Jardin',
    'Sport & Loisirs',
    'Beauté & Santé',
    'Jouets & Enfants',
    'Automobile'
  ];

  useEffect(() => {
    fetchCatalogProducts();
  }, [searchTerm, selectedCategory]);

  const fetchCatalogProducts = async () => {
    try {
      setLoading(true);
      
      // Use mock data filtered by search and category
      let filteredProducts = [...mockCatalogProducts];
      
      if (selectedCategory) {
        filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.supplier_name.toLowerCase().includes(term)
        );
      }
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching catalog products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le catalogue de produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkImport = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Aucun produit sélectionné",
        description: "Veuillez sélectionner au moins un produit à importer",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    try {
      // Récupérer les produits sélectionnés
      const productsToImport = products.filter(p => selectedProducts.includes(p.id));
      
      // Préparer les données d'import for the products table
      const importData = productsToImport.map(product => ({
        user_id: user?.id,
        title: product.name,
        name: product.name,
        price: product.price,
        cost_price: product.price * 0.7, // Estimation
        category: product.category,
        supplier: product.supplier_name,
        image_url: product.image_url,
        description: `Produit ${product.name} de qualité premium`,
        status: 'draft' as const,
        sku: `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stock_quantity: 100
      }));

      // Importer les produits into the products table
      const { data: importedProducts, error: importError } = await supabase
        .from('products')
        .insert(importData)
        .select();

      if (importError) throw importError;

      toast({
        title: "Import réussi !",
        description: `${selectedProducts.length} produits importés avec succès`,
      });

      // Callback si fourni
      if (onImport) {
        onImport(productsToImport);
      }

      // Reset selection
      setSelectedProducts([]);
      
    } catch (error) {
      console.error('Error importing products:', error);
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer les produits sélectionnés",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Catalogue de Produits</CardTitle>
          <CardDescription>Chargement des produits...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-lg mb-4"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          {selectedProducts.length > 0 && (
            <Button
              onClick={handleBulkImport}
              disabled={importing}
              className="flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Import...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Importer ({selectedProducts.length})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${
              selectedProducts.includes(product.id) 
                ? 'border-primary shadow-md' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => toggleProductSelection(product.id)}
          >
            <div className="relative">
              <img
                src={product.image_url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              
              {/* Badges overlay */}
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {product.is_trending && (
                  <Badge className="bg-red-500 text-white text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Tendance
                  </Badge>
                )}
                {product.is_bestseller && (
                  <Badge className="bg-yellow-500 text-white text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Best
                  </Badge>
                )}
              </div>

              {/* Selection indicator */}
              {selectedProducts.includes(product.id) && (
                <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                  ✓
                </div>
              )}

              {/* Quick actions */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <Heart className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  {product.profit_margin && (
                    <Badge variant="outline" className="text-xs">
                      +{product.profit_margin.toFixed(0)}% marge
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{product.supplier_name}</span>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    <span>{product.rating}</span>
                    <span className="ml-1">({product.reviews_count})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                  <span className="text-green-600">
                    📦 {product.delivery_time || '7-14j'}
                  </span>
                </div>

                {product.competition_score && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Score concurrentiel</span>
                      <span className="font-medium">{product.competition_score}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-red-400 to-green-500 h-1 rounded-full"
                        style={{ width: `${product.competition_score}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
