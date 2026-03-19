/**
 * ChannelSettingsTab - Complete settings with connection details + danger zone
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, Unplug, Globe, Wifi, WifiOff, RefreshCw, 
  CheckCircle2, XCircle, Loader2, Settings2, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { AutoSyncSettings } from '@/components/channels/AutoSyncSettings'
import { WebhookEventsLog } from '@/components/channels/WebhookEventsLog'

interface ChannelSettingsTabProps {
  channelId: string
  channel: {
    platform?: string | null
    platform_name?: string | null
    store_url?: string | null
    connection_status?: string | null
    config?: any
    last_sync_at?: string | null
  }
  onDisconnect: () => void
  onConfigChange?: () => void
}

export function ChannelSettingsTab({ channelId, channel, onDisconnect, onConfigChange }: ChannelSettingsTabProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const config = (channel.config as any) || {}
      const credentials = config?.credentials || {}
      const shopDomain = credentials.shop_domain || channel.store_url
      const accessToken = credentials.access_token

      if (!shopDomain || !accessToken) {
        throw new Error('Identifiants manquants')
      }

      // Test via Shopify admin API
      const { error } = await supabase.functions.invoke('shopify-admin-products', {
        body: { shopDomain, accessToken, limit: 1 }
      })

      if (error) throw error
      setTestResult('success')
      toast.success('Connexion vérifiée avec succès')
    } catch (err: any) {
      setTestResult('error')
      toast.error(`Échec du test: ${err.message}`)
    } finally {
      setIsTesting(false)
    }
  }

  const handleClearCache = async () => {
    try {
      await supabase
        .from('integrations')
        .update({ 
          updated_at: new Date().toISOString(),
          config: {
            ...(channel.config as any || {}),
            cache_cleared_at: new Date().toISOString()
          }
        })
        .eq('id', channelId)

      toast.success('Cache vidé avec succès')
    } catch {
      toast.error('Erreur lors du vidage du cache')
    }
  }

  return (
    <div className="space-y-5">
      {/* Connection Test */}
      <Card className="shadow-none border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <Wifi className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-semibold">Test de connexion</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Vérifiez que la connexion à votre boutique fonctionne correctement</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestConnection}
              disabled={isTesting}
              className="gap-2"
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : testResult === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : testResult === 'error' ? (
                <XCircle className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <Wifi className="h-3.5 w-3.5" />
              )}
              {isTesting ? 'Test en cours...' : 'Tester la connexion'}
            </Button>

            <Button variant="outline" size="sm" onClick={handleClearCache} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Vider le cache
            </Button>

            {testResult && (
              <Badge 
                variant="outline" 
                className={cn(
                  "gap-1",
                  testResult === 'success' 
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" 
                    : "bg-destructive/10 text-destructive border-destructive/30"
                )}
              >
                {testResult === 'success' ? 'Connecté' : 'Erreur'}
              </Badge>
            )}
          </div>

          {/* Connection details summary */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Plateforme', value: channel.platform_name || channel.platform || '—' },
              { label: 'URL', value: channel.store_url || '—' },
              { label: 'Statut', value: channel.connection_status || 'unknown' },
              { label: 'Dernière sync', value: channel.last_sync_at 
                ? new Date(channel.last_sync_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                : 'Jamais' 
              },
            ].map((item) => (
              <div key={item.label} className="p-2.5 rounded-lg bg-muted/50 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-xs font-medium truncate mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto Sync Settings */}
      <AutoSyncSettings 
        channelId={channelId}
        platform={channel.platform?.toLowerCase() || 'default'}
        onConfigChange={() => {
          onConfigChange?.()
          toast.success('Paramètres de sync enregistrés')
        }}
      />

      {/* Webhook Events */}
      <WebhookEventsLog channelId={channelId} />

      {/* Danger Zone */}
      <Card className="border-destructive/30 shadow-none">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">Zone de danger</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium text-sm">Déconnecter ce canal</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cette action est irréversible. Toutes les données de synchronisation seront perdues.
              </p>
            </div>
            <Button 
              variant="destructive"
              size="sm"
              className="gap-2 shrink-0"
              onClick={onDisconnect}
            >
              <Unplug className="h-4 w-4" />
              Déconnecter
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
