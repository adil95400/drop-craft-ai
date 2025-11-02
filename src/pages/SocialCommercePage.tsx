import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Facebook,
  Instagram,
  ShoppingBag,
  TrendingUp,
  Users,
  DollarSign,
  MessageCircle,
} from 'lucide-react';

const SocialCommercePage: React.FC = () => {
  const platforms = [
    {
      name: 'Facebook Shop',
      icon: Facebook,
      status: 'connected',
      products: 234,
      orders: 89,
      revenue: 4532,
    },
    {
      name: 'Instagram Shopping',
      icon: Instagram,
      status: 'connected',
      products: 234,
      orders: 156,
      revenue: 7890,
    },
    {
      name: 'TikTok Shop',
      icon: ShoppingBag,
      status: 'not_connected',
      products: 0,
      orders: 0,
      revenue: 0,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Social Commerce</h1>
          <p className="text-muted-foreground">
            Vendez directement sur les réseaux sociaux
          </p>
        </div>
        <Button>
          <ShoppingBag className="mr-2 h-4 w-4" />
          Connecter une plateforme
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue social</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€12,422</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +32% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">+18% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,932</div>
            <p className="text-xs text-muted-foreground">Interactions totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.7%</div>
            <p className="text-xs text-muted-foreground">+0.4% vs moyenne</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="platforms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="platforms">Plateformes</TabsTrigger>
          <TabsTrigger value="products">Produits sociaux</TabsTrigger>
          <TabsTrigger value="posts">Publications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {platforms.map((platform, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <platform.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                    </div>
                    <Badge
                      variant={platform.status === 'connected' ? 'default' : 'secondary'}
                    >
                      {platform.status === 'connected' ? 'Connecté' : 'Non connecté'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {platform.status === 'connected' ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xl font-bold">{platform.products}</div>
                          <div className="text-xs text-muted-foreground">Produits</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">{platform.orders}</div>
                          <div className="text-xs text-muted-foreground">Commandes</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">€{platform.revenue}</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                      <Button className="w-full" variant="outline">
                        Gérer
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full">Connecter</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Avantages du Social Commerce</CardTitle>
              <CardDescription>
                Pourquoi vendre sur les réseaux sociaux?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex gap-3">
                  <Users className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Audience massive</h4>
                    <p className="text-sm text-muted-foreground">
                      Accédez à des milliards d'utilisateurs actifs quotidiennement
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ShoppingBag className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Achat simplifié</h4>
                    <p className="text-sm text-muted-foreground">
                      Parcours d'achat optimisé sans quitter la plateforme
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MessageCircle className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Engagement élevé</h4>
                    <p className="text-sm text-muted-foreground">
                      Interagissez directement avec vos clients
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Conversion améliorée</h4>
                    <p className="text-sm text-muted-foreground">
                      Taux de conversion supérieurs grâce au contexte social
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Catalogue social</CardTitle>
              <CardDescription>Produits synchronisés sur les réseaux sociaux</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Liste des produits sociaux...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Publications shoppables</CardTitle>
              <CardDescription>Posts avec tags produits</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Publications avec produits tagués...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics social commerce</CardTitle>
              <CardDescription>Performance détaillée par plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Statistiques de performance...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialCommercePage;
