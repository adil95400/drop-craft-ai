import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Star, DollarSign, Truck, Award, TrendingUp } from 'lucide-react';

export default function ProductSourcingAssistant() {
  const [searchQuery, setSearchQuery] = useState('');

  const sourcingResults = [
    {
      supplier: 'AliExpress - Premium Supplier',
      rating: 4.8,
      orders: 12500,
      price: 8.50,
      shipping: 'Fast Shipping (7-15 days)',
      shippingCost: 2.50,
      moq: 1,
      samples: true,
      verified: true,
      advantages: ['Fast shipping', 'High rating', 'Low MOQ']
    },
    {
      supplier: 'Alibaba - Manufacturer Direct',
      rating: 4.5,
      orders: 8700,
      price: 6.20,
      shipping: 'Standard (20-35 days)',
      shippingCost: 8.50,
      moq: 50,
      samples: true,
      verified: true,
      advantages: ['Best price', 'Bulk discounts', 'Customization']
    },
    {
      supplier: 'CJ Dropshipping',
      rating: 4.7,
      orders: 15000,
      price: 9.80,
      shipping: 'Express (5-10 days)',
      shippingCost: 0,
      moq: 1,
      samples: false,
      verified: true,
      advantages: ['Free shipping', 'No MOQ', 'Quality control']
    }
  ];

  const recentSourcings = [
    { product: 'Wireless Earbuds', status: 'completed', suppliers: 5, bestPrice: 7.50 },
    { product: 'Smart Watch Band', status: 'pending', suppliers: 3, bestPrice: 4.20 },
    { product: 'Phone Case', status: 'completed', suppliers: 8, bestPrice: 2.80 }
  ];

  return (
    <>
      <Helmet>
        <title>Product Sourcing Assistant - ShopOpti</title>
        <meta name="description" content="Trouvez les meilleurs fournisseurs pour vos produits avec comparaison intelligente et recommandations IA" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Product Sourcing Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Trouvez et comparez les meilleurs fournisseurs pour vos produits
          </p>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Rechercher un Fournisseur</CardTitle>
            <CardDescription>
              Décrivez le produit que vous cherchez à sourcer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Wireless earbuds with charging case"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
            
            <Textarea
              placeholder="Détails additionnels: couleurs souhaitées, spécifications techniques, quantité estimée..."
              rows={3}
            />

            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">MOQ &lt; 10</Badge>
              <Badge variant="outline">Fast Shipping</Badge>
              <Badge variant="outline">Free Samples</Badge>
              <Badge variant="outline">Rating &gt; 4.5</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Résultats du Sourcing</h2>
            <Button variant="outline">
              Trier par Prix
            </Button>
          </div>

          {sourcingResults.map((result, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{result.supplier}</h3>
                      {result.verified && (
                        <Badge className="bg-blue-500">
                          <Award className="h-3 w-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {result.rating} ({result.orders.toLocaleString()} commandes)
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        {result.shipping}
                      </span>
                    </div>

                    <div className="flex gap-2 mb-3">
                      {result.advantages.map((adv, i) => (
                        <Badge key={i} variant="secondary">{adv}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold mb-1">${result.price}</div>
                    <div className="text-sm text-muted-foreground mb-3">par unité</div>
                    <Button>Contacter Fournisseur</Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">MOQ</div>
                    <div className="font-semibold">{result.moq} unité{result.moq > 1 ? 's' : ''}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Frais de port</div>
                    <div className="font-semibold">
                      {result.shippingCost === 0 ? 'Gratuit' : `$${result.shippingCost}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Échantillons</div>
                    <div className="font-semibold">{result.samples ? 'Disponible' : 'Non disponible'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Prix total estimé</div>
                    <div className="font-semibold text-green-600">
                      ${(result.price + result.shippingCost).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Sourcings */}
        <Card>
          <CardHeader>
            <CardTitle>Recherches Récentes</CardTitle>
            <CardDescription>
              Historique de vos demandes de sourcing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSourcings.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold">{item.product}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.suppliers} fournisseurs trouvés
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Meilleur prix</div>
                      <div className="font-semibold text-green-600">${item.bestPrice}</div>
                    </div>
                    <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                      {item.status === 'completed' ? 'Complété' : 'En attente'}
                    </Badge>
                    <Button size="sm" variant="outline">Voir</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Recommandations IA
            </CardTitle>
            <CardDescription>
              Suggestions basées sur votre historique et tendances du marché
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                💡 <strong>AliExpress Premium</strong> offre le meilleur rapport qualité/prix pour ce produit
              </p>
              <p className="text-sm">
                💡 Demander des échantillons avant de commander en gros (MOQ élevé chez Alibaba)
              </p>
              <p className="text-sm">
                💡 CJ Dropshipping recommandé si vous faites du dropshipping (pas de MOQ)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
