import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Clock, TrendingUp, DollarSign, Users, Plus } from 'lucide-react';

const FlashSalesPage: React.FC = () => {
  const flashSales = [
    {
      id: 1,
      name: 'Vente Flash Weekend',
      discount: 50,
      products: 12,
      status: 'active',
      sold: 89,
      stock: 200,
      revenue: 4567,
      endsIn: '2h 34min',
    },
    {
      id: 2,
      name: 'Deal du Jour',
      discount: 30,
      products: 5,
      status: 'scheduled',
      sold: 0,
      stock: 100,
      revenue: 0,
      startsIn: '5h',
    },
    {
      id: 3,
      name: 'Black Friday Preview',
      discount: 70,
      products: 25,
      status: 'completed',
      sold: 234,
      stock: 250,
      revenue: 12890,
      completedAt: '2024-01-10',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ventes Flash</h1>
          <p className="text-muted-foreground">
            Créez l'urgence et boostez vos ventes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle vente flash
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes flash actives</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 programmées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue généré</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€17,457</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits vendus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">323</div>
            <p className="text-xs text-muted-foreground">Sur 550 disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.5%</div>
            <p className="text-xs text-muted-foreground">+8% vs ventes normales</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Actives</TabsTrigger>
          <TabsTrigger value="scheduled">Programmées</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventes flash en cours</CardTitle>
              <CardDescription>Offres actuellement disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flashSales
                  .filter((sale) => sale.status === 'active')
                  .map((sale) => (
                    <div
                      key={sale.id}
                      className="p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary rounded-lg">
                            <Zap className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{sale.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="destructive" className="gap-1">
                                <Clock className="h-3 w-3" />
                                Se termine dans {sale.endsIn}
                              </Badge>
                              <Badge variant="outline">-{sale.discount}%</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Modifier
                          </Button>
                          <Button size="sm" variant="outline">
                            Arrêter
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Produits</div>
                          <div className="text-lg font-semibold">{sale.products}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Vendus</div>
                          <div className="text-lg font-semibold">
                            {sale.sold}/{sale.stock}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                          <div className="text-lg font-semibold">€{sale.revenue}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Taux</div>
                          <div className="text-lg font-semibold">
                            {((sale.sold / sale.stock) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(sale.sold / sale.stock) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Ventes programmées</CardTitle>
              <CardDescription>Prochaines ventes flash à venir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flashSales
                  .filter((sale) => sale.status === 'scheduled')
                  .map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{sale.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Démarre dans {sale.startsIn} • {sale.products} produits • -
                            {sale.discount}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Programmée</Badge>
                        <Button size="sm" variant="outline">
                          Modifier
                        </Button>
                        <Button size="sm">Lancer maintenant</Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Ventes terminées</CardTitle>
              <CardDescription>Historique des ventes flash</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flashSales
                  .filter((sale) => sale.status === 'completed')
                  .map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{sale.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Terminée le {sale.completedAt} • {sale.sold} ventes • €
                            {sale.revenue}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {((sale.sold / sale.stock) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Taux de vente</div>
                        </div>
                        <Button size="sm" variant="outline">
                          Voir rapport
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de ventes flash</CardTitle>
              <CardDescription>Modèles prédéfinis pour lancer rapidement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: 'Weekend Deal', discount: 30, duration: '48h' },
                  { name: 'Flash 24h', discount: 50, duration: '24h' },
                  { name: 'Happy Hour', discount: 20, duration: '2h' },
                ].map((template, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <div className="text-4xl font-bold text-primary mb-2">
                          -{template.discount}%
                        </div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Durée: {template.duration}
                        </p>
                      </div>
                      <Button className="w-full" size="sm">
                        Utiliser ce template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FlashSalesPage;
