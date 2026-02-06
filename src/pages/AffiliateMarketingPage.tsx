import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Link2, DollarSign, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

const AffiliateMarketingPage: React.FC = () => {
  const affiliates = [
    {
      id: 1,
      name: 'Jean Influenceur',
      email: 'jean@example.com',
      status: 'active',
      sales: 45,
      revenue: 2345,
      commission: 234.50,
      conversionRate: 3.2,
    },
    {
      id: 2,
      name: 'Marie Blogger',
      email: 'marie@example.com',
      status: 'active',
      sales: 89,
      revenue: 5678,
      commission: 567.80,
      conversionRate: 5.1,
    },
    {
      id: 3,
      name: 'Sophie Youtuber',
      email: 'sophie@example.com',
      status: 'pending',
      sales: 0,
      revenue: 0,
      commission: 0,
      conversionRate: 0,
    },
  ];

  return (
    <ChannablePageWrapper
      title="Marketing d'affiliation"
      subtitle="Marketing"
      description="Gérez votre programme d'affiliés et suivez les performances"
      heroImage="marketing"
      badge={{ label: "Affiliates", icon: Users }}
      actions={
        <Button>
          <Users className="mr-2 h-4 w-4" />
          Inviter un affilié
        </Button>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.affiliate} />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliés actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">+5 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue généré</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€12,456</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +18% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€1,246</div>
            <p className="text-xs text-muted-foreground">À payer ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2%</div>
            <p className="text-xs text-muted-foreground">Moyenne globale</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="affiliates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="affiliates">Affiliés</TabsTrigger>
          <TabsTrigger value="links">Liens</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vos affiliés</CardTitle>
              <CardDescription>Liste de vos partenaires affiliés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {affiliates.map((affiliate) => (
                  <div
                    key={affiliate.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{affiliate.name}</h3>
                        <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm font-semibold">{affiliate.sales}</div>
                        <div className="text-xs text-muted-foreground">Ventes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">€{affiliate.revenue}</div>
                        <div className="text-xs text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">€{affiliate.commission}</div>
                        <div className="text-xs text-muted-foreground">Commission</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">{affiliate.conversionRate}%</div>
                        <div className="text-xs text-muted-foreground">Conversion</div>
                      </div>
                      <Badge
                        variant={affiliate.status === 'active' ? 'default' : 'secondary'}
                      >
                        {affiliate.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Voir détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Liens d'affiliation</CardTitle>
              <CardDescription>Gérez les liens de tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Lien général</h4>
                    </div>
                    <Badge>245 clics</Badge>
                  </div>
                  <div className="p-2 bg-muted rounded font-mono text-sm">
                    https://votresite.com?ref=ABC123
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">Copier</Button>
                    <Button size="sm" variant="outline">Analytics</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Lien produit spécifique</h4>
                    </div>
                    <Badge>89 clics</Badge>
                  </div>
                  <div className="p-2 bg-muted rounded font-mono text-sm">
                    https://votresite.com/produit?ref=ABC123
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">Copier</Button>
                    <Button size="sm" variant="outline">Analytics</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Structure de commissions</CardTitle>
              <CardDescription>Définissez vos taux de commission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Commission par défaut</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Appliquée à tous les nouveaux affiliés
                    </p>
                    <Badge variant="secondary" className="text-lg">10%</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3">
                    Modifier
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Commission par palier</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>0-10 ventes/mois</span>
                      <Badge variant="outline">10%</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>11-50 ventes/mois</span>
                      <Badge variant="outline">12%</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>50+ ventes/mois</span>
                      <Badge variant="outline">15%</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3">
                    Modifier
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Cookie de tracking</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Durée: 30 jours
                  </p>
                  <Button size="sm" variant="outline">
                    Modifier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du programme</CardTitle>
              <CardDescription>Configuration générale du programme d'affiliation</CardDescription>
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

export default AffiliateMarketingPage;
