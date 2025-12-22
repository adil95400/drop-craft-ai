import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Star, MapPin, Clock, 
  Package, Award, ShoppingCart, Heart, Eye 
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const SupplierCatalogPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const [supplier, setSupplier] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupplierData();
  }, [supplierId]);

  const loadSupplierData = async () => {
    try {
      setLoading(true);
      
      // Load supplier info
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .maybeSingle();

      if (supplierError) throw supplierError;

      if (supplierData) {
        setSupplier({
          id: supplierData.id,
          name: supplierData.name,
          description: (supplierData as any).description || 'Fournisseur professionnel',
          logo: (supplierData as any).logo_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200',
          banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
          rating: (supplierData as any).rating || 4.5,
          reviewsCount: 100,
          location: supplierData.country || 'International',
          founded: '2010',
          responseTime: '2h',
          deliveryTime: '24-48h',
          categories: [(supplierData as any).sector || 'Général'],
          certifications: ['ISO 9001', 'CE'],
          stats: {
            totalProducts: (supplierData as any).product_count || 0,
            completedOrders: 1000,
            satisfactionRate: 95
          },
          policies: {
            returns: '30 jours',
            warranty: '2 ans',
            support: '24/7'
          }
        });
      }

      // Load supplier products
      const { data: productsData, error: productsError } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', supplierId)
        .limit(20);

      if (productsError) throw productsError;

      const mappedProducts = (productsData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.original_price,
        rating: 4.5,
        reviewsCount: 50,
        image: p.image_url || 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400',
        category: p.category || 'Général',
        inStock: true,
        discount: null
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!supplier) {
    return <div>Fournisseur non trouvé</div>;
  }

  return (
    <>
      <Helmet>
        <title>{supplier.name} - Catalogue Fournisseur</title>
        <meta name="description" content={supplier.description} />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au marketplace
          </Button>
        </div>

        {/* Supplier Banner */}
        <div className="relative h-48 rounded-lg overflow-hidden">
          <img
            src={supplier.banner}
            alt={supplier.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-end gap-6">
              <div className="w-20 h-20 rounded-lg bg-white p-2 flex items-center justify-center">
                <img
                  src={supplier.logo}
                  alt={supplier.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex-1 text-white">
                <h1 className="text-3xl font-bold">{supplier.name}</h1>
                <p className="text-white/80 mb-2">{supplier.description}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span>{supplier.rating}</span>
                    <span className="text-white/60">({supplier.reviewsCount} avis)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{supplier.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Répond sous {supplier.responseTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{supplier.stats.totalProducts}</div>
              <div className="text-muted-foreground">Produits disponibles</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{supplier.stats.completedOrders.toLocaleString()}</div>
              <div className="text-muted-foreground">Commandes livrées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{supplier.stats.satisfactionRate}%</div>
              <div className="text-muted-foreground">Satisfaction client</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="about">À propos</TabsTrigger>
            <TabsTrigger value="policies">Conditions</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Categories Filter */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default">Toutes les catégories</Badge>
              {supplier.categories.map((category: string) => (
                <Badge key={category} variant="outline">{category}</Badge>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-0">
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
                      </div>
                      
                      <div className="p-4 space-y-2">
                        <Badge variant="outline" className="text-xs">{product.category}</Badge>
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
                          <Button size="sm">
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Fondé en</div>
                      <div className="font-medium">{supplier.founded}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Localisation</div>
                      <div className="font-medium">{supplier.location}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Temps de réponse</div>
                      <div className="font-medium">{supplier.responseTime}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Livraison</div>
                      <div className="font-medium">{supplier.deliveryTime}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {supplier.certifications.map((cert: string) => (
                      <Badge key={cert} variant="outline">{cert}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Spécialités</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {supplier.categories.map((category: string) => (
                    <Badge key={category} variant="secondary">{category}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Retours</h3>
                      <p className="text-2xl font-bold">{supplier.policies.returns}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Retours acceptés pendant 30 jours après réception
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Garantie</h3>
                      <p className="text-2xl font-bold">{supplier.policies.warranty}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Garantie constructeur étendue sur tous les produits
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Eye className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Support</h3>
                      <p className="text-2xl font-bold">{supplier.policies.support}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Support client disponible en continu
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default SupplierCatalogPage;