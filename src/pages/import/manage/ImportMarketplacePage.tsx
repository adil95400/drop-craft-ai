import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useProductImports } from '@/hooks/useProductImports';
import { useMarketplaceConnections } from '@/hooks/useMarketplaceConnections';
import { toast } from 'sonner';
import { 
  Store, 
  Globe, 
  ShoppingCart, 
  Package, 
  Settings,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2
} from 'lucide-react';

const MARKETPLACE_CONFIGS = [
  { id: 'amazon', name: 'Amazon', description: 'Marketplace mondiale avec millions de visiteurs', icon: Store, color: 'orange' },
  { id: 'ebay', name: 'eBay', description: "Plateforme d'enchères et vente directe", icon: ShoppingCart, color: 'blue' },
  { id: 'tiktok', name: 'TikTok Shop', description: 'Social commerce sur TikTok', icon: Package, color: 'black' },
  { id: 'meta', name: 'Meta Commerce', description: 'Facebook Marketplace & Instagram Shopping', icon: Store, color: 'blue' },
  { id: 'google', name: 'Google Shopping', description: 'Plateforme publicitaire de Google', icon: Globe, color: 'green' },
  { id: 'etsy', name: 'Etsy', description: 'Marketplace pour produits artisanaux et vintage', icon: Package, color: 'orange' },
  { id: 'walmart', name: 'Walmart', description: 'Géant américain du retail en ligne', icon: Store, color: 'blue' },
  { id: 'cdiscount', name: 'Cdiscount', description: 'Leader français du e-commerce', icon: ShoppingCart, color: 'red' },
  { id: 'aliexpress', name: 'AliExpress', description: 'Marketplace chinoise B2C mondiale', icon: Package, color: 'red' },
  { id: 'wish', name: 'Wish', description: 'Plateforme de commerce à petits prix', icon: Store, color: 'purple' },
];

export default function ImportMarketplacePage() {
  const navigate = useNavigate();
  const { importedProducts } = useProductImports();
  const { connections, isLoading: loadingConnections, connect, disconnect, toggleSync, syncProducts, isConnecting, isSyncing } = useMarketplaceConnections();

  const publishedProducts = importedProducts.filter(p => p.status === 'published');

  const getConnectionForMarketplace = (marketplaceId: string) => {
    return connections.find(c => c.platform === marketplaceId);
  };

  const handleConnect = async (marketplace: typeof MARKETPLACE_CONFIGS[0]) => {
    await connect(marketplace.id, marketplace.name);
  };

  const handleDisconnect = async (connectionId: string) => {
    await disconnect(connectionId);
  };

  const handleToggleSync = async (connectionId: string, enabled: boolean) => {
    await toggleSync(connectionId, enabled);
  };

  const handleSync = async (connectionId: string) => {
    if (publishedProducts.length === 0) {
      toast.error('Aucun produit à synchroniser');
      return;
    }
    await syncProducts(connectionId);
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const totalSynced = connections.reduce((sum, c) => sum + (c.total_products_synced || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Marketplaces</h1>
            <p className="text-muted-foreground">
              Synchronisez vos produits avec les principales plateformes de vente
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits Disponibles</p>
                <p className="text-2xl font-bold">{publishedProducts.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marketplaces Connectées</p>
                <p className="text-2xl font-bold">{connectedCount}</p>
              </div>
              <Store className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits Synchronisés</p>
                <p className="text-2xl font-bold">{totalSynced}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de Succès</p>
                <p className="text-2xl font-bold">
                  {totalSynced > 0 ? '100%' : '--%'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketplaces Grid */}
      {loadingConnections ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MARKETPLACE_CONFIGS.map((marketplace) => {
            const Icon = marketplace.icon;
            const connection = getConnectionForMarketplace(marketplace.id);
            const isConnected = connection?.status === 'connected';
            const stats = { published: connection?.total_products_synced || 0, pending: 0, rejected: connection?.failed_sync_count || 0 };
            const syncingNow = isSyncing;
            
            return (
              <Card key={marketplace.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-foreground" />
                      </div>
                      <div>
                        <CardTitle>{marketplace.name}</CardTitle>
                        <CardDescription>{marketplace.description}</CardDescription>
                      </div>
                    </div>
                    {isConnected ? (
                      <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connecté
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="w-3 h-3 mr-1" />
                        Non connecté
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                      <p className="text-xs text-muted-foreground">Publiés</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                      <p className="text-xs text-muted-foreground">En attente</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                      <p className="text-xs text-muted-foreground">Rejetés</p>
                    </div>
                  </div>

                  {/* Sync Toggle */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Synchronisation automatique</span>
                    </div>
                    <Switch
                      checked={connection?.is_active ?? false}
                      onCheckedChange={(checked) => {
                        if (connection) {
                          handleToggleSync(connection.id, checked);
                        }
                      }}
                      disabled={!isConnected}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isConnected ? (
                      <>
                        <Button 
                          className="flex-1"
                          onClick={() => connection && handleSync(connection.id)}
                          disabled={syncingNow || publishedProducts.length === 0}
                        >
                          {syncingNow ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Synchroniser
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => connection && handleDisconnect(connection.id)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        className="flex-1"
                        variant="outline"
                        onClick={() => handleConnect(marketplace)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Connecter
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
