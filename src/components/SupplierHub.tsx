import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supplierHub } from '@/services/SupplierHub';
import { importManager } from '@/services/ImportManager';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Settings, 
  RefreshCw as Sync, 
  Upload, 
  Database, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Package,
  Globe,
  Wifi,
  WifiOff
} from 'lucide-react';
import type { SupplierConnectorInfo } from '@/services/SupplierHub';

const SupplierHub: React.FC = () => {
  const { toast } = useToast();
  const [connectors] = useState<SupplierConnectorInfo[]>([
    ...supplierHub.getAvailableConnectors(),
    // Ajout des nouveaux connecteurs Wise2Sync
    {
      id: 'bigbuy',
      name: 'BigBuy',
      displayName: 'BigBuy',
      description: '300K+ produits européens, synchronisation temps réel',
      category: 'Dropshipping Premium',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/bigbuy.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 3600 },
      setupComplexity: 'medium'
    },
    {
      id: 'cdiscount-pro',
      name: 'Cdiscount Pro',
      displayName: 'Cdiscount Pro',
      description: 'Marketplace française, API/EDI complète',
      category: 'Marketplace Française',
      status: 'available',
      authType: 'oauth',
      logo: '/logos/cdiscount.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 },
      setupComplexity: 'advanced'
    },
    {
      id: 'eprolo',
      name: 'Eprolo',
      displayName: 'Eprolo',
      description: '1M+ produits, dropshipping européen premium',
      category: 'Dropshipping Premium',
      status: 'available',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 100, requestsPerHour: 6000 },
      setupComplexity: 'easy'
    },
    {
      id: 'vidaxl',
      name: 'VidaXL',
      displayName: 'VidaXL',
      description: '85K+ produits mobilier/jardin européen',
      category: 'Mobilier & Jardin',
      status: 'available',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: false, webhooks: false },
      rateLimits: { requestsPerMinute: 40, requestsPerHour: 2400 },
      setupComplexity: 'medium'
    },
    {
      id: 'syncee',
      name: 'Syncee',
      displayName: 'Syncee',
      description: '8M+ produits, 12K+ marques mondiales',
      category: 'Marketplace Globale',
      status: 'available',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: false, webhooks: true },
      rateLimits: { requestsPerMinute: 120, requestsPerHour: 7200 },
      setupComplexity: 'easy'
    },
    {
      id: 'printful',
      name: 'Printful',
      displayName: 'Printful',
      description: 'Print-on-demand leader mondial',
      category: 'Print-on-Demand',
      status: 'available',
      authType: 'api_key',
      features: { products: true, inventory: false, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 120, requestsPerHour: 7200 },
      setupComplexity: 'easy'
    },
    {
      id: 'matterhorn',
      name: 'Matterhorn',
      displayName: 'Matterhorn',
      description: '120K+ produits lingerie/mode européens',
      category: 'Mode & Lingerie',
      status: 'available',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 50, requestsPerHour: 3000 },
      setupComplexity: 'advanced'
    },
    // Fournisseurs européens
    {
      id: 'hurtownia-polska',
      name: 'Hurtownia Polska',
      displayName: 'Hurtownia Polska',
      description: 'Grande hurtownia polonaise',
      category: 'Fournisseurs Européens',
      status: 'available',
      authType: 'credentials',
      features: { products: true, inventory: false, orders: false, webhooks: false },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 1200 },
      setupComplexity: 'medium'
    }
  ]);
  const [activeConnectors, setActiveConnectors] = useState<string[]>([]);
  const [connectionDialog, setConnectionDialog] = useState<{ open: boolean; connector?: SupplierConnectorInfo }>({ open: false });
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [syncProgress, setSyncProgress] = useState<Record<string, number>>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [stats, setStats] = useState({
    connected: 0,
    available: 0,
    products: 1234,
    syncToday: 8
  });

  // Initialiser les stats en fonction des connecteurs
  useEffect(() => {
    setStats({
      connected: activeConnectors.length,
      available: connectors.filter(c => c.status === 'available').length,
      products: 1234 + Math.floor(Math.random() * 500),
      syncToday: Math.floor(Math.random() * 15) + 5
    });
  }, [activeConnectors, connectors]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'beta': return 'bg-orange-500';
      case 'coming_soon': return 'bg-slate-400';
      default: return 'bg-emerald-500';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'text-emerald-600';
      case 'medium': return 'text-orange-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const handleConnect = async (connector: SupplierConnectorInfo) => {
    if (connector.status === 'coming_soon') {
      toast({
        title: "Bientôt disponible",
        description: `${connector.displayName} sera bientôt disponible. Restez connecté !`,
        variant: "default"
      });
      return;
    }

    setConnectionDialog({ open: true, connector });
    setCredentials({});
  };

  const handleSaveConnection = async () => {
    if (!connectionDialog.connector) return;
    
    setConnecting(connectionDialog.connector.id);
    
    try {
      const success = await supplierHub.connectSupplier(
        connectionDialog.connector.id,
        credentials
      );

      if (success) {
        setActiveConnectors(prev => [...prev, connectionDialog.connector!.id]);
        toast({
          title: "Connexion réussie",
          description: `${connectionDialog.connector.displayName} a été connecté avec succès`,
        });
        setConnectionDialog({ open: false });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Vérifiez vos identifiants et réessayez",
        variant: "destructive"
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectorId: string) => {
    try {
      await supplierHub.disconnectSupplier(connectorId);
      setActiveConnectors(prev => prev.filter(id => id !== connectorId));
      toast({
        title: "Déconnexion réussie",
        description: "Le fournisseur a été déconnecté",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter le fournisseur",
        variant: "destructive"
      });
    }
  };

  const handleSync = async (connectorId: string) => {
    setSyncProgress(prev => ({ ...prev, [connectorId]: 0 }));
    
    try {
      // Utiliser la nouvelle Edge Function pour la synchronisation
      const { data, error } = await supabase.functions.invoke('supplier-sync-engine', {
        body: {
          connectorId,
          userId: 'user-demo', // TODO: récupérer le vrai user ID
          jobType: 'products',
          options: {
            fullSync: false,
            limit: 100
          }
        }
      });

      if (error) throw error;

      // Simulation du progress en temps réel
      for (let i = 0; i <= 100; i += 10) {
        setSyncProgress(prev => ({ ...prev, [connectorId]: i }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const result = data.result;
      
      toast({
        title: "Synchronisation terminée",
        description: `${result.imported} produits importés, ${result.duplicates} doublons détectés`,
      });

      // Mettre à jour les stats
      setStats(prev => ({
        ...prev,
        connected: activeConnectors.length,
        available: connectors.filter(c => c.status === 'available').length,
        products: prev.products + result.imported,
        syncToday: prev.syncToday + 1
      }));

    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: `Impossible de synchroniser ${connectorId}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setSyncProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[connectorId];
          return newProgress;
        });
      }, 2000);
    }
  };

  const renderCredentialFields = (connector: SupplierConnectorInfo) => {
    switch (connector.authType) {
      case 'api_key':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Clé API</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Entrez votre clé API"
                value={credentials.apiKey || ''}
                onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            {connector.id === 'shopify' && (
              <div>
                <Label htmlFor="shopDomain">Nom de boutique</Label>
                <Input
                  id="shopDomain"
                  placeholder="monshop.myshopify.com"
                  value={credentials.shopDomain || ''}
                  onChange={(e) => setCredentials(prev => ({ ...prev, shopDomain: e.target.value }))}
                />
              </div>
            )}
          </div>
        );
      case 'credentials':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={credentials.username || ''}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password || ''}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>
        );
      case 'oauth':
        return (
          <div className="text-center py-4">
            <Button onClick={() => {/* OAuth flow */}}>
              Se connecter avec OAuth
            </Button>
          </div>
        );
      default:
        return <div>Configuration automatique</div>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hub Fournisseurs</h1>
          <p className="text-muted-foreground mt-2">
            Connectez et synchronisez vos fournisseurs pour importer des produits automatiquement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Manuel
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Fournisseur
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connectés</p>
                <p className="text-2xl font-bold">{stats.connected}</p>
              </div>
              <Wifi className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold">{stats.available}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{stats.products.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sync Aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.syncToday}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectors.map((connector) => {
          const isActive = activeConnectors.includes(connector.id);
          const progress = syncProgress[connector.id];
          
          return (
            <Card key={connector.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {connector.logo ? (
                      <img src={connector.logo} alt={connector.displayName} className="h-8 w-8 rounded" />
                    ) : (
                      <Globe className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{connector.displayName}</CardTitle>
                      <CardDescription className="text-sm">{connector.category}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(connector.status)} text-white text-xs`}
                    >
                      {connector.status === 'available' ? 'Disponible' :
                       connector.status === 'beta' ? 'Bêta' : 'Bientôt'}
                    </Badge>
                    {isActive ? (
                      <Wifi className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{connector.description}</p>
                
                {/* Features */}
                <div className="flex gap-2 flex-wrap">
                  {connector.features.products && (
                    <Badge variant="outline" className="text-xs">Produits</Badge>
                  )}
                  {connector.features.inventory && (
                    <Badge variant="outline" className="text-xs">Stock</Badge>
                  )}
                  {connector.features.orders && (
                    <Badge variant="outline" className="text-xs">Commandes</Badge>
                  )}
                  {connector.features.webhooks && (
                    <Badge variant="outline" className="text-xs">Webhooks</Badge>
                  )}
                </div>

                {/* Rate Limits & Complexity */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Limite: {connector.rateLimits.requestsPerMinute}/min</span>
                  <span className={getComplexityColor(connector.setupComplexity)}>
                    {connector.setupComplexity === 'easy' ? 'Facile' :
                     connector.setupComplexity === 'medium' ? 'Moyen' : 'Avancé'}
                  </span>
                </div>

                {/* Progress bar for sync */}
                {progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Synchronisation...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {isActive ? (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleSync(connector.id)}
                        disabled={progress !== undefined}
                        className="flex-1"
                      >
                        <Sync className="h-4 w-4 mr-1" />
                        Sync
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDisconnect(connector.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => handleConnect(connector)}
                      disabled={connecting === connector.id}
                      className="flex-1"
                    >
                      {connecting === connector.id ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Connexion...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Connecter
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connection Dialog */}
      <Dialog open={connectionDialog.open} onOpenChange={(open) => setConnectionDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Connecter {connectionDialog.connector?.displayName}
            </DialogTitle>
            <DialogDescription>
              Configurez votre connexion à {connectionDialog.connector?.displayName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {connectionDialog.connector && renderCredentialFields(connectionDialog.connector)}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setConnectionDialog({ open: false })}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveConnection}
                disabled={connecting !== null}
              >
                {connecting ? 'Connexion...' : 'Connecter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierHub;