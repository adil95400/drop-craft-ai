import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle, Clock, RefreshCw, Trash2, TestTube } from 'lucide-react'
import { useIntegrationsUnified } from '@/hooks/unified'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function RealIntegrationsManager() {
  const {
    integrations,
    connectedIntegrations,
    connectShopify,
    connectAliExpress,
    connectBigBuy,
    syncProducts,
    syncOrders,
    testConnection,
    deleteIntegration,
    isConnectingShopify,
    isConnectingAliExpress,
    isConnectingBigBuy,
    isSyncingProducts,
    isSyncingOrders,
    isTesting,
    isDeleting
  } = useIntegrationsUnified()

  const [shopifyData, setShopifyData] = useState({ shopDomain: '', accessToken: '' })
  const [aliexpressData, setAliexpressData] = useState({ apiKey: '', apiSecret: '' })
  const [bigbuyData, setBigbuyData] = useState({ apiKey: '' })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Connecté</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erreur</Badge>
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Déconnecté</Badge>
    }
  }

  const handleShopifyConnect = () => {
    connectShopify({
      shop_domain: shopifyData.shopDomain,
      access_token: shopifyData.accessToken
    })
  }

  const handleAliExpressConnect = () => {
    connectAliExpress({
      apiKey: aliexpressData.apiKey,
      apiSecret: aliexpressData.apiSecret
    })
  }

  const handleBigBuyConnect = () => {
    connectBigBuy({
      apiKey: bigbuyData.apiKey
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Intégrations Réelles</h2>
        <p className="text-muted-foreground">
          Connectez vos vraies boutiques et fournisseurs pour synchroniser automatiquement vos données
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Intégrations Actives</p>
                <p className="text-2xl font-bold">{connectedIntegrations.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dernière Sync</p>
                <p className="text-sm text-muted-foreground">
                  {connectedIntegrations[0]?.last_sync_at 
                    ? new Date(connectedIntegrations[0].last_sync_at).toLocaleDateString()
                    : 'Jamais'
                  }
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Statut Global</p>
                <p className="text-sm text-green-600 font-medium">
                  {connectedIntegrations.length > 0 ? 'Opérationnel' : 'En attente'}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="connect" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connect">Connecter</TabsTrigger>
          <TabsTrigger value="manage">Gérer</TabsTrigger>
          <TabsTrigger value="sync">Synchroniser</TabsTrigger>
        </TabsList>

        <TabsContent value="connect" className="space-y-4">
          <div className="grid gap-6">
            {/* Shopify */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="/lovable-uploads/d3b4944e-d4d8-48dc-9869-b28719260acf.png" alt="Shopify" className="w-6 h-6" />
                  Shopify
                </CardTitle>
                <CardDescription>
                  Synchronisez vos produits, commandes et stocks depuis votre boutique Shopify
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shopDomain">Domaine de la boutique</Label>
                  <Input
                    id="shopDomain"
                    placeholder="ma-boutique.myshopify.com"
                    value={shopifyData.shopDomain}
                    onChange={(e) => setShopifyData({...shopifyData, shopDomain: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="accessToken">Token d'accès</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="••••••••••••••••"
                    value={shopifyData.accessToken}
                    onChange={(e) => setShopifyData({...shopifyData, accessToken: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleShopifyConnect}
                  disabled={isConnectingShopify || !shopifyData.shopDomain || !shopifyData.accessToken}
                  className="w-full"
                >
                  {isConnectingShopify ? 'Connexion...' : 'Connecter Shopify'}
                </Button>
              </CardFooter>
            </Card>

            {/* AliExpress */}
            <Card>
              <CardHeader>
                <CardTitle>AliExpress</CardTitle>
                <CardDescription>
                  Importez automatiquement des produits depuis AliExpress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="aliApiKey">Clé API</Label>
                  <Input
                    id="aliApiKey"
                    type="password"
                    placeholder="Votre clé API AliExpress"
                    value={aliexpressData.apiKey}
                    onChange={(e) => setAliexpressData({...aliexpressData, apiKey: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="aliApiSecret">Clé secrète</Label>
                  <Input
                    id="aliApiSecret"
                    type="password"
                    placeholder="Votre clé secrète AliExpress"
                    value={aliexpressData.apiSecret}
                    onChange={(e) => setAliexpressData({...aliexpressData, apiSecret: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAliExpressConnect}
                  disabled={isConnectingAliExpress || !aliexpressData.apiKey || !aliexpressData.apiSecret}
                  className="w-full"
                >
                  {isConnectingAliExpress ? 'Connexion...' : 'Connecter AliExpress'}
                </Button>
              </CardFooter>
            </Card>

            {/* BigBuy */}
            <Card>
              <CardHeader>
                <CardTitle>BigBuy</CardTitle>
                <CardDescription>
                  Connectez-vous au fournisseur européen BigBuy pour le dropshipping
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bigbuyApiKey">Clé API BigBuy</Label>
                  <Input
                    id="bigbuyApiKey"
                    type="password"
                    placeholder="Votre clé API BigBuy"
                    value={bigbuyData.apiKey}
                    onChange={(e) => setBigbuyData({...bigbuyData, apiKey: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleBigBuyConnect}
                  disabled={isConnectingBigBuy || !bigbuyData.apiKey}
                  className="w-full"
                >
                  {isConnectingBigBuy ? 'Connexion...' : 'Connecter BigBuy'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          {integrations.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucune intégration configurée. Commencez par connecter vos plateformes dans l'onglet "Connecter".
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="capitalize">{integration.platform_name}</CardTitle>
                        <CardDescription>
                          Dernière synchronisation: {integration.last_sync_at 
                            ? new Date(integration.last_sync_at).toLocaleString()
                            : 'Jamais'
                          }
                        </CardDescription>
                      </div>
                      {getStatusBadge(integration.connection_status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection(integration.id)}
                        disabled={isTesting}
                      >
                        <TestTube className="w-4 h-4 mr-1" />
                        Tester
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteIntegration(integration.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          {connectedIntegrations.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucune intégration connectée. Connectez d'abord vos plateformes pour pouvoir synchroniser.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {connectedIntegrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <CardTitle className="capitalize">{integration.platform_name}</CardTitle>
                    <CardDescription>
                      Synchronisez vos données avec cette plateforme
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => syncProducts(integration.id)}
                        disabled={isSyncingProducts}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        {isSyncingProducts ? 'Sync Produits...' : 'Sync Produits'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => syncOrders(integration.id)}
                        disabled={isSyncingOrders}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        {isSyncingOrders ? 'Sync Commandes...' : 'Sync Commandes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}