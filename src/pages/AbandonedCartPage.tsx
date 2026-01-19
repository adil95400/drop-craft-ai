import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Mail, DollarSign, TrendingUp, Clock, Target } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const AbandonedCartPage: React.FC = () => {
  const abandonedCarts = [
    {
      id: 1,
      customer: 'Marie Dupont',
      email: 'marie@example.com',
      items: 3,
      value: 89.97,
      abandoned: '2 heures',
      status: 'not_contacted',
    },
    {
      id: 2,
      customer: 'Jean Martin',
      email: 'jean@example.com',
      items: 1,
      value: 49.99,
      abandoned: '5 heures',
      status: 'emailed',
    },
    {
      id: 3,
      customer: 'Sophie Leblanc',
      email: 'sophie@example.com',
      items: 2,
      value: 129.98,
      abandoned: '1 jour',
      status: 'recovered',
    },
  ];

  return (
    <ChannablePageWrapper
      title="Paniers abandonnés"
      subtitle="Marketing"
      description="Récupérez les ventes perdues avec des campagnes automatiques"
      heroImage="marketing"
      badge={{ label: "Recovery", icon: ShoppingCart }}
      actions={
        <Button>
          <Mail className="mr-2 h-4 w-4" />
          Nouvelle campagne
        </Button>
      }
    >

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paniers abandonnés</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€15,678</div>
            <p className="text-xs text-muted-foreground">Revenue potentiel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de récupération</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28.5%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +3.2% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue récupéré</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€4,468</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="carts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="carts">Paniers actifs</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="carts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paniers abandonnés récents</CardTitle>
              <CardDescription>Récupérez ces ventes maintenant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {abandonedCarts.map((cart) => (
                  <div
                    key={cart.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{cart.customer}</h3>
                        <p className="text-sm text-muted-foreground">{cart.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {cart.items} articles • Abandonné il y a {cart.abandoned}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold">€{cart.value}</div>
                        <div className="text-xs text-muted-foreground">Valeur panier</div>
                      </div>
                      <Badge
                        variant={
                          cart.status === 'recovered'
                            ? 'default'
                            : cart.status === 'emailed'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {cart.status === 'recovered'
                          ? 'Récupéré'
                          : cart.status === 'emailed'
                          ? 'Email envoyé'
                          : 'Non contacté'}
                      </Badge>
                      {cart.status === 'not_contacted' && (
                        <Button size="sm">
                          <Mail className="mr-2 h-4 w-4" />
                          Envoyer email
                        </Button>
                      )}
                      {cart.status === 'emailed' && (
                        <Button size="sm" variant="outline">
                          Relancer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campagnes de récupération</CardTitle>
              <CardDescription>Séquences d'emails automatiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">Email 1h après abandon</h4>
                      <p className="text-sm text-muted-foreground">
                        Rappel simple avec lien vers le panier
                      </p>
                    </div>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <div className="text-sm font-semibold">45.2%</div>
                      <div className="text-xs text-muted-foreground">Taux d'ouverture</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">18.3%</div>
                      <div className="text-xs text-muted-foreground">Taux de clic</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">12.5%</div>
                      <div className="text-xs text-muted-foreground">Taux de conversion</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3">
                    Modifier
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">Email 24h + code promo 10%</h4>
                      <p className="text-sm text-muted-foreground">
                        Incitation avec réduction
                      </p>
                    </div>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <div className="text-sm font-semibold">38.7%</div>
                      <div className="text-xs text-muted-foreground">Taux d'ouverture</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">24.8%</div>
                      <div className="text-xs text-muted-foreground">Taux de clic</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">21.2%</div>
                      <div className="text-xs text-muted-foreground">Taux de conversion</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3">
                    Modifier
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">Email 72h - Dernière chance</h4>
                      <p className="text-sm text-muted-foreground">
                        Urgence avec offre limitée
                      </p>
                    </div>
                    <Badge variant="secondary">Inactif</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3">
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
                <CardTitle>Taux d'abandon par heure</CardTitle>
                <CardDescription>Moments critiques de l'abandon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Graphique des abandons par heure</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Raisons d'abandon</CardTitle>
                <CardDescription>Principales causes identifiées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { reason: 'Frais de livraison trop élevés', percentage: 35 },
                    { reason: 'Juste en train de comparer', percentage: 28 },
                    { reason: 'Processus de paiement complexe', percentage: 18 },
                    { reason: 'Manque de modes de paiement', percentage: 12 },
                    { reason: 'Autres raisons', percentage: 7 },
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.reason}</span>
                        <span className="font-medium">{item.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${item.percentage}%` }}
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
              <CardTitle>Paramètres de récupération</CardTitle>
              <CardDescription>Configurez vos campagnes automatiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Délai avant premier contact</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Temps d'attente avant d'envoyer le premier email
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">1 heure</Badge>
                    <Button size="sm" variant="outline">
                      Modifier
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Code promo automatique</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Réduction offerte dans les emails de relance
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">10% de réduction</Badge>
                    <Button size="sm" variant="outline">
                      Modifier
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Valeur minimum du panier</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Montant minimum pour déclencher les emails
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">€20</Badge>
                    <Button size="sm" variant="outline">
                      Modifier
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
};

export default AbandonedCartPage;
