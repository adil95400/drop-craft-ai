import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Percent, DollarSign, Users, TrendingUp, Plus, Calendar } from 'lucide-react';

const CouponManagementPage: React.FC = () => {
  const coupons = [
    {
      id: 1,
      code: 'SUMMER2024',
      type: 'percentage',
      value: 20,
      uses: 156,
      limit: 500,
      status: 'active',
      expires: '2024-08-31',
    },
    {
      id: 2,
      code: 'WELCOME10',
      type: 'fixed',
      value: 10,
      uses: 89,
      limit: null,
      status: 'active',
      expires: null,
    },
    {
      id: 3,
      code: 'FLASH50',
      type: 'percentage',
      value: 50,
      uses: 234,
      limit: 500,
      status: 'expired',
      expires: '2024-01-10',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des coupons</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos codes promotionnels
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Créer un coupon
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coupons actifs</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">15 utilisés ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">479</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +24% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Économies clients</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€3,456</div>
            <p className="text-xs text-muted-foreground">Réductions accordées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'utilisation</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4%</div>
            <p className="text-xs text-muted-foreground">Des commandes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Actifs</TabsTrigger>
          <TabsTrigger value="scheduled">Programmés</TabsTrigger>
          <TabsTrigger value="expired">Expirés</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coupons actifs</CardTitle>
              <CardDescription>Codes promotionnels en cours d'utilisation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coupons
                  .filter((c) => c.status === 'active')
                  .map((coupon) => (
                    <div
                      key={coupon.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {coupon.type === 'percentage' ? (
                            <Percent className="h-5 w-5 text-primary" />
                          ) : (
                            <DollarSign className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{coupon.code}</h3>
                            <Badge variant="outline">
                              {coupon.type === 'percentage'
                                ? `-${coupon.value}%`
                                : `-€${coupon.value}`}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {coupon.expires && (
                              <>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Expire le {coupon.expires}
                                </div>
                                <span>•</span>
                              </>
                            )}
                            <span>
                              {coupon.uses} utilisations
                              {coupon.limit && ` / ${coupon.limit}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{coupon.status}</Badge>
                        <Button size="sm" variant="outline">
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline">
                          Désactiver
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Réduction fixe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Montant fixe déduit du total
                </p>
                <div className="text-3xl font-bold mb-2">€10</div>
                <p className="text-xs text-muted-foreground mb-4">Exemple: -10€</p>
                <Button className="w-full" size="sm">
                  Créer
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pourcentage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Pourcentage sur le total
                </p>
                <div className="text-3xl font-bold mb-2">20%</div>
                <p className="text-xs text-muted-foreground mb-4">Exemple: -20%</p>
                <Button className="w-full" size="sm">
                  Créer
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Livraison gratuite</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Frais de port offerts
                </p>
                <div className="text-3xl font-bold mb-2">0€</div>
                <p className="text-xs text-muted-foreground mb-4">Shipping gratuit</p>
                <Button className="w-full" size="sm">
                  Créer
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Coupons programmés</CardTitle>
              <CardDescription>Codes qui seront activés automatiquement</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Aucun coupon programmé pour le moment</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>Coupons expirés</CardTitle>
              <CardDescription>Historique des codes périmés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coupons
                  .filter((c) => c.status === 'expired')
                  .map((coupon) => (
                    <div
                      key={coupon.id}
                      className="flex items-center justify-between p-4 border rounded-lg opacity-60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{coupon.code}</h3>
                          <p className="text-sm text-muted-foreground">
                            Expiré le {coupon.expires} • {coupon.uses} utilisations
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Expiré</Badge>
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
                <CardTitle>Top 5 coupons</CardTitle>
                <CardDescription>Les plus utilisés ce mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coupons.slice(0, 5).map((coupon, index) => (
                    <div key={coupon.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{coupon.code}</p>
                          <p className="text-xs text-muted-foreground">
                            {coupon.uses} utilisations
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold">
                        {coupon.type === 'percentage'
                          ? `-${coupon.value}%`
                          : `-€${coupon.value}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact sur les ventes</CardTitle>
                <CardDescription>Conversion avec coupons</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Panier moyen avec coupon</span>
                      <span className="font-semibold">€45.20</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Panier moyen sans coupon</span>
                      <span className="font-semibold">€32.80</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-primary">
                      <span>Impact</span>
                      <span>+€12.40 (+38%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CouponManagementPage;
