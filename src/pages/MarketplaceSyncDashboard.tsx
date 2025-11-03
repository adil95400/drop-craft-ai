import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketplaceSync } from '@/hooks/useMarketplaceSync';
import {
  Store,
  RefreshCw,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Settings,
  Trash2,
  ArrowRightLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const platformIcons: Record<string, string> = {
  shopify: '🛍️',
  woocommerce: '🛒',
  amazon: '📦',
  ebay: '🏷️',
  prestashop: '🏪',
};

export default function MarketplaceSyncDashboard() {
  const {
    connections,
    isLoadingConnections,
    syncStats,
    createConnection,
    isCreatingConnection,
    updateConnection,
    deleteConnection,
    syncProducts,
    isSyncingProducts,
    syncInventory,
    isSyncingInventory,
    getSyncLogs,
  } = useMarketplaceSync();

  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newConnection, setNewConnection] = useState({
    platform: 'shopify' as const,
    storeName: '',
    credentials: {} as Record<string, string>,
  });

  const { data: syncLogs = [] } = getSyncLogs(selectedConnection || undefined);

  const handleCreateConnection = () => {
    createConnection(newConnection);
    setIsAddDialogOpen(false);
    setNewConnection({
      platform: 'shopify',
      storeName: '',
      credentials: {},
    });
  };

  const handleSyncInventory = (connectionId: string) => {
    syncInventory(connectionId);
  };

  const renderCredentialFields = (platform: string) => {
    switch (platform) {
      case 'shopify':
        return (
          <>
            <div>
              <Label htmlFor="shop_domain">Shop Domain</Label>
              <Input
                id="shop_domain"
                placeholder="mon-shop.myshopify.com"
                value={newConnection.credentials.shop_domain || ''}
                onChange={(e) =>
                  setNewConnection({
                    ...newConnection,
                    credentials: { ...newConnection.credentials, shop_domain: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="access_token">Access Token</Label>
              <Input
                id="access_token"
                type="password"
                placeholder="shpat_xxxxx"
                value={newConnection.credentials.access_token || ''}
                onChange={(e) =>
                  setNewConnection({
                    ...newConnection,
                    credentials: { ...newConnection.credentials, access_token: e.target.value },
                  })
                }
              />
            </div>
          </>
        );
      case 'woocommerce':
        return (
          <>
            <div>
              <Label htmlFor="site_url">Site URL</Label>
              <Input
                id="site_url"
                placeholder="https://monsite.com"
                value={newConnection.credentials.site_url || ''}
                onChange={(e) =>
                  setNewConnection({
                    ...newConnection,
                    credentials: { ...newConnection.credentials, site_url: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="consumer_key">Consumer Key</Label>
              <Input
                id="consumer_key"
                value={newConnection.credentials.consumer_key || ''}
                onChange={(e) =>
                  setNewConnection({
                    ...newConnection,
                    credentials: { ...newConnection.credentials, consumer_key: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="consumer_secret">Consumer Secret</Label>
              <Input
                id="consumer_secret"
                type="password"
                value={newConnection.credentials.consumer_secret || ''}
                onChange={(e) =>
                  setNewConnection({
                    ...newConnection,
                    credentials: { ...newConnection.credentials, consumer_secret: e.target.value },
                  })
                }
              />
            </div>
          </>
        );
      default:
        return <p className="text-sm text-muted-foreground">Plateforme non encore supportée</p>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Synchronisation Marketplace - DropCraft AI</title>
        <meta
          name="description"
          content="Gérez vos synchronisations avec Shopify, Amazon, eBay et autres marketplaces"
        />
      </Helmet>

      <div className="container mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Synchronisation Marketplace</h1>
            <p className="text-muted-foreground">
              Gérez vos connexions et synchronisez automatiquement vos produits
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Connexion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une marketplace</DialogTitle>
                <DialogDescription>
                  Connectez une nouvelle plateforme de vente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="platform">Plateforme</Label>
                  <Select
                    value={newConnection.platform}
                    onValueChange={(value: any) =>
                      setNewConnection({ ...newConnection, platform: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shopify">Shopify</SelectItem>
                      <SelectItem value="woocommerce">WooCommerce</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="ebay">eBay</SelectItem>
                      <SelectItem value="prestashop">PrestaShop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="storeName">Nom du magasin</Label>
                  <Input
                    id="storeName"
                    placeholder="Mon Shop Principal"
                    value={newConnection.storeName}
                    onChange={(e) =>
                      setNewConnection({ ...newConnection, storeName: e.target.value })
                    }
                  />
                </div>
                {renderCredentialFields(newConnection.platform)}
                <Button
                  onClick={handleCreateConnection}
                  disabled={isCreatingConnection || !newConnection.storeName}
                  className="w-full"
                >
                  {isCreatingConnection ? 'Connexion...' : 'Connecter'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connexions Actives</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats?.total_connections || 0}</div>
              <p className="text-xs text-muted-foreground">Marketplaces connectées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits Mappés</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats?.total_products_mapped || 0}</div>
              <p className="text-xs text-muted-foreground">
                {syncStats?.synced || 0} synchronisés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">À Synchroniser</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats?.out_of_sync || 0}</div>
              <p className="text-xs text-muted-foreground">
                {syncStats?.pending || 0} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Syncs 24h</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats?.syncs_24h || 0}</div>
              <p className="text-xs text-muted-foreground">
                {syncStats?.successful_syncs_24h || 0} réussies
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="connections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="connections">Connexions</TabsTrigger>
            <TabsTrigger value="logs">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4">
            {isLoadingConnections ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Chargement des connexions...</p>
                </CardContent>
              </Card>
            ) : connections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucune connexion</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par connecter une marketplace
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {connections.map((connection) => (
                  <Card key={connection.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {platformIcons[connection.platform]}
                          </span>
                          <div>
                            <CardTitle className="text-lg">{connection.store_name}</CardTitle>
                            <CardDescription className="capitalize">
                              {connection.platform}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={connection.is_active ? 'default' : 'secondary'}>
                          {connection.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {connection.last_sync_at && (
                        <div className="text-sm text-muted-foreground">
                          Dernière sync:{' '}
                          {format(new Date(connection.last_sync_at), 'Pp', { locale: fr })}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncInventory(connection.id)}
                          disabled={isSyncingInventory}
                          className="flex-1"
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          Sync Stock
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteConnection(connection.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Historique de Synchronisation</CardTitle>
                <CardDescription>
                  Logs des 50 dernières synchronisations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {syncLogs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucun historique disponible
                      </div>
                    ) : (
                      syncLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start justify-between border-b pb-4 last:border-0"
                        >
                          <div className="flex items-start gap-3">
                            {log.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : log.status === 'failed' ? (
                              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            ) : log.status === 'partial' ? (
                              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            ) : (
                              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mt-0.5" />
                            )}
                            <div>
                              <div className="font-medium capitalize">
                                {log.sync_type} - {log.direction}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {log.success_items}/{log.total_items} réussi
                                {log.error_items > 0 && `, ${log.error_items} erreurs`}
                              </div>
                              {log.duration_ms && (
                                <div className="text-xs text-muted-foreground">
                                  Durée: {(log.duration_ms / 1000).toFixed(2)}s
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {format(new Date(log.created_at), 'Pp', { locale: fr })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
