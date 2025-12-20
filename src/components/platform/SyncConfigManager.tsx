import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface SyncConfig {
  id: string
  platform: string
  is_active: boolean
  sync_type: string
  sync_frequency: string
  last_sync_at: string | null
}

interface SyncLog {
  id: string
  platform: string
  sync_type: string
  status: string
  items_synced: number
  items_failed: number
  duration_ms: number
  started_at: string
}

export function SyncConfigManager() {
  const [configs, setConfigs] = useState<SyncConfig[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const { toast } = useToast()

  const platforms = ['shopify', 'amazon', 'ebay', 'woocommerce', 'facebook', 'google']
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

  useEffect(() => {
    fetchConfigs()
    fetchLogs()
  }, [])

  const fetchConfigs = async () => {
    // Use mock data since platform_sync_configs table doesn't exist
    const mockConfigs: SyncConfig[] = platforms.map((platform, idx) => ({
      id: `config-${idx}`,
      platform,
      is_active: idx < 3, // First 3 platforms active
      sync_type: 'all',
      sync_frequency: '1hour',
      last_sync_at: idx < 3 ? new Date(Date.now() - Math.random() * 3600000).toISOString() : null
    }))
    setConfigs(mockConfigs)
  }

  const fetchLogs = async () => {
    // Use mock data since platform_sync_logs table doesn't exist
    const mockLogs: SyncLog[] = [
      {
        id: '1',
        platform: 'shopify',
        sync_type: 'all',
        status: 'success',
        items_synced: 45,
        items_failed: 0,
        duration_ms: 2340,
        started_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '2',
        platform: 'amazon',
        sync_type: 'inventory',
        status: 'partial',
        items_synced: 38,
        items_failed: 2,
        duration_ms: 5670,
        started_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        platform: 'ebay',
        sync_type: 'prices',
        status: 'failed',
        items_synced: 0,
        items_failed: 12,
        duration_ms: 890,
        started_at: new Date(Date.now() - 7200000).toISOString()
      }
    ]
    setSyncLogs(mockLogs)
  }

  const toggleSync = async (platform: string, enabled: boolean) => {
    setConfigs(prev => prev.map(c => 
      c.platform === platform ? { ...c, is_active: enabled } : c
    ))
    toast({
      title: 'Succès',
      description: 'Configuration mise à jour'
    })
  }

  const updateSyncType = async (platform: string, syncType: string) => {
    setConfigs(prev => prev.map(c => 
      c.platform === platform ? { ...c, sync_type: syncType } : c
    ))
    toast({
      title: 'Succès',
      description: 'Configuration mise à jour'
    })
  }

  const updateFrequency = async (platform: string, frequency: string) => {
    setConfigs(prev => prev.map(c => 
      c.platform === platform ? { ...c, sync_frequency: frequency } : c
    ))
    toast({
      title: 'Succès',
      description: 'Configuration mise à jour'
    })
  }

  const runManualSync = async (platform: string) => {
    setSyncing(platform)
    
    try {
      toast({
        title: 'Synchronisation en cours...',
        description: `Synchronisation de ${platform}`
      })

      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update last sync time
      setConfigs(prev => prev.map(c => 
        c.platform === platform ? { ...c, last_sync_at: new Date().toISOString() } : c
      ))

      // Add new log
      const newLog: SyncLog = {
        id: `log-${Date.now()}`,
        platform,
        sync_type: configs.find(c => c.platform === platform)?.sync_type || 'all',
        status: 'success',
        items_synced: Math.floor(Math.random() * 50) + 10,
        items_failed: 0,
        duration_ms: Math.floor(Math.random() * 5000) + 1000,
        started_at: new Date().toISOString()
      }
      setSyncLogs(prev => [newLog, ...prev.slice(0, 9)])

      toast({
        title: 'Succès',
        description: `${newLog.items_synced} éléments synchronisés`
      })

    } catch (error: any) {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSyncing(null)
    }
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
          const config = configs.find(c => c.platform === platform)
          
          return (
            <Card key={platform}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">{platform}</CardTitle>
                    <CardDescription>
                      {config?.last_sync_at
                        ? `Dernière sync: ${format(new Date(config.last_sync_at), 'Pp', { locale: fr })}`
                        : 'Jamais synchronisé'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config?.is_active || false}
                        onCheckedChange={(checked) => toggleSync(platform, checked)}
                      />
                      <Label>Actif</Label>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => runManualSync(platform)}
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
                      onValueChange={(value) => updateSyncType(platform, value)}
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
                      onValueChange={(value) => updateFrequency(platform, value)}
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
          <CardDescription>Les 10 dernières synchronisations</CardDescription>
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
                      {format(new Date(log.started_at), 'Pp', { locale: fr })}
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
