/**
 * Hub Boutiques & Canaux - Design Channable Premium
 * Interface professionnelle avec glassmorphism et animations fluides
 */

import { useState, useMemo, useCallback } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
import { useApiJobs } from '@/hooks/api/useApiJobs'
import { useIsMobile } from '@/hooks/use-mobile'

// Channable Components
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { 
  ChannableSearchBar,
  ChannableCategoryFilter,
  ChannableEmptyState,
  ChannableBulkActions,
  ChannableActivityFeed,
  ChannableChannelHealth,
  type FilterConfig
} from '@/components/channable'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { PlatformLogo } from '@/components/ui/platform-logo'
import { Progress } from '@/components/ui/progress'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Store, ShoppingCart, Plus, RefreshCw, Settings, 
  CheckCircle2, AlertCircle, Clock, WifiOff,
  Package, TrendingUp, Globe, Link2, Loader2,
  LayoutGrid, List, ChevronRight, Zap, Activity,
  BarChart3, Eye, EyeOff, Download, 
  Sparkles, ArrowUpRight, Database, Trash2,
  ArrowRight, Wifi, Shield, Timer
} from 'lucide-react'

// Re-export ChannelConnection
export type { ChannelConnection } from '@/hooks/useChannelConnections'

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
  { id: 'amazon', name: 'Amazon', color: '#FF9900', category: 'marketplace' },
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

// Helper to map event types
function mapEventType(type: string): 'sync' | 'order' | 'product' | 'alert' | 'system' {
  if (type === 'sync') return 'sync'
  if (type === 'error') return 'alert'
  if (type === 'connection') return 'system'
  if (type === 'update') return 'product'
  return 'system'
}

// ============= PREMIUM STAT CARD =============
interface PremiumStatCardProps {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  gradient: string
  delay?: number
}

function PremiumStatCard({ label, value, change, trend, icon: Icon, gradient, delay = 0 }: PremiumStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.03, y: -4 }}
      className={cn(
        "relative group cursor-default overflow-hidden rounded-2xl border border-border/40",
        "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl",
        "shadow-lg hover:shadow-xl transition-all duration-300"
      )}
    >
      {/* Gradient accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", gradient)} />
      
      {/* Background glow */}
      <div className={cn(
        "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity",
        gradient
      )} />
      
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-2.5 rounded-xl",
            gradient.replace('bg-gradient-to-r', 'bg-gradient-to-br')
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {change && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-medium border-0",
                trend === 'up' && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                trend === 'down' && "bg-red-500/20 text-red-600 dark:text-red-400",
                trend === 'neutral' && "bg-muted text-muted-foreground"
              )}
            >
              {trend === 'up' && '↑'} {trend === 'down' && '↓'} {change}
            </Badge>
          )}
        </div>
        <p className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          {value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ============= CHANNEL CARD PREMIUM =============
interface ChannelCardPremiumProps {
  connection: ChannelConnection
  viewMode: 'grid' | 'list'
  onSync: () => void
  onManage: () => void
  isSyncing: boolean
  index: number
  isSelected?: boolean
  onToggleSelect?: () => void
}

function ChannelCardPremium({ connection, viewMode, onSync, onManage, isSyncing, index, isSelected, onToggleSelect }: ChannelCardPremiumProps) {
  const statusConfig = {
    connected: { 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10 border-emerald-500/30', 
      icon: CheckCircle2, 
      label: 'Connecté',
      dot: 'bg-emerald-500'
    },
    error: { 
      color: 'text-red-500', 
      bg: 'bg-red-500/10 border-red-500/30', 
      icon: AlertCircle, 
      label: 'Erreur',
      dot: 'bg-red-500'
    },
    connecting: { 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10 border-amber-500/30', 
      icon: Loader2, 
      label: 'Connexion...',
      dot: 'bg-amber-500'
    },
    disconnected: { 
      color: 'text-muted-foreground', 
      bg: 'bg-muted/50 border-muted', 
      icon: WifiOff, 
      label: 'Déconnecté',
      dot: 'bg-muted-foreground'
    },
  }

  const status = statusConfig[connection.connection_status] || statusConfig.disconnected
  const StatusIcon = status.icon

  const formatLastSync = (date?: string) => {
    if (!date) return 'Jamais'
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `Il y a ${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${Math.floor(hours / 24)}j`
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className={cn(
          "group relative flex items-center gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-sm",
          "hover:bg-card/80 hover:shadow-md hover:border-primary/30 transition-all duration-300",
          isSelected && "ring-2 ring-primary border-primary bg-primary/5"
        )}
      >
        {onToggleSelect && (
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="shrink-0"
          />
        )}
        
        <div className="relative shrink-0">
          <PlatformLogo platform={connection.platform_type} size="sm" />
          <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card", status.dot)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{connection.platform_name}</p>
          <p className="text-xs text-muted-foreground truncate">{connection.shop_domain}</p>
        </div>
        
        <div className="hidden sm:flex items-center gap-6 text-center">
          <div>
            <p className="text-lg font-bold">{connection.products_synced?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-muted-foreground">Produits</p>
          </div>
          <div>
            <p className="text-lg font-bold">{connection.orders_synced?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-muted-foreground">Commandes</p>
          </div>
          <div>
            <p className="text-sm">{formatLastSync(connection.last_sync_at)}</p>
            <p className="text-[10px] text-muted-foreground">Dernière sync</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs gap-1", status.color, status.bg)}>
            <StatusIcon className={cn("h-3 w-3", connection.connection_status === 'connecting' && 'animate-spin')} />
            <span className="hidden md:inline">{status.label}</span>
          </Badge>
          
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSync} disabled={isSyncing}>
            <RefreshCw className={cn("h-4 w-4", isSyncing && 'animate-spin')} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onManage}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative rounded-2xl border bg-card/60 backdrop-blur-sm overflow-hidden",
        "hover:shadow-xl hover:border-primary/40 transition-all duration-300",
        isSelected && "ring-2 ring-primary border-primary"
      )}
    >
      {/* Top gradient bar based on status */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        connection.connection_status === 'connected' && "bg-gradient-to-r from-emerald-500 to-emerald-400",
        connection.connection_status === 'error' && "bg-gradient-to-r from-red-500 to-red-400",
        connection.connection_status === 'connecting' && "bg-gradient-to-r from-amber-500 to-amber-400",
        connection.connection_status === 'disconnected' && "bg-gradient-to-r from-muted to-muted-foreground/50"
      )} />

      {onToggleSelect && (
        <div className="absolute top-4 left-4 z-10">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="bg-background/80 backdrop-blur-sm"
          />
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative">
            <div className="p-2 rounded-xl bg-muted/50 group-hover:bg-muted transition-colors">
              <PlatformLogo platform={connection.platform_type} size="md" />
            </div>
            <span className={cn(
              "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card",
              status.dot
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base truncate">{connection.platform_name}</h3>
            <p className="text-xs text-muted-foreground truncate">{connection.shop_domain}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Produits</span>
            </div>
            <p className="text-xl font-bold">{connection.products_synced?.toLocaleString() || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Commandes</span>
            </div>
            <p className="text-xl font-bold">{connection.orders_synced?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Last sync */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Timer className="h-3.5 w-3.5" />
          <span>Sync: {formatLastSync(connection.last_sync_at)}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-4 border-t border-border/50">
          <Badge variant="outline" className={cn("text-xs gap-1", status.color, status.bg)}>
            <StatusIcon className={cn("h-3 w-3", connection.connection_status === 'connecting' && 'animate-spin')} />
            {status.label}
          </Badge>
          
          {connection.auto_sync_enabled && (
            <Badge variant="outline" className="text-xs text-primary bg-primary/10 border-primary/30 gap-1">
              <Zap className="h-3 w-3" />
              Auto
            </Badge>
          )}

          <div className="flex-1" />

          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={onSync} disabled={isSyncing}>
            <RefreshCw className={cn("h-4 w-4", isSyncing && 'animate-spin')} />
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 gap-1.5 bg-primary/90 hover:bg-primary"
            onClick={onManage}
          >
            Gérer
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ============= PLATFORM CARD PREMIUM =============
interface PlatformCardPremiumProps {
  platform: typeof STORE_PLATFORMS[0]
  onConnect: () => void
  index: number
}

function PlatformCardPremium({ platform, onConnect, index }: PlatformCardPremiumProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onConnect}
      className={cn(
        "group cursor-pointer p-4 rounded-xl border-2 border-dashed border-border/50",
        "bg-gradient-to-br from-card/50 to-muted/20 backdrop-blur-sm",
        "hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg transition-all duration-300"
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="p-2 rounded-xl bg-muted/50 group-hover:bg-background transition-colors">
          <PlatformLogo platform={platform.id} size="md" />
        </div>
        <div>
          <p className="font-semibold text-sm">{platform.name}</p>
          <p className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 justify-center mt-1">
            <Plus className="h-3 w-3" />
            Connecter
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ============= HEALTH METRIC CARD =============
interface HealthMetricProps {
  icon: React.ElementType
  label: string
  value: number
  status: 'good' | 'warning' | 'critical'
}

function HealthMetricCard({ icon: Icon, label, value, status }: HealthMetricProps) {
  const statusColors = {
    good: 'text-emerald-500 bg-emerald-500',
    warning: 'text-amber-500 bg-amber-500',
    critical: 'text-red-500 bg-red-500'
  }
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn("p-2 rounded-lg", statusColors[status].replace('text-', 'bg-') + '/10')}>
        <Icon className={cn("h-4 w-4", statusColors[status].split(' ')[0])} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <Progress 
            value={value} 
            className="h-1.5 flex-1" 
          />
          <span className={cn("text-xs font-semibold", statusColors[status].split(' ')[0])}>{value}%</span>
        </div>
      </div>
    </div>
  )
}

// ============= ACTIVE JOBS SIDEBAR =============
function ActiveJobsSidebar() {
  const { activeJobs, jobs } = useApiJobs({ limit: 5, jobType: 'sync' })
  
  const recentJobs = jobs.slice(0, 5)
  if (recentJobs.length === 0) return null

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          Jobs Sync
          {activeJobs.length > 0 && (
            <Badge className="text-[10px] bg-primary/10 text-primary border-0">
              {activeJobs.length} actif{activeJobs.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {recentJobs.map(job => {
          const isActive = job.status === 'running' || job.status === 'pending'
          const isDone = job.status === 'completed'
          const isFail = job.status === 'failed'
          return (
            <div key={job.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
              {isActive ? (
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
              ) : isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : isFail ? (
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="flex-1 truncate capitalize">{job.job_type?.replace(/_/g, ' ')}</span>
              {isActive && (
                <span className="text-primary font-medium">{Math.round(job.progress_percent || 0)}%</span>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ============= MAIN COMPONENT =============
export default function StoresAndChannelsHub() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'
  
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<FilterConfig>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Hooks with real data
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
      
      return matchesSearch && matchesTab && matchesStatus
    })
  }, [connections, searchTerm, activeTab, filters])

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => setSelectedIds(new Set(filteredConnections.map(c => c.id))), [filteredConnections])
  const deselectAll = useCallback(() => setSelectedIds(new Set()), [])

  // Bulk actions
  const bulkActions = useMemo(() => [
    { id: 'sync-all', label: 'Synchroniser', icon: RefreshCw, onClick: () => syncMutation.mutate(Array.from(selectedIds)) },
    { id: 'enable-autosync', label: 'Auto-Sync On', icon: Zap, onClick: () => toggleAutoSyncMutation.mutate({ connectionIds: Array.from(selectedIds), enabled: true }) },
    { id: 'disable-autosync', label: 'Auto-Sync Off', icon: EyeOff, variant: 'outline' as const, onClick: () => toggleAutoSyncMutation.mutate({ connectionIds: Array.from(selectedIds), enabled: false }) },
    { id: 'export', label: 'Exporter', icon: Download, onClick: () => { exportChannels(Array.from(selectedIds)); deselectAll() } },
    { id: 'delete', label: 'Supprimer', icon: Trash2, variant: 'destructive' as const, onClick: () => setShowBulkDeleteConfirm(true) }
  ], [selectedIds, syncMutation, toggleAutoSyncMutation, deleteMutation, exportChannels, deselectAll])

  // Available platforms
  const connectedPlatformIds = connections.map(c => c.platform_type?.toLowerCase())
  const availableStores = STORE_PLATFORMS.filter(p => !connectedPlatformIds.includes(p.id))
  const availableMarketplaces = MARKETPLACE_PLATFORMS.filter(p => !connectedPlatformIds.includes(p.id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des canaux...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Boutiques & Canaux - ShopOpti</title>
        <meta name="description" content="Gérez vos connexions boutiques et marketplaces. Synchronisez vos produits en temps réel." />
      </Helmet>

      <ChannablePageWrapper
        title="Boutiques & Canaux"
        subtitle="Gestion Multi-Canal"
        description="Connectez vos boutiques et publiez sur les marketplaces. Synchronisation en temps réel."
        heroImage="integrations"
        badge={{
          label: `${connections.filter(c => c.connection_status === 'connected').length} actifs`,
          icon: Link2
        }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ChannableSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher..."
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
              className="h-9 w-9 p-0 bg-background/50"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>

            <Button
              size="sm"
              onClick={() => navigate('/stores-channels/connect?type=store')}
              className="h-9 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              <Store className="h-4 w-4" />
              {!isMobile && 'Boutique'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/stores-channels/connect?type=marketplace')}
              className="h-9 gap-2 bg-background/50"
            >
              <ShoppingCart className="h-4 w-4" />
              {!isMobile && 'Marketplace'}
            </Button>
          </div>
        }
      >
        {/* Premium Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <PremiumStatCard
            label="Canaux Connectés"
            value={connections.filter(c => c.connection_status === 'connected').length}
            change="+1"
            trend="up"
            icon={Link2}
            gradient="bg-gradient-to-r from-primary to-primary/70"
            delay={0}
          />
          <PremiumStatCard
            label="Boutiques"
            value={connections.filter(c => STORE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length}
            icon={Store}
            gradient="bg-gradient-to-r from-violet-500 to-violet-400"
            delay={1}
          />
          <PremiumStatCard
            label="Marketplaces"
            value={connections.filter(c => MARKETPLACE_PLATFORMS.some(p => p.id === c.platform_type?.toLowerCase())).length}
            icon={Globe}
            gradient="bg-gradient-to-r from-amber-500 to-amber-400"
            delay={2}
          />
          <PremiumStatCard
            label="Produits Sync"
            value={connections.reduce((acc, c) => acc + (c.products_synced || 0), 0).toLocaleString()}
            change="+156"
            trend="up"
            icon={Package}
            gradient="bg-gradient-to-r from-blue-500 to-blue-400"
            delay={3}
          />
          <PremiumStatCard
            label="Commandes"
            value={connections.reduce((acc, c) => acc + (c.orders_synced || 0), 0).toLocaleString()}
            change="+89"
            trend="up"
            icon={TrendingUp}
            gradient="bg-gradient-to-r from-emerald-500 to-emerald-400"
            delay={4}
          />
          <PremiumStatCard
            label="Auto-Sync"
            value={connections.filter(c => c.auto_sync_enabled).length}
            icon={Zap}
            gradient="bg-gradient-to-r from-orange-500 to-orange-400"
            delay={5}
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
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ChannableBulkActions
                selectedCount={selectedIds.size}
                totalCount={filteredConnections.length}
                selectedIds={Array.from(selectedIds)}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                isAllSelected={selectedIds.size === filteredConnections.length && filteredConnections.length > 0}
                actions={bulkActions}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Connected Channels */}
            {filteredConnections.length > 0 ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    Canaux connectés
                    <Badge className="bg-primary/10 text-primary border-0">{filteredConnections.length}</Badge>
                  </h2>
                </div>
                
                <div className={cn(
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                    : 'flex flex-col gap-3'
                )}>
                  <AnimatePresence mode="popLayout">
                    {filteredConnections.map((connection, index) => (
                      <ChannelCardPremium
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
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  Boutiques disponibles
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {availableStores.map((platform, i) => (
                    <PlatformCardPremium 
                      key={platform.id}
                      platform={platform}
                      onConnect={() => navigate(`/stores-channels/connect/${platform.id}`)}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Available Marketplaces */}
            {(activeTab === 'all' || activeTab === 'marketplaces') && availableMarketplaces.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10">
                    <ShoppingCart className="h-5 w-5 text-amber-500" />
                  </div>
                  Marketplaces disponibles
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {availableMarketplaces.map((platform, i) => (
                    <PlatformCardPremium 
                      key={platform.id}
                      platform={platform}
                      onConnect={() => navigate(`/stores-channels/connect/${platform.id}`)}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Active Jobs from FastAPI */}
            <ActiveJobsSidebar />

            {/* Channel Health */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  Santé des canaux
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <HealthMetricCard
                  icon={Wifi}
                  label="Taux de synchronisation"
                  value={healthMetrics?.syncRate || 100}
                  status={healthMetrics?.syncRate >= 80 ? 'good' : healthMetrics?.syncRate >= 50 ? 'warning' : 'critical'}
                />
                <HealthMetricCard
                  icon={AlertCircle}
                  label="Taux d'erreur"
                  value={100 - (healthMetrics?.errorRate || 0)}
                  status={healthMetrics?.errorRate <= 5 ? 'good' : healthMetrics?.errorRate <= 20 ? 'warning' : 'critical'}
                />
                <HealthMetricCard
                  icon={Activity}
                  label="Disponibilité"
                  value={healthMetrics?.uptime || 100}
                  status={healthMetrics?.uptime >= 95 ? 'good' : healthMetrics?.uptime >= 80 ? 'warning' : 'critical'}
                />
                <HealthMetricCard
                  icon={Timer}
                  label="Latence"
                  value={Math.max(0, 100 - (healthMetrics?.avgLatency || 0) * 10)}
                  status={healthMetrics?.avgLatency <= 5 ? 'good' : healthMetrics?.avgLatency <= 15 ? 'warning' : 'critical'}
                />
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  Activité récente
                  <Badge className="text-[10px] bg-primary/10 text-primary border-0 animate-pulse">
                    Temps réel
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[280px]">
                  {activityEvents.length > 0 ? (
                    <div className="p-4">
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
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Activity className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Les synchronisations apparaîtront ici
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </ChannablePageWrapper>
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        title={`Supprimer ${selectedIds.size} canal(aux) ?`}
        description="Cette action est irréversible."
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={() => { deleteMutation.mutate(Array.from(selectedIds)); deselectAll(); setShowBulkDeleteConfirm(false) }}
      />
    </>
  )
}
