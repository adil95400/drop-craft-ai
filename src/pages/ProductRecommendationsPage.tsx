import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, ShoppingCart, Target, Zap, BarChart3 } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const ProductRecommendationsPage: React.FC = () => {
  const strategies = [
    {
      id: 1,
      name: 'Produits similaires',
      type: 'similar',
      status: 'active',
      conversions: 234,
      revenue: 12456,
      ctr: 8.5,
    },
    {
      id: 2,
      name: 'Souvent achetés ensemble',
      type: 'bundle',
      status: 'active',
      conversions: 189,
      revenue: 9876,
      ctr: 6.2,
    },
    {
      id: 3,
      name: 'Basé sur l\'historique',
      type: 'personalized',
      status: 'active',
      conversions: 456,
      revenue: 23456,
      ctr: 12.3,
    },
  ];

  return (
    <ChannablePageWrapper
      title="Recommandations produits"
      description="Augmentez vos ventes avec des recommandations IA"
      heroImage="ai"
      badge={{ label: 'Recommandations', icon: Sparkles }}
      actions={
        <Button>
          <Sparkles className="mr-2 h-4 w-4" />
          Nouvelle stratégie
        </Button>
      }
    >

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue généré</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€45,788</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +24% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">879</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de clic</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9.2%</div>
            <p className="text-xs text-muted-foreground">Moyenne globale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+€12.50</div>
            <p className="text-xs text-muted-foreground">Gain moyen par commande</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="strategies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategies">Stratégies</TabsTrigger>
          <TabsTrigger value="ai">IA & ML</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stratégies de recommandation</CardTitle>
              <CardDescription>Gérez vos moteurs de recommandation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{strategy.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          Type: {strategy.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm font-semibold">{strategy.conversions}</div>
                        <div className="text-xs text-muted-foreground">Conversions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">€{strategy.revenue}</div>
                        <div className="text-xs text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">{strategy.ctr}%</div>
                        <div className="text-xs text-muted-foreground">CTR</div>
                      </div>
                      <Badge variant="default">{strategy.status}</Badge>
                      <Button size="sm" variant="outline">
                        Configurer
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
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Cross-sell</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Recommandez des produits complémentaires pendant l'achat
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taux d'adoption</span>
                    <span className="font-semibold">18%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Revenue moyen</span>
                    <span className="font-semibold">€15.20</span>
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm">Activer</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Up-sell</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Suggérez des versions premium ou améliorées
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taux d'adoption</span>
                    <span className="font-semibold">12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Revenue moyen</span>
                    <span className="font-semibold">€28.50</span>
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm">Activer</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Personnalisé</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Recommandations basées sur le comportement utilisateur
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taux d'adoption</span>
                    <span className="font-semibold">22%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Revenue moyen</span>
                    <span className="font-semibold">€19.80</span>
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm" variant="default">Actif</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>Configuration IA & Machine Learning</CardTitle>
              <CardDescription>Optimisez les algorithmes de recommandation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Apprentissage automatique</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Le système apprend continuellement des interactions utilisateurs pour améliorer les recommandations
                  </p>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modèle actuel:</span>
                      <span className="font-medium">Collaborative Filtering v2.3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Précision:</span>
                      <span className="font-medium">87.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dernière mise à jour:</span>
                      <span className="font-medium">Il y a 2h</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Facteurs de recommandation</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Historique d'achat</span>
                        <span className="font-medium">40%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '40%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Navigation produits</span>
                        <span className="font-medium">30%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '30%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Similarité produits</span>
                        <span className="font-medium">20%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '20%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tendances globales</span>
                        <span className="font-medium">10%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Analyse de performance</CardTitle>
              <CardDescription>Métriques détaillées par stratégie</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Graphiques et analyses de performance...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>Configuration des recommandations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Paramètres de configuration...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
};

export default ProductRecommendationsPage;
