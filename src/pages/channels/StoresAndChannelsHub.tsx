/**
 * Hub Boutiques & Canaux - Design Channable
 * Gestion centralisée des connexions boutiques et marketplaces
 */

import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Channable Components
import { 
  ChannablePageLayout,
  ChannableHeroSection,
  ChannableStatsGrid,
  ChannableSearchBar,
  ChannableCategoryFilter,
  ChannableEmptyState
} from '@/components/channable'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlatformLogo } from '@/components/ui/platform-logo'
import {
  Store, ShoppingCart, Plus, RefreshCw, Settings, 
  CheckCircle2, AlertCircle, Clock, WifiOff,
  Package, TrendingUp, Globe, Link2, Loader2,
  LayoutGrid, List, ChevronRight
} from 'lucide-react'

// Platform definitions
const STORE_PLATFORMS = [
  { id: 'shopify', name: 'Shopify', color: '#95BF47', category: 'store' },
  { id: 'woocommerce', name: 'WooCommerce', color: '#96588A', category: 'store' },
  { id: 'prestashop', name: 'PrestaShop', color: '#DF0067', category: 'store' },
  { id: 'magento', name: 'Magento', color: '#EE672F', category: 'store' },
  { id: 'wix', name: 'Wix', color: '#000000', category: 'store' },
  { id: 'squarespace', name: 'Squarespace', color: '#000000', category: 'store' },
  { id: 'bigcommerce', name: 'BigCommerce', color: '#34313F', category: 'store' },
]

const MARKETPLACE_PLATFORMS = [
  { id: 'amazon', name: 'Amazon Seller', color: '#FF9900', category: 'marketplace' },
  { id: 'ebay', name: 'eBay', color: '#E53238', category: 'marketplace' },
  { id: 'etsy', name: 'Etsy', color: '#F56400', category: 'marketplace' },
  { id: 'google', name: 'Google Merchant', color: '#4285F4', category: 'marketplace' },
  { id: 'facebook', name: 'Meta Commerce', color: '#1877F2', category: 'marketplace' },
  { id: 'tiktok', name: 'TikTok Shop', color: '#000000', category: 'marketplace' },
  { id: 'cdiscount', name: 'Cdiscount', color: '#C4161C', category: 'marketplace' },
  { id: 'fnac', name: 'Fnac', color: '#E4A400', category: 'marketplace' },
  { id: 'rakuten', name: 'Rakuten', color: '#BF0000', category: 'marketplace' },
  { id: 'zalando', name: 'Zalando', color: '#FF6900', category: 'marketplace' },
]

interface ChannelConnection {
  id: string
  platform_type: string
  platform_name: string
  shop_domain?: string
  connection_status: 'connected' | 'error' | 'connecting' | 'disconnected'
  last_sync_at?: string
  products_synced?: number
  orders_synced?: number
  created_at: string
}

// Demo data
const DEMO_CONNECTIONS: ChannelConnection[] = [
  {
    id: 'demo-shopify-1',
    platform_type: 'shopify',
    platform_name: 'Shopify',
    shop_domain: 'mode-parisienne.myshopify.com',
    connection_status: 'connected',
    last_sync_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    products_synced: 1247,
    orders_synced: 892,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-amazon-1',
    platform_type: 'amazon',
    platform_name: 'Amazon Seller',
    shop_domain: 'Amazon FR - TechStore',
    connection_status: 'connected',
    last_sync_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    products_synced: 834,
    orders_synced: 2156,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-woocommerce-1',
    platform_type: 'woocommerce',
    platform_name: 'WooCommerce',
    shop_domain: 'boutique-bio.fr',
    connection_status: 'connected',
    last_sync_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    products_synced: 456,
    orders_synced: 321,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
]

export default function StoresAndChannelsHub() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'
  
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch connections
  const { data: dbConnections = [], isLoading } = useQuery({
    queryKey: ['channel-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map(d => ({
        id: d.id,
        platform_type: d.platform,
        platform_name: d.platform_name || d.platform,
        shop_domain: d.store_url,
        connection_status: d.connection_status as any,
        last_sync_at: d.last_sync_at,
        products_synced: 0,
        orders_synced: 0,
        created_at: d.created_at || ''
      })) as ChannelConnection[]
    }
  })

  const connections = dbConnections.length > 0 ? dbConnections : DEMO_CONNECTIONS

  // Mutations
  const syncMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      await supabase.from('integrations').update({ 
        connection_status: 'connecting',
        last_sync_at: new Date().toISOString()
      }).eq('id', connectionId)
      await new Promise(resolve => setTimeout(resolve, 2000))
      await supabase.from('integrations').update({ connection_status: 'connected' }).eq('id', connectionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-connections'] })
      toast({ title: 'Synchronisation terminée' })
    }
  })

  const setActiveTab = (tab: string) => setSearchParams({ tab })

  // Stats Channable
  const stats = [
    {
      label: 'Connectés',
      value: connections.filter(c => c.connection_status === 'connected').length,
      icon: Link2,
      trend: '+1',
      color: 'primary' as const
    },
    {
      label: 'Boutiques',
      value: connections.filter(c => STORE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length,
      icon: Store,
      trend: '+0',
      color: 'success' as const
    },
    {
      label: 'Marketplaces',
      value: connections.filter(c => MARKETPLACE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length,
      icon: ShoppingCart,
      trend: '+0',
      color: 'warning' as const
    },
    {
      label: 'Produits',
      value: connections.reduce((acc, c) => acc + (c.products_synced || 0), 0),
      icon: Package,
      trend: '+156',
      color: 'primary' as const
    },
    {
      label: 'Commandes',
      value: connections.reduce((acc, c) => acc + (c.orders_synced || 0), 0),
      icon: TrendingUp,
      trend: '+89',
      color: 'success' as const
    }
  ]

  // Categories Channable
  const categories = [
    { id: 'all', label: 'Tous', icon: LayoutGrid, count: connections.length },
    { id: 'stores', label: 'Boutiques', icon: Store, count: connections.filter(c => STORE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length },
    { id: 'marketplaces', label: 'Marketplaces', icon: ShoppingCart, count: connections.filter(c => MARKETPLACE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length },
  ]

  // Filter connections
  const filteredConnections = connections.filter(c => {
    const matchesSearch = !searchTerm || 
      c.platform_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.shop_domain?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'stores' && STORE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())) ||
      (activeTab === 'marketplaces' && MARKETPLACE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase()))
    
    return matchesSearch && matchesTab
  })

  // Available platforms
  const connectedPlatformIds = connections.map(c => c.platform_type?.toLowerCase())
  const availableStores = STORE_PLATFORMS.filter(p => !connectedPlatformIds.includes(p.id))
  const availableMarketplaces = MARKETPLACE_PLATFORMS.filter(p => !connectedPlatformIds.includes(p.id))

  if (isLoading) {
    return (
      <ChannablePageLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ChannablePageLayout>
    )
  }

  return (
    <>
      <Helmet>
        <title>Boutiques & Canaux - ShopOpti</title>
      </Helmet>

      <ChannablePageLayout>
        {/* Hero Channable */}
        <ChannableHeroSection
          title="Boutiques & Canaux"
          description="Connectez vos boutiques et publiez sur les marketplaces"
          primaryAction={{
            label: 'Connecter Boutique',
            onClick: () => navigate('/stores-channels/connect?type=store'),
            icon: Store
          }}
          secondaryAction={{
            label: 'Ajouter Marketplace',
            onClick: () => navigate('/stores-channels/connect?type=marketplace')
          }}
        />

        {/* Stats Channable */}
        <ChannableStatsGrid stats={stats} />

        {/* Filters Channable */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <ChannableCategoryFilter
            categories={categories}
            selectedCategory={activeTab}
            onSelectCategory={setActiveTab}
          />
          <div className="flex gap-2 items-center">
            <ChannableSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher..."
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Connected Channels */}
        {filteredConnections.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Canaux connectés
            </h2>
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-3'
            )}>
              <AnimatePresence>
                {filteredConnections.map((connection, index) => (
                  <ChannelCard
                    key={connection.id}
                    connection={connection}
                    viewMode={viewMode}
                    onSync={() => syncMutation.mutate(connection.id)}
                    onManage={() => navigate(`/stores-channels/${connection.id}`)}
                    isSyncing={syncMutation.isPending}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Available Stores */}
        {(activeTab === 'all' || activeTab === 'stores') && availableStores.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Boutiques disponibles
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {availableStores.map(platform => (
                <PlatformCard 
                  key={platform.id}
                  platform={platform}
                  onConnect={() => navigate(`/stores-channels/connect/${platform.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Available Marketplaces */}
        {(activeTab === 'all' || activeTab === 'marketplaces') && availableMarketplaces.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              Marketplaces disponibles
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {availableMarketplaces.map(platform => (
                <PlatformCard 
                  key={platform.id}
                  platform={platform}
                  onConnect={() => navigate(`/stores-channels/connect/${platform.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {connections.length === 0 && (
          <ChannableEmptyState
            icon={Globe}
            title="Aucun canal connecté"
            description="Connectez votre boutique e-commerce ou ajoutez une marketplace pour synchroniser vos produits"
            action={{
              label: 'Connecter une boutique',
              onClick: () => navigate('/stores-channels/connect')
            }}
          />
        )}
      </ChannablePageLayout>
    </>
  )
}

// Channel Card Component
function ChannelCard({ connection, viewMode, onSync, onManage, isSyncing, index }: {
  connection: ChannelConnection
  viewMode: 'grid' | 'list'
  onSync: () => void
  onManage: () => void
  isSyncing: boolean
  index: number
}) {
  const getStatusBadge = () => {
    switch (connection.connection_status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />Connecté</Badge>
      case 'connecting':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1"><Loader2 className="h-3 w-3 animate-spin" />Sync...</Badge>
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Erreur</Badge>
      default:
        return <Badge variant="outline" className="gap-1"><WifiOff className="h-3 w-3" />Déconnecté</Badge>
    }
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="hover:shadow-md transition-all cursor-pointer group border-border/50 hover:border-primary/30" onClick={onManage}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-card border">
                <PlatformLogo platform={connection.platform_type || ''} size="lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{connection.platform_name}</h3>
                  {getStatusBadge()}
                </div>
                <p className="text-sm text-muted-foreground truncate">{connection.shop_domain || 'Non configuré'}</p>
              </div>
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-semibold">{connection.products_synced || 0}</p>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{connection.orders_synced || 0}</p>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onSync() }} disabled={isSyncing}>
                  <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                </Button>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-all h-full group border-border/50 hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-card border">
                <PlatformLogo platform={connection.platform_type || ''} size="lg" />
              </div>
              <div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">{connection.platform_name}</CardTitle>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {connection.shop_domain || 'Non configuré'}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <p className="font-semibold">{connection.products_synced || 0}</p>
              <p className="text-xs text-muted-foreground">Produits</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <p className="font-semibold">{connection.orders_synced || 0}</p>
              <p className="text-xs text-muted-foreground">Commandes</p>
            </div>
          </div>

          {connection.last_sync_at && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Sync: {new Date(connection.last_sync_at).toLocaleDateString('fr-FR')}
            </p>
          )}

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 group-hover:border-primary group-hover:text-primary"
              onClick={(e) => { e.stopPropagation(); onSync() }}
              disabled={isSyncing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", isSyncing && "animate-spin")} />
              Sync
            </Button>
            <Button size="sm" className="flex-1" onClick={onManage}>
              <Settings className="h-4 w-4 mr-1" />
              Gérer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Platform Card Component
function PlatformCard({ platform, onConnect }: {
  platform: { id: string; name: string; color: string }
  onConnect: () => void
}) {
  return (
    <Card 
      className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer group border-border/50 hover:border-primary/30"
      onClick={onConnect}
    >
      <CardContent className="p-4 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center shadow-md mb-3 bg-card border">
          <PlatformLogo platform={platform.id} size="lg" />
        </div>
        <p className="font-medium text-sm truncate">{platform.name}</p>
        <Button 
          size="sm" 
          variant="ghost" 
          className="mt-2 w-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus className="h-4 w-4 mr-1" />
          Connecter
        </Button>
      </CardContent>
    </Card>
  )
}
