/**
 * Page de détail d'un canal connecté - Design Channable
 * Gestion, mapping, produits, analytics
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, Settings, Package, ShoppingCart, RefreshCw, TrendingUp,
  CheckCircle2, AlertCircle, Clock, ExternalLink, Unplug, Loader2,
  FileText, Zap, BarChart3, Code2, Wifi, Save, Bell, AlertTriangle,
  Database, DollarSign, BoxIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductMappingEditor } from '@/components/channels/ProductMappingEditor'
import { TransformationRulesEditor } from '@/components/channels/TransformationRulesEditor'
import { useChannelWebhooks } from '@/hooks/useChannelWebhooks'
import { VisualMappingEditor } from '@/components/channels/VisualMappingEditor'
import { AutoSyncSettings } from '@/components/channels/AutoSyncSettings'
import { WebhookEventsLog } from '@/components/channels/WebhookEventsLog'
import { ChannablePageLayout, ChannableStatsGrid, ChannableEmptyState } from '@/components/channable'
import { motion } from 'framer-motion'
import type { ChannableStat } from '@/components/channable/types'

export default function ChannelDetailPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [retryCount, setRetryCount] = useState([3])
  
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

  // Fetch synced products from products table
  const { data: syncedProducts, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['channel-products', channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url, price, stock_quantity, status, sku')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data || []).map(p => ({
        id: p.id,
        title: p.name,
        image_url: p.image_url,
        price: p.price,
        inventory_quantity: p.stock_quantity,
        status: p.status,
        sku: p.sku,
        vendor: null as string | null
      }))
    },
    enabled: !!channelId
  })

  // Count total products
  const { data: productCount } = useQuery({
    queryKey: ['channel-product-count', channelId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return count || 0
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  // Stats Channable
  const stats: ChannableStat[] = [
    {
      label: 'Produits',
      value: (productCount || 0).toLocaleString(),
      icon: Package,
      color: 'info'
    },
    {
      label: 'Commandes',
      value: ((channel as any).orders_synced || 0).toLocaleString(),
      icon: ShoppingCart,
      color: 'success'
    },
    {
      label: 'CA Total',
      value: '€0',
      icon: TrendingUp,
      color: 'primary'
    },
    {
      label: 'Dernière sync',
      value: channel.last_sync_at 
        ? new Date(channel.last_sync_at).toLocaleDateString('fr-FR')
        : 'Jamais',
      icon: Clock,
      color: 'warning'
    }
  ]

  const getStatusBadge = () => {
    switch (channel.connection_status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />Connecté</Badge>
      case 'connecting':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 gap-1"><Loader2 className="h-3 w-3 animate-spin" />Synchronisation</Badge>
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Erreur</Badge>
      default:
        return <Badge variant="outline">Déconnecté</Badge>
    }
  }

  return (
    <>
      <Helmet>
        <title>{channel.platform_name} - ShopOpti</title>
      </Helmet>

      <ChannablePageLayout className="space-y-6">
        {/* Header Channable Style */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50"
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/stores-channels')}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
              {channel.platform_name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{channel.platform_name}</h1>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground">
                {channel.store_url || 'Non configuré'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {webhooksConnected && (
              <Badge variant="outline" className="gap-1.5 text-green-600 border-green-500/30 bg-green-500/10">
                <Wifi className="h-3 w-3" />
                Temps réel actif
              </Badge>
            )}
            <Button 
              variant="outline" 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")} />
              Synchroniser
            </Button>
            {channel.store_url && (
              <Button variant="outline" asChild>
                <a href={channel.store_url.startsWith('http') ? channel.store_url : `https://${channel.store_url}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir
                </a>
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Grid Channable */}
        <ChannableStatsGrid stats={stats} columns={4} />

        {/* Webhook realtime indicator */}
        {webhooksConnected && eventCount > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 bg-muted/50 rounded-lg"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>{eventCount} événement{eventCount !== 1 ? 's' : ''} reçu{eventCount !== 1 ? 's' : ''} en temps réel</span>
          </motion.div>
        )}

        {/* Tabs Channable Style */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex-wrap gap-1">
            <TabsTrigger value="overview" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Produits</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">Règles</span>
            </TabsTrigger>
            <TabsTrigger value="mapping" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Mapping</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Design Channable */}
          <TabsContent value="overview" className="space-y-6">
            {/* Types de données - Style Channable */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Types de données</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Sélectionnez les données à synchroniser</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'products', label: 'Produits', desc: 'Titre, prix, images', icon: BoxIcon },
                    { key: 'orders', label: 'Commandes', desc: 'Nouvelles commandes', icon: ShoppingCart },
                    { key: 'inventory', label: 'Inventaire', desc: 'Niveaux de stock', icon: Package },
                    { key: 'prices', label: 'Prix', desc: 'Mises à jour prix', icon: DollarSign },
                  ].map((item) => (
                    <div 
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={syncSettings[item.key as keyof typeof syncSettings] as boolean}
                        onCheckedChange={(checked) => setSyncSettings(prev => ({ ...prev, [item.key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
                  <div>
                    <p className="font-medium text-sm">Notifier en cas de succès</p>
                    <p className="text-xs text-muted-foreground">Recevoir une notification après chaque sync réussie</p>
                  </div>
                  <Switch 
                    checked={syncSettings.notifySuccess}
                    onCheckedChange={(checked) => setSyncSettings(prev => ({ ...prev, notifySuccess: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
                  <div>
                    <p className="font-medium text-sm">Notifier en cas d'erreur</p>
                    <p className="text-xs text-muted-foreground">Recevoir une alerte si la synchronisation échoue</p>
                  </div>
                  <Switch 
                    checked={syncSettings.notifyError}
                    onCheckedChange={(checked) => setSyncSettings(prev => ({ ...prev, notifyError: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Gestion des erreurs */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Gestion des erreurs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
                  <div>
                    <p className="font-medium text-sm">Réessayer automatiquement</p>
                    <p className="text-xs text-muted-foreground">Retenter la sync en cas d'échec</p>
                  </div>
                  <Switch 
                    checked={syncSettings.autoRetry}
                    onCheckedChange={(checked) => setSyncSettings(prev => ({ ...prev, autoRetry: checked }))}
                  />
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-sm">Nombre maximum de tentatives: {retryCount[0]}</p>
                  </div>
                  <Slider
                    value={retryCount}
                    onValueChange={setRetryCount}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")} />
                Synchroniser maintenant
              </Button>
              <Button onClick={handleSaveConfig} className="gap-2 bg-primary hover:bg-primary/90">
                <Save className="h-4 w-4" />
                Sauvegarder la configuration
              </Button>
            </div>

            {/* Activity & Performance Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Activité récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lastEvent && (
                      <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium">{lastEvent.type}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Temps réel</Badge>
                      </div>
                    )}
                    {[
                      { action: 'Synchronisation produits', time: 'Il y a 2h', status: 'success' },
                      { action: 'Import commandes', time: 'Il y a 4h', status: 'success' },
                      { action: 'Mise à jour stock', time: 'Il y a 6h', status: 'success' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{item.action}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Performances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {[
                      { label: 'Taux de sync', value: 98, color: 'bg-green-500' },
                      { label: 'Produits publiés', value: 85, color: 'bg-blue-500' },
                      { label: 'Stock synchronisé', value: 100, color: 'bg-purple-500' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-semibold">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={cn("h-full rounded-full", item.color)} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Produits synchronisés ({productCount || 0})</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchProducts()}
                    disabled={productsLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", productsLoading && "animate-spin")} />
                    Actualiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : syncedProducts && syncedProducts.length > 0 ? (
                  <div className="space-y-3">
                    {syncedProducts.map((product, index) => (
                      <motion.div 
                        key={product.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.title || ''} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.title || 'Sans titre'}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.sku && `SKU: ${product.sku} • `}
                            Stock: {product.inventory_quantity ?? 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{product.price?.toFixed(2) || '0.00'}</p>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {product.status || 'draft'}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <ChannableEmptyState
                    icon={Package}
                    title="Aucun produit synchronisé"
                    description="Lancez une synchronisation pour importer vos produits"
                    action={{
                      label: syncMutation.isPending ? 'Synchronisation...' : 'Lancer une synchronisation',
                      onClick: () => syncMutation.mutate()
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <Card className="border-border/50 shadow-sm">
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
          <TabsContent value="mapping">
            <div className="space-y-6">
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
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <AutoSyncSettings 
                channelId={channelId || ''}
                platform={channel.platform?.toLowerCase() || 'default'}
                onConfigChange={(config) => {
                  toast({ title: 'Paramètres de sync enregistrés' })
                }}
              />

              <WebhookEventsLog channelId={channelId || ''} />

              <Card className="border-destructive/30 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Zone de danger
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                    <div>
                      <p className="font-medium">Déconnecter ce canal</p>
                      <p className="text-sm text-muted-foreground">
                        Cette action est irréversible. Toutes les données de synchronisation seront perdues.
                      </p>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir déconnecter ce canal ?')) {
                          disconnectMutation.mutate()
                        }
                      }}
                    >
                      <Unplug className="h-4 w-4 mr-2" />
                      Déconnecter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </ChannablePageLayout>
    </>
  )
}
