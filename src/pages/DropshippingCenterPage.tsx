import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, TrendingUp, DollarSign, Truck, Globe, ShoppingBag } from 'lucide-react';

const DropshippingCenterPage: React.FC = () => {
  const suppliers = [
    {
      id: 1,
      name: 'AliExpress',
      status: 'connected',
      products: 234,
      orders: 89,
      avgShipping: 15,
      rating: 4.5,
    },
    {
      id: 2,
      name: 'Oberlo',
      status: 'connected',
      products: 156,
      orders: 45,
      avgShipping: 12,
      rating: 4.8,
    },
    {
      id: 3,
      name: 'Spocket',
      status: 'not_connected',
      products: 0,
      orders: 0,
      avgShipping: 0,
      rating: 0,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Centre Dropshipping</h1>
          <p className="text-muted-foreground">
            Gérez votre activité de dropshipping
          </p>
        </div>
        <Button>
          <Package className="mr-2 h-4 w-4" />
          Connecter un fournisseur
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits importés</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">390</div>
            <p className="text-xs text-muted-foreground">2 fournisseurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes en cours</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">134</div>
            <p className="text-xs text-muted-foreground">En transit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge moyenne</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +3% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14 jours</div>
            <p className="text-xs text-muted-foreground">Livraison estimée</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    </div>
                    <Badge
                      variant={supplier.status === 'connected' ? 'default' : 'secondary'}
                    >
                      {supplier.status === 'connected' ? 'Connecté' : 'Non connecté'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supplier.status === 'connected' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xl font-bold">{supplier.products}</div>
                          <div className="text-xs text-muted-foreground">Produits</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">{supplier.orders}</div>
                          <div className="text-xs text-muted-foreground">Commandes</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Délai moyen</span>
                          <span className="font-medium">{supplier.avgShipping} jours</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Note</span>
                          <span className="font-medium">{supplier.rating}/5</span>
                        </div>
                      </div>
                      <Button className="w-full" variant="outline">
                        Gérer
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Connectez ce fournisseur pour importer des produits
                      </p>
                      <Button className="w-full">Connecter</Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Avantages du dropshipping</CardTitle>
              <CardDescription>
                Pourquoi choisir le dropshipping?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex gap-3">
                  <Package className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Pas de stock</h4>
                    <p className="text-sm text-muted-foreground">
                      Vendez sans gérer d'inventaire physique
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Faible investissement</h4>
                    <p className="text-sm text-muted-foreground">
                      Démarrez votre business avec un capital minimal
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Globe className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Large catalogue</h4>
                    <p className="text-sm text-muted-foreground">
                      Accédez à des millions de produits du monde entier
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Truck className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Livraison automatique</h4>
                    <p className="text-sm text-muted-foreground">
                      Le fournisseur expédie directement au client
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Catalogue dropshipping</CardTitle>
              <CardDescription>Produits importés de vos fournisseurs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Liste des produits dropshipping...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des commandes</CardTitle>
              <CardDescription>Suivez vos commandes dropshipping</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Liste des commandes en dropshipping...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automatisation</CardTitle>
              <CardDescription>Automatisez la gestion de vos commandes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Commande automatique</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Les commandes sont automatiquement transférées au fournisseur
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Mise à jour du tracking</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Les numéros de suivi sont automatiquement synchronisés
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Synchronisation stock</h4>
                    <Badge variant="secondary">Inactif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Synchronise automatiquement les niveaux de stock
                  </p>
                  <Button size="sm" variant="outline">Activer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DropshippingCenterPage;
