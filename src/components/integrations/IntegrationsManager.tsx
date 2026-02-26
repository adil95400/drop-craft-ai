import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Clock, ShoppingCart, Globe, Package, Zap, Settings, Plus, Trash2, Eye, RefreshCw, Palette } from 'lucide-react';
import { useIntegrationsUnified, type UnifiedIntegration as Integration } from '@/hooks/unified';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { CanvaIntegrationCard } from './CanvaIntegrationCard';

export const IntegrationsManager = () => {
  const { toast } = useToast();
  const {
    integrations,
    stats,
    isLoading,
    connectShopify,
    connectAliExpress,
    connectBigBuy,
    syncIntegration,
    testConnection,
    updateIntegration,
    deleteIntegration,
    isConnectingShopify,
    isConnectingAliExpress,
    isConnectingBigBuy,
    isSyncing,
    isTesting,
    isUpdating,
    isDeleting
  } = useIntegrationsUnified();

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIntegrationForm, setNewIntegrationForm] = useState({
    platform_type: '',
    platform_name: '',
    shop_domain: '',
    api_key: '',
    api_secret: '',
    seller_id: ''
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'shopify': return ShoppingCart;
      case 'woocommerce': return Globe;
      case 'aliexpress': return Package;
      case 'bigbuy': return Package;
      default: return Globe;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return CheckCircle2;
      case 'error': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      const credentials = {
        shop_domain: newIntegrationForm.shop_domain,
        credentials: {
          api_key: newIntegrationForm.api_key,
          api_secret: newIntegrationForm.api_secret,
          seller_id: newIntegrationForm.seller_id
        }
      };

      switch (platform) {
        case 'shopify':
          connectShopify(credentials);
          break;
        case 'aliexpress':
          connectAliExpress(credentials);
          break;
        case 'bigbuy':
          connectBigBuy(credentials);
          break;
      }
      
      setShowAddDialog(false);
      setNewIntegrationForm({
        platform_type: '',
        platform_name: '',
        shop_domain: '',
        api_key: '',
        api_secret: '',
        seller_id: ''
      });
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de connecter l'intégration",
        variant: "destructive"
      });
    }
  };

  const handleSync = (integrationId: string) => {
    syncIntegration(integrationId);
  };

  const handleTest = (integrationId: string) => {
    testConnection(integrationId);
  };

  const handleToggleActive = (integration: Integration) => {
    updateIntegration({
      id: integration.id,
      updates: { is_active: !integration.is_active }
    });
  };

  const handleDelete = (integrationId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette intégration ?')) {
      deleteIntegration(integrationId);
    }
  };

  const availablePlatforms = [
    { id: 'shopify', name: 'Shopify', icon: ShoppingCart, description: 'Boutique e-commerce complète' },
    { id: 'woocommerce', name: 'WooCommerce', icon: Globe, description: 'Plugin WordPress e-commerce' },
    { id: 'aliexpress', name: 'AliExpress', icon: Package, description: 'Marketplace B2B/B2C' },
    { id: 'bigbuy', name: 'BigBuy', icon: Package, description: 'Grossiste dropshipping' }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Intégrations</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connectées</p>
                <p className="text-2xl font-bold text-green-600">{stats.connected}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dernière sync</p>
                <p className="text-sm font-medium">
                  {stats.lastSync.getTime() > 0 
                    ? formatDistanceToNow(stats.lastSync, { addSuffix: true, locale: getDateFnsLocale() })
                    : 'Jamais'
                  }
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Intégrations Connectées</CardTitle>
              <CardDescription>
                Gérez vos connexions avec les plateformes e-commerce et fournisseurs
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Intégration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter une Intégration</DialogTitle>
                  <DialogDescription>
                    Connectez une nouvelle plateforme à votre système
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="platforms" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="platforms">Plateformes</TabsTrigger>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="platforms" className="space-y-4">
                    <div className="grid gap-3">
                      {availablePlatforms.map((platform) => {
                        const IconComponent = platform.icon;
                        return (
                          <Card 
                            key={platform.id}
                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                              newIntegrationForm.platform_type === platform.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setNewIntegrationForm(prev => ({
                              ...prev,
                              platform_type: platform.id,
                              platform_name: platform.name
                            }))}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <IconComponent className="h-8 w-8" />
                                <div>
                                  <h3 className="font-medium">{platform.name}</h3>
                                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="config" className="space-y-4">
                    {newIntegrationForm.platform_type && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="shop_domain">Domaine / URL</Label>
                          <Input
                            id="shop_domain"
                            placeholder="monshop.myshopify.com"
                            value={newIntegrationForm.shop_domain}
                            onChange={(e) => setNewIntegrationForm(prev => ({ ...prev, shop_domain: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="api_key">Clé API</Label>
                          <Input
                            id="api_key"
                            type="password"
                            placeholder="Votre clé API"
                            value={newIntegrationForm.api_key}
                            onChange={(e) => setNewIntegrationForm(prev => ({ ...prev, api_key: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="api_secret">Secret API</Label>
                          <Input
                            id="api_secret"
                            type="password"
                            placeholder="Votre secret API"
                            value={newIntegrationForm.api_secret}
                            onChange={(e) => setNewIntegrationForm(prev => ({ ...prev, api_secret: e.target.value }))}
                          />
                        </div>
                        
                        {newIntegrationForm.platform_type !== 'shopify' && (
                          <div>
                            <Label htmlFor="seller_id">ID Vendeur (optionnel)</Label>
                            <Input
                              id="seller_id"
                              placeholder="Votre ID vendeur"
                              value={newIntegrationForm.seller_id}
                              onChange={(e) => setNewIntegrationForm(prev => ({ ...prev, seller_id: e.target.value }))}
                            />
                          </div>
                        )}
                        
                        <Button 
                          onClick={() => handleConnect(newIntegrationForm.platform_type)}
                          className="w-full"
                          disabled={isConnectingShopify || isConnectingAliExpress || isConnectingBigBuy}
                        >
                          {(isConnectingShopify || isConnectingAliExpress || isConnectingBigBuy) ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Connexion...
                            </>
                          ) : (
                            'Connecter'
                          )}
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Canva Integration - Always show */}
            <CanvaIntegrationCard />
            
            {integrations.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune intégration e-commerce configurée</h3>
                <p className="text-muted-foreground mb-4">
                  Connectez vos plateformes e-commerce et fournisseurs
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une Intégration
                </Button>
              </div>
            ) : (
              integrations.map((integration) => {
                const PlatformIcon = getPlatformIcon(integration.platform_type);
                const StatusIcon = getStatusIcon(integration.connection_status);
                const statusColor = getStatusColor(integration.connection_status);
                
                return (
                  <Card key={integration.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <PlatformIcon className="h-10 w-10" />
                            <StatusIcon className={`h-4 w-4 absolute -bottom-1 -right-1 ${statusColor}`} />
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-lg">{integration.platform_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {integration.shop_domain || integration.platform_url}
                            </p>
                            {integration.last_sync_at && (
                              <p className="text-xs text-muted-foreground">
                                Dernière sync: {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true, locale: getDateFnsLocale() })}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge variant={integration.connection_status === 'connected' ? 'default' : 'secondary'}>
                            {integration.connection_status === 'connected' ? 'Connecté' : 'Déconnecté'}
                          </Badge>
                          
                          <Switch
                            checked={integration.is_active}
                            onCheckedChange={() => handleToggleActive(integration)}
                            disabled={isUpdating}
                          />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTest(integration.id)}
                            disabled={isTesting}
                          >
                            {isTesting ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(integration.id)}
                            disabled={isSyncing}
                          >
                            {isSyncing ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedIntegration(integration)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(integration.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};