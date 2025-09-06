import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, Star, Heart, Share2, 
  ShoppingCart, Eye, Package, Truck 
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const ProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Simulation de chargement du produit
    setTimeout(() => {
      setProduct({
        id: id,
        name: 'Smartphone Galaxy S24 Ultra',
        price: 1299.99,
        originalPrice: 1499.99,
        rating: 4.8,
        reviewsCount: 2847,
        description: 'Le dernier smartphone Samsung avec une caméra révolutionnaire de 200MP et une intelligence artificielle avancée.',
        category: 'Électronique',
        brand: 'Samsung',
        sku: 'SM-S928B',
        stock: 47,
        images: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
          'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79b2?w=800'
        ],
        features: [
          'Caméra 200MP avec zoom optique 10x',
          'Écran Dynamic AMOLED 2X 6.8"',
          'Processeur Snapdragon 8 Gen 3',
          'Batterie 5000mAh avec charge rapide',
          'Résistance à l\'eau IP68',
          'S Pen intégré'
        ],
        specifications: {
          'Écran': '6.8" Dynamic AMOLED 2X',
          'Processeur': 'Snapdragon 8 Gen 3',
          'RAM': '12GB',
          'Stockage': '256GB',
          'Caméra': '200MP + 50MP + 12MP + 10MP',
          'Batterie': '5000mAh',
          'OS': 'Android 14'
        },
        supplier: {
          name: 'TechWorld Pro',
          rating: 4.9,
          location: 'France',
          responseTime: '2h'
        },
        shipping: {
          cost: 0,
          time: '24-48h',
          methods: ['Standard', 'Express', 'Point Relais']
        }
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleAddToCart = () => {
    toast.success('Produit ajouté au panier!');
  };

  const handleAddToFavorites = () => {
    toast.success('Produit ajouté aux favoris!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return <div>Produit non trouvé</div>;
  }

  return (
    <>
      <Helmet>
        <title>{product.name} - Drop Craft AI Marketplace</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au marketplace
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              {product.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-muted'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{product.category}</Badge>
                <Badge variant="outline">{product.brand}</Badge>
              </div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviewsCount} avis)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{product.price}€</span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {product.originalPrice}€
                  </span>
                )}
                {product.originalPrice && (
                  <Badge variant="destructive">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </Badge>
                )}
              </div>
              <p className="text-sm text-green-600 font-medium">
                Livraison gratuite • En stock ({product.stock} disponibles)
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 text-center min-w-[60px]">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  >
                    +
                  </Button>
                </div>
                <Button onClick={handleAddToCart} className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ajouter au panier
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAddToFavorites} className="flex-1">
                  <Heart className="h-4 w-4 mr-2" />
                  Favoris
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>

            {/* Supplier Info */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Fournisseur</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.supplier.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span>{product.supplier.rating}</span>
                      <span>•</span>
                      <span>{product.supplier.location}</span>
                      <span>•</span>
                      <span>Répond sous {product.supplier.responseTime}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir profil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="space-y-4">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Caractéristiques</TabsTrigger>
            <TabsTrigger value="shipping">Livraison</TabsTrigger>
            <TabsTrigger value="reviews">Avis</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">{product.description}</p>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Caractéristiques principales</h4>
                    <ul className="space-y-2">
                      {product.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications">
            <Card>
              <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {Object.entries(product.specifications).map(([key, value]) => (
                     <div key={key} className="flex justify-between p-3 border rounded">
                       <span className="font-medium">{key}</span>
                       <span className="text-muted-foreground">{String(value)}</span>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Livraison gratuite</p>
                      <p className="text-sm text-muted-foreground">
                        Délai: {product.shipping.time}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Modes de livraison disponibles</h4>
                    <div className="space-y-2">
                      {product.shipping.methods.map((method: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4" />
                            <span>{method}</span>
                          </div>
                          <Badge variant="outline">Gratuit</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Avis clients</h3>
                  <p className="text-muted-foreground">
                    Les avis clients seront bientôt disponibles
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ProductDetailPage;