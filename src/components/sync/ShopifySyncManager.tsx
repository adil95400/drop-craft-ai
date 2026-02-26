import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useShopifySync } from '@/hooks/useShopifySync'
import { supabase } from '@/integrations/supabase/client'
import { RefreshCw, Download, Upload, ArrowLeftRight, Clock, CheckCircle, XCircle, Play, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

export const ShopifySyncManager = () => {
  const { 
    configs, 
    logs, 
    configsLoading, 
    createConfig, 
    updateConfig, 
    deleteConfig,
    triggerSync, 
    isSyncing 
  } = useShopifySync()

  const [newConfigDirection, setNewConfigDirection] = useState<'import' | 'export' | 'both'>('import')
  const [newConfigFrequency, setNewConfigFrequency] = useState<'manual' | 'hourly' | 'daily' | 'weekly'>('daily')

  const handleCreateConfig = async () => {
    // Get first Shopify integration
    const { data: integrations } = await supabase
      .from('integrations')
      .select('id')
      .eq('platform_name', 'Shopify')
      .limit(1)

    const integrationId = integrations?.[0]?.id

    createConfig({
      sync_direction: newConfigDirection,
      sync_frequency: newConfigFrequency,
      auto_sync_enabled: false
    })
  }

  const handleToggleAutoSync = (configId: string, enabled: boolean) => {
    updateConfig({ id: configId, updates: { auto_sync_enabled: enabled } })
  }

  const handleTriggerSync = (configId: string, direction: 'import' | 'export' | 'both') => {
    const syncProducts = direction === 'import' || direction === 'both'
    const syncOrders = direction === 'import' || direction === 'both'
    
    triggerSync({ 
      configId, 
      syncProducts, 
      syncOrders,
      syncCustomers: false 
    })
  }

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'import': return <Download className="h-4 w-4" />
      case 'export': return <Upload className="h-4 w-4" />
      case 'both':
      case 'bidirectional': return <ArrowLeftRight className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'syncing':
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'idle': 'secondary',
      'syncing': 'default',
      'running': 'default',
      'success': 'default',
      'error': 'destructive'
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Create New Config */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Nouvelle Configuration
        </h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select value={newConfigDirection} onValueChange={(v: any) => setNewConfigDirection(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="import">Import (Shopify → Catalogue)</SelectItem>
                <SelectItem value="export">Export (Catalogue → Shopify)</SelectItem>
                <SelectItem value="both">Bidirectionnel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fréquence</Label>
            <Select value={newConfigFrequency} onValueChange={(v: any) => setNewConfigFrequency(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manuel</SelectItem>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={handleCreateConfig} className="w-full">
              Créer Configuration
            </Button>
          </div>
        </div>
      </Card>

      {/* Active Configs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configurations Actives</h3>
        
        {configsLoading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : !configs || configs.length === 0 ? (
          <p className="text-muted-foreground">Aucune configuration</p>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => (
              <div key={config.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getDirectionIcon(config.sync_direction)}
                    <div>
                      <p className="font-medium capitalize">{config.sync_direction}</p>
                      <p className="text-sm text-muted-foreground">
                        Fréquence: {config.sync_frequency}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusBadge(config.sync_status)}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.auto_sync_enabled}
                        onCheckedChange={(checked) => handleToggleAutoSync(config.id, checked)}
                        disabled={config.sync_frequency === 'manual'}
                      />
                      <Label className="text-sm">Auto</Label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    {config.last_sync_at && (
                      <span>
                        Dernière sync: {format(new Date(config.last_sync_at), 'Pp', { locale: getDateFnsLocale() })}
                      </span>
                    )}
                    {config.next_sync_at && config.auto_sync_enabled && (
                      <span>
                        Prochaine: {format(new Date(config.next_sync_at), 'Pp', { locale: getDateFnsLocale() })}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTriggerSync(config.id, config.sync_direction as any)}
                      disabled={isSyncing || config.sync_status === 'syncing'}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Lancer
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteConfig(config.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {config.last_sync_result && typeof config.last_sync_result === 'object' && (
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium">{(config.last_sync_result as any).total || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Créés</p>
                      <p className="font-medium text-green-600">{(config.last_sync_result as any).created || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mis à jour</p>
                      <p className="font-medium text-blue-600">{(config.last_sync_result as any).updated || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ignorés</p>
                      <p className="font-medium text-orange-600">{(config.last_sync_result as any).skipped || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sync Logs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Historique des Synchronisations</h3>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead>Durée</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.slice(0, 10).map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {format(new Date(log.started_at), 'Pp', { locale: getDateFnsLocale() })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(log.sync_direction)}
                    <span className="capitalize">{log.sync_direction}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.sync_type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    {getStatusBadge(log.status)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="text-green-600">+{log.products_created}</span>
                    {' '}
                    <span className="text-blue-600">~{log.products_updated}</span>
                    {log.products_skipped > 0 && (
                      <>
                        {' '}
                        <span className="text-orange-600">-{log.products_skipped}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}