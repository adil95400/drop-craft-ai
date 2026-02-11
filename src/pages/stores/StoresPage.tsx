/**
 * StoresPage - Boutiques connectées
 */
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { StatCard } from '@/components/shared'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useIntegrationsUnified } from '@/hooks/unified'
import { useApiStores } from '@/hooks/api/useApiStores'
import { StoreConnectionStatus } from '@/components/stores/StoreConnectionStatus'
import { ActiveJobsBanner } from '@/components/jobs/ActiveJobsBanner'
import { Store, Plus, RefreshCw, Unplug, ExternalLink, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StoresPage() {
  const { integrations, isLoading: loading, refetch } = useIntegrationsUnified()
  const { syncStores, deleteStores, isSyncing, isDeleting } = useApiStores()

  const handleSync = (integrationId: string) => { syncStores.mutate([integrationId]) }
  const [disconnectId, setDisconnectId] = useState<string | null>(null)
  const handleDisconnect = (integrationId: string) => {
    setDisconnectId(integrationId)
  }
  const confirmDisconnect = () => {
    if (disconnectId) {
      deleteStores.mutate([disconnectId])
      setDisconnectId(null)
    }
  }

  const stats = {
    stores: integrations.length,
    connected: integrations.filter(i => i.connection_status === 'connected').length,
    errors: integrations.filter(i => i.connection_status === 'error').length
  }

  if (loading) {
    return (
      <ChannablePageWrapper title="Boutiques connectées" description="Chargement…" heroImage="integrations" badge={{ label: 'Boutiques', icon: Store }}>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="w-32 h-6 bg-muted rounded" /></CardHeader>
              <CardContent><div className="w-full h-4 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </ChannablePageWrapper>
    )
  }

  return (
    <ChannablePageWrapper
      title="Boutiques connectées"
      description={`${stats.stores} boutique(s) — ${stats.connected} active(s)`}
      heroImage="integrations"
      badge={{ label: 'Boutiques', icon: Store }}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Actualiser
          </Button>
          <Button size="sm" asChild>
            <Link to="/stores/connect"><Plus className="w-4 h-4 mr-2" />Connecter</Link>
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Boutiques totales" value={stats.stores} icon={Store} color="primary" />
        <StatCard label="Connectées" value={stats.connected} icon={CheckCircle} color="success" />
        <StatCard label="Erreurs" value={stats.errors} icon={AlertTriangle} color="destructive" />
      </div>

      <ActiveJobsBanner />

      {integrations.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Aucune boutique connectée</CardTitle>
            <CardDescription>Connectez votre première boutique pour commencer</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link to="/stores/connect"><Plus className="w-4 h-4 mr-2" />Connecter une boutique</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{(integration as any).config?.name || integration.platform_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{integration.platform_name}</p>
                    </div>
                  </div>
                  <StoreConnectionStatus status={integration.connection_status as any} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {integration.store_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{integration.store_url}</span>
                    </div>
                  )}
                  {integration.last_sync_at && (
                    <div className="text-sm text-muted-foreground">
                      Dernière sync: {new Date(integration.last_sync_at).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleSync(integration.id)} disabled={isSyncing} className="flex-1">
                      {isSyncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}Sync
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDisconnect(integration.id)} disabled={isDeleting} className="text-destructive hover:text-destructive">
                      <Unplug className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!disconnectId}
        onOpenChange={(open) => { if (!open) setDisconnectId(null) }}
        title="Déconnecter cette boutique ?"
        description="Êtes-vous sûr de vouloir déconnecter cette boutique ?"
        confirmText="Déconnecter"
        variant="destructive"
        onConfirm={confirmDisconnect}
      />
    </ChannablePageWrapper>
  )
}
