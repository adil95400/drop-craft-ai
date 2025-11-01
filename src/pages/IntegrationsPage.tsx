import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plug, CheckCircle, Settings, Plus, Search, Zap, Globe, ShoppingCart, Palette, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { IntegrationsManager } from '@/components/integrations/IntegrationsManager';
import { LiveAnalyticsDashboard } from '@/components/analytics/LiveAnalyticsDashboard';
import { OperationalAI } from '@/components/ai/OperationalAI';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function IntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: integrationsData = [], isLoading } = useQuery({
    queryKey: ['marketplace-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_integrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: apiLogs = [] } = useQuery({
    queryKey: ['api-logs-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_logs')
        .select('id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      return data || [];
    }
  });

  const activeIntegrations = integrationsData.filter(i => i.status === 'connected').length;
  const totalApiCalls = apiLogs.length;
  const webhooksCount = integrationsData.length;

  const integrations = [
    {
      name: 'Canva',
      description: 'Création de designs professionnels et marketing',
      category: 'Design',
      status: 'available',
      icon: Palette,
      premium: false
    },
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Intégrations Actives</CardTitle>
                <Plug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeIntegrations}</div>
                <p className="text-xs text-muted-foreground">
                  Sur {integrationsData.length} total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(totalApiCalls / 1000).toFixed(1)}K</div>
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
                <div className="text-2xl font-bold">{webhooksCount}</div>
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
        )}

        {/* Contenu Principal */}
        <Tabs defaultValue="integrations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="integrations">Intégrations Live</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="api">Analytics Live</TabsTrigger>
              <TabsTrigger value="marketplace">IA Opérationnelle</TabsTrigger>
            </TabsList>

          <TabsContent value="integrations" className="space-y-4">
            <IntegrationsManager />
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
            <LiveAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <OperationalAI />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}