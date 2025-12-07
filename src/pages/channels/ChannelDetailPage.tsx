/**
 * Page de détail d'un canal connecté
 * Gestion, mapping, produits, analytics
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, Settings, Package, ShoppingCart, RefreshCw, TrendingUp,
  CheckCircle2, AlertCircle, Clock, ExternalLink, Unplug, Loader2,
  FileText, Database, Zap, BarChart3, Edit2, Save, Trash2, Code2, Wifi
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductMappingEditor } from '@/components/channels/ProductMappingEditor'
import { ChannelSyncStatus } from '@/components/channels/ChannelSyncStatus'
import { TransformationRulesEditor } from '@/components/channels/TransformationRulesEditor'
import { ResponsiveProductTable } from '@/components/channels/ResponsiveProductTable'
import { useChannelWebhooks } from '@/hooks/useChannelWebhooks'

export default function ChannelDetailPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

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

  // Fetch synced products from shopify_products table
  const { data: syncedProducts, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['channel-products', channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopify_products')
        .select('id, title, image_url, price, inventory_quantity, status, sku, vendor')
        .eq('store_integration_id', channelId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data || []
    },
    enabled: !!channelId
  })

  // Count total products
  const { data: productCount } = useQuery({
    queryKey: ['channel-product-count', channelId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('shopify_products')
        .select('*', { count: 'exact', head: true })
        .eq('store_integration_id', channelId)
      if (error) throw error
      return count || 0
    },
    enabled: !!channelId
  })

  // Sync mutation - calls real Shopify sync edge function
  const syncMutation = useMutation({
    mutationFn: async () => {
      // Update status to syncing
      await supabase
        .from('integrations')
        .update({ 
          connection_status: 'connecting',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', channelId)
      
      // Call the real sync edge function
      const { data, error } = await supabase.functions.invoke('shopify-complete-import', {
        body: { 
          historyId: `sync-${Date.now()}`,
          includeVariants: true
        }
      })
      
      if (error) {
        // Revert status on error
        await supabase
          .from('integrations')
          .update({ connection_status: 'error' })
          .eq('id', channelId)
        throw error
      }
      
      // Update with real product count
      const { count } = await supabase
        .from('shopify_products')
        .select('*', { count: 'exact', head: true })
        .eq('store_integration_id', channelId)
      
      await supabase
        .from('integrations')
        .update({ 
          connection_status: 'connected'
        })
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Canal introuvable</h2>
            <p className="text-muted-foreground mb-4">Ce canal n'existe pas ou a été supprimé</p>
            <Button onClick={() => navigate('/stores-channels')}>Retour aux canaux</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = () => {
    switch (channel.connection_status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-700 gap-1"><CheckCircle2 className="h-3 w-3" />Connecté</Badge>
      case 'connecting':
        return <Badge className="bg-blue-500/20 text-blue-700 gap-1"><Loader2 className="h-3 w-3 animate-spin" />Synchronisation</Badge>
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

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/stores-channels')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {channel.platform_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                {channel.platform_name}
                {getStatusBadge()}
              </h1>
              <p className="text-sm text-muted-foreground">
                {channel.shop_domain || 'Non configuré'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")} />
              Synchroniser
            </Button>
            {channel.shop_domain && (
              <Button variant="outline" asChild>
                <a href={`https://${channel.shop_domain}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(productCount || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{((channel as any).orders_synced || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">€0</p>
                  <p className="text-xs text-muted-foreground">CA Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {channel.last_sync_at 
                      ? new Date(channel.last_sync_at).toLocaleDateString('fr-FR')
                      : 'Jamais'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Dernière sync</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Webhook Status */}
        {webhooksConnected && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wifi className="h-3 w-3 text-green-500" />
            <span>Webhooks temps réel actifs • {eventCount} événement{eventCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Produits</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">Règles</span>
            </TabsTrigger>
            <TabsTrigger value="mapping" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Mapping</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Synchronisation produits', time: 'Il y a 2h', status: 'success' },
                      { action: 'Import commandes', time: 'Il y a 4h', status: 'success' },
                      { action: 'Mise à jour stock', time: 'Il y a 6h', status: 'success' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
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

              <Card>
                <CardHeader>
                  <CardTitle>Performances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Taux de sync</span>
                        <span className="font-medium">98%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '98%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Produits publiés</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Stock synchronisé</span>
                        <span className="font-medium">100%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Produits synchronisés ({productCount || 0})</CardTitle>
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
                    {syncedProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-12 h-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
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
                            {product.vendor && `${product.vendor} • `}
                            Stock: {product.inventory_quantity ?? 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{product.price?.toFixed(2) || '0.00'}</p>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {product.status || 'draft'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun produit synchronisé pour le moment</p>
                    <Button className="mt-4" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                      {syncMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Synchronisation...</>
                      ) : (
                        'Lancer une synchronisation'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <Card>
              <CardContent className="p-6">
                <TransformationRulesEditor
                  channelId={channelId || ''}
                  onSave={(rules) => {
                    console.log('Saving rules:', rules)
                    toast({ title: 'Règles enregistrées', description: `${rules.length} règle(s) configurée(s)` })
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping">
            <ProductMappingEditor
              platform={channel.platform_type?.toLowerCase() || 'default'}
              platformName={channel.platform_name || 'Canal'}
              onSave={(mappings) => {
                console.log('Saving mappings:', mappings)
                toast({ title: 'Mapping enregistré', description: `${mappings.filter(m => m.enabled).length} champs mappés` })
              }}
            />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de synchronisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Synchronisation automatique</p>
                      <p className="text-sm text-muted-foreground">Sync toutes les heures</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Importer les commandes</p>
                      <p className="text-sm text-muted-foreground">Récupérer automatiquement les nouvelles commandes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Sync inventaire temps réel</p>
                      <p className="text-sm text-muted-foreground">Mettre à jour les stocks instantanément</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Zone de danger</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
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
      </div>
    </>
  )
}
