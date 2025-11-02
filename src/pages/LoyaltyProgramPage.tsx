import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Star, Gift, Users, TrendingUp, Crown } from 'lucide-react';

const LoyaltyProgramPage: React.FC = () => {
  const tiers = [
    {
      name: 'Bronze',
      icon: Award,
      minPoints: 0,
      members: 1234,
      benefits: ['5% de réduction', 'Livraison gratuite dès 50€'],
      color: 'text-orange-600',
    },
    {
      name: 'Argent',
      icon: Star,
      minPoints: 500,
      members: 456,
      benefits: ['10% de réduction', 'Livraison gratuite', 'Accès ventes privées'],
      color: 'text-gray-400',
    },
    {
      name: 'Or',
      icon: Crown,
      minPoints: 1500,
      members: 89,
      benefits: ['15% de réduction', 'Livraison express gratuite', 'Support prioritaire', 'Cadeaux exclusifs'],
      color: 'text-yellow-500',
    },
  ];

  const rewards = [
    { id: 1, name: 'Bon de réduction 10€', points: 100, stock: 50 },
    { id: 2, name: 'Livraison gratuite', points: 50, stock: 'Illimité' },
    { id: 3, name: 'Produit gratuit', points: 500, stock: 10 },
    { id: 4, name: 'Upgrade niveau supérieur', points: 300, stock: 25 },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Programme de fidélité</h1>
          <p className="text-muted-foreground">
            Récompensez vos clients fidèles
          </p>
        </div>
        <Button>
          <Gift className="mr-2 h-4 w-4" />
          Nouvelle récompense
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,779</div>
            <p className="text-xs text-muted-foreground">+12% ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points distribués</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,678</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récompenses échangées</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234</div>
            <p className="text-xs text-muted-foreground">Valeur: €2,340</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">+5% vs mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tiers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tiers">Niveaux</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="rules">Règles de points</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {tiers.map((tier, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <tier.icon className={`h-12 w-12 ${tier.color} opacity-20`} />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <tier.icon className={`h-6 w-6 ${tier.color}`} />
                    <CardTitle>{tier.name}</CardTitle>
                  </div>
                  <CardDescription>À partir de {tier.minPoints} points</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold">{tier.members}</div>
                    <div className="text-xs text-muted-foreground">membres</div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Avantages:</h4>
                    <ul className="space-y-1">
                      {tier.benefits.map((benefit, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Star className="h-3 w-3 mt-0.5 text-primary" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="w-full" variant="outline">
                    Modifier
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Catalogue de récompenses</CardTitle>
              <CardDescription>Récompenses disponibles pour vos clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{reward.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Stock: {reward.stock}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" />
                        {reward.points} points
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

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Règles d'attribution de points</CardTitle>
              <CardDescription>Configurez comment les clients gagnent des points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Achat</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      1 point = 1€ dépensé
                    </p>
                    <Button size="sm" variant="outline">Modifier</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Inscription</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      100 points bonus
                    </p>
                    <Button size="sm" variant="outline">Modifier</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Parrainage</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      50 points par filleul
                    </p>
                    <Button size="sm" variant="outline">Modifier</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Avis produit</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      25 points par avis
                    </p>
                    <Button size="sm" variant="outline">Modifier</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des membres</CardTitle>
              <CardDescription>Liste et détails des membres du programme</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Liste des membres du programme de fidélité...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoyaltyProgramPage;
