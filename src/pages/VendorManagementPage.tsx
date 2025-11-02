import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Users, DollarSign, Package, TrendingUp, Star } from 'lucide-react';

const VendorManagementPage: React.FC = () => {
  const vendors = [
    {
      id: 1,
      name: 'TechStore Pro',
      email: 'contact@techstore.com',
      status: 'active',
      products: 234,
      sales: 1567,
      revenue: 45678,
      commission: 4567,
      rating: 4.8,
    },
    {
      id: 2,
      name: 'Fashion Paradise',
      email: 'hello@fashion.com',
      status: 'active',
      products: 456,
      sales: 2345,
      revenue: 67890,
      commission: 6789,
      rating: 4.6,
    },
    {
      id: 3,
      name: 'Home & Garden',
      email: 'info@homegarden.com',
      status: 'pending',
      products: 89,
      sales: 234,
      revenue: 12345,
      commission: 1234,
      rating: 4.2,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des vendeurs</h1>
          <p className="text-muted-foreground">
            Administrez votre marketplace multi-vendeurs
          </p>
        </div>
        <Button>
          <Users className="mr-2 h-4 w-4" />
          Inviter un vendeur
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendeurs actifs</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">+5 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GMV total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€125,913</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +22% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€12,590</div>
            <p className="text-xs text-muted-foreground">Votre part ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits vendeurs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,567</div>
            <p className="text-xs text-muted-foreground">Sur la marketplace</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendors">Vendeurs</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des vendeurs</CardTitle>
              <CardDescription>Gérez vos partenaires vendeurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{vendor.name}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">
                              {vendor.rating}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{vendor.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {vendor.products} produits • {vendor.sales} ventes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm font-semibold">€{vendor.revenue}</div>
                        <div className="text-xs text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">€{vendor.commission}</div>
                        <div className="text-xs text-muted-foreground">Commission</div>
                      </div>
                      <Badge
                        variant={vendor.status === 'active' ? 'default' : 'secondary'}
                      >
                        {vendor.status === 'active' ? 'Actif' : 'En attente'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Gérer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Structure de commissions</CardTitle>
              <CardDescription>Configurez vos taux par catégorie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: 'Électronique', rate: 15 },
                  { category: 'Mode & Vêtements', rate: 20 },
                  { category: 'Maison & Jardin', rate: 18 },
                  { category: 'Sports & Loisirs', rate: 12 },
                  { category: 'Livres & Média', rate: 10 },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">{item.category}</h4>
                      <p className="text-sm text-muted-foreground">
                        Commission sur les ventes
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="text-lg">
                        {item.rate}%
                      </Badge>
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

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 vendeurs</CardTitle>
                <CardDescription>Par revenue ce mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendors.slice(0, 5).map((vendor, index) => (
                    <div key={vendor.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {vendor.sales} ventes
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold">€{vendor.revenue}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution GMV</CardTitle>
                <CardDescription>Répartition du volume d'affaires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendors.slice(0, 3).map((vendor) => (
                    <div key={vendor.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{vendor.name}</span>
                        <span className="font-medium">€{vendor.revenue}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(vendor.revenue / 125913) * 100}%`,
                          }}
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
              <CardTitle>Paramètres marketplace</CardTitle>
              <CardDescription>Configuration générale des vendeurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Validation des produits</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tous les produits doivent être validés avant publication
                  </p>
                  <Button size="sm" variant="outline">
                    Modifier
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Paiement automatique</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Versement automatique des commissions tous les 15 du mois
                  </p>
                  <Button size="sm" variant="outline">
                    Configurer
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Seuil minimum de paiement</h4>
                    <Badge variant="outline">€100</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Montant minimum pour déclencher un versement
                  </p>
                  <Button size="sm" variant="outline">
                    Modifier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorManagementPage;
