import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Link, 
  Zap, 
  RefreshCw, 
  Package, 
  ShoppingCart,
  Settings,
  ArrowRight,
  Check,
  Clock,
  Rocket,
  Code,
  FileJson
} from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const ShopifyAppIntegration = () => {
  const integrationFeatures = [
    {
      icon: Package,
      title: 'Sync Produits',
      description: 'Import automatique vers votre boutique Shopify',
      status: 'available'
    },
    {
      icon: ShoppingCart,
      title: 'Sync Commandes',
      description: 'Récupération automatique des nouvelles commandes',
      status: 'available'
    },
    {
      icon: RefreshCw,
      title: 'Sync Stock',
      description: 'Mise à jour en temps réel du stock fournisseur',
      status: 'available'
    },
    {
      icon: Zap,
      title: 'Auto-Fulfillment',
      description: 'Traitement automatique des commandes',
      status: 'coming'
    }
  ];

  const setupSteps = [
    {
      step: 1,
      title: 'Connecter votre boutique',
      description: 'Allez dans Boutiques > Ajouter une boutique > Shopify',
      action: 'Déjà disponible via l\'interface actuelle'
    },
    {
      step: 2,
      title: 'Autoriser l\'accès API',
      description: 'Shopopti+ demande les permissions nécessaires',
      action: 'Automatique lors de la connexion OAuth'
    },
    {
      step: 3,
      title: 'Configurer les règles',
      description: 'Définissez vos règles de pricing et d\'import',
      action: 'Via le panneau Règles dans le dashboard'
    },
    {
      step: 4,
      title: 'Activer la sync auto',
      description: 'Activez la synchronisation automatique',
      action: 'Toggle dans les paramètres de boutique'
    }
  ];

  return (
    <ChannablePageWrapper
      title="Intégration Shopify App"
      description="Connectez Shopopti+ directement à votre boutique Shopify"
    >
      <Helmet>
        <title>Intégration Shopify App | Shopopti+</title>
        <meta name="description" content="Intégrez Shopopti+ avec votre boutique Shopify pour synchroniser produits, commandes et stock automatiquement." />
      </Helmet>

      <div className="space-y-6">
        {/* Hero Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-[#95BF47]/10 rounded-xl">
                <Store className="h-12 w-12 text-[#95BF47]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">Shopify Integration</h2>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    App native bientôt
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Shopopti+ s'intègre parfaitement avec Shopify via notre système de connexion API. 
                  Une app native Shopify est en cours de développement pour une intégration encore plus fluide.
                </p>
                <div className="flex gap-3">
                  <Button asChild>
                    <a href="/stores-channels">
                      <Link className="h-4 w-4 mr-2" />
                      Connecter une boutique
                    </a>
                  </Button>
                  <Button variant="outline">
                    <FileJson className="h-4 w-4 mr-2" />
                    Documentation API
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Integration Status */}
        <Alert>
          <Rocket className="h-4 w-4" />
          <AlertDescription>
            <strong>Intégration actuelle :</strong> Shopopti+ se connecte à Shopify via l'API Admin REST/GraphQL. 
            Toutes les fonctionnalités de sync sont opérationnelles. L'app Shopify native ajoutera 
            une installation en 1-clic depuis le Shopify App Store.
          </AlertDescription>
        </Alert>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrationFeatures.map((feature) => (
            <Card key={feature.title} className="relative overflow-hidden">
              {feature.status === 'coming' && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">Bientôt</Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className={`p-2 rounded-lg w-fit ${
                  feature.status === 'available' ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <feature.icon className={`h-5 w-5 ${
                    feature.status === 'available' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="setup" className="space-y-4">
          <TabsList>
            <TabsTrigger value="setup">Configuration</TabsTrigger>
            <TabsTrigger value="api">Utilisation API</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap App</TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <Card>
              <CardHeader>
                <CardTitle>Comment connecter Shopify</CardTitle>
                <CardDescription>
                  Suivez ces étapes pour connecter votre boutique Shopify à Shopopti+
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {setupSteps.map((step, index) => (
                    <div key={step.step} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {step.step}
                        </div>
                        {index < setupSteps.length - 1 && (
                          <div className="w-0.5 h-12 bg-border mx-auto mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <h4 className="font-semibold mb-1">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          {step.action}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Button asChild className="w-full">
                    <a href="/stores-channels">
                      Commencer la configuration
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Shopify Integration
                </CardTitle>
                <CardDescription>
                  Endpoints disponibles pour l'intégration Shopify
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-mono text-sm font-semibold text-primary mb-2">
                      POST /shopify-operations
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Endpoint principal pour toutes les opérations Shopify (export produits, import commandes, sync stock)
                    </p>
                    <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`{
  "action": "export_products" | "import_orders" | "sync_inventory",
  "store_id": "uuid",
  "product_ids": ["uuid1", "uuid2"], // pour export
  "options": {
    "update_existing": true,
    "apply_rules": true
  }
}`}
                    </pre>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-mono text-sm font-semibold text-primary mb-2">
                      POST /shopify-auto-sync
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Synchronisation automatique complète (produits, commandes, clients)
                    </p>
                    <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`{
  "store_id": "uuid",
  "sync_products": true,
  "sync_orders": true,
  "sync_customers": true,
  "days_back": 30
}`}
                    </pre>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-mono text-sm font-semibold text-primary mb-2">
                      POST /shopify-webhook
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Réception des webhooks Shopify pour sync temps réel (commandes, inventaire)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roadmap">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Roadmap App Shopify Native
                </CardTitle>
                <CardDescription>
                  Fonctionnalités prévues pour l'app Shopify officielle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <Badge className="bg-green-500">Phase 1</Badge>
                    <div>
                      <h4 className="font-semibold">Installation 1-Click</h4>
                      <p className="text-sm text-muted-foreground">
                        Installation directe depuis le Shopify App Store sans configuration API manuelle
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <Badge variant="secondary">Phase 2</Badge>
                    <div>
                      <h4 className="font-semibold">Embedded App</h4>
                      <p className="text-sm text-muted-foreground">
                        Interface Shopopti+ intégrée directement dans l'admin Shopify
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <Badge variant="outline">Phase 3</Badge>
                    <div>
                      <h4 className="font-semibold">Theme App Extension</h4>
                      <p className="text-sm text-muted-foreground">
                        Widgets personnalisables directement dans le thème de la boutique
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <Badge variant="outline">Phase 4</Badge>
                    <div>
                      <h4 className="font-semibold">Checkout Extension</h4>
                      <p className="text-sm text-muted-foreground">
                        Intégration au checkout pour upsells et promotions automatiques
                      </p>
                    </div>
                  </div>
                </div>

                <Alert className="mt-6">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Calendrier estimé :</strong> L'app Shopify native est prévue pour Q2 2025. 
                    En attendant, l'intégration API actuelle offre toutes les fonctionnalités essentielles.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-[#95BF47]/10 to-[#5E8E3E]/10 border-[#95BF47]/20">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-bold mb-2">Prêt à connecter votre boutique ?</h3>
            <p className="text-muted-foreground mb-4">
              Commencez à synchroniser vos produits avec Shopify en quelques minutes
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <a href="/stores-channels">
                  <Store className="h-4 w-4 mr-2" />
                  Ajouter ma boutique Shopify
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/extensions/chrome">
                  Extension Chrome
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
};

export default ShopifyAppIntegration;
