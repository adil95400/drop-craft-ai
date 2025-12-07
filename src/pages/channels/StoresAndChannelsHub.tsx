/**
 * Hub Boutiques & Canaux - Interface unifiée style Channable/AutoDS
 * Gestion centralisée des connexions boutiques et marketplaces
 */

import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Store, ShoppingCart, Plus, RefreshCw, Settings, Search, 
  CheckCircle2, AlertCircle, Clock, Wifi, WifiOff, ExternalLink,
  ArrowRight, Zap, Package, TrendingUp, Globe, Link2, Unplug,
  LayoutGrid, List, Filter, ChevronRight, Loader2, ShoppingBag, Play
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Platform definitions
const STORE_PLATFORMS = [
  { id: 'shopify', name: 'Shopify', color: '#95BF47', logo: '/logos/shopify-text.svg', category: 'store' },
  { id: 'woocommerce', name: 'WooCommerce', color: '#96588A', logo: '/logos/woocommerce.svg', category: 'store' },
  { id: 'prestashop', name: 'PrestaShop', color: '#DF0067', logo: '/logos/prestashop.svg', category: 'store' },
  { id: 'magento', name: 'Magento', color: '#EE672F', logo: '/logos/magento.svg', category: 'store' },
  { id: 'wix', name: 'Wix', color: '#000000', logo: '/logos/wix-text.svg', category: 'store' },
  { id: 'squarespace', name: 'Squarespace', color: '#000000', logo: '/logos/squarespace-text.svg', category: 'store' },
  { id: 'bigcommerce', name: 'BigCommerce', color: '#34313F', logo: '/logos/bigcommerce-icon.svg', category: 'store' },
]

const MARKETPLACE_PLATFORMS = [
  { id: 'amazon', name: 'Amazon Seller', color: '#FF9900', logo: '/logos/amazon-text.svg', category: 'marketplace' },
  { id: 'ebay', name: 'eBay', color: '#E53238', logo: '/logos/ebay-icon.svg', category: 'marketplace' },
  { id: 'etsy', name: 'Etsy', color: '#F56400', logo: '/logos/etsy.svg', category: 'marketplace' },
  { id: 'google', name: 'Google Merchant', color: '#4285F4', logo: '/logos/google.svg', category: 'marketplace' },
  { id: 'facebook', name: 'Meta Commerce', color: '#1877F2', logo: '/logos/meta-color.svg', category: 'marketplace' },
  { id: 'tiktok', name: 'TikTok Shop', color: '#000000', logo: '/logos/tiktok.svg', category: 'marketplace' },
  { id: 'cdiscount', name: 'Cdiscount', color: '#C4161C', logo: '/logos/cdiscount-text.svg', category: 'marketplace' },
  { id: 'fnac', name: 'Fnac', color: '#E4A400', logo: '/logos/fnac-text.svg', category: 'marketplace' },
  { id: 'rakuten', name: 'Rakuten', color: '#BF0000', logo: '/logos/rakuten-text.svg', category: 'marketplace' },
  { id: 'zalando', name: 'Zalando', color: '#FF6900', logo: '/logos/zalando-text.svg', category: 'marketplace' },
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

// Demo data for international showcase
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
  {
    id: 'demo-ebay-1',
    platform_type: 'ebay',
    platform_name: 'eBay',
    shop_domain: 'eBay DE - ElektroShop',
    connection_status: 'connected',
    last_sync_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    products_synced: 678,
    orders_synced: 1543,
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-etsy-1',
    platform_type: 'etsy',
    platform_name: 'Etsy',
    shop_domain: 'ArtisanCreations',
    connection_status: 'error',
    last_sync_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    products_synced: 234,
    orders_synced: 567,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
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

  // Fetch all channel connections
  const { data: dbConnections = [], isLoading } = useQuery({
    queryKey: ['channel-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as ChannelConnection[]
    }
  })

  // Merge demo data with real connections (demo shown if no real connections)
  const connections = dbConnections.length > 0 ? dbConnections : DEMO_CONNECTIONS

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('integrations')
        .update({ 
          connection_status: 'connecting',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', connectionId)
      if (error) throw error
      
      // Simulate sync completion
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await supabase
        .from('integrations')
        .update({ connection_status: 'connected' })
        .eq('id', connectionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-connections'] })
      toast({ title: 'Synchronisation terminée', description: 'Vos données ont été mises à jour' })
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'La synchronisation a échoué', variant: 'destructive' })
    }
  })

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('integrations')
        .update({ connection_status: 'disconnected', is_active: false })
        .eq('id', connectionId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-connections'] })
      toast({ title: 'Déconnexion réussie' })
    }
  })

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab })
  }

  // Stats
  const stats = {
    total: connections.length,
    connected: connections.filter(c => c.connection_status === 'connected').length,
    stores: connections.filter(c => STORE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length,
    marketplaces: connections.filter(c => MARKETPLACE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length,
    errors: connections.filter(c => c.connection_status === 'error').length,
    totalProducts: connections.reduce((acc, c) => acc + (c.products_synced || 0), 0),
    totalOrders: connections.reduce((acc, c) => acc + (c.orders_synced || 0), 0),
  }

  // Filter connections
  const filteredConnections = connections.filter(c => {
    const matchesSearch = searchTerm === '' || 
      c.platform_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.shop_domain?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'stores' && STORE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())) ||
      (activeTab === 'marketplaces' && MARKETPLACE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase()))
    
    return matchesSearch && matchesTab
  })

  // Available platforms (not connected)
  const connectedPlatformIds = connections.map(c => c.platform_type?.toLowerCase())
  const availableStores = STORE_PLATFORMS.filter(p => !connectedPlatformIds.includes(p.id))
  const availableMarketplaces = MARKETPLACE_PLATFORMS.filter(p => !connectedPlatformIds.includes(p.id))

  return (
    <>
      <Helmet>
        <title>Boutiques & Canaux - ShopOpti</title>
        <meta name="description" content="Gérez vos boutiques e-commerce et marketplaces depuis un seul endroit" />
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 shadow-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                Boutiques & Canaux
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Connectez vos boutiques et publiez sur les marketplaces
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                onClick={() => navigate('/stores-channels/connect?type=store')}
                className="gap-2"
              >
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Connecter</span> Boutique
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/stores-channels/connect?type=marketplace')}
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Ajouter</span> Marketplace
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatsCard 
              icon={<Link2 className="h-5 w-5" />}
              value={stats.connected}
              label="Connectés"
              color="primary"
            />
            <StatsCard 
              icon={<Store className="h-5 w-5" />}
              value={stats.stores}
              label="Boutiques"
              color="blue"
            />
            <StatsCard 
              icon={<ShoppingCart className="h-5 w-5" />}
              value={stats.marketplaces}
              label="Marketplaces"
              color="green"
            />
            <StatsCard 
              icon={<Package className="h-5 w-5" />}
              value={stats.totalProducts}
              label="Produits"
              color="purple"
            />
            <StatsCard 
              icon={<TrendingUp className="h-5 w-5" />}
              value={stats.totalOrders}
              label="Commandes"
              color="orange"
              className="hidden md:flex"
            />
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              <TabsTrigger value="all" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span>Tous</span>
                <Badge variant="secondary" className="ml-1 hidden sm:inline">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="stores" className="gap-2">
                <Store className="h-4 w-4" />
                <span>Boutiques</span>
              </TabsTrigger>
              <TabsTrigger value="marketplaces" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Marketplaces</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-6">
            {isLoading ? (
              <LoadingGrid />
            ) : (
              <>
                {/* Connected Channels */}
                {filteredConnections.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
                            onDisconnect={() => disconnectMutation.mutate(connection.id)}
                            onManage={() => navigate(`/stores-channels/${connection.id}`)}
                            isSyncing={syncMutation.isPending}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </section>
                )}

                {/* Available Platforms */}
                {(activeTab === 'all' || activeTab === 'stores') && availableStores.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Store className="h-5 w-5 text-blue-500" />
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

                {(activeTab === 'all' || activeTab === 'marketplaces') && availableMarketplaces.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
                  <EmptyState onConnect={() => navigate('/stores-channels/connect')} />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

// Sub-components
function StatsCard({ icon, value, label, color, className }: {
  icon: React.ReactNode
  value: number
  label: string
  color: string
  className?: string
}) {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    purple: 'bg-purple-500/10 text-purple-600',
    orange: 'bg-orange-500/10 text-orange-600',
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChannelCard({ connection, viewMode, onSync, onDisconnect, onManage, isSyncing, index }: {
  connection: ChannelConnection
  viewMode: 'grid' | 'list'
  onSync: () => void
  onDisconnect: () => void
  onManage: () => void
  isSyncing: boolean
  index: number
}) {
  const platform = [...STORE_PLATFORMS, ...MARKETPLACE_PLATFORMS].find(
    p => p.id === connection.platform_type?.toLowerCase()
  )

  const getStatusBadge = () => {
    switch (connection.connection_status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />Connecté</Badge>
      case 'connecting':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 gap-1"><Loader2 className="h-3 w-3 animate-spin" />Sync...</Badge>
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
        <Card className="hover:shadow-md transition-all cursor-pointer group" onClick={onManage}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                style={{ backgroundColor: platform?.color || '#6366f1' }}
              >
                {connection.platform_name?.charAt(0) || 'S'}
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
      <Card className="hover:shadow-lg transition-all h-full group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                style={{ backgroundColor: platform?.color || '#6366f1' }}
              >
                {connection.platform_name?.charAt(0) || 'S'}
              </div>
              <div>
                <CardTitle className="text-base">{connection.platform_name}</CardTitle>
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
              className="flex-1"
              onClick={onSync}
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

function PlatformCard({ platform, onConnect }: {
  platform: { id: string; name: string; color: string; logo: string }
  onConnect: () => void
}) {
  const [imgError, setImgError] = useState(false)
  
  return (
    <Card 
      className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer group"
      onClick={onConnect}
    >
      <CardContent className="p-4 text-center">
        <div 
          className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center shadow-md mb-3 overflow-hidden bg-white"
        >
          {!imgError ? (
            <img 
              src={platform.logo} 
              alt={platform.name}
              className="w-8 h-8 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span 
              className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: platform.color }}
            >
              {platform.name.charAt(0)}
            </span>
          )}
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

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Aucun canal connecté</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Connectez votre boutique e-commerce ou ajoutez une marketplace pour commencer à synchroniser vos produits
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onConnect} size="lg" className="gap-2">
            <Store className="h-5 w-5" />
            Connecter une boutique
          </Button>
          <Button variant="outline" size="lg" className="gap-2" onClick={onConnect}>
            <ShoppingCart className="h-5 w-5" />
            Ajouter une marketplace
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
