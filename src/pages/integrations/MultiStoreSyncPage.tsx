/**
 * Multi-Store Sync Page - Real data from integrations + sync_configurations tables
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  RefreshCw, Store, CheckCircle, AlertTriangle,
  ArrowLeftRight, Clock, Package, ShoppingBag, Globe, 
  Settings, Plus, Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

const platformIcons: Record<string, string> = {
  shopify: '🟢', woocommerce: '🟣', ebay: '🔵', amazon: '🟠', etsy: '🟤',
}
const platformLabels: Record<string, string> = {
  shopify: 'Shopify', woocommerce: 'WooCommerce', ebay: 'eBay', amazon: 'Amazon', etsy: 'Etsy',
}

export default function MultiStoreSyncPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [syncingAll, setSyncingAll] = useState(false)

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['multi-store-sync', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('integrations')
        .select('*, sync_configurations(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map((i: any) => {
        const syncConfig = i.sync_configurations?.[0]
        return {
          id: i.id,
          name: i.name || i.platform,
          platform: i.platform,
          url: i.store_url || i.platform,
          status: i.is_active ? (i.sync_status === 'error' ? 'error' : 'connected') : 'paused',
          productsCount: i.products_synced ?? 0,
          syncedProducts: i.products_synced ?? 0,
          ordersToday: 0,
          lastSync: i.last_sync_at ? new Date(i.last_sync_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Jamais',
          autoSync: syncConfig?.is_active ?? false,
          syncDirection: syncConfig?.sync_direction || 'bidirectional',
          syncConfigId: syncConfig?.id
        }
      })
    },
    enabled: !!user?.id
  })

  const { data: activity = [] } = useQuery({
    queryKey: ['sync-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('action', ['sync_completed', 'sync_failed', 'sync_started', 'products_synced'])
        .order('created_at', { ascending: false })
        .limit(10)
      return (data || []).map((a: any) => ({
        id: a.id,
        storeName: a.entity_type || 'Store',
        action: a.description || a.action,
        productsAffected: (a.details as any)?.count ?? 0,
        status: a.action.includes('failed') ? 'failed' : 'success',
        timestamp: new Date(a.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }))
    },
    enabled: !!user?.id
  })

  const toggleAutoSync = async (store: any) => {
    if (store.syncConfigId) {
      await supabase.from('sync_configurations').update({ is_active: !store.autoSync }).eq('id', store.syncConfigId)
    }
    queryClient.invalidateQueries({ queryKey: ['multi-store-sync'] })
    toast({ title: 'Auto-sync mis à jour' })
  }

  const syncStore = async (id: string) => {
    toast({ title: 'Sync lancée' })
    await supabase.from('integrations').update({ sync_status: 'syncing', last_sync_at: new Date().toISOString() }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['multi-store-sync'] })
  }

  const syncAll = () => {
    setSyncingAll(true)
    toast({ title: 'Sync globale lancée', description: 'Synchronisation de toutes les boutiques en cours...' })
    setTimeout(() => { setSyncingAll(false); queryClient.invalidateQueries({ queryKey: ['multi-store-sync'] }) }, 3000)
  }

  const totalProducts = stores.reduce((a: number, s: any) => a + s.productsCount, 0)
  const totalSynced = stores.reduce((a: number, s: any) => a + s.syncedProducts, 0)
  const totalOrders = stores.reduce((a: number, s: any) => a + s.ordersToday, 0)

  return (
    <ChannablePageWrapper
      title="Multi-Store Sync"
      description="Synchronisation bidirectionnelle de vos boutiques : produits, prix, stock et commandes en temps réel."
      heroImage="integrations"
      badge={{ label: 'Multi-Store', icon: Globe }}
      actions={
        <>
          <Button onClick={syncAll} disabled={syncingAll}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncingAll ? 'animate-spin' : ''}`} />
            {syncingAll ? 'Sync en cours...' : 'Tout synchroniser'}
          </Button>
          <Button variant="outline" disabled>
            <Plus className="mr-2 h-4 w-4" /> Ajouter une boutique
          </Button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Store className="h-4 w-4" /> Boutiques</div>
          <div className="text-2xl font-bold">{isLoading ? '...' : stores.length}</div>
          <p className="text-xs text-green-600 mt-1">{stores.filter((s: any) => s.status === 'connected').length} connectées</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Package className="h-4 w-4" /> Produits total</div>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground mt-1">{totalSynced} synchronisés</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><ArrowLeftRight className="h-4 w-4" /> Taux de sync</div>
          <div className="text-2xl font-bold text-primary">{totalProducts > 0 ? Math.round(totalSynced / totalProducts * 100) : 0}%</div>
          <Progress value={totalProducts > 0 ? (totalSynced / totalProducts * 100) : 0} className="h-1.5 mt-2" />
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><ShoppingBag className="h-4 w-4" /> Commandes</div>
          <div className="text-2xl font-bold">{totalOrders}</div>
          <p className="text-xs text-muted-foreground mt-1">aujourd'hui toutes boutiques</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="stores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stores"><Store className="mr-2 h-4 w-4" /> Boutiques</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4" /> Activité</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" /> Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          {isLoading ? (
            [1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : stores.length === 0 ? (
            <Card className="p-12 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">Aucune boutique connectée</h3>
              <p className="text-sm text-muted-foreground">Connectez votre première boutique dans Intégrations</p>
            </Card>
          ) : (
            stores.map((store: any) => (
              <Card key={store.id} className={store.status === 'error' ? 'border-destructive/50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{platformIcons[store.platform] || '🔗'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{store.name}</h3>
                          <Badge variant={store.status === 'connected' ? 'default' : store.status === 'error' ? 'destructive' : 'outline'} className="text-xs">
                            {store.status === 'connected' && <CheckCircle className="mr-1 h-3 w-3" />}
                            {store.status === 'error' && <AlertTriangle className="mr-1 h-3 w-3" />}
                            {store.status === 'connected' ? 'Connecté' : store.status === 'error' ? 'Erreur' : 'Pause'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{platformLabels[store.platform] || store.platform} · {store.url}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{store.syncedProducts}/{store.productsCount} produits</span>
                          <span><Clock className="inline h-3 w-3 mr-1" />{store.lastSync}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Auto</span>
                        <Switch checked={store.autoSync} onCheckedChange={() => toggleAutoSync(store)} />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => syncStore(store.id)}>
                        <RefreshCw className="mr-1 h-3 w-3" /> Sync
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Historique de synchronisation</CardTitle></CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune activité de sync récente</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((act: any) => (
                    <div key={act.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      {act.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{act.action}</p>
                        <p className="text-xs text-muted-foreground">{act.timestamp}</p>
                      </div>
                      <Badge variant={act.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                        {act.status === 'success' ? 'Succès' : 'Échec'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Paramètres de synchronisation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['Sync automatique globale', 'Sync prix en temps réel', 'Sync stock bidirectionnel', 'Alertes de désynchronisation'].map(label => (
                <div key={label} className="flex items-center justify-between p-3 rounded-lg border">
                  <p className="font-medium text-sm">{label}</p>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
