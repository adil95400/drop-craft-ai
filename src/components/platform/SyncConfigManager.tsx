import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function SyncConfigManager() {
  const [configs, setConfigs] = useState<any[]>([])
  const [syncLogs, setSyncLogs] = useState<any[]>([])
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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('platform_sync_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('platform')

      if (error) throw error
      setConfigs(data || [])
    } catch (error: any) {
      console.error('Error fetching configs:', error)
    }
  }

  const fetchLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('platform_sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setSyncLogs(data || [])
    } catch (error: any) {
      console.error('Error fetching logs:', error)
    }
  }

  const createOrUpdateConfig = async (platform: string, updates: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const existingConfig = configs.find(c => c.platform === platform)

      if (existingConfig) {
        const { error } = await supabase
          .from('platform_sync_configs')
          .update(updates)
          .eq('id', existingConfig.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('platform_sync_configs')
          .insert({
            user_id: user.id,
            platform,
            ...updates
          })

        if (error) throw error
      }

      await fetchConfigs()

      toast({
        title: 'Succès',
        description: 'Configuration mise à jour'
      })
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const toggleSync = async (platform: string, enabled: boolean) => {
    await createOrUpdateConfig(platform, { is_active: enabled })
  }

  const updateSyncType = async (platform: string, syncType: string) => {
    await createOrUpdateConfig(platform, { sync_type: syncType })
  }

  const updateFrequency = async (platform: string, frequency: string) => {
    await createOrUpdateConfig(platform, { sync_frequency: frequency })
  }

  const runManualSync = async (platform: string) => {
    setSyncing(platform)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const config = configs.find(c => c.platform === platform) || {
        sync_type: 'all'
      }

      toast({
        title: 'Synchronisation en cours...',
        description: `Synchronisation de ${platform}`
      })

      const { data, error } = await supabase.functions.invoke('platform-sync', {
        body: {
          userId: user.id,
          platform,
          syncType: config.sync_type
        }
      })

      if (error) throw error

      await fetchLogs()
      await fetchConfigs()

      toast({
        title: 'Succès',
        description: `${data.itemsSynced} éléments synchronisés`
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
