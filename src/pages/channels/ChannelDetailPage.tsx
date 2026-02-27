/**
 * Page de détail d'un canal - Style Channable avancé
 * Interface data-dense, professionnelle et 100% fonctionnelle
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { BarChart3, Package, Code2, FileText, Settings, Loader2, AlertCircle, ShoppingCart, Activity, Shield } from 'lucide-react'
import { ChannableEmptyState } from '@/components/channable'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { ProductMappingEditor } from '@/components/channels/ProductMappingEditor'
import { TransformationRulesEditor } from '@/components/channels/TransformationRulesEditor'
import { VisualMappingEditor } from '@/components/channels/VisualMappingEditor'
import { AutoSyncSettings } from '@/components/channels/AutoSyncSettings'
import { WebhookEventsLog } from '@/components/channels/WebhookEventsLog'
import { useChannelWebhooks } from '@/hooks/useChannelWebhooks'
import { ChannelHeader, ChannelStatsBar, ChannelOverviewTab, ChannelProductsTab, ChannelAlertsPanel, ChannelOrdersPanel, ChannelBulkActions, ChannelSyncHistory } from '@/components/channels/detail'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Unplug } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function ChannelDetailPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [retryCount, setRetryCount] = useState([3])
  const [activeTab, setActiveTab] = useState('overview')
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  
  const [syncSettings, setSyncSettings] = useState({
    products: true,
    orders: true,
    inventory: true,
    prices: true,
    notifySuccess: true,
    notifyError: false,
    autoRetry: true,
  })

  const { isConnected: webhooksConnected, lastEvent, eventCount } = useChannelWebhooks({
    channelId,
    enableNotifications: true,
  })

  // Fetch channel details
  const { data: channel, isLoading } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', channelId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!channelId
  })

  // Fetch products from Shopify
  const { data: syncedProducts, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['channel-products', channelId],
    queryFn: async () => {
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', channelId)
        .single()
      
      if (!integration) return []
      
      const config = integration.config as any
      const credentials = config?.credentials || {}
      const shopDomain = credentials.shop_domain || integration.store_url
      const accessToken = credentials.access_token
      
      if (!shopDomain || !accessToken) {
        throw new Error("Configuration de boutique manquante")
      }
      
      const response = await supabase.functions.invoke('shopify-admin-products', {
        body: { shopDomain, accessToken, limit: 100 }
      })
      
      if (response.error) throw response.error
      
      const products = response.data?.products || []
      
      return products.map((p: any) => ({
        id: p.id,
        title: p.title,
        image_url: p.images?.edges?.[0]?.node?.url || '',
        price: parseFloat(p.priceRange?.minVariantPrice?.amount || '0'),
        inventory_quantity: p.variants?.edges?.[0]?.node?.availableForSale ? 1 : 0,
        status: 'active',
        sku: p.handle
      }))
    },
    enabled: !!channelId
  })

  // Channel stats
  const { data: channelStats } = useQuery({
    queryKey: ['channel-stats', channelId],
    queryFn: async () => {
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', channelId)
        .single()
      
      if (!integration?.user_id) return { products: 0, orders: 0, revenue: 0 }
      
      let shopifyProductCount = 0
      const config = integration.config as any
      const credentials = config?.credentials || {}
      const shopDomain = credentials.shop_domain || integration.store_url
      const accessToken = credentials.access_token
      
      if (shopDomain && accessToken) {
        try {
          const response = await supabase.functions.invoke('shopify-admin-products', {
            body: { shopDomain, accessToken, limit: 250 }
          })
          shopifyProductCount = response.data?.count || response.data?.products?.length || 0
        } catch (err) {
          console.error('Error fetching Shopify product count:', err)
        }
      }
      
      const [ordersResult, revenueResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', integration.user_id),
        supabase
          .from('orders')
          .select('total_amount')
          .eq('user_id', integration.user_id)
      ])
      
      const revenue = (revenueResult.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0)
      
      return { products: shopifyProductCount, orders: ordersResult.count || 0, revenue }
    },
    enabled: !!channelId
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('integrations')
        .update({ connection_status: 'connecting', last_sync_at: new Date().toISOString() })
        .eq('id', channelId)
      
      const { data, error } = await supabase.functions.invoke('shopify-complete-import', {
        body: { historyId: `sync-${Date.now()}`, includeVariants: true }
      })
      
      if (error) {
        await supabase.from('integrations').update({ connection_status: 'error' }).eq('id', channelId)
        throw error
      }
      
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true })
      
      await supabase.from('integrations').update({ connection_status: 'connected' }).eq('id', channelId)
      
      return { productCount: count || 0 }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId] })
      queryClient.invalidateQueries({ queryKey: ['channel-products', channelId] })
      queryClient.invalidateQueries({ queryKey: ['channel-product-count', channelId] })
      toast({ title: 'Synchronisation terminée', description: `${data.productCount} produits synchronisés` })
    },
    onError: (error) => {
      toast({ title: 'Erreur de synchronisation', description: error.message, variant: 'destructive' })
    }
  })

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('integrations').update({ connection_status: 'disconnected', is_active: false }).eq('id', channelId)
    },
    onSuccess: () => {
      toast({ title: 'Canal déconnecté' })
      navigate('/stores-channels')
    }
  })

  // Save config
  const handleSaveConfig = async () => {
    try {
      const newSyncSettings = {
        types: {
          products: syncSettings.products,
          orders: syncSettings.orders,
          inventory: syncSettings.inventory,
          prices: syncSettings.prices,
        },
        notifications: {
          success: syncSettings.notifySuccess,
          error: syncSettings.notifyError,
        },
        auto_sync: true,
        retry: {
          enabled: syncSettings.autoRetry,
          max_retries: retryCount[0] ?? 3,
        },
        interval_minutes: 60,
      }

      const { error } = await supabase
        .from('integrations')
        .update({ sync_settings: newSyncSettings, updated_at: new Date().toISOString() })
        .eq('id', channelId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['channel', channelId] })
      toast({ title: 'Configuration sauvegardée', description: 'Vos paramètres ont été enregistrés avec succès' })
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder la configuration', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Chargement..." heroImage="integrations">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Chargement du canal...</p>
          </div>
        </div>
      </ChannablePageWrapper>
    )
  }

  if (!channel) {
    return (
      <ChannablePageWrapper title="Canal introuvable" heroImage="integrations">
        <ChannableEmptyState
          icon={AlertCircle}
          title="Canal introuvable"
          description="Ce canal n'existe pas ou a été supprimé"
          action={{
            label: "Retour aux canaux",
            onClick: () => navigate('/stores-channels')
          }}
        />
      </ChannablePageWrapper>
    )
  }

  const tabItems = [
    { value: 'overview', icon: BarChart3, label: "Vue d'ensemble", count: null },
    { value: 'products', icon: Package, label: 'Produits', count: channelStats?.products || null },
    { value: 'orders', icon: ShoppingCart, label: 'Commandes', count: channelStats?.orders || null },
    { value: 'rules', icon: Code2, label: 'Règles', count: null },
    { value: 'mapping', icon: FileText, label: 'Mapping', count: null },
    { value: 'settings', icon: Settings, label: 'Paramètres', count: null },
  ]

  return (
    <>
      <Helmet>
        <title>{channel.platform_name || 'Canal'} - Détail du canal</title>
      </Helmet>

      <ChannablePageWrapper title={channel.platform_name || 'Canal'} heroImage="integrations" className="space-y-0">
        {/* Header Section */}
        <ChannelHeader
          channel={channel}
          webhooksConnected={webhooksConnected}
          isSyncing={syncMutation.isPending}
          onBack={() => navigate('/stores-channels')}
          onSync={() => syncMutation.mutate()}
        />

        {/* Stats Bar */}
        <div className="mt-5">
          <ChannelStatsBar
            productCount={channelStats?.products || 0}
            orderCount={channelStats?.orders || 0}
            revenue={channelStats?.revenue || 0}
            lastSync={channel.last_sync_at}
          />
        </div>

        {/* Realtime Banner */}
        {webhooksConnected && eventCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2.5 text-sm px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-primary font-medium">
              {eventCount} événement{eventCount !== 1 ? 's' : ''} reçu{eventCount !== 1 ? 's' : ''} en temps réel
            </span>
          </motion.div>
        )}

        {/* Tabs Navigation - Channable style with counters */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            <div className="border-b border-border">
              <TabsList className="bg-transparent rounded-none h-auto p-0 w-full justify-start gap-0 overflow-x-auto">
                {tabItems.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative gap-2 rounded-none border-b-2 border-transparent px-4 py-3",
                      "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                      "data-[state=active]:text-foreground text-muted-foreground",
                      "hover:text-foreground hover:bg-muted/40 transition-all",
                      "text-sm font-medium whitespace-nowrap"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count !== null && tab.count > 0 && (
                      <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-[10px] font-semibold rounded-full">
                        {tab.count > 999 ? `${(tab.count / 1000).toFixed(1)}k` : tab.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0 space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <ChannelAlertsPanel />
                <ChannelSyncHistory 
                  channelId={channelId || ''} 
                  onSync={async () => { syncMutation.mutate() }}
                  isSyncing={syncMutation.isPending}
                />
              </div>
              
              <ChannelOverviewTab
                syncSettings={syncSettings}
                onSyncSettingsChange={setSyncSettings}
                retryCount={retryCount}
                onRetryCountChange={setRetryCount}
                onSync={() => syncMutation.mutate()}
                onSave={handleSaveConfig}
                isSyncing={syncMutation.isPending}
                lastEvent={lastEvent}
              />
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="m-0">
              <ChannelProductsTab
                products={syncedProducts || []}
                totalCount={channelStats?.products || 0}
                isLoading={productsLoading}
                onRefresh={() => { refetchProducts() }}
                onSync={() => syncMutation.mutate()}
                isSyncing={syncMutation.isPending}
              />
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="m-0">
              <ChannelOrdersPanel channelId={channelId || ''} />
            </TabsContent>

            {/* Rules Tab */}
            <TabsContent value="rules" className="m-0">
              <Card className="shadow-none border-border">
                <CardContent className="p-6">
                  <TransformationRulesEditor
                    channelId={channelId || ''}
                    onSave={(rules) => {
                      toast({ title: 'Règles enregistrées', description: `${rules.length} règle(s) configurée(s)` })
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mapping Tab */}
            <TabsContent value="mapping" className="m-0 space-y-5">
              <VisualMappingEditor 
                channelId={channelId || ''}
                platform={channel.platform?.toLowerCase() || 'default'}
                mappings={[]}
                onSave={async () => {
                  toast({ title: 'Mapping visuel mis à jour' })
                }}
              />
              
              <ProductMappingEditor
                platform={channel.platform?.toLowerCase() || 'default'}
                platformName={channel.platform_name || 'Canal'}
                onSave={(mappings) => {
                  toast({ title: 'Mapping enregistré', description: `${mappings.filter(m => m.enabled).length} champs mappés` })
                }}
              />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="m-0 space-y-5">
              <AutoSyncSettings 
                channelId={channelId || ''}
                platform={channel.platform?.toLowerCase() || 'default'}
                onConfigChange={() => {
                  toast({ title: 'Paramètres de sync enregistrés' })
                }}
              />

              <WebhookEventsLog channelId={channelId || ''} />

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
                      onClick={() => setShowDisconnectConfirm(true)}
                    >
                      <Unplug className="h-4 w-4" />
                      Déconnecter
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ChannablePageWrapper>

      <ConfirmDialog
        open={showDisconnectConfirm}
        onOpenChange={setShowDisconnectConfirm}
        title="Déconnecter ce canal ?"
        description="Cette action est irréversible. Toutes les données seront perdues."
        confirmText="Déconnecter"
        variant="destructive"
        onConfirm={() => disconnectMutation.mutate()}
      />
    </>
  )
}
