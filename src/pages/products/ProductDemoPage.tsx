/**
 * Product Demo Page - Démo des fonctionnalités produit avancées
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, Languages, Star, Image, TrendingUp, 
  Globe, MessageSquare, Sparkles 
} from 'lucide-react';

export default function ProductDemoPage() {
  const features = [
    {
      icon: Languages,
      title: 'Traductions Multi-langues',
      description: 'Traduction automatique en 50+ langues avec IA'
    },
    {
      icon: Star,
      title: 'Avis Clients',
      description: 'Gestion et modération automatique des avis'
    },
    {
      icon: Image,
      title: 'Galerie d\'Images',
      description: 'Optimisation et compression automatique'
    },
    {
      icon: Globe,
      title: 'SEO International',
      description: 'Optimisation SEO par pays et langue'
    },
    {
      icon: MessageSquare,
      title: 'Q&A Produit',
      description: 'Réponses automatiques aux questions clients'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Produit',
      description: 'Suivi des performances et conversions'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Détails Produit Avancés</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Découvrez toutes les fonctionnalités avancées de gestion de produits
        </p>
      </div>

      <Tabs defaultValue="features" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="translations">Traductions</TabsTrigger>
          <TabsTrigger value="reviews">Avis</TabsTrigger>
          <TabsTrigger value="gallery">Galerie</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      En savoir plus
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="translations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Traductions Multi-langues
              </CardTitle>
              <CardDescription>
                Traduisez automatiquement vos produits en 50+ langues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Traduction IA</h4>
                  <p className="text-sm text-muted-foreground">
                    Traduction automatique avec contexte e-commerce
                  </p>
                  <Badge className="mt-2">50+ langues</Badge>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">SEO Local</h4>
                  <p className="text-sm text-muted-foreground">
                    Optimisation SEO par pays et langue
                  </p>
                  <Badge className="mt-2">Auto</Badge>
                </div>
              </div>
              <Button className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Traduire ce produit
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Gestion des Avis Clients
              </CardTitle>
              <CardDescription>
                Collectez et modérez automatiquement les avis clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-medium">Avis vérifiés</p>
                    <p className="text-sm text-muted-foreground">
                      Système de vérification automatique
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">Réponses auto</p>
                    <p className="text-sm text-muted-foreground">
                      IA répond aux questions fréquentes
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Galerie d'Images
              </CardTitle>
              <CardDescription>
                Gestion avancée de vos images produits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Optimisation automatique</span>
                  <Badge variant="outline">Activé</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Compression WebP</span>
                  <Badge variant="outline">Activé</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Alt text IA</span>
                  <Badge variant="outline">Activé</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
