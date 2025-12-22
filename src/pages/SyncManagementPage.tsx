import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AutoSyncManager } from '@/components/sync/AutoSyncManager'
import { ConnectMarketplaceDialog } from '@/components/marketplace/ConnectMarketplaceDialog'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, CheckCircle, XCircle, Clock, Play, Settings, Store } from 'lucide-react'

interface StoreIntegration {
  id: string
  platform: string
  store_name: string | null
  store_url: string | null
  connection_status: string
  is_active: boolean
  last_sync_at: string | null
  sync_frequency: string | null
  sync_settings: any
  product_count: number | null
}

export default function SyncManagementPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['store-integrations-sync'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('store_integrations')
        .select('id, platform, store_name, store_url, is_active, last_sync_at, sync_frequency, sync_settings, product_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      // Map is_active to connection_status for compatibility
      return (data || []).map((d: any) => ({
        ...d,
        connection_status: d.is_active ? 'connected' : 'disconnected'
      })) as StoreIntegration[]
    }
  })

  const syncMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke('sync-integration', {
        body: { integration_id: connectionId, sync_type: 'full' }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations-sync'] })
      toast({
        title: 'Synchronisation lancée',
        description: `${data?.products_synced || 0} produits synchronisés`
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

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

  const getFrequencyLabel = (freq: string | null) => {
    switch (freq) {
      case '15min': return 'Toutes les 15 min'
      case 'hourly': return 'Toutes les heures'
      case 'daily': return 'Quotidienne'
      case 'weekly': return 'Hebdomadaire'
      default: return 'Manuel'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
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
                  {getStatusIcon(connection.connection_status)}
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      {connection.store_name || connection.platform}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {connection.last_sync_at 
                        ? `Dernière sync: ${new Date(connection.last_sync_at).toLocaleString('fr-FR')}`
                        : 'Jamais synchronisé'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={connection.connection_status === 'connected' ? 'default' : 'destructive'}>
                    {connection.connection_status}
                  </Badge>
                  {connection.product_count !== null && (
                    <Badge variant="outline">{connection.product_count} produits</Badge>
                  )}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Fréquence: {getFrequencyLabel(connection.sync_frequency)}</p>
                {connection.store_url && (
                  <p className="truncate">URL: {connection.store_url}</p>
                )}
              </div>

              <Button
                onClick={() => syncMutation.mutate(connection.id)}
                disabled={syncMutation.isPending}
                variant="outline"
                className="w-full"
              >
                <Play className="mr-2 h-4 w-4" />
                {syncMutation.isPending ? 'Synchronisation...' : 'Synchroniser maintenant'}
              </Button>

              <AutoSyncManager
                connectionId={connection.id}
                platform={connection.platform}
                currentSettings={{
                  enabled: connection.is_active,
                  frequency: connection.sync_frequency || 'hourly',
                  syncTypes: connection.sync_settings?.import_products ? ['products'] : []
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
              Connectez des boutiques pour gérer leur synchronisation
            </p>
            <ConnectMarketplaceDialog />
          </Card>
        )}
      </div>
    </>
  )
}
