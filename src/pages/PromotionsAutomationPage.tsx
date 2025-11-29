import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Zap, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PromotionsAutomationPage() {
  return (
    <>
      <Helmet>
        <title>Promotions Automatisées - ShopOpti</title>
        <meta name="description" content="Créez et gérez vos promotions multi-marketplace automatiquement" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            🎯 Promotions Automatisées
          </h1>
          <p className="text-xl text-muted-foreground">
            Créez et déployez vos campagnes promotionnelles sur tous vos canaux de vente
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campagnes Actives</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">En cours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Règles Auto</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Automatisations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planifiées</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">À venir</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impact CA</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0€</div>
              <p className="text-xs text-muted-foreground">Ce mois-ci</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
            <TabsTrigger value="automation">Automatisation</TabsTrigger>
            <TabsTrigger value="scheduled">Planifiées</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Campagnes Promotionnelles</CardTitle>
                <CardDescription>Gérez vos promotions actives et passées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <p className="text-muted-foreground">Aucune campagne créée pour le moment</p>
                  <Button>Créer une campagne</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation">
            <Card>
              <CardHeader>
                <CardTitle>Règles d'Automatisation</CardTitle>
                <CardDescription>
                  Configurez des promotions déclenchées automatiquement selon vos critères
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Types de déclencheurs disponibles</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Date-based:</strong> Black Friday, Noël, soldes saisonnières</li>
                      <li>• <strong>Stock-based:</strong> Réduction automatique si stock &lt; seuil</li>
                      <li>• <strong>Sales-based:</strong> Promotion si aucune vente depuis X jours</li>
                      <li>• <strong>Competitor-based:</strong> Alignement automatique sur la concurrence</li>
                    </ul>
                  </div>
                  <Button className="w-full">Créer une règle d'automatisation</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Promotions Planifiées</CardTitle>
                <CardDescription>Calendrier de vos promotions futures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune promotion planifiée</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance des Promotions</CardTitle>
                <CardDescription>Analysez l'impact de vos campagnes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Les statistiques de performance apparaîtront ici après vos premières campagnes
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
