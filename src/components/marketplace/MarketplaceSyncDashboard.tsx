import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useMarketplaceSync, MarketplaceConnection, SyncLog } from '@/hooks/useMarketplaceSync';
import { 
  Plus, RefreshCw, Settings, Link2, Unlink, Check, X, 
  AlertTriangle, Clock, Store, ShoppingBag, Package,
  ArrowRightLeft, Zap, Play, Pause
} from 'lucide-react';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

const MARKETPLACES = [
  { id: 'shopify', name: 'Shopify', icon: '🛒', color: 'bg-green-500' },
  { id: 'amazon', name: 'Amazon', icon: '📦', color: 'bg-orange-500' },
  { id: 'ebay', name: 'eBay', icon: '🏷️', color: 'bg-blue-500' },
  { id: 'woocommerce', name: 'WooCommerce', icon: '🔮', color: 'bg-purple-500' },
  { id: 'etsy', name: 'Etsy', icon: '🎨', color: 'bg-orange-400' },
  { id: 'aliexpress', name: 'AliExpress', icon: '🌏', color: 'bg-red-500' }
];

export function MarketplaceSyncDashboard() {
  const locale = useDateFnsLocale();
  const {
    connections,
    syncStats,
    isLoadingConnections,
    createConnection,
    isCreatingConnection,
    updateConnection,
    deleteConnection,
    syncProducts,
    isSyncingProducts,
    syncInventory,
    isSyncingInventory
  } = useMarketplaceSync();

  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [storeName, setStoreName] = useState('');
  const [credentials, setCredentials] = useState({ apiKey: '', apiSecret: '', shopDomain: '' });

  const handleConnect = () => {
    createConnection({
      platform: selectedPlatform,
      storeName,
      credentials
    });
    setIsConnectOpen(false);
    setSelectedPlatform('');
    setStoreName('');
    setCredentials({ apiKey: '', apiSecret: '', shopDomain: '' });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Connecté</Badge>;
      case 'error':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Erreur</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Sync</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
    }
  };

  const getMarketplaceInfo = (platformId: string) => {
    return MARKETPLACES.find(m => m.id === platformId) || { 
      id: platformId, 
      name: platformId, 
      icon: '🔗', 
      color: 'bg-gray-500' 
    };
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marketplaces connectées</p>
                <p className="text-2xl font-bold">{syncStats?.activeConnections || 0}</p>
              </div>
              <Store className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits mappés</p>
                <p className="text-2xl font-bold">245</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Syncs aujourd'hui</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dernière sync</p>
                <p className="text-sm font-medium">
                  {syncStats?.lastSync 
                    ? format(new Date(syncStats.lastSync), 'HH:mm', { locale })
                    : 'Jamais'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Connexions Marketplace</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => connections.forEach(c => syncInventory(c.id))}
            disabled={isSyncingInventory || connections.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingInventory ? 'animate-spin' : ''}`} />
            Sync global
          </Button>
          <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Connecter une marketplace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connecter une Marketplace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Plateforme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {MARKETPLACES.map(mp => (
                      <Button
                        key={mp.id}
                        variant={selectedPlatform === mp.id ? 'default' : 'outline'}
                        className="h-20 flex flex-col gap-1"
                        onClick={() => setSelectedPlatform(mp.id)}
                      >
                        <span className="text-2xl">{mp.icon}</span>
                        <span className="text-xs">{mp.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedPlatform && (
                  <>
                    <div className="space-y-2">
                      <Label>Nom de la boutique</Label>
                      <Input
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Ma Boutique"
                      />
                    </div>

                    {selectedPlatform === 'shopify' && (
                      <div className="space-y-2">
                        <Label>Domaine Shopify</Label>
                        <Input
                          value={credentials.shopDomain}
                          onChange={(e) => setCredentials({ ...credentials, shopDomain: e.target.value })}
                          placeholder="ma-boutique.myshopify.com"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Clé API</Label>
                        <Input
                          type="password"
                          value={credentials.apiKey}
                          onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secret API</Label>
                        <Input
                          type="password"
                          value={credentials.apiSecret}
                          onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConnectOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleConnect} 
                  disabled={isCreatingConnection || !selectedPlatform || !storeName}
                >
                  {isCreatingConnection ? 'Connexion...' : 'Connecter'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Connections List */}
      {isLoadingConnections ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      ) : connections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune marketplace connectée</h3>
            <p className="text-muted-foreground mb-4">
              Connectez vos boutiques pour synchroniser automatiquement vos produits
            </p>
            <Button onClick={() => setIsConnectOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connecter une marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map(connection => {
            const mp = getMarketplaceInfo(connection.platform);
            return (
              <Card key={connection.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg ${mp.color} flex items-center justify-center text-2xl text-white`}>
                        {mp.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{connection.store_name || connection.platform_name}</h3>
                          {getStatusBadge(connection.connection_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{mp.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Dernière sync</p>
                        <p className="text-sm font-medium">
                          {connection.last_sync_at 
                            ? format(new Date(connection.last_sync_at), 'dd/MM/yyyy HH:mm', { locale })
                            : 'Jamais'
                          }
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => syncProducts({ connectionId: connection.id, productIds: [] })}
                          disabled={isSyncingProducts}
                        >
                          <RefreshCw className={`h-4 w-4 ${isSyncingProducts ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateConnection({ 
                            connectionId: connection.id, 
                            updates: { is_active: !connection.is_active } 
                          })}
                        >
                          {connection.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteConnection(connection.id)}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sync Activity */}
      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activité de synchronisation</CardTitle>
            <CardDescription>Historique récent des synchronisations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Placeholder sync logs */}
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>🛒</span>
                      <span>Shopify</span>
                    </div>
                  </TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500">Succès</Badge>
                  </TableCell>
                  <TableCell>45 produits</TableCell>
                  <TableCell>{format(new Date(), 'dd/MM HH:mm', { locale })}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>📦</span>
                      <span>Amazon</span>
                    </div>
                  </TableCell>
                  <TableCell>Prix</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500">Succès</Badge>
                  </TableCell>
                  <TableCell>120 produits</TableCell>
                  <TableCell>{format(new Date(Date.now() - 3600000), 'dd/MM HH:mm', { locale })}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
