import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Heart, 
  ExternalLink,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Eye,
  Truck,
  Shield,
  Zap
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Product {
  id: string;
  name: string;
  supplier: string;
  supplierLogo: string;
  price: number;
  costPrice: number;
  margin: number;
  rating: number;
  reviews: number;
  sales: number;
  stock: number;
  trend: string;
  category: string;
  imageUrl: string;
  isWinner: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  deliveryTime: string;
  tags: string[];
  description?: string;
  features?: string[];
  variants?: any[];
  priceHistory?: any[];
  competitors?: any[];
}

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onImport: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
  isFavorite: boolean;
}

export const ProductDetail = ({ 
  product, 
  onClose, 
  onImport, 
  onToggleFavorite, 
  isFavorite 
}: ProductDetailProps) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const priceHistoryData = [
    { month: 'Jan', price: 25.99 },
    { month: 'Fév', price: 24.99 },
    { month: 'Mar', price: 26.99 },
    { month: 'Avr', price: 24.99 },
    { month: 'Mai', price: 23.99 },
    { month: 'Juin', price: 24.99 },
  ];

  const competitors = [
    { name: "Concurrent A", price: 29.99, margin: 35, rating: 4.2 },
    { name: "Concurrent B", price: 27.99, margin: 42, rating: 4.5 },
    { name: "Concurrent C", price: 31.99, margin: 28, rating: 4.0 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={product.supplierLogo} />
                <AvatarFallback>{product.supplier.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{product.name}</CardTitle>
                <p className="text-muted-foreground">Par {product.supplier}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => onToggleFavorite(product.id)}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </Button>
              <Button variant="ghost" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Images & Info */}
            <div className="lg:col-span-1 space-y-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-20 h-20 text-muted-foreground" />
                )}
              </div>

              {/* Quick Stats */}
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Prix de vente</span>
                    <span className="font-bold text-primary text-lg">{product.price}€</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Coût d'achat</span>
                    <span className="font-medium">{product.costPrice}€</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Marge</span>
                    <Badge className="bg-green-100 text-green-800">{product.margin}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bénéfice</span>
                    <span className="font-bold text-green-600">
                      {(product.price - product.costPrice).toFixed(2)}€
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  onClick={() => onImport(product)}
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Importer dans ma boutique
                </Button>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Voir chez le fournisseur
                </Button>
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Aperçu</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="competitors">Concurrence</TabsTrigger>
                  <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {product.isWinner && (
                      <Badge className="bg-yellow-500 text-black">
                        <Zap className="w-3 h-3 mr-1" />
                        Winner détecté
                      </Badge>
                    )}
                    {product.isTrending && (
                      <Badge className="bg-green-500 text-white">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    {product.isBestSeller && (
                      <Badge className="bg-purple-500 text-white">
                        Best seller
                      </Badge>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-4">
                    <div className="flex">{renderStars(Math.floor(product.rating))}</div>
                    <span className="text-sm text-muted-foreground">
                      {product.rating}/5 ({product.reviews} avis)
                    </span>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-border/50">
                      <CardContent className="p-3 text-center">
                        <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-lg font-bold">{product.sales}</p>
                        <p className="text-xs text-muted-foreground">Ventes/mois</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardContent className="p-3 text-center">
                        <Package className="w-6 h-6 mx-auto mb-2 text-green-600" />
                        <p className="text-lg font-bold">{product.stock}</p>
                        <p className="text-xs text-muted-foreground">En stock</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardContent className="p-3 text-center">
                        <Truck className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-lg font-bold">{product.deliveryTime}</p>
                        <p className="text-xs text-muted-foreground">Livraison</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardContent className="p-3 text-center">
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-lg font-bold">{product.trend}</p>
                        <p className="text-xs text-muted-foreground">Tendance</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Description */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {product.description || "Description du produit non disponible."}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Features */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Caractéristiques</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(product.features || [
                          "Qualité premium",
                          "Garantie constructeur", 
                          "Livraison rapide",
                          "Support client 24/7"
                        ]).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Historique des prix</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={priceHistoryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Popularité</span>
                            <span className="text-sm">85%</span>
                          </div>
                          <Progress value={85} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Conversion</span>
                            <span className="text-sm">12%</span>
                          </div>
                          <Progress value={12} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Satisfaction</span>
                            <span className="text-sm">92%</span>
                          </div>
                          <Progress value={92} />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Recommandations IA</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span className="text-sm">Produit Winner avec fort potentiel</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span className="text-sm">Marge excellente (45%)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                          <span className="text-sm">Stock en baisse (-15% ce mois)</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="competitors" className="space-y-4">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Analyse concurrentielle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {competitors.map((competitor, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{competitor.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {competitor.rating}/5 • {competitor.margin}% marge
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{competitor.price}€</p>
                              <Badge variant={competitor.price < product.price ? 'destructive' : 'default'}>
                                {competitor.price < product.price ? 'Moins cher' : 'Plus cher'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Historique du produit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Produit ajouté au catalogue</p>
                            <p className="text-xs text-muted-foreground">Il y a 6 mois</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Détection Winner par IA</p>
                            <p className="text-xs text-muted-foreground">Il y a 3 mois</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Devient Best Seller</p>
                            <p className="text-xs text-muted-foreground">Il y a 1 mois</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};