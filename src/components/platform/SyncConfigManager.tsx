import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { usePlatformManagement } from '@/hooks/usePlatformManagement'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

export function SyncConfigManager() {
  const { syncConfigs, syncLogs, loading, platforms, updateSyncConfig, runSync } = usePlatformManagement()
  const [syncing, setSyncing] = useState<string | null>(null)

  const syncTypes = [
    { value: 'inventory', label: 'Stock uniquement' },
    { value: 'prices', label: 'Prix uniquement' },
    { value: 'orders', label: 'Commandes uniquement' },
    { value: 'all', label: 'Tout synchroniser' }
  ]
  const frequencies = [
    { value: 'realtime', label: 'Temps réel' },
    { value: '5min', label: 'Toutes les 5 min' },
    { value: '15min', label: 'Toutes les 15 min' },
    { value: '30min', label: 'Toutes les 30 min' },
    { value: '1hour', label: 'Toutes les heures' },
    { value: '6hour', label: 'Toutes les 6 heures' },
    { value: '24hour', label: 'Une fois par jour' }
  ]

  const handleSync = async (platform: string) => {
    setSyncing(platform)
    await runSync(platform)
    setSyncing(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Synchronisation Automatique</h2>
        <p className="text-muted-foreground">
          Configurez la synchronisation automatique avec vos marketplaces
        </p>
      </div>

      <div className="grid gap-4">
        {platforms.map(platform => {
          const config = syncConfigs.find(c => c.platform === platform)
          
          return (
            <Card key={platform}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">{platform}</CardTitle>
                    <CardDescription>
                      {config?.last_sync_at
                        ? `Dernière sync: ${format(new Date(config.last_sync_at), 'Pp', { locale: getDateFnsLocale() })}`
                        : 'Jamais synchronisé'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config?.is_active || false}
                        onCheckedChange={(checked) => updateSyncConfig(platform, { is_active: checked })}
                      />
                      <Label>Actif</Label>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSync(platform)}
                      disabled={syncing === platform}
                    >
                      {syncing === platform ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Synchroniser
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Type de synchronisation</Label>
                    <Select
                      value={config?.sync_type || 'all'}
                      onValueChange={(value) => updateSyncConfig(platform, { sync_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {syncTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fréquence</Label>
                    <Select
                      value={config?.sync_frequency || '1hour'}
                      onValueChange={(value) => updateSyncConfig(platform, { sync_frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map(freq => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des synchronisations</CardTitle>
          <CardDescription>Les 20 dernières synchronisations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="font-medium capitalize">{log.platform} - {log.sync_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.started_at), 'Pp', { locale: getDateFnsLocale() })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {log.items_synced} synchronisés
                  </p>
                  {log.items_failed > 0 && (
                    <p className="text-sm text-red-500">
                      {log.items_failed} échecs
                    </p>
                  )}
                  {log.duration_ms && (
                    <p className="text-xs text-muted-foreground">
                      {(log.duration_ms / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
              </div>
            ))}

            {!syncLogs.length && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun historique de synchronisation
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
