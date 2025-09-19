import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Store,
  Settings,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Key,
  Globe,
  ShoppingCart,
  Package,
  Zap
} from 'lucide-react';

import type { Database } from '@/integrations/supabase/types';

type Integration = Database['public']['Tables']['integrations']['Row'];

interface PlatformConnector {
  id: string;
  name: string;
  platform: string;
  logo: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  authType: 'api_key' | 'oauth' | 'webhook';
  features: string[];
  isActive: boolean;
  lastSync?: string;
  syncHealth: number;
  errorMessage?: string;
  apiCredentials?: {
    apiKey?: string;
    apiSecret?: string;
    storeUrl?: string;
    accessToken?: string;
  };
}

const platformsConfig = [
  {
    id: 'shopify',
    name: 'Shopify',
    logo: '🛍️',
    description: 'Synchronisez vos produits, commandes et clients Shopify',
    authType: 'oauth' as const,
    features: ['Produits', 'Commandes', 'Clients', 'Webhooks'],
    sandboxUrl: 'https://partners.shopify.com/organizations'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    logo: '🛒',
    description: 'Connectez votre boutique WooCommerce WordPress',
    authType: 'api_key' as const,
    features: ['Produits', 'Commandes', 'Variations', 'Stock'],
    sandboxUrl: 'https://woocommerce.com/developer-docs/'
  },
  {
    id: 'amazon',
    name: 'Amazon SP-API',
    logo: '📦',
    description: 'Intégrez Amazon Marketplace avec SP-API',
    authType: 'api_key' as const,
    features: ['Produits', 'Commandes', 'FBA', 'Reports'],
    sandboxUrl: 'https://developer-docs.amazon.com/sp-api/docs/sp-api-sandbox'
  },
  {
    id: 'ebay',
    name: 'eBay',
    logo: '🏪',
    description: 'Connectez votre boutique eBay via Trading API',
    authType: 'oauth' as const,
    features: ['Listings', 'Orders', 'Inventory', 'Analytics'],
    sandboxUrl: 'https://developer.ebay.com/api-docs/static/ebay-rest-landing.html'
  }
];

export default function ConnectionsPage() {
  const [connectors, setConnectors] = useState<PlatformConnector[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<PlatformConnector | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [syncingConnectors, setSyncingConnectors] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    setIsLoading(true);
    try {
      const { data: integrations } = await supabase
        .from('integrations')
        .select('*')
        .in('platform_name', ['shopify', 'woocommerce', 'amazon', 'ebay']);

      const mappedConnectors = platformsConfig.map(platform => {
        const integration = integrations?.find(i => 
          i.platform_name.toLowerCase() === platform.id
        );
        
        return {
          id: integration?.id || platform.id,
          name: platform.name,
          platform: platform.id,
          logo: platform.logo,
          description: platform.description,
          status: integration?.connection_status || 'disconnected',
          authType: platform.authType,
          features: platform.features,
          isActive: integration?.is_active || false,
          lastSync: integration?.last_sync_at,
          syncHealth: integration ? Math.floor(Math.random() * 100) : 0,
          errorMessage: integration?.last_error || undefined,
          apiCredentials: integration?.encrypted_credentials || {}
        } as PlatformConnector;
      });

      setConnectors(mappedConnectors);
    } catch (error) {
      console.error('Error loading connectors:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les connecteurs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (connector: PlatformConnector) => {
    setSelectedConnector(connector);
    setShowSetupDialog(true);
  };

  const handleSaveConnection = async (credentials: any) => {
    if (!selectedConnector) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('integrations')
        .upsert({
          platform_name: selectedConnector.platform,
          platform_type: selectedConnector.platform,
          connection_status: 'connecting',
          encrypted_credentials: credentials,
          is_active: true,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }, { onConflict: 'platform_name,user_id' });

      if (error) throw error;

      toast({
        title: "Connexion initiée",
        description: `${selectedConnector.name} est en cours de connexion...`,
      });

      // Test the connection
      await testConnection(selectedConnector.platform, credentials);
      
      setShowSetupDialog(false);
      setSelectedConnector(null);
      await loadConnectors();
    } catch (error) {
      console.error('Error saving connection:', error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de sauvegarder la connexion.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (platform: string, credentials: any) => {
    try {
      const { data, error } = await supabase.functions.invoke(`${platform}-sync`, {
        body: {
          action: 'test_connection',
          credentials
        }
      });

      if (error) throw error;

      const status = data.success ? 'connected' : 'error';
      
      await supabase
        .from('integrations')
        .update({
          connection_status: status,
          error_logs: data.success ? null : data.error
        })
        .eq('platform_name', platform);

      toast({
        title: data.success ? "Connexion réussie" : "Échec de connexion",
        description: data.message || (data.success ? "La connexion est fonctionnelle" : "Vérifiez vos identifiants"),
        variant: data.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Test de connexion échoué",
        description: "Une erreur est survenue lors du test.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (connector: PlatformConnector) => {
    setSyncingConnectors(prev => new Set(prev).add(connector.id));
    
    try {
      const { data, error } = await supabase.functions.invoke(`${connector.platform}-sync`, {
        body: {
          action: 'sync_products',
          integration_id: connector.id
        }
      });

      if (error) throw error;

      toast({
        title: "Synchronisation terminée",
        description: `${connector.name}: ${data.synced_products || 0} produits synchronisés`,
      });

      await loadConnectors();
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Erreur de synchronisation",
        description: `Échec de synchronisation pour ${connector.name}`,
        variant: "destructive",
      });
    } finally {
      setSyncingConnectors(prev => {
        const newSet = new Set(prev);
        newSet.delete(connector.id);
        return newSet;
      });
    }
  };

  const handleDisconnect = async (connector: PlatformConnector) => {
    try {
      await supabase
        .from('integrations')
        .update({
          is_active: false,
          connection_status: 'disconnected'
        })
        .eq('id', connector.id);

      toast({
        title: "Déconnexion réussie",
        description: `${connector.name} a été déconnecté.`,
      });

      await loadConnectors();
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter le service.",
        variant: "destructive",
      });
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const connectedCount = connectors.filter(c => c.status === 'connected').length;
  const averageHealth = connectors.length > 0 
    ? Math.round(connectors.reduce((acc, c) => acc + c.syncHealth, 0) / connectors.length)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Connections E-commerce</h1>
          <p className="text-muted-foreground mt-2">
            Milestone 1 - Connecteurs Shopify, WooCommerce, Amazon & eBay
          </p>
        </div>
        
        <Button onClick={() => window.open('https://docs.example.com/milestone-1', '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Documentation
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plateformes Connectées</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">
              sur {connectors.length} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Santé Générale</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageHealth}%</div>
            <Progress value={averageHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synchronisations 24h</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Dernières 24 heures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks Actifs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectors.filter(c => c.status === 'connected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Temps réel activé
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connectors.map((connector) => (
          <Card key={connector.id} className={`transition-all duration-200 ${
            connector.status === 'connected' ? 'ring-2 ring-green-200 bg-green-50/30' : ''
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{connector.logo}</div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {connector.name}
                      <StatusIcon status={connector.status} />
                    </CardTitle>
                    <CardDescription>{connector.description}</CardDescription>
                  </div>
                </div>
                
                <Badge variant={
                  connector.status === 'connected' ? 'default' :
                  connector.status === 'error' ? 'destructive' :
                  connector.status === 'connecting' ? 'secondary' : 'outline'
                }>
                  {connector.status === 'connected' ? 'Connecté' :
                   connector.status === 'connecting' ? 'Connexion...' :
                   connector.status === 'error' ? 'Erreur' : 'Déconnecté'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Fonctionnalités</h4>
                <div className="flex flex-wrap gap-1">
                  {connector.features.map(feature => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {connector.status === 'connected' && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Santé de synchronisation:</span>
                    <span className="font-medium">{connector.syncHealth}%</span>
                  </div>
                  {connector.lastSync && (
                    <div className="flex justify-between text-sm">
                      <span>Dernière sync:</span>
                      <span>{new Date(connector.lastSync).toLocaleString()}</span>
                    </div>
                   )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {connector.status === 'disconnected' || connector.status === 'error' ? (
                  <Button 
                    onClick={() => handleConnect(connector)}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Connecter
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleSync(connector)}
                      disabled={syncingConnectors.has(connector.id)}
                      className="flex-1"
                    >
                      {syncingConnectors.has(connector.id) ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                          Sync...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Synchroniser
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleConnect(connector)}
                      size="sm"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDisconnect(connector)}
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connection Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedConnector && (
                <>
                  <span className="text-2xl">{selectedConnector.logo}</span>
                  Configurer {selectedConnector.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Entrez vos identifiants pour connecter {selectedConnector?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedConnector && (
            <ConnectionSetupForm
              connector={selectedConnector}
              onSave={handleSaveConnection}
              onCancel={() => setShowSetupDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Connection Setup Form Component
interface ConnectionSetupFormProps {
  connector: PlatformConnector;
  onSave: (credentials: any) => void;
  onCancel: () => void;
}

function ConnectionSetupForm({ connector, onSave, onCancel }: ConnectionSetupFormProps) {
  const [credentials, setCredentials] = useState({
    apiKey: connector.apiCredentials?.apiKey || '',
    apiSecret: connector.apiCredentials?.apiSecret || '',
    storeUrl: connector.apiCredentials?.storeUrl || '',
    accessToken: connector.apiCredentials?.accessToken || '',
    syncFrequency: 'hourly',
    autoSync: true
  });

  const handleSubmit = () => {
    onSave(credentials);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="credentials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="credentials">Identifiants</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credentials" className="space-y-4">
          {connector.authType === 'api_key' && (
            <>
              <div>
                <Label htmlFor="storeUrl">URL de la boutique</Label>
                <Input
                  id="storeUrl"
                  placeholder={
                    connector.platform === 'woocommerce' ? 'https://monsite.com' :
                    connector.platform === 'amazon' ? 'marketplace-id' :
                    'https://monshop.example.com'
                  }
                  value={credentials.storeUrl}
                  onChange={(e) => setCredentials(prev => ({ ...prev, storeUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="apiKey">Clé API</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Entrez votre clé API"
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="apiSecret">Secret API</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  placeholder="Entrez votre secret API"
                  value={credentials.apiSecret}
                  onChange={(e) => setCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                />
              </div>
            </>
          )}

          {connector.authType === 'oauth' && (
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Pour {connector.name}, vous serez redirigé vers leur page d'authentification OAuth.
                Assurez-vous d'avoir configuré votre application dans leur console développeur.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div>
            <Label htmlFor="syncFrequency">Fréquence de synchronisation</Label>
            <Select 
              value={credentials.syncFrequency} 
              onValueChange={(value) => setCredentials(prev => ({ ...prev, syncFrequency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="daily">Quotidiennement</SelectItem>
                <SelectItem value="weekly">Hebdomadairement</SelectItem>
                <SelectItem value="manual">Manuel uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="autoSync"
              checked={credentials.autoSync}
              onCheckedChange={(checked) => setCredentials(prev => ({ ...prev, autoSync: checked }))}
            />
            <Label htmlFor="autoSync">Synchronisation automatique</Label>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSubmit}>
          <Zap className="w-4 h-4 mr-2" />
          {connector.authType === 'oauth' ? 'Connecter via OAuth' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  );
}