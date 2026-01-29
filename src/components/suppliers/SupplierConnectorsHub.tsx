/**
 * Hub des Connecteurs Fournisseurs
 * Interface pour connecter et gérer les API des fournisseurs
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plug, 
  CheckCircle, 
  XCircle, 
  Settings, 
  RefreshCw, 
  Zap,
  Globe,
  Truck,
  Package,
  Palette,
  Building2,
  Search,
  Filter,
  ExternalLink,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react';

interface SupplierConnector {
  id: string;
  name: string;
  logo: string;
  type: 'api' | 'scraping' | 'feed' | 'oauth';
  category: 'china' | 'europe' | 'us' | 'print_on_demand' | 'wholesale' | 'marketplace';
  features: string[];
  rateLimit: { requests: number; window: string };
  isConnected?: boolean;
  lastSync?: string;
}

interface ConnectionCredentials {
  [key: string]: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  china: { label: 'Chine', icon: <Globe className="h-4 w-4" />, color: 'bg-red-500/10 text-red-500' },
  europe: { label: 'Europe', icon: <Building2 className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-500' },
  us: { label: 'USA', icon: <Truck className="h-4 w-4" />, color: 'bg-green-500/10 text-green-500' },
  print_on_demand: { label: 'Print on Demand', icon: <Palette className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-500' },
  wholesale: { label: 'Grossiste', icon: <Package className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-500' },
  marketplace: { label: 'Marketplace', icon: <Globe className="h-4 w-4" />, color: 'bg-cyan-500/10 text-cyan-500' }
};

const CREDENTIAL_FIELDS: Record<string, { label: string; type: string; placeholder: string }[]> = {
  cj_dropshipping: [
    { label: 'Email', type: 'email', placeholder: 'votre@email.com' },
    { label: 'Mot de passe API', type: 'password', placeholder: '••••••••' }
  ],
  bigbuy: [
    { label: 'Clé API', type: 'password', placeholder: 'Votre clé API BigBuy' }
  ],
  aliexpress: [
    { label: 'App Key', type: 'text', placeholder: 'Votre App Key' },
    { label: 'App Secret', type: 'password', placeholder: 'Votre App Secret' },
    { label: 'Access Token', type: 'password', placeholder: 'Token d\'accès OAuth' }
  ],
  printful: [
    { label: 'Clé API', type: 'password', placeholder: 'Votre clé API Printful' }
  ],
  printify: [
    { label: 'Clé API', type: 'password', placeholder: 'Votre clé API Printify' },
    { label: 'Shop ID', type: 'text', placeholder: 'ID de votre boutique' }
  ],
  spocket: [
    { label: 'Client ID', type: 'text', placeholder: 'OAuth Client ID' },
    { label: 'Client Secret', type: 'password', placeholder: 'OAuth Client Secret' }
  ],
  zendrop: [
    { label: 'Clé API', type: 'password', placeholder: 'Votre clé API Zendrop' }
  ],
  syncee: [
    { label: 'Clé API', type: 'password', placeholder: 'Votre clé API Syncee' }
  ],
  modalyst: [
    { label: 'Access Token', type: 'password', placeholder: 'Token d\'accès OAuth' }
  ],
  doba: [
    { label: 'Clé API', type: 'password', placeholder: 'Votre clé API Doba' }
  ],
  salehoo: [
    { label: 'Clé API', type: 'password', placeholder: 'Votre clé API SaleHoo' }
  ],
  banggood: [
    { label: 'App ID', type: 'text', placeholder: 'Votre App ID' },
    { label: 'App Secret', type: 'password', placeholder: 'Votre App Secret' }
  ],
  dsers: [
    { label: 'Clé API', type: 'password', placeholder: 'Votre clé API DSers' }
  ],
  b2b_sports: [
    { label: 'User Key', type: 'text', placeholder: 'Votre User Key' },
    { label: 'Auth Key', type: 'password', placeholder: 'Votre Auth Key' }
  ],
  wholesale2b: [
    { label: 'Clé API', type: 'password', placeholder: 'Votre clé API Wholesale2B' }
  ]
};

export function SupplierConnectorsHub() {
  const [connectors, setConnectors] = useState<SupplierConnector[]>([]);
  const [connectedSuppliers, setConnectedSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<SupplierConnector | null>(null);
  const [credentials, setCredentials] = useState<ConnectionCredentials>({});
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadConnectors();
    loadConnectedSuppliers();
  }, []);

  const loadConnectors = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-connectors', {
        body: { action: 'list_connectors' }
      });

      if (error) throw error;
      setConnectors(data.connectors || []);
    } catch (error) {
      console.error('Error loading connectors:', error);
      // Fallback to static data
      setConnectors(getStaticConnectors());
    } finally {
      setLoading(false);
    }
  };

  const loadConnectedSuppliers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('supplier-connectors', {
        body: { action: 'get_connected_suppliers', userId: user.id }
      });

      if (!error && data.connections) {
        setConnectedSuppliers(data.connections.map((c: any) => c.connector_id));
      }
    } catch (error) {
      console.error('Error loading connected suppliers:', error);
    }
  };

  const getStaticConnectors = (): SupplierConnector[] => [
    { id: 'aliexpress', name: 'AliExpress', logo: '🛒', type: 'api', category: 'china', features: ['product_search', 'order_placement', 'tracking'], rateLimit: { requests: 40, window: '1s' } },
    { id: 'cj_dropshipping', name: 'CJ Dropshipping', logo: '📦', type: 'api', category: 'china', features: ['product_search', 'order_placement', 'tracking', 'warehousing'], rateLimit: { requests: 100, window: '1m' } },
    { id: 'bigbuy', name: 'BigBuy', logo: '🇪🇺', type: 'api', category: 'europe', features: ['product_search', 'order_placement', 'eu_warehousing'], rateLimit: { requests: 250, window: '5m' } },
    { id: 'spocket', name: 'Spocket', logo: '🚀', type: 'api', category: 'us', features: ['product_search', 'us_eu_suppliers', 'quality_verified'], rateLimit: { requests: 100, window: '1m' } },
    { id: 'zendrop', name: 'Zendrop', logo: '⚡', type: 'api', category: 'us', features: ['fast_shipping', 'us_warehousing', 'custom_branding'], rateLimit: { requests: 60, window: '1m' } },
    { id: 'printful', name: 'Printful', logo: '🎨', type: 'api', category: 'print_on_demand', features: ['custom_print', 'mockup_generator', 'global_fulfillment'], rateLimit: { requests: 120, window: '1m' } },
    { id: 'printify', name: 'Printify', logo: '🖨️', type: 'api', category: 'print_on_demand', features: ['custom_print', 'multi_provider'], rateLimit: { requests: 600, window: '1m' } },
    { id: 'syncee', name: 'Syncee', logo: '🔄', type: 'api', category: 'marketplace', features: ['auto_sync', 'multi_supplier'], rateLimit: { requests: 100, window: '1m' } },
    { id: 'modalyst', name: 'Modalyst', logo: '👗', type: 'api', category: 'us', features: ['brand_suppliers', 'fashion_focus'], rateLimit: { requests: 100, window: '1m' } },
    { id: 'doba', name: 'Doba', logo: '📊', type: 'api', category: 'wholesale', features: ['wholesale_prices', 'multi_supplier'], rateLimit: { requests: 60, window: '1m' } },
    { id: 'salehoo', name: 'SaleHoo', logo: '🏷️', type: 'api', category: 'wholesale', features: ['supplier_directory', 'verified_suppliers'], rateLimit: { requests: 100, window: '1m' } },
    { id: 'banggood', name: 'Banggood', logo: '🔌', type: 'api', category: 'china', features: ['electronics_focus', 'global_warehouses'], rateLimit: { requests: 100, window: '1m' } },
    { id: 'dsers', name: 'DSers', logo: '🔗', type: 'api', category: 'china', features: ['aliexpress_integration', 'bulk_orders'], rateLimit: { requests: 100, window: '1m' } },
    { id: 'b2b_sports', name: 'B2B Sports', logo: '⚽', type: 'api', category: 'europe', features: ['sports_products', 'eu_warehousing'], rateLimit: { requests: 100, window: '1m' } },
    { id: 'wholesale2b', name: 'Wholesale2B', logo: '🏭', type: 'feed', category: 'wholesale', features: ['product_feed', 'us_suppliers'], rateLimit: { requests: 60, window: '1m' } }
  ];

  const handleConnect = async () => {
    if (!selectedConnector) return;

    setConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Test connection first
      const { data: testResult, error: testError } = await supabase.functions.invoke('supplier-connectors', {
        body: { 
          action: 'test_connection',
          connectorId: selectedConnector.id,
          credentials
        }
      });

      if (testError || !testResult.isValid) {
        throw new Error(testResult?.message || 'Échec de la connexion');
      }

      // Save connection
      const { error: connectError } = await supabase.functions.invoke('supplier-connectors', {
        body: { 
          action: 'connect',
          userId: user.id,
          connectorId: selectedConnector.id,
          credentials
        }
      });

      if (connectError) throw connectError;

      toast.success(`Connecté à ${selectedConnector.name} !`);
      setConnectedSuppliers([...connectedSuppliers, selectedConnector.id]);
      setConnectDialogOpen(false);
      setCredentials({});
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connectorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.functions.invoke('supplier-connectors', {
        body: { action: 'disconnect', userId: user.id, connectorId }
      });

      setConnectedSuppliers(connectedSuppliers.filter(id => id !== connectorId));
      toast.success('Déconnecté');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handleSync = async (connectorId: string) => {
    setSyncing(connectorId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('supplier-connectors', {
        body: { action: 'sync_inventory', userId: user.id, connectorId }
      });

      if (error) throw error;

      toast.success(`Synchronisation terminée: ${data.updated} produits mis à jour`);
    } catch (error) {
      toast.error('Erreur de synchronisation');
    } finally {
      setSyncing(null);
    }
  };

  const filteredConnectors = connectors.filter(c => {
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openConnectDialog = (connector: SupplierConnector) => {
    setSelectedConnector(connector);
    setCredentials({});
    setConnectDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Hub Connecteurs Fournisseurs</h2>
          <p className="text-muted-foreground">
            Connectez vos fournisseurs préférés en quelques clics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            {connectedSuppliers.length} connectés
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
            {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
              <TabsTrigger key={key} value={key} className="text-xs">{label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredConnectors.map((connector) => {
          const isConnected = connectedSuppliers.includes(connector.id);
          const categoryInfo = CATEGORY_LABELS[connector.category];

          return (
            <Card 
              key={connector.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                isConnected ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              {isConnected && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-500 text-white gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Connecté
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{connector.logo}</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{connector.name}</CardTitle>
                    <Badge variant="secondary" className={`mt-1 text-xs ${categoryInfo?.color}`}>
                      {categoryInfo?.icon}
                      <span className="ml-1">{categoryInfo?.label}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {connector.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  {connector.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{connector.features.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Rate Limit */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{connector.rateLimit.requests} req/{connector.rateLimit.window}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isConnected ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleSync(connector.id)}
                        disabled={syncing === connector.id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncing === connector.id ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDisconnect(connector.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => openConnectDialog(connector)}
                    >
                      <Plug className="h-4 w-4 mr-1" />
                      Connecter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connect Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedConnector?.logo}</span>
              Connecter {selectedConnector?.name}
            </DialogTitle>
            <DialogDescription>
              Entrez vos identifiants API pour connecter votre compte
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedConnector && CREDENTIAL_FIELDS[selectedConnector.id]?.map((field, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`field-${index}`}>{field.label}</Label>
                <Input
                  id={`field-${index}`}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={credentials[field.label.toLowerCase().replace(/ /g, '_')] || ''}
                  onChange={(e) => setCredentials({
                    ...credentials,
                    [field.label.toLowerCase().replace(/ /g, '_')]: e.target.value
                  })}
                />
              </div>
            ))}

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Vos identifiants sont chiffrés et stockés de manière sécurisée
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Plug className="h-4 w-4 mr-2" />
                  Connecter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
