import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AutoSyncManager } from '@/components/sync/AutoSyncManager'
import { ConnectMarketplaceDialog } from '@/components/marketplace/ConnectMarketplaceDialog'
import { useMarketplaceConnections } from '@/hooks/useMarketplaceConnections'
import { RefreshCw, CheckCircle, XCircle, Clock, Play, Settings } from 'lucide-react'

export default function SyncManagementPage() {
  const navigate = useNavigate()
  const { connections, syncMarketplace, isSyncing } = useMarketplaceConnections()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <>
      <Helmet>
        <title>Gestion des Synchronisations - DropCraft AI</title>
        <meta 
          name="description" 
          content="Gérez la synchronisation automatique de vos marketplaces"
        />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-primary" />
              Gestion des Synchronisations
            </h1>
            <p className="text-muted-foreground mt-2">
              Configurez la synchronisation automatique de vos données
            </p>
          </div>
          <Button onClick={() => navigate('/integrations/sync-config')}>
            <Settings className="mr-2 h-4 w-4" />
            Configuration Avancée
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {connections.map((connection) => (
            <Card key={connection.id} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(connection.status)}
                  <div>
                    <h3 className="font-semibold capitalize">{connection.platform}</h3>
                    <p className="text-xs text-muted-foreground">
                      {connection.last_sync_at 
                        ? `Dernière sync: ${new Date(connection.last_sync_at).toLocaleString('fr-FR')}`
                        : 'Jamais synchronisé'}
                    </p>
                  </div>
                </div>
                <Badge variant={connection.status === 'connected' ? 'default' : 'destructive'}>
                  {connection.status}
                </Badge>
              </div>

              <Button
                onClick={() => syncMarketplace({ connectionId: connection.id })}
                disabled={isSyncing}
                variant="outline"
                className="w-full"
              >
                <Play className="mr-2 h-4 w-4" />
                Synchroniser maintenant
              </Button>

              <AutoSyncManager
                connectionId={connection.id}
                platform={connection.platform}
                currentSettings={{
                  enabled: false,
                  frequency: 'hourly',
                  syncTypes: ['products', 'orders', 'inventory']
                }}
              />
            </Card>
          ))}
        </div>

        {connections.length === 0 && (
          <Card className="p-12 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune connexion</h3>
            <p className="text-muted-foreground mb-4">
              Connectez des marketplaces pour gérer leur synchronisation
            </p>
            <ConnectMarketplaceDialog />
          </Card>
        )}
      </div>
    </>
  )
}
