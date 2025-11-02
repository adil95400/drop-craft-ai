import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Package, MapPin, DollarSign, Clock, TrendingUp } from 'lucide-react';

const ShippingManagementPage: React.FC = () => {
  const carriers = [
    {
      id: 1,
      name: 'Colissimo',
      status: 'active',
      shipments: 234,
      avgCost: 6.50,
      avgDelivery: 2,
    },
    {
      id: 2,
      name: 'Chronopost',
      status: 'active',
      shipments: 89,
      avgCost: 12.80,
      avgDelivery: 1,
    },
    {
      id: 3,
      name: 'Mondial Relay',
      status: 'active',
      shipments: 156,
      avgCost: 4.20,
      avgDelivery: 3,
    },
  ];

  const zones = [
    { name: 'France métropolitaine', orders: 456, avgCost: 5.50 },
    { name: 'Europe', orders: 89, avgCost: 12.00 },
    { name: 'International', orders: 23, avgCost: 25.00 },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des expéditions</h1>
          <p className="text-muted-foreground">
            Configurez vos options de livraison
          </p>
        </div>
        <Button>
          <Truck className="mr-2 h-4 w-4" />
          Ajouter un transporteur
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expéditions ce mois</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">479</div>
            <p className="text-xs text-muted-foreground">+18% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût moyen</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€7.20</div>
            <p className="text-xs text-muted-foreground">Par colis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3j</div>
            <p className="text-xs text-muted-foreground">Livraison</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de livraison</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97.5%</div>
            <p className="text-xs text-muted-foreground">Sans incident</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="carriers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="carriers">Transporteurs</TabsTrigger>
          <TabsTrigger value="zones">Zones de livraison</TabsTrigger>
          <TabsTrigger value="rules">Règles d'expédition</TabsTrigger>
          <TabsTrigger value="tracking">Suivi</TabsTrigger>
        </TabsList>

        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transporteurs actifs</CardTitle>
              <CardDescription>Gérez vos transporteurs partenaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {carriers.map((carrier) => (
                  <div
                    key={carrier.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{carrier.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {carrier.shipments} expéditions ce mois
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm font-semibold">€{carrier.avgCost}</div>
                        <div className="text-xs text-muted-foreground">Coût moyen</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">{carrier.avgDelivery}j</div>
                        <div className="text-xs text-muted-foreground">Délai</div>
                      </div>
                      <Badge variant="default">{carrier.status}</Badge>
                      <Button size="sm" variant="outline">
                        Configurer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardTitle>Zones de livraison</CardTitle>
              <CardDescription>Configurez vos zones et tarifs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zones.map((zone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{zone.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {zone.orders} commandes ce mois
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold">€{zone.avgCost}</div>
                        <div className="text-xs text-muted-foreground">Coût moyen</div>
                      </div>
                      <Button size="sm" variant="outline">
                        Modifier
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Règles d'expédition</CardTitle>
              <CardDescription>Configurez les conditions de livraison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Livraison gratuite</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Dès 50€ d'achat en France métropolitaine
                  </p>
                  <Button size="sm" variant="outline">
                    Modifier
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Express</h4>
                    <Badge variant="secondary">Inactif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Livraison en 24h pour +5€
                  </p>
                  <Button size="sm" variant="outline">
                    Activer
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Point relais</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Retrait en point relais à partir de 3.50€
                  </p>
                  <Button size="sm" variant="outline">
                    Modifier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des expéditions</CardTitle>
              <CardDescription>Suivez vos colis en temps réel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">Commande #12345</h4>
                      <p className="text-sm text-muted-foreground">
                        Colissimo • Tracking: 6A12345678901
                      </p>
                    </div>
                    <Badge>En transit</Badge>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                      <div>
                        <p className="text-sm font-medium">Colis pris en charge</p>
                        <p className="text-xs text-muted-foreground">15/01/2024 - 14:30</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                      <div>
                        <p className="text-sm font-medium">En cours d'acheminement</p>
                        <p className="text-xs text-muted-foreground">16/01/2024 - 08:15</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-muted mt-1.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Livraison prévue
                        </p>
                        <p className="text-xs text-muted-foreground">17/01/2024</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShippingManagementPage;
