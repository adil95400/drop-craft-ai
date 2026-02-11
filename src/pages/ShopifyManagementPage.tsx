import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIntegrationsUnified } from '@/hooks/unified'
import { useShopifySync } from '@/hooks/useShopifySync'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

const ShopifyManagementPage = () => {
  const navigate = useNavigate()
  const { integrations, syncProducts, isSyncingProducts, testConnection, isTesting } = useIntegrationsUnified()
  const { configs, logs, isSyncing, triggerSync } = useShopifySync()
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)

  const shopifyIntegration = integrations.find(i => i.platform_type === 'shopify')
  const isConnected = shopifyIntegration?.connection_status === 'connected'
  const lastSync = shopifyIntegration?.last_sync_at

  const handleSync = async () => {
    if (!shopifyIntegration) return
    
    setSelectedIntegration(shopifyIntegration.id)
    syncProducts(shopifyIntegration.id)
  }

  const handleTestConnection = async () => {
    if (!shopifyIntegration) return
    testConnection(shopifyIntegration.id)
  }

  const getStatusBadge = () => {
    if (!shopifyIntegration) {
      return (
        <Badge variant="outline" className="gap-2">
          <AlertCircle className="h-3 w-3" />
          Non configuré
        </Badge>
      )
    }

    switch (shopifyIntegration.connection_status) {
      case 'connected':
        return (
          <Badge className="gap-2 bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3" />
            Connecté
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-2">
            <AlertCircle className="h-3 w-3" />
            Erreur
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="gap-2">
            <Clock className="h-3 w-3" />
            Déconnecté
          </Badge>
        )
    }
  }

  const recentLogs = logs?.slice(0, 5) || []

  return (
    <ChannablePageWrapper
      title="Gestion Shopify"
      description="Gérez votre connexion et synchronisation Shopify"
      heroImage="integrations"
      badge={{ label: 'Shopify', icon: ShoppingBag }}
    >

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Statut de la connexion</CardTitle>
              <CardDescription>
                État actuel de votre intégration Shopify
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!shopifyIntegration && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucune boutique Shopify n'est configurée. Veuillez d'abord connecter votre boutique dans la section Intégrations.
              </AlertDescription>
            </Alert>
          )}

          {shopifyIntegration && shopifyIntegration.connection_status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                La connexion à votre boutique Shopify a échoué. Cela peut indiquer que l'application n'est plus installée ou que les autorisations ont été révoquées.
              </AlertDescription>
            </Alert>
          )}

          {shopifyIntegration && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Boutique</p>
                  <p className="text-sm text-muted-foreground">
                    {shopifyIntegration.shop_domain || 'Non défini'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? 'Test en cours...' : 'Tester la connexion'}
                </Button>
              </div>

              {lastSync && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Dernière synchronisation</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lastSync).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Actions */}
      {shopifyIntegration && isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Actions de synchronisation</CardTitle>
            <CardDescription>
              Synchronisez manuellement vos produits depuis Shopify
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSync}
              disabled={isSyncingProducts || isSyncing}
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${(isSyncingProducts || isSyncing) ? 'animate-spin' : ''}`} />
              {isSyncingProducts || isSyncing ? 'Synchronisation en cours...' : 'Synchroniser les produits'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reconnection Guide */}
      {shopifyIntegration && !isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Reconnecter votre boutique</CardTitle>
            <CardDescription>
              Suivez ces étapes pour reconnecter votre boutique Shopify
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Votre boutique Shopify semble déconnectée. Pour la reconnecter :
              </AlertDescription>
            </Alert>

            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>Accédez à votre <strong>admin Shopify</strong></li>
              <li>Allez dans <strong>Paramètres → Applications et canaux de vente</strong></li>
              <li>Vérifiez que l'application est bien installée et activée</li>
              <li>Si l'application n'est pas visible, réinstallez-la</li>
              <li>Revenez ici et cliquez sur "Tester la connexion"</li>
            </ol>

            <Separator />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open('https://admin.shopify.com', '_blank')}
              >
                Ouvrir Shopify Admin
              </Button>
              <Button
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? 'Test en cours...' : 'Retester la connexion'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sync Logs */}
      {recentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique de synchronisation</CardTitle>
            <CardDescription>
              Les 5 dernières synchronisations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {log.sync_type === 'import' ? 'Import' : 'Export'}
                      </span>
                      <Badge
                        variant={
                          log.status === 'completed' ? 'default' :
                          log.status === 'failed' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.started_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  {log.products_synced !== null && (
                    <div className="text-right">
                      <p className="text-sm font-medium">{log.products_synced} produits</p>
                      <p className="text-xs text-muted-foreground">
                        {log.duration_ms ? `${Math.round(log.duration_ms / 1000)}s` : '-'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </ChannablePageWrapper>
  )
}

export default ShopifyManagementPage
