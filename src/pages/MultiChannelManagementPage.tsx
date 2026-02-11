import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, ShoppingBag, TrendingUp, RefreshCw, Globe, BarChart3 } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const MultiChannelManagementPage: React.FC = () => {
  const channels = [
    {
      id: 1,
      name: 'Amazon',
      type: 'marketplace',
      status: 'connected',
      products: 234,
      orders: 156,
      revenue: 15678,
    },
    {
      id: 2,
      name: 'eBay',
      type: 'marketplace',
      status: 'connected',
      products: 189,
      orders: 89,
      revenue: 8765,
    },
    {
      id: 3,
      name: 'Facebook Shop',
      type: 'social',
      status: 'connected',
      products: 234,
      orders: 67,
      revenue: 5432,
    },
    {
      id: 4,
      name: 'Google Shopping',
      type: 'advertising',
      status: 'not_connected',
      products: 0,
      orders: 0,
      revenue: 0,
    },
  ];

  return (
    <ChannablePageWrapper
      title="Gestion Multi-Canal"
      description="Gérez tous vos canaux de vente depuis un seul endroit"
      heroImage="integrations"
      badge={{ label: 'Multi-Canal', icon: Globe }}
      actions={
        <Button size="sm">
          <Store className="mr-2 h-4 w-4" />
          Connecter un canal
        </Button>
      }
    >

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canaux actifs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 marketplaces, 5 réseaux sociaux</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€29,875</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">312</div>
            <p className="text-xs text-muted-foreground">Tous canaux</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits listés</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">657</div>
            <p className="text-xs text-muted-foreground">Sur tous les canaux</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Canaux</TabsTrigger>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {channels.map((channel) => (
              <Card key={channel.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{channel.name}</CardTitle>
                        <CardDescription className="capitalize">{channel.type}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={channel.status === 'connected' ? 'default' : 'secondary'}>
                      {channel.status === 'connected' ? 'Connecté' : 'Non connecté'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {channel.status === 'connected' ? (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xl font-bold">{channel.products}</div>
                          <div className="text-xs text-muted-foreground">Produits</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">{channel.orders}</div>
                          <div className="text-xs text-muted-foreground">Commandes</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">€{channel.revenue}</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1" variant="outline">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Synchroniser
                        </Button>
                        <Button className="flex-1" variant="outline">
                          Gérer
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Connectez ce canal pour vendre sur {channel.name}
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
              <CardTitle>Canaux disponibles</CardTitle>
              <CardDescription>Étendez votre présence en ligne</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {['Etsy', 'Walmart', 'Pinterest', 'TikTok Shop'].map((platform) => (
                  <Card key={platform} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 text-center">
                      <div className="h-16 bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <Store className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h4 className="font-semibold mb-2">{platform}</h4>
                      <Button size="sm" variant="outline" className="w-full">
                        Connecter
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Synchronisation automatique</CardTitle>
              <CardDescription>Configurez la synchronisation des données</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Synchronisation des stocks</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Mise à jour automatique toutes les 15 minutes
                  </p>
                  <Button size="sm" variant="outline">
                    Configurer
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Synchronisation des prix</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Mise à jour en temps réel des modifications de prix
                  </p>
                  <Button size="sm" variant="outline">
                    Configurer
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Import des commandes</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Import automatique des nouvelles commandes toutes les 5 minutes
                  </p>
                  <Button size="sm" variant="outline">
                    Configurer
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Mise à jour des produits</h4>
                    <Badge variant="secondary">Inactif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Synchronisation bidirectionnelle des descriptions et images
                  </p>
                  <Button size="sm" variant="outline">
                    Activer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance par canal</CardTitle>
                <CardDescription>Revenue et commandes ce mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {channels
                    .filter((c) => c.status === 'connected')
                    .map((channel) => (
                      <div key={channel.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{channel.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {channel.orders} commandes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{channel.revenue}</p>
                          <p className="text-xs text-muted-foreground">
                            {((channel.revenue / 29875) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de conversion</CardTitle>
                <CardDescription>Par canal de vente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {channels
                    .filter((c) => c.status === 'connected')
                    .map((channel) => (
                      <div key={channel.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{channel.name}</span>
                          <span className="font-medium">
                            {(Math.random() * 5 + 1).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres multi-canal</CardTitle>
              <CardDescription>Configuration générale</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Paramètres de gestion multi-canal...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
};

export default MultiChannelManagementPage;
