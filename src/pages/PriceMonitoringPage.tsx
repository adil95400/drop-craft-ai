import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, 
  Settings, Play, Pause, History, Target 
} from 'lucide-react';

export default function PriceMonitoringPage() {
  const [autoPricingEnabled, setAutoPricingEnabled] = useState(false);

  const priceRules = [
    {
      id: 1,
      name: 'Competitive Pricing',
      description: 'Toujours 5% moins cher que le concurrent le moins cher',
      status: 'active',
      products: 245,
      savings: '+12%'
    },
    {
      id: 2,
      name: 'Dynamic Margin',
      description: 'Marge minimum 30%, maximum 50%',
      status: 'active',
      products: 189,
      savings: '+8%'
    },
    {
      id: 3,
      name: 'Flash Sales',
      description: 'Réduction automatique sur stock élevé',
      status: 'paused',
      products: 67,
      savings: '+15%'
    }
  ];

  const monitoredProducts = [
    {
      id: 1,
      name: 'Wireless Headphones Pro',
      myPrice: 79.99,
      competitors: [
        { name: 'Amazon', price: 84.99, change: -2 },
        { name: 'eBay', price: 82.50, change: 0 },
        { name: 'AliExpress', price: 75.00, change: -5 }
      ],
      recommended: 78.99,
      lastUpdate: '2 min ago'
    },
    {
      id: 2,
      name: 'Smart Watch X5',
      myPrice: 149.99,
      competitors: [
        { name: 'Amazon', price: 159.99, change: 0 },
        { name: 'eBay', price: 145.00, change: -3 },
        { name: 'Walmart', price: 152.00, change: +2 }
      ],
      recommended: 147.99,
      lastUpdate: '5 min ago'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Price Monitoring & Auto-Pricing - DropCraft AI</title>
        <meta name="description" content="Surveillance automatique des prix concurrents et ajustement dynamique pour maximiser vos marges" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Price Monitoring & Auto-Pricing</h1>
            <p className="text-muted-foreground mt-2">
              Surveillez les prix concurrents et ajustez automatiquement vos tarifs
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-pricing">Auto-Pricing</Label>
              <Switch 
                id="auto-pricing"
                checked={autoPricingEnabled}
                onCheckedChange={setAutoPricingEnabled}
              />
            </div>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configurer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Produits Surveillés</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">+23 cette semaine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Prix Ajustés (24h)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-green-500">+12% vs hier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Marge Moyenne</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">38.5%</div>
              <p className="text-xs text-green-500">+2.3% ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alertes Prix</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Nécessite attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList>
            <TabsTrigger value="monitoring">Monitoring en Temps Réel</TabsTrigger>
            <TabsTrigger value="rules">Règles de Prix</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produits Surveillés</CardTitle>
                <CardDescription>
                  Comparaison en temps réel avec vos concurrents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {monitoredProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Dernière mise à jour: {product.lastUpdate}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Votre prix</div>
                          <div className="text-2xl font-bold">${product.myPrice}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {product.competitors.map((comp, idx) => (
                          <div key={idx} className="border rounded-lg p-3">
                            <div className="text-sm font-medium mb-1">{comp.name}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold">${comp.price}</span>
                              <Badge variant={comp.change < 0 ? 'destructive' : comp.change > 0 ? 'default' : 'secondary'}>
                                {comp.change > 0 ? '+' : ''}{comp.change}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <div className="text-sm font-medium text-green-900">Prix Recommandé</div>
                          <div className="text-xs text-green-700">
                            Optimisé pour compétitivité et marge
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-green-900">${product.recommended}</div>
                          <Button size="sm" variant="default">
                            Appliquer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Règles de Prix Automatiques</h3>
                <p className="text-sm text-muted-foreground">
                  Définissez des stratégies de pricing intelligentes
                </p>
              </div>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Nouvelle Règle
              </Button>
            </div>

            <div className="grid gap-4">
              {priceRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                            {rule.status === 'active' ? 'Actif' : 'Pausé'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {rule.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {rule.products} produits
                          </span>
                          <span className="text-green-600 font-medium">
                            {rule.savings} conversions
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          {rule.status === 'active' ? (
                            <><Pause className="h-4 w-4 mr-2" />Pause</>
                          ) : (
                            <><Play className="h-4 w-4 mr-2" />Activer</>
                          )}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Changements de Prix</CardTitle>
                <CardDescription>
                  Suivez l'évolution de vos prix et leur impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Historique des prix et analytics disponible prochainement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Monitoring</CardTitle>
                <CardDescription>
                  Configurez vos sources et règles de surveillance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Fréquence de vérification</Label>
                  <Input type="number" placeholder="15" defaultValue="15" />
                  <p className="text-xs text-muted-foreground">Minutes entre chaque vérification</p>
                </div>

                <div className="space-y-2">
                  <Label>Marge minimum (%)</Label>
                  <Input type="number" placeholder="20" defaultValue="20" />
                </div>

                <div className="space-y-2">
                  <Label>Marge maximum (%)</Label>
                  <Input type="number" placeholder="60" defaultValue="60" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications prix</Label>
                    <p className="text-xs text-muted-foreground">
                      Alertes quand un concurrent baisse ses prix
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Button className="w-full">Enregistrer les Paramètres</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
