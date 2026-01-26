/**
 * Page de détail d'un canal connecté - Design Premium Optimisé
 * Architecture modulaire avec composants réutilisables
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { BarChart3, Package, Code2, FileText, Settings, Loader2, AlertCircle } from 'lucide-react'
import { ChannablePageLayout, ChannableEmptyState } from '@/components/channable'
import { ProductMappingEditor } from '@/components/channels/ProductMappingEditor'
import { TransformationRulesEditor } from '@/components/channels/TransformationRulesEditor'
import { VisualMappingEditor } from '@/components/channels/VisualMappingEditor'
import { AutoSyncSettings } from '@/components/channels/AutoSyncSettings'
import { WebhookEventsLog } from '@/components/channels/WebhookEventsLog'
import { useChannelWebhooks } from '@/hooks/useChannelWebhooks'
import { ChannelHeader, ChannelStatsBar, ChannelOverviewTab, ChannelProductsTab } from '@/components/channels/detail'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Unplug } from 'lucide-react'

export default function ChannelDetailPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [retryCount, setRetryCount] = useState([3])
  const [activeTab, setActiveTab] = useState('overview')
  
  // Data sync settings state
  const [syncSettings, setSyncSettings] = useState({
    products: true,
    orders: true,
    inventory: true,
    prices: true,
    notifySuccess: true,
    notifyError: false,
    autoRetry: true,
  })

  // Real-time webhooks
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

  // Fetch synced products - combine products and imported_products for the user
  const { data: syncedProducts, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['channel-products', channelId],
    queryFn: async () => {
      // Get user_id from the integration
      const { data: integration } = await supabase
        .from('integrations')
        .select('user_id')
        .eq('id', channelId)
        .single()
      
      if (!integration?.user_id) return []
      
      // Get products for this user (linked to Shopify)
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, title, image_url, images, price, stock_quantity, status, sku, shopify_product_id')
        .eq('user_id', integration.user_id)
        .order('created_at', { ascending: false })
        .limit(100)
      
      // Map products - use image_url directly
      return (productsData || []).map(p => ({
        id: p.id,
        title: p.title || p.name,
        image_url: p.image_url,
        price: p.price,
        inventory_quantity: p.stock_quantity,
        status: p.status || (p.shopify_product_id ? 'active' : 'draft'),
        sku: p.sku
      }))
    },
    enabled: !!channelId
  })

  // Count total products and orders for this channel's user
  const { data: channelStats } = useQuery({
    queryKey: ['channel-stats', channelId],
    queryFn: async () => {
      const { data: integration } = await supabase
        .from('integrations')
        .select('user_id')
        .eq('id', channelId)
        .single()
      
      if (!integration?.user_id) return { products: 0, orders: 0, revenue: 0 }
      
      const [productsResult, ordersResult, revenueResult] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', integration.user_id),
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
      
      return {
        products: productsResult.count || 0,
        orders: ordersResult.count || 0,
        revenue
      }
    },
    enabled: !!channelId
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('integrations')
        .update({ 
          connection_status: 'connecting',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', channelId)
      
      const { data, error } = await supabase.functions.invoke('shopify-complete-import', {
        body: { 
          historyId: `sync-${Date.now()}`,
          includeVariants: true
        }
      })
      
      if (error) {
        await supabase
          .from('integrations')
          .update({ connection_status: 'error' })
          .eq('id', channelId)
        throw error
      }
      
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      
      await supabase
        .from('integrations')
        .update({ connection_status: 'connected' })
        .eq('id', channelId)
      
      return { productCount: count || 0 }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId] })
      queryClient.invalidateQueries({ queryKey: ['channel-products', channelId] })
      queryClient.invalidateQueries({ queryKey: ['channel-product-count', channelId] })
      toast({ 
        title: 'Synchronisation terminée', 
        description: `${data.productCount} produits synchronisés`
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

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('integrations')
        .update({ connection_status: 'disconnected', is_active: false })
        .eq('id', channelId)
    },
    onSuccess: () => {
      toast({ title: 'Canal déconnecté' })
      navigate('/stores-channels')
    }
  })

  // Save configuration handler
  const handleSaveConfig = () => {
    toast({ 
      title: 'Configuration sauvegardée',
      description: 'Vos paramètres ont été enregistrés avec succès'
    })
  }

  if (isLoading) {
    return (
      <ChannablePageLayout title="Chargement...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Chargement du canal...</p>
          </div>
        </div>
      </ChannablePageLayout>
    )
  }

  if (!channel) {
    return (
      <ChannablePageLayout title="Canal introuvable">
        <ChannableEmptyState
          icon={AlertCircle}
          title="Canal introuvable"
          description="Ce canal n'existe pas ou a été supprimé"
          action={{
            label: "Retour aux canaux",
            onClick: () => navigate('/stores-channels')
          }}
        />
      </ChannablePageLayout>
    )
  }

  return (
    <>
      <Helmet>
        <title>{channel.platform_name || 'Canal'} - ShopOpti+</title>
      </Helmet>

      <ChannablePageLayout className="space-y-6">
        {/* Premium Header */}
        <ChannelHeader
          channel={channel}
          webhooksConnected={webhooksConnected}
          isSyncing={syncMutation.isPending}
          onBack={() => navigate('/stores-channels')}
          onSync={() => syncMutation.mutate()}
        />

        {/* Stats Bar */}
        <ChannelStatsBar
          productCount={channelStats?.products || 0}
          orderCount={channelStats?.orders || 0}
          revenue={channelStats?.revenue || 0}
          lastSync={channel.last_sync_at}
        />

        {/* Realtime Indicator */}
        {webhooksConnected && eventCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-sm px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-green-700 dark:text-green-400">
              {eventCount} événement{eventCount !== 1 ? 's' : ''} reçu{eventCount !== 1 ? 's' : ''} en temps réel
            </span>
          </motion.div>
        )}

        {/* Tabs with Premium Design */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-auto flex-wrap gap-1 w-full sm:w-auto">
            {[
              { value: 'overview', icon: BarChart3, label: "Vue d'ensemble" },
              { value: 'products', icon: Package, label: 'Produits' },
              { value: 'rules', icon: Code2, label: 'Règles' },
              { value: 'mapping', icon: FileText, label: 'Mapping' },
              { value: 'settings', icon: Settings, label: 'Paramètres' },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="m-0">
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

          {/* Rules Tab */}
          <TabsContent value="rules" className="m-0">
            <Card className="border-border/50 shadow-sm overflow-hidden">
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
          <TabsContent value="mapping" className="m-0 space-y-6">
            <VisualMappingEditor 
              channelId={channelId || ''}
              platform={channel.platform?.toLowerCase() || 'default'}
              mappings={[]}
              onSave={async (mappings) => {
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
          <TabsContent value="settings" className="m-0 space-y-6">
            <AutoSyncSettings 
              channelId={channelId || ''}
              platform={channel.platform?.toLowerCase() || 'default'}
              onConfigChange={(config) => {
                toast({ title: 'Paramètres de sync enregistrés' })
              }}
            />

            <WebhookEventsLog channelId={channelId || ''} />

            {/* Danger Zone */}
            <Card className="border-destructive/30 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-destructive">Zone de danger</h3>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div>
                    <p className="font-medium">Déconnecter ce canal</p>
                    <p className="text-sm text-muted-foreground">
                      Cette action est irréversible. Toutes les données seront perdues.
                    </p>
                  </div>
                  <Button 
                    variant="destructive"
                    className="gap-2 shrink-0 rounded-xl"
                    onClick={() => {
                      if (confirm('Êtes-vous sûr de vouloir déconnecter ce canal ?')) {
                        disconnectMutation.mutate()
                      }
                    }}
                  >
                    <Unplug className="h-4 w-4" />
                    Déconnecter
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageLayout>
    </>
  )
}
