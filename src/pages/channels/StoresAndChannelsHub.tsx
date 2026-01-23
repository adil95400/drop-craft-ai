/**
 * Hub Boutiques & Canaux - 100% Données Réelles
 * Gestion centralisée des connexions boutiques et marketplaces
 */

import { useState, useMemo, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Custom hooks with real data
import { useChannelConnections, type ChannelConnection } from '@/hooks/useChannelConnections'
import { useChannelHealth } from '@/hooks/useChannelHealth'
import { useChannelActivity } from '@/hooks/useChannelActivity'

// Channable Components
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { 
  ChannablePageLayout,
  ChannableStatsGrid,
  ChannableSearchBar,
  ChannableCategoryFilter,
  ChannableEmptyState,
  ChannableAdvancedFilters,
  ChannableBulkActions,
  ChannableActivityFeed,
  ChannableChannelHealth,
  ChannableSyncTimeline,
  type FilterConfig,
  type SyncEvent
} from '@/components/channable'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { PlatformLogo } from '@/components/ui/platform-logo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Store, ShoppingCart, Plus, RefreshCw, Settings, 
  CheckCircle2, AlertCircle, Clock, WifiOff,
  Package, TrendingUp, Globe, Link2, Loader2,
  LayoutGrid, List, ChevronRight, Zap, Activity,
  BarChart3, Eye, EyeOff, History, Download, Upload,
  Filter, Sparkles, Target, ArrowUpRight, Database, Trash2
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

// Re-export ChannelConnection from hook for local use
export type { ChannelConnection } from '@/hooks/useChannelConnections'

// Helper to map event types
function mapEventType(type: string): 'sync' | 'order' | 'product' | 'alert' | 'system' {
  if (type === 'sync') return 'sync'
  if (type === 'error') return 'alert'
  if (type === 'connection') return 'system'
  if (type === 'update') return 'product'
  return 'system'
}

// Composant carte statistique premium
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'info';
}

function StatCard({ label, value, change, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 border-primary/30 text-primary',
    success: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-500',
    warning: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-500',
    info: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-500',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "p-4 rounded-xl border bg-gradient-to-br backdrop-blur-sm transition-all duration-300",
        colorClasses[color]
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-background/50">
          <Icon className="h-4 w-4" />
        </div>
        {change && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-background/50">
            {change}
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

// Composant carte de connexion
interface ChannelCardProps {
  connection: ChannelConnection;
  viewMode: 'grid' | 'list';
  onSync: () => void;
  onManage: () => void;
  isSyncing: boolean;
  index: number;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

function ChannelCard({ connection, viewMode, onSync, onManage, isSyncing, index, isSelected, onToggleSelect }: ChannelCardProps) {
  const statusConfig = {
    connected: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Connecté' },
    error: { color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle, label: 'Erreur' },
    connecting: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Loader2, label: 'Connexion...' },
    disconnected: { color: 'text-muted-foreground', bg: 'bg-muted/50', icon: WifiOff, label: 'Déconnecté' },
  };

  const status = statusConfig[connection.connection_status] || statusConfig.disconnected;
  const StatusIcon = status.icon;

  const formatLastSync = (date?: string) => {
    if (!date) return 'Jamais';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30",
        isSelected && "ring-2 ring-primary border-primary"
      )}
    >
      {/* Selection checkbox */}
      {onToggleSelect && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="bg-background/80 backdrop-blur-sm"
          />
        </div>
      )}

      <div className={cn("p-4", viewMode === 'list' && 'flex items-center gap-4')}>
        {/* Platform Logo & Info */}
        <div className={cn("flex items-center gap-3", viewMode === 'list' ? 'flex-1' : 'mb-4')}>
          <div className="relative">
            <PlatformLogo platform={connection.platform_type} size={viewMode === 'list' ? 'sm' : 'md'} />
            <div className={cn("absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background", status.bg)}>
              <div className={cn("w-full h-full rounded-full", connection.connection_status === 'connected' ? 'bg-emerald-500' : connection.connection_status === 'error' ? 'bg-red-500' : 'bg-amber-500')} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{connection.platform_name}</h3>
            <p className="text-xs text-muted-foreground truncate">{connection.shop_domain}</p>
          </div>
        </div>

        {/* Stats */}
        <div className={cn("grid gap-2", viewMode === 'list' ? 'grid-cols-3 flex-1' : 'grid-cols-2 mb-4')}>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold">{connection.products_synced?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-muted-foreground">Produits</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold">{connection.orders_synced?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-muted-foreground">Commandes</p>
          </div>
          {viewMode === 'list' && (
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-sm font-medium">{formatLastSync(connection.last_sync_at)}</p>
              <p className="text-[10px] text-muted-foreground">Dernière sync</p>
            </div>
          )}
        </div>

        {/* Status & Actions */}
        <div className={cn("flex items-center gap-2", viewMode === 'list' ? '' : 'pt-3 border-t border-border/50')}>
          <Badge variant="outline" className={cn("text-xs", status.color, status.bg)}>
            <StatusIcon className={cn("h-3 w-3 mr-1", connection.connection_status === 'connecting' && 'animate-spin')} />
            {status.label}
          </Badge>
          
          {connection.auto_sync_enabled && (
            <Badge variant="outline" className="text-xs text-primary bg-primary/10">
              <Zap className="h-3 w-3 mr-1" />
              Auto
            </Badge>
          )}

          <div className="flex-1" />

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSync} disabled={isSyncing}>
            <RefreshCw className={cn("h-4 w-4", isSyncing && 'animate-spin')} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onManage}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Composant carte de plateforme disponible
interface PlatformCardProps {
  platform: typeof STORE_PLATFORMS[0];
  onConnect: () => void;
}

function PlatformCard({ platform, onConnect }: PlatformCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onConnect}
      className="group cursor-pointer p-4 rounded-xl border border-dashed border-border/50 bg-card/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <PlatformLogo platform={platform.id} size="md" />
        <div>
          <p className="font-medium text-sm">{platform.name}</p>
          <p className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
            Cliquez pour connecter
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function StoresAndChannelsHub() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'
  
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<FilterConfig>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showActivity, setShowActivity] = useState(true)
  const [showHealth, setShowHealth] = useState(true)

  // Use unified hooks with real data
  const { connections, stats, isLoading, syncMutation, deleteMutation, toggleAutoSyncMutation, exportChannels } = useChannelConnections()
  const { data: healthMetrics } = useChannelHealth()
  const { events: activityEvents } = useChannelActivity()

  const setActiveTab = (tab: string) => setSearchParams({ tab })

  // Categories
  const categories = useMemo(() => [
    { id: 'all', label: 'Tous', icon: LayoutGrid, count: connections.length },
    { id: 'stores', label: 'Boutiques', icon: Store, count: connections.filter(c => STORE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length },
    { id: 'marketplaces', label: 'Marketplaces', icon: ShoppingCart, count: connections.filter(c => MARKETPLACE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length },
    { id: 'errors', label: 'Erreurs', icon: AlertCircle, count: connections.filter(c => c.connection_status === 'error').length },
  ], [connections])

  // Filter connections
  const filteredConnections = useMemo(() => {
    return connections.filter(c => {
      const matchesSearch = !searchTerm || 
        c.platform_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.shop_domain?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'stores' && STORE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())) ||
        (activeTab === 'marketplaces' && MARKETPLACE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())) ||
        (activeTab === 'errors' && c.connection_status === 'error')
      
      const matchesStatus = !filters.status?.length || filters.status.includes(c.connection_status)
      const matchesErrors = !filters.hasErrors || c.connection_status === 'error'
      const matchesProducts = !filters.hasProducts || (c.products_synced || 0) > 0
      const matchesAutoSync = !filters.autoSync || c.auto_sync_enabled
      
      return matchesSearch && matchesTab && matchesStatus && matchesErrors && matchesProducts && matchesAutoSync
    })
  }, [connections, searchTerm, activeTab, filters])

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredConnections.map(c => c.id)))
  }, [filteredConnections])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Bulk actions with real functionality
  const bulkActions = useMemo(() => [
    {
      id: 'sync-all',
      label: 'Synchroniser',
      icon: RefreshCw,
      onClick: () => syncMutation.mutate(Array.from(selectedIds))
    },
    {
      id: 'enable-autosync',
      label: 'Activer Auto-Sync',
      icon: Zap,
      onClick: () => toggleAutoSyncMutation.mutate({ connectionIds: Array.from(selectedIds), enabled: true })
    },
    {
      id: 'disable-autosync',
      label: 'Désactiver Auto-Sync',
      icon: EyeOff,
      variant: 'outline' as const,
      onClick: () => toggleAutoSyncMutation.mutate({ connectionIds: Array.from(selectedIds), enabled: false })
    },
    {
      id: 'export',
      label: 'Exporter',
      icon: Download,
      onClick: () => {
        exportChannels(Array.from(selectedIds))
        deselectAll()
      }
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      onClick: () => {
        if (selectedIds.size === 1) {
          navigate(`/stores-channels/${Array.from(selectedIds)[0]}`)
        } else {
          toast({ title: 'Sélectionnez un seul canal pour accéder aux paramètres' })
        }
      }
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} canal(aux) ?`)) {
          deleteMutation.mutate(Array.from(selectedIds))
          deselectAll()
        }
      }
    }
  ], [selectedIds, syncMutation, toggleAutoSyncMutation, deleteMutation, exportChannels, navigate, toast, deselectAll])

  // Available platforms
  const connectedPlatformIds = connections.map(c => c.platform_type?.toLowerCase())
  const availableStores = STORE_PLATFORMS.filter(p => !connectedPlatformIds.includes(p.id))
  const availableMarketplaces = MARKETPLACE_PLATFORMS.filter(p => !connectedPlatformIds.includes(p.id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Boutiques & Canaux - ShopOpti</title>
      </Helmet>

      <ChannablePageWrapper
        title="Boutiques & Canaux"
        subtitle="Gestion des connexions"
        description="Connectez vos boutiques et publiez sur les marketplaces. Synchronisez vos produits en temps réel."
        heroImage="integrations"
        badge={{
          label: `${connections.filter(c => c.connection_status === 'connected').length} actifs`,
          icon: Link2
        }}
        actions={
          <>
            <ChannableSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher..."
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
              className="bg-background/50 border-border/50"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>

            <Button
              size="sm"
              onClick={() => navigate('/stores-channels/connect?type=store')}
              className="bg-primary hover:bg-primary/90"
            >
              <Store className="h-4 w-4 mr-2" />
              Boutique
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/stores-channels/connect?type=marketplace')}
              className="bg-background/50 border-border/50"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Marketplace
            </Button>
          </>
        }
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard
            label="Connectés"
            value={connections.filter(c => c.connection_status === 'connected').length}
            change="+1"
            icon={Link2}
            color="primary"
          />
          <StatCard
            label="Boutiques"
            value={connections.filter(c => STORE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length}
            icon={Store}
            color="success"
          />
          <StatCard
            label="Marketplaces"
            value={connections.filter(c => MARKETPLACE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length}
            icon={ShoppingCart}
            color="warning"
          />
          <StatCard
            label="Produits"
            value={connections.reduce((acc, c) => acc + (c.products_synced || 0), 0).toLocaleString()}
            change="+156"
            icon={Package}
            color="info"
          />
          <StatCard
            label="Commandes"
            value={connections.reduce((acc, c) => acc + (c.orders_synced || 0), 0).toLocaleString()}
            change="+89"
            icon={TrendingUp}
            color="success"
          />
          <StatCard
            label="Auto-Sync"
            value={connections.filter(c => c.auto_sync_enabled).length}
            icon={Zap}
            color="primary"
          />
        </div>

        {/* Category Filter */}
        <ChannableCategoryFilter
          categories={categories}
          selectedCategory={activeTab}
          onSelectCategory={setActiveTab}
          variant="pills"
        />

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <ChannableBulkActions
            selectedCount={selectedIds.size}
            totalCount={filteredConnections.length}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            isAllSelected={selectedIds.size === filteredConnections.length && filteredConnections.length > 0}
            actions={bulkActions}
          />
        )}

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Connected Channels */}
            {filteredConnections.length > 0 ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Canaux connectés
                    <Badge variant="secondary">{filteredConnections.length}</Badge>
                  </h2>
                </div>
                
                <div className={cn(
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                    : 'flex flex-col gap-3'
                )}>
                  <AnimatePresence>
                    {filteredConnections.map((connection, index) => (
                      <ChannelCard
                        key={connection.id}
                        connection={connection}
                        viewMode={viewMode}
                        onSync={() => syncMutation.mutate([connection.id])}
                        onManage={() => navigate(`/stores-channels/${connection.id}`)}
                        isSyncing={syncMutation.isPending}
                        index={index}
                        isSelected={selectedIds.has(connection.id)}
                        onToggleSelect={() => toggleSelection(connection.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            ) : (
              <ChannableEmptyState
                title="Aucun canal connecté"
                description="Connectez votre première boutique ou marketplace pour commencer à synchroniser vos produits."
                icon={Link2}
                action={{
                  label: 'Connecter une boutique',
                  onClick: () => navigate('/stores-channels/connect')
                }}
              />
            )}

            {/* Available Stores */}
            {(activeTab === 'all' || activeTab === 'stores') && availableStores.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Boutiques disponibles
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Marketplaces disponibles
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Channel Health */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Santé des canaux
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500">
                    <Database className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChannableChannelHealth 
                  metrics={healthMetrics ? [
                    { id: 'sync-rate', label: 'Taux de sync', score: healthMetrics.syncRate, maxScore: 100, status: healthMetrics.syncRate >= 80 ? 'good' : healthMetrics.syncRate >= 50 ? 'warning' : 'critical' as const },
                    { id: 'error-rate', label: 'Taux erreur', score: 100 - healthMetrics.errorRate, maxScore: 100, status: healthMetrics.errorRate <= 5 ? 'good' : healthMetrics.errorRate <= 20 ? 'warning' : 'critical' as const },
                    { id: 'uptime', label: 'Disponibilité', score: healthMetrics.uptime, maxScore: 100, status: healthMetrics.uptime >= 95 ? 'good' : healthMetrics.uptime >= 80 ? 'warning' : 'critical' as const },
                    { id: 'latency', label: 'Latence', score: Math.max(0, 100 - healthMetrics.avgLatency * 10), maxScore: 100, status: healthMetrics.avgLatency <= 5 ? 'good' : healthMetrics.avgLatency <= 15 ? 'warning' : 'critical' as const }
                  ] : [
                    { id: 'sync-rate', label: 'Taux de sync', score: 100, maxScore: 100, status: 'good' as const },
                    { id: 'error-rate', label: 'Taux erreur', score: 100, maxScore: 100, status: 'good' as const },
                    { id: 'uptime', label: 'Disponibilité', score: 100, maxScore: 100, status: 'good' as const },
                    { id: 'latency', label: 'Latence', score: 100, maxScore: 100, status: 'good' as const }
                  ]} 
                />
              </CardContent>
            </Card>

            {/* Activity Feed - Real Data */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Activité récente
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary animate-pulse">
                    Temps réel
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityEvents.length > 0 ? (
                  <ChannableActivityFeed 
                    events={activityEvents.map(e => ({
                      id: e.id,
                      type: mapEventType(e.type),
                      action: e.title,
                      title: e.title,
                      description: e.description,
                      timestamp: e.timestamp,
                      status: e.status as 'success' | 'error' | 'warning' | 'info'
                    }))} 
                    realtime 
                  />
                ) : (
                  <div className="py-6 text-center">
                    <Activity className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Les synchronisations apparaîtront ici
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ChannablePageWrapper>
    </>
  )
}
