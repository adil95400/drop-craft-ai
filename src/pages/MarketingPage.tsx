import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Mail, MessageSquare, TrendingUp, Target, Users, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Badge } from "@/components/ui/badge";

export default function MarketingPage() {
  return (
    <>
      <Helmet>
        <title>Marketing - Campagnes & Automation | Drop Craft AI</title>
        <meta name="description" content="Gérez vos campagnes marketing, email marketing et automatisation pour booster vos ventes." />
      </Helmet>

      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Megaphone className="h-8 w-8 text-primary" />
              Marketing & Automation
            </h1>
            <p className="text-muted-foreground">
              Boostez vos ventes avec nos outils marketing
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Target className="mr-2 h-4 w-4" />
              Campagnes
            </Button>
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              Nouvelle campagne
            </Button>
          </div>
        </div>

        {/* Stats Marketing */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campagnes actives</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                En cours d'exécution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">24.5%</div>
              <p className="text-xs text-muted-foreground">
                +2.3% vs mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">156</div>
              <p className="text-xs text-muted-foreground">
                Cette semaine
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI Marketing</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">3.2x</div>
              <p className="text-xs text-muted-foreground">
                Retour sur investissement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets Marketing */}
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
            <TabsTrigger value="email">Email Marketing</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campagnes en cours</CardTitle>
                <CardDescription>
                  Gérez vos campagnes marketing actives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Promo Black Friday', status: 'active', reach: 5234, conversions: 89 },
                    { name: 'Email Newsletter', status: 'active', reach: 12456, conversions: 234 },
                    { name: 'Retargeting Ads', status: 'paused', reach: 3421, conversions: 45 }
                  ].map((campaign, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Megaphone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Portée: {campaign.reach.toLocaleString()} • Conversions: {campaign.conversions}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                        <Button variant="outline" size="sm">Modifier</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Marketing
                </CardTitle>
                <CardDescription>
                  Créez et envoyez des emails à vos clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Email Marketing</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez votre première campagne email
                  </p>
                  <Button>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Créer une campagne
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Automation Marketing
                </CardTitle>
                <CardDescription>
                  Automatisez vos campagnes marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Welcome Email', type: 'Nouveau client', status: 'active' },
                    { name: 'Abandon de panier', type: 'Rappel automatique', status: 'active' },
                    { name: 'Email anniversaire', type: 'Fidélisation', status: 'paused' }
                  ].map((auto, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{auto.name}</h4>
                        <p className="text-sm text-muted-foreground">{auto.type}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={auto.status === 'active' ? 'default' : 'secondary'}>
                          {auto.status}
                        </Badge>
                        <Button variant="outline" size="sm">Configurer</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analytics Marketing
                </CardTitle>
                <CardDescription>
                  Analysez les performances de vos campagnes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tableaux de bord analytiques en cours de développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
