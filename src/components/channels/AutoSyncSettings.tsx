/**
 * Paramètres de synchronisation automatique pour les canaux
 * Configuration des intervalles, types de sync, et notifications
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  RefreshCw, Clock, Zap, Bell, AlertTriangle, Save,
  Package, ShoppingCart, Database, TrendingUp, Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutoSyncConfig {
  enabled: boolean
  interval: number // minutes
  syncProducts: boolean
  syncOrders: boolean
  syncInventory: boolean
  syncPrices: boolean
  notifyOnSuccess: boolean
  notifyOnError: boolean
  retryOnError: boolean
  maxRetries: number
  quietHoursStart?: number
  quietHoursEnd?: number
}

interface AutoSyncSettingsProps {
  channelId: string
  platform: string
  initialConfig?: Partial<AutoSyncConfig>
  onConfigChange?: (config: AutoSyncConfig) => void
}

const defaultConfig: AutoSyncConfig = {
  enabled: false,
  interval: 60,
  syncProducts: true,
  syncOrders: true,
  syncInventory: true,
  syncPrices: true,
  notifyOnSuccess: false,
  notifyOnError: true,
  retryOnError: true,
  maxRetries: 3,
}

const intervalOptions = [
  { value: 5, label: '5 minutes', description: 'Temps réel' },
  { value: 15, label: '15 minutes', description: 'Très fréquent' },
  { value: 30, label: '30 minutes', description: 'Fréquent' },
  { value: 60, label: '1 heure', description: 'Standard' },
  { value: 180, label: '3 heures', description: 'Modéré' },
  { value: 360, label: '6 heures', description: 'Économique' },
  { value: 720, label: '12 heures', description: '2x/jour' },
  { value: 1440, label: '24 heures', description: '1x/jour' },
]

export function AutoSyncSettings({
  channelId,
  platform,
  initialConfig,
  onConfigChange
}: AutoSyncSettingsProps) {
  const [config, setConfig] = useState<AutoSyncConfig>({
    ...defaultConfig,
    ...initialConfig
  })
  const [isDirty, setIsDirty] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Update config
  const updateConfig = <K extends keyof AutoSyncConfig>(
    key: K, 
    value: AutoSyncConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const syncSettingsPayload = {
        auto_sync: config.enabled,
        interval_minutes: config.interval,
        types: {
          products: config.syncProducts,
          orders: config.syncOrders,
          inventory: config.syncInventory,
          prices: config.syncPrices,
        },
        notifications: {
          success: config.notifyOnSuccess,
          error: config.notifyOnError,
        },
        retry: {
          enabled: config.retryOnError,
          max_retries: config.maxRetries,
        },
      }

      // 1. Save to database first
      const { error } = await supabase
        .from('integrations')
        .update({
          sync_settings: syncSettingsPayload as any,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', channelId)

      if (error) throw error

      // 2. Try to register schedule (non-blocking — don't fail the save)
      if (config.enabled) {
        try {
          await supabase.functions.invoke('auto-sync-channels', {
            body: {
              action: 'schedule',
              channelId,
              intervalMinutes: config.interval,
            },
          })
        } catch (scheduleErr) {
          console.warn('Schedule registration failed (non-critical):', scheduleErr)
        }
      }

      return config
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId] })
      setIsDirty(false)
      onConfigChange?.(config)
      toast({ title: 'Configuration sauvegardée', description: 'Vos paramètres ont été enregistrés avec succès' })
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de sauvegarder la configuration',
        variant: 'destructive'
      })
    }
  })

  // Trigger manual sync
  const triggerSync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('auto-sync-channels', {
        body: { channelId }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId] })
      queryClient.invalidateQueries({ queryKey: ['channel-products', channelId] })
      toast({ 
        title: 'Synchronisation terminée',
        description: `${data?.summary?.totalProducts || 0} produits synchronisés`
      })
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const selectedInterval = intervalOptions.find(o => o.value === config.interval)

  return (
    <div className="space-y-6">
      {/* Main toggle */}
      <Card className={cn(
        "transition-colors",
        config.enabled ? "border-primary/50 bg-primary/5" : ""
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl transition-colors",
                config.enabled ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Synchronisation automatique</h3>
                <p className="text-sm text-muted-foreground">
                  Maintenez vos données à jour automatiquement
                </p>
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig('enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Interval selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Fréquence de synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={config.interval.toString()}
            onValueChange={(value) => updateConfig('interval', parseInt(value))}
            disabled={!config.enabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intervalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex items-center justify-between gap-4">
                    <span>{option.label}</span>
                    <Badge variant="outline" className="ml-2">{option.description}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedInterval && config.enabled && (
            <p className="text-sm text-muted-foreground">
              Prochaine sync dans ~{selectedInterval.label}. 
              Environ {Math.round(1440 / config.interval)} synchronisations par jour.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sync types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Types de données
          </CardTitle>
          <CardDescription>Sélectionnez les données à synchroniser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Products */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-colors",
              config.syncProducts ? "bg-blue-500/5 border-blue-500/20" : ""
            )}>
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Produits</p>
                  <p className="text-xs text-muted-foreground">Titre, prix, images</p>
                </div>
              </div>
              <Switch
                checked={config.syncProducts}
                onCheckedChange={(checked) => updateConfig('syncProducts', checked)}
                disabled={!config.enabled}
              />
            </div>

            {/* Orders */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-colors",
              config.syncOrders ? "bg-green-500/5 border-green-500/20" : ""
            )}>
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Commandes</p>
                  <p className="text-xs text-muted-foreground">Nouvelles commandes</p>
                </div>
              </div>
              <Switch
                checked={config.syncOrders}
                onCheckedChange={(checked) => updateConfig('syncOrders', checked)}
                disabled={!config.enabled}
              />
            </div>

            {/* Inventory */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-colors",
              config.syncInventory ? "bg-purple-500/5 border-purple-500/20" : ""
            )}>
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Inventaire</p>
                  <p className="text-xs text-muted-foreground">Niveaux de stock</p>
                </div>
              </div>
              <Switch
                checked={config.syncInventory}
                onCheckedChange={(checked) => updateConfig('syncInventory', checked)}
                disabled={!config.enabled}
              />
            </div>

            {/* Prices */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-colors",
              config.syncPrices ? "bg-orange-500/5 border-orange-500/20" : ""
            )}>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Prix</p>
                  <p className="text-xs text-muted-foreground">Mises à jour prix</p>
                </div>
              </div>
              <Switch
                checked={config.syncPrices}
                onCheckedChange={(checked) => updateConfig('syncPrices', checked)}
                disabled={!config.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifier en cas de succès</p>
              <p className="text-sm text-muted-foreground">Recevoir une notification après chaque sync réussie</p>
            </div>
            <Switch
              checked={config.notifyOnSuccess}
              onCheckedChange={(checked) => updateConfig('notifyOnSuccess', checked)}
              disabled={!config.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifier en cas d'erreur</p>
              <p className="text-sm text-muted-foreground">Recevoir une alerte si la synchronisation échoue</p>
            </div>
            <Switch
              checked={config.notifyOnError}
              onCheckedChange={(checked) => updateConfig('notifyOnError', checked)}
              disabled={!config.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error handling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Gestion des erreurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Réessayer automatiquement</p>
              <p className="text-sm text-muted-foreground">Retenter la sync en cas d'échec</p>
            </div>
            <Switch
              checked={config.retryOnError}
              onCheckedChange={(checked) => updateConfig('retryOnError', checked)}
              disabled={!config.enabled}
            />
          </div>
          
          {config.retryOnError && (
            <div className="space-y-2">
              <Label>Nombre maximum de tentatives: {config.maxRetries}</Label>
              <Slider
                value={[config.maxRetries]}
                onValueChange={([value]) => updateConfig('maxRetries', value)}
                min={1}
                max={5}
                step={1}
                disabled={!config.enabled}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => triggerSync.mutate()}
          disabled={triggerSync.isPending}
          variant="outline"
          className="flex-1 gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", triggerSync.isPending && "animate-spin")} />
          Synchroniser maintenant
        </Button>
        
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!isDirty || saveMutation.isPending}
          className="flex-1 gap-2"
        >
          <Save className="h-4 w-4" />
          Sauvegarder la configuration
        </Button>
      </div>
    </div>
  )
}

export default AutoSyncSettings
