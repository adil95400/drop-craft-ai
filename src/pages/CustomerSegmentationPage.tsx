import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingUp, DollarSign, Plus } from 'lucide-react';

const CustomerSegmentationPage: React.FC = () => {
  const segments = [
    {
      id: 1,
      name: 'VIP Customers',
      description: 'Clients à haute valeur',
      count: 234,
      avgOrderValue: 156.50,
      totalRevenue: 36621,
      color: 'bg-purple-500',
    },
    {
      id: 2,
      name: 'Frequent Buyers',
      description: 'Achats réguliers',
      count: 892,
      avgOrderValue: 45.30,
      totalRevenue: 40408,
      color: 'bg-blue-500',
    },
    {
      id: 3,
      name: 'New Customers',
      description: 'Premiers achats',
      count: 456,
      avgOrderValue: 32.20,
      totalRevenue: 14683,
      color: 'bg-green-500',
    },
    {
      id: 4,
      name: 'At Risk',
      description: 'Inactifs récemment',
      count: 178,
      avgOrderValue: 52.40,
      totalRevenue: 9327,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Segmentation clients</h1>
          <p className="text-muted-foreground">
            Analysez et ciblez vos groupes de clients
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Créer un segment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,760</div>
            <p className="text-xs text-muted-foreground">4 segments actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur moyenne</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€57.35</div>
            <p className="text-xs text-muted-foreground">Par client</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de rétention</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">+5% vs trimestre dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segment le plus profitable</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Frequent</div>
            <p className="text-xs text-muted-foreground">€40,408 revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {segments.map((segment) => (
          <Card key={segment.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                  <div>
                    <CardTitle>{segment.name}</CardTitle>
                    <CardDescription>{segment.description}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Cibler
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold">{segment.count}</div>
                  <p className="text-xs text-muted-foreground">Clients</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">€{segment.avgOrderValue}</div>
                  <p className="text-xs text-muted-foreground">Panier moyen</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    €{segment.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Revenue total</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Actions recommandées:</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">Email</Badge>
                    <Badge variant="outline">Promo</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Critères de segmentation</CardTitle>
          <CardDescription>
            Personnalisez vos segments selon différents critères
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Comportementale</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Fréquence d'achat</li>
                <li>• Montant dépensé</li>
                <li>• Dernière visite</li>
                <li>• Produits favoris</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Démographique</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Âge</li>
                <li>• Localisation</li>
                <li>• Genre</li>
                <li>• Profession</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Engagement</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Emails ouverts</li>
                <li>• Clics</li>
                <li>• Avis laissés</li>
                <li>• Partages sociaux</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerSegmentationPage;
