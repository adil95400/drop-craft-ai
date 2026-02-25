import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, ShoppingBag, TrendingUp, RefreshCw, Globe, BarChart3, Plug, Unplug } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useMarketplaceIntegrations } from '@/hooks/useMarketplaceIntegrations';
import { MarketplaceConnectDialog } from '@/domains/marketplace/components/MarketplaceConnectDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const AVAILABLE_PLATFORMS = [
  { key: 'amazon', name: 'Amazon', type: 'marketplace' },
  { key: 'ebay', name: 'eBay', type: 'marketplace' },
  { key: 'etsy', name: 'Etsy', type: 'marketplace' },
  { key: 'tiktok', name: 'TikTok Shop', type: 'social' },
  { key: 'shopify', name: 'Shopify', type: 'e-commerce' },
  { key: 'woocommerce', name: 'WooCommerce', type: 'e-commerce' },
  { key: 'cdiscount', name: 'Cdiscount', type: 'marketplace' },
  { key: 'allegro', name: 'Allegro', type: 'marketplace' },
  { key: 'manomano', name: 'ManoMano', type: 'marketplace' },
];

const MultiChannelManagementPage: React.FC = () => {
  const { integrations, connected, isLoading, connectPlatform, disconnectPlatform, syncPlatform, isConnecting } = useMarketplaceIntegrations();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const connectedPlatformKeys = new Set(connected.map(i => i.platform));
  const availableToConnect = AVAILABLE_PLATFORMS.filter(p => !connectedPlatformKeys.has(p.key));

  const handleOpenConnect = (platform: string) => {
    setSelectedPlatform(platform);
    setConnectDialogOpen(true);
  };

  const handleConnect = async (credentials: Record<string, string>) => {
    await connectPlatform({ platform: selectedPlatform, credentials });
  };

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Gestion Multi-Canal" description="Chargement..." heroImage="integrations" badge={{ label: 'Multi-Canal', icon: Globe }}>
        <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
      </ChannablePageWrapper>
    );
  }

  return (
    <ChannablePageWrapper
      title="Gestion Multi-Canal"
      description="Gérez tous vos canaux de vente depuis un seul endroit"
      heroImage="integrations"
      badge={{ label: 'Multi-Canal', icon: Globe }}
      actions={
        <Button size="sm" onClick={() => handleOpenConnect(availableToConnect[0]?.key || 'amazon')}>
          <Plug className="mr-2 h-4 w-4" />
          Connecter un canal
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canaux connectés</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connected.length}</div>
            <p className="text-xs text-muted-foreground">{integrations.length} total configurés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketplaces</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connected.filter(c => ['amazon','ebay','etsy','cdiscount','allegro','manomano'].includes(c.platform)).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-commerce</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connected.filter(c => ['shopify','woocommerce'].includes(c.platform)).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Commerce</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connected.filter(c => c.platform === 'tiktok').length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Canaux connectés</TabsTrigger>
          <TabsTrigger value="available">Ajouter un canal</TabsTrigger>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
        </TabsList>

        {/* Connected channels */}
        <TabsContent value="channels" className="space-y-4">
          {connected.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun canal connecté</h3>
                <p className="text-muted-foreground mb-4">Connectez votre première marketplace pour commencer à vendre</p>
                <Button onClick={() => handleOpenConnect('amazon')}>
                  <Plug className="mr-2 h-4 w-4" />
                  Connecter Amazon
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {connected.map(integration => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.platform_name || integration.platform}</CardTitle>
                          <CardDescription>
                            {integration.store_url || integration.store_id || 'Connecté'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge>Connecté</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {integration.last_sync_at ? (
                        <>Dernière sync : {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true, locale: fr })}</>
                      ) : (
                        'Jamais synchronisé'
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" variant="outline" size="sm" onClick={() => syncPlatform(integration.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Synchroniser
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => disconnectPlatform(integration.id)}>
                        <Unplug className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available platforms */}
        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Plateformes disponibles</CardTitle>
              <CardDescription>Étendez votre présence en ligne</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {AVAILABLE_PLATFORMS.map(platform => {
                  const isConnected = connectedPlatformKeys.has(platform.key);
                  return (
                    <Card key={platform.key} className={`cursor-pointer transition-shadow ${isConnected ? 'opacity-60' : 'hover:shadow-lg'}`}>
                      <CardContent className="p-4 text-center">
                        <div className="h-14 bg-muted rounded-lg mb-3 flex items-center justify-center">
                          <Store className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h4 className="font-semibold mb-1">{platform.name}</h4>
                        <Badge variant="outline" className="mb-3 text-xs">{platform.type}</Badge>
                        <Button
                          size="sm"
                          variant={isConnected ? 'secondary' : 'outline'}
                          className="w-full"
                          disabled={isConnected || isConnecting}
                          onClick={() => handleOpenConnect(platform.key)}
                        >
                          {isConnected ? 'Déjà connecté' : 'Connecter'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync settings */}
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Synchronisation automatique</CardTitle>
              <CardDescription>Statut de synchronisation de vos canaux connectés</CardDescription>
            </CardHeader>
            <CardContent>
              {connected.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Connectez un canal pour configurer la synchronisation</p>
              ) : (
                <div className="space-y-4">
                  {connected.map(integration => (
                    <div key={integration.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{integration.platform_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Fréquence : {integration.sync_frequency || '15 min'} • Auto-sync : {integration.auto_sync_enabled ? 'Actif' : 'Inactif'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.auto_sync_enabled ? 'default' : 'secondary'}>
                          {integration.auto_sync_enabled ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => syncPlatform(integration.id)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MarketplaceConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        platform={selectedPlatform}
        onConnect={handleConnect}
      />
    </ChannablePageWrapper>
  );
};

export default MultiChannelManagementPage;
