import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plug, CheckCircle, Settings, Plus, Search, Zap, Globe, ShoppingCart } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function IntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const integrations = [
    {
      name: 'Shopify',
      description: 'Synchronisation complète avec votre boutique Shopify',
      category: 'E-commerce',
      status: 'connected',
      icon: ShoppingCart,
      premium: false
    },
    {
      name: 'WooCommerce',
      description: 'Intégration native avec WooCommerce',
      category: 'E-commerce',
      status: 'available',
      icon: Globe,
      premium: false
    },
    {
      name: 'Zapier Premium',
      description: 'Automatisation avancée avec 1000+ applications',
      category: 'Automation',
      status: 'available',
      icon: Zap,
      premium: true
    },
    {
      name: 'Salesforce',
      description: 'CRM enterprise pour grandes équipes',
      category: 'CRM',
      status: 'available',
      icon: Settings,
      premium: true
    },
    {
      name: 'HubSpot Premium',
      description: 'Suite marketing et CRM complète',
      category: 'Marketing',
      status: 'connected',
      icon: CheckCircle,
      premium: true
    },
    {
      name: 'Google Analytics 4',
      description: 'Analytics avancés et tracking e-commerce',
      category: 'Analytics',
      status: 'connected',
      icon: Settings,
      premium: false
    }
  ];

  const webhooks = [
    {
      name: 'Order Created',
      endpoint: 'https://api.dropcraft.ai/webhooks/orders',
      status: 'active',
      lastTrigger: '2 min'
    },
    {
      name: 'Product Updated',
      endpoint: 'https://api.dropcraft.ai/webhooks/products',
      status: 'active',
      lastTrigger: '15 min'
    },
    {
      name: 'Inventory Alert',
      endpoint: 'https://api.dropcraft.ai/webhooks/inventory',
      status: 'paused',
      lastTrigger: '2h'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'available': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connecté';
      case 'available': return 'Disponible';
      case 'error': return 'Erreur';
      default: return 'Inconnue';
    }
  };

  return (
    <>
      <Helmet>
        <title>Intégrations Premium - Connectivité Avancée | Drop Craft AI</title>
        <meta name="description" content="Connectez votre application avec des centaines de services. Intégrations premium, webhooks personnalisés et API avancées." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Intégrations Premium</h1>
            <p className="text-muted-foreground">
              Connectez votre application avec vos outils favoris
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configuration
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Intégration
            </Button>
          </div>
        </div>

        {/* Stats Rapides */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Intégrations Actives</CardTitle>
              <Plug className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 depuis le mois dernier
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45.2K</div>
              <p className="text-xs text-muted-foreground">
                Ce mois-ci
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Configurés
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.9%</div>
              <p className="text-xs text-muted-foreground">
                7 derniers jours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenu Principal */}
        <Tabs defaultValue="integrations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="integrations">Intégrations</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mes Intégrations</CardTitle>
                    <CardDescription>
                      Gérez vos connexions avec les services externes
                    </CardDescription>
                  </div>
                  <Input
                    placeholder="Rechercher une intégration..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {integrations.map((integration, i) => (
                    <Card key={i} className="relative">
                      {integration.premium && (
                        <Badge className="absolute top-2 right-2 text-xs">PREMIUM</Badge>
                      )}
                      <CardHeader className="pb-4">
                        <div className="flex items-center space-x-3">
                          <integration.icon className="h-8 w-8" />
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {integration.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-4">
                          {integration.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant={getStatusColor(integration.status)}>
                            {getStatusText(integration.status)}
                          </Badge>
                          <Button 
                            variant={integration.status === 'connected' ? 'outline' : 'default'}
                            size="sm"
                          >
                            {integration.status === 'connected' ? 'Configurer' : 'Connecter'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhooks Configuration</CardTitle>
                <CardDescription>
                  Configurez les événements automatiques vers vos applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {webhooks.map((webhook, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{webhook.name}</h4>
                        <p className="text-sm text-muted-foreground">{webhook.endpoint}</p>
                        <p className="text-xs text-muted-foreground">
                          Dernier déclenchement: {webhook.lastTrigger}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                          {webhook.status === 'active' ? 'Actif' : 'Pausé'}
                        </Badge>
                        <Switch checked={webhook.status === 'active'} />
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un Webhook
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Management</CardTitle>
                <CardDescription>
                  Gérez vos clés API et surveillez l'utilisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Plug className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">API Management</h3>
                  <p className="text-muted-foreground">
                    Interface de gestion des API en cours de développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marketplace</CardTitle>
                <CardDescription>
                  Découvrez de nouvelles intégrations disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Marketplace des Intégrations</h3>
                  <p className="text-muted-foreground">
                    Catalogue complet des intégrations disponibles bientôt en ligne
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