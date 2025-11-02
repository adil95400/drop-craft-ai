import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Repeat, Users, DollarSign, TrendingUp, Calendar, Package } from 'lucide-react';

const SubscriptionManagementPage: React.FC = () => {
  const subscriptions = [
    {
      id: 1,
      customer: 'Marie Dupont',
      plan: 'Premium Monthly',
      price: 29.99,
      status: 'active',
      nextBilling: '2024-02-15',
      started: '2023-08-15',
    },
    {
      id: 2,
      customer: 'Jean Martin',
      plan: 'Basic Annual',
      price: 199.99,
      status: 'active',
      nextBilling: '2024-06-20',
      started: '2023-06-20',
    },
    {
      id: 3,
      customer: 'Sophie Leblanc',
      plan: 'Premium Monthly',
      price: 29.99,
      status: 'cancelled',
      nextBilling: null,
      started: '2023-10-01',
    },
  ];

  const plans = [
    {
      name: 'Basic',
      monthly: 9.99,
      annual: 99.99,
      subscribers: 234,
      features: ['Accès de base', 'Support email', '1 utilisateur'],
    },
    {
      name: 'Premium',
      monthly: 29.99,
      annual: 299.99,
      subscribers: 156,
      features: ['Toutes les fonctionnalités', 'Support prioritaire', '5 utilisateurs', 'Analytics avancés'],
    },
    {
      name: 'Enterprise',
      monthly: 99.99,
      annual: 999.99,
      subscribers: 23,
      features: ['Personnalisation complète', 'Support dédié', 'Utilisateurs illimités', 'API complète'],
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des abonnements</h1>
          <p className="text-muted-foreground">
            Gérez vos plans et abonnements récurrents
          </p>
        </div>
        <Button>
          <Package className="mr-2 h-4 w-4" />
          Nouveau plan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnés actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">413</div>
            <p className="text-xs text-muted-foreground">+23 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€12,456</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +8.5% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de rétention</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">+1.2% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.8%</div>
            <p className="text-xs text-muted-foreground">-0.5% vs mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="billing">Facturation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Abonnements clients</CardTitle>
              <CardDescription>Liste des abonnements actifs et annulés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Repeat className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{sub.customer}</h3>
                        <p className="text-sm text-muted-foreground">{sub.plan}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Démarré le {sub.started}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-semibold">€{sub.price}</div>
                        <div className="text-xs text-muted-foreground">
                          {sub.nextBilling ? `Prochain: ${sub.nextBilling}` : 'Annulé'}
                        </div>
                      </div>
                      <Badge
                        variant={sub.status === 'active' ? 'default' : 'secondary'}
                      >
                        {sub.status === 'active' ? 'Actif' : 'Annulé'}
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

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.subscribers} abonnés</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">€{plan.monthly}</div>
                    <p className="text-sm text-muted-foreground">par mois</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ou €{plan.annual}/an (économisez{' '}
                      {((1 - plan.annual / (plan.monthly * 12)) * 100).toFixed(0)}%)
                    </p>
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline">
                      Modifier
                    </Button>
                    <Button className="flex-1" variant="outline">
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Cycles de facturation</CardTitle>
              <CardDescription>Prochaines facturations prévues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          {new Date(Date.now() + i * 86400000 * 7).toLocaleDateString('fr-FR')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(Math.random() * 50 + 10)} facturations prévues
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        €{(Math.random() * 5000 + 2000).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Montant estimé</div>
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
                <CardTitle>Évolution MRR</CardTitle>
                <CardDescription>Revenue récurrent mensuel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Graphique MRR</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par plan</CardTitle>
                <CardDescription>Distribution des abonnés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{plan.name}</span>
                        <span className="font-medium">{plan.subscribers}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(plan.subscribers / 413) * 100}%`,
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
      </Tabs>
    </div>
  );
};

export default SubscriptionManagementPage;
