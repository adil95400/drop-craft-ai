/**
 * Channable-Style Feed Manager
 * Gestion professionnelle des feeds marketplace - Design moderne optimisé
 */
import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useProductFeeds, ProductFeed } from '@/hooks/useProductFeeds'
import { useToast } from '@/hooks/use-toast'
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation'
import { cn } from '@/lib/utils'
import {
  Rss, Plus, RefreshCw, CheckCircle, AlertTriangle, XCircle,
  ExternalLink, Trash2, Clock, Package, TrendingUp, Search, Loader2, Store,
  Sparkles, Zap, Globe, Filter, LayoutGrid, List, ArrowRight, ArrowLeft,
  Check, Settings, Eye, Copy, Download, BarChart3, Activity, Star, 
  ShoppingCart, Tag, ChevronRight
} from 'lucide-react'

// Marketplace configurations
const MARKETPLACE_CATEGORIES = [
  { id: 'popular', name: 'Populaires', icon: Star, color: 'from-amber-500 to-orange-500' },
  { id: 'shopping', name: 'Comparateurs', icon: Search, color: 'from-blue-500 to-cyan-500' },
  { id: 'social', name: 'Social Commerce', icon: Globe, color: 'from-pink-500 to-rose-500' },
  { id: 'europe', name: 'Europe', icon: Globe, color: 'from-indigo-500 to-purple-500' },
  { id: 'international', name: 'International', icon: Globe, color: 'from-green-500 to-emerald-500' },
  { id: 'niche', name: 'Niche', icon: Tag, color: 'from-violet-500 to-purple-500' },
  { id: 'affiliate', name: 'Affiliation', icon: Zap, color: 'from-red-500 to-orange-500' },
]

const getMarketplaceLogoPath = (id: string): string | null => {
  const logoMap: Record<string, string> = {
    amazon: '/logos/amazon.svg',
    ebay: '/logos/ebay.svg',
    google_shopping: '/logos/google.svg',
    meta: '/logos/meta-color.svg',
    shopify: '/logos/shopify.svg',
    woocommerce: '/logos/woocommerce.svg',
    prestashop: '/logos/prestashop.svg',
    magento: '/logos/magento.svg',
    tiktok: '/logos/tiktok-shop.svg',
    instagram: '/logos/instagram-color.svg',
    pinterest: '/logos/pinterest.svg',
    facebook: '/logos/facebook.svg',
    cdiscount: '/logos/cdiscount.svg',
    fnac: '/logos/fnac.svg',
    zalando: '/logos/zalando.svg',
    aliexpress: '/logos/aliexpress.svg',
    rakuten: '/logos/rakuten.svg',
    etsy: '/logos/etsy.svg',
    google: '/logos/google.svg',
    google_ads: '/logos/google-ads.svg',
  }
  return logoMap[id] || null
}

const MARKETPLACES = [
  // Popular Marketplaces
  { id: 'amazon', name: 'Amazon', emoji: '🛒', category: 'popular', status: 'popular', color: 'from-orange-500 to-amber-500' },
  { id: 'ebay', name: 'eBay', emoji: '🏷️', category: 'popular', status: 'popular', color: 'from-blue-500 to-indigo-500' },
  { id: 'google_shopping', name: 'Google Shopping', emoji: '🔍', category: 'popular', status: 'popular', color: 'from-red-500 to-yellow-500' },
  { id: 'meta', name: 'Meta Commerce', emoji: '📘', category: 'popular', status: 'popular', color: 'from-blue-600 to-blue-500' },
  { id: 'shopify', name: 'Shopify', emoji: '🛍️', category: 'popular', status: 'popular', color: 'from-green-500 to-emerald-500' },
  { id: 'woocommerce', name: 'WooCommerce', emoji: '🔮', category: 'popular', status: 'popular', color: 'from-purple-500 to-violet-500' },
  { id: 'prestashop', name: 'PrestaShop', emoji: '🛒', category: 'popular', status: 'popular', color: 'from-pink-500 to-rose-500' },
  { id: 'magento', name: 'Magento', emoji: '🧱', category: 'popular', status: 'popular', color: 'from-orange-600 to-red-500' },
  
  // Social Commerce
  { id: 'tiktok', name: 'TikTok Shop', emoji: '🎵', category: 'social', status: 'trending', color: 'from-black to-gray-800' },
  { id: 'instagram', name: 'Instagram Shopping', emoji: '📸', category: 'social', status: 'trending', color: 'from-purple-500 to-pink-500' },
  { id: 'pinterest', name: 'Pinterest', emoji: '📌', category: 'social', status: 'popular', color: 'from-red-500 to-red-600' },
  { id: 'facebook', name: 'Facebook Shop', emoji: '📘', category: 'social', status: 'popular', color: 'from-blue-600 to-blue-700' },
  
  // Comparateurs
  { id: 'bing_shopping', name: 'Bing Shopping', emoji: '🔷', category: 'shopping', status: 'popular', color: 'from-cyan-500 to-blue-500' },
  { id: 'idealo', name: 'Idealo', emoji: '💡', category: 'shopping', status: 'eu', color: 'from-orange-400 to-amber-500' },
  { id: 'kelkoo', name: 'Kelkoo', emoji: '🔶', category: 'shopping', status: 'eu', color: 'from-orange-500 to-orange-600' },
  { id: 'google_ads', name: 'Google Ads', emoji: '📢', category: 'shopping', status: 'popular', color: 'from-green-500 to-blue-500' },
  
  // Europe
  { id: 'cdiscount', name: 'Cdiscount', emoji: '🇫🇷', category: 'europe', status: 'eu', color: 'from-red-500 to-red-600' },
  { id: 'fnac', name: 'Fnac', emoji: '🇫🇷', category: 'europe', status: 'eu', color: 'from-yellow-500 to-amber-500' },
  { id: 'zalando', name: 'Zalando', emoji: '👟', category: 'europe', status: 'eu', color: 'from-orange-500 to-amber-500' },
  { id: 'manomano', name: 'ManoMano', emoji: '🔧', category: 'europe', status: 'eu', color: 'from-blue-500 to-blue-600' },
  
  // International
  { id: 'walmart', name: 'Walmart', emoji: '🏪', category: 'international', status: 'popular', color: 'from-blue-600 to-blue-700' },
  { id: 'aliexpress', name: 'AliExpress', emoji: '🇨🇳', category: 'international', status: 'popular', color: 'from-red-500 to-orange-500' },
  { id: 'rakuten', name: 'Rakuten', emoji: '🇯🇵', category: 'international', status: 'popular', color: 'from-red-500 to-red-600' },
  { id: 'shopee', name: 'Shopee', emoji: '🧡', category: 'international', status: 'trending', color: 'from-orange-500 to-orange-600' },
  
  // Niche
  { id: 'etsy', name: 'Etsy', emoji: '🎨', category: 'niche', status: 'popular', color: 'from-orange-500 to-amber-500' },
  { id: 'wayfair', name: 'Wayfair', emoji: '🏠', category: 'niche', status: 'popular', color: 'from-purple-500 to-indigo-500' },
  { id: 'decathlon', name: 'Decathlon', emoji: '⚽', category: 'niche', status: 'eu', color: 'from-blue-500 to-blue-600' },
  
  // Affiliate
  { id: 'awin', name: 'Awin', emoji: '🔗', category: 'affiliate', status: 'popular', color: 'from-teal-500 to-cyan-500' },
  { id: 'cj', name: 'CJ Affiliate', emoji: '🤝', category: 'affiliate', status: 'popular', color: 'from-blue-600 to-indigo-600' },
  { id: 'criteo', name: 'Criteo', emoji: '🎯', category: 'affiliate', status: 'popular', color: 'from-orange-500 to-red-500' },
]

// Marketplace Logo Component
const MarketplaceLogo = ({ id, emoji, size = 24 }: { id: string; emoji: string; size?: number }) => {
  const logoPath = getMarketplaceLogoPath(id)
  
  if (logoPath) {
    return (
      <img 
        src={logoPath} 
        alt={id} 
        className="object-contain"
        style={{ width: size, height: size }}
        onError={(e) => {
          const parent = e.currentTarget.parentElement
          if (parent) {
            parent.innerHTML = `<span style="font-size: ${size}px">${emoji}</span>`
          }
        }}
      />
    )
  }
  
  return <span style={{ fontSize: size }}>{emoji}</span>
}

// Stats Card Component
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color,
  delay = 0
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  trend?: number;
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1, duration: 0.3 }}
  >
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50">
      <div className={cn(
        "absolute inset-0 opacity-5 bg-gradient-to-br",
        color
      )} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend >= 0 ? "text-green-600" : "text-red-600"
              )}>
                <TrendingUp className={cn("h-3 w-3", trend < 0 && "rotate-180")} />
                <span>{trend >= 0 ? '+' : ''}{trend}%</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br",
            color
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

// Feed Card Component for Grid View
const FeedCard = ({ 
  feed, 
  onGenerate, 
  onDelete, 
  isGenerating,
  getMarketplaceName,
  delay = 0
}: { 
  feed: ProductFeed; 
  onGenerate: () => void; 
  onDelete: () => void;
  isGenerating: boolean;
  getMarketplaceName: (type: string) => string;
  delay?: number;
}) => {
  const mp = MARKETPLACES.find(m => m.id === feed.feed_type)
  
  const getStatusConfig = (status: string | null) => {
    const configs: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
      completed: { color: 'text-green-600', bgColor: 'bg-green-500/10', icon: CheckCircle, label: 'Actif' },
      pending: { color: 'text-amber-600', bgColor: 'bg-amber-500/10', icon: Clock, label: 'En attente' },
      error: { color: 'text-red-600', bgColor: 'bg-red-500/10', icon: XCircle, label: 'Erreur' },
      generating: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', icon: RefreshCw, label: 'Génération...' },
    }
    return configs[status || 'pending'] || configs.pending
  }

  const statusConfig = getStatusConfig(feed.generation_status)
  const StatusIcon = statusConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: delay * 0.05, duration: 0.2 }}
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 overflow-hidden">
        <div className={cn(
          "h-2 bg-gradient-to-r",
          mp?.color || "from-gray-400 to-gray-500"
        )} />
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-br shrink-0",
              mp?.color || "from-gray-400 to-gray-500"
            )}>
              <MarketplaceLogo id={feed.feed_type} emoji={mp?.emoji || '📦'} size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold truncate">{feed.name}</h3>
                  <p className="text-sm text-muted-foreground">{getMarketplaceName(feed.feed_type)}</p>
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn("shrink-0", statusConfig.bgColor, statusConfig.color)}
                >
                  <StatusIcon className={cn(
                    "h-3 w-3 mr-1",
                    feed.generation_status === 'generating' && "animate-spin"
                  )} />
                  {statusConfig.label}
                </Badge>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Produits</p>
                  <p className="text-lg font-semibold">{(feed.product_count || 0).toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Dernière sync</p>
                  <p className="text-sm font-medium truncate">
                    {feed.last_generated_at 
                      ? new Date(feed.last_generated_at).toLocaleDateString('fr-FR')
                      : 'Jamais'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-1.5", isGenerating && "animate-spin")} />
                  Synchroniser
                </Button>
                {feed.feed_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={feed.feed_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ChannableFeedManager() {
  const { toast } = useToast()
  const { 
    feeds, 
    isLoading: isLoadingFeeds, 
    stats,
    createFeed,
    isCreating,
    deleteFeed,
    generateFeed,
    isGenerating 
  } = useProductFeeds()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('popular')
  const [newFeed, setNewFeed] = useState({ name: '', marketplace: '' })

  const filteredFeeds = useMemo(() => {
    return feeds.filter(feed => {
      const matchesSearch = feed.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || feed.generation_status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [feeds, searchTerm, statusFilter])

  const getMarketplaceName = (feedType: string) => {
    const mp = MARKETPLACES.find(m => m.id === feedType)
    return mp?.name || feedType
  }

  const handleCreateFeed = () => {
    if (!newFeed.name || !newFeed.marketplace) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs', variant: 'destructive' })
      return
    }
    createFeed({ name: newFeed.name, feed_type: newFeed.marketplace })
    setShowCreateDialog(false)
    setNewFeed({ name: '', marketplace: '' })
    setCreateStep(1)
  }

  const handleCloseDialog = () => {
    setShowCreateDialog(false)
    setNewFeed({ name: '', marketplace: '' })
    setCreateStep(1)
  }

  const filteredMarketplaces = MARKETPLACES.filter(mp => mp.category === selectedCategory)
  const selectedMp = MARKETPLACES.find(mp => mp.id === newFeed.marketplace)

  return (
    <>
      <Helmet>
        <title>Feeds & Marketplaces - ShopOpti</title>
        <meta name="description" content="Gérez vos feeds marketplace avec une interface moderne" />
      </Helmet>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <FeedSubNavigation />
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <Rss className="h-6 w-6 text-primary-foreground" />
              </div>
              Feeds & Marketplaces
            </h1>
            <p className="text-muted-foreground mt-1">
              Centralisez et optimisez vos flux produits sur tous vos canaux de vente
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Feed
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Rss} label="Total Feeds" value={stats.totalFeeds} color="from-primary to-primary/80" delay={0} />
          <StatCard icon={CheckCircle} label="Feeds Actifs" value={stats.activeFeeds} trend={12} color="from-green-500 to-emerald-600" delay={1} />
          <StatCard icon={Package} label="Produits" value={stats.totalProducts.toLocaleString()} color="from-blue-500 to-indigo-600" delay={2} />
          <StatCard icon={Clock} label="En Attente" value={stats.pendingFeeds} color="from-amber-500 to-orange-600" delay={3} />
          <StatCard icon={AlertTriangle} label="Erreurs" value={stats.errorFeeds} color="from-red-500 to-rose-600" delay={4} />
        </div>

        {/* Quick Actions - Marketplace Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    Ajouter un Marketplace
                  </CardTitle>
                  <CardDescription>
                    {MARKETPLACES.length}+ marketplaces et canaux de vente supportés
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Intégration rapide
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                  {MARKETPLACE_CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    const count = MARKETPLACES.filter(mp => mp.category === cat.id).length
                    return (
                      <TabsTrigger 
                        key={cat.id} 
                        value={cat.id}
                        className="flex items-center gap-1.5 data-[state=active]:bg-background"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{cat.name}</span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1">{count}</Badge>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
                
                {MARKETPLACE_CATEGORIES.map(cat => (
                  <TabsContent key={cat.id} value={cat.id} className="mt-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {MARKETPLACES.filter(mp => mp.category === cat.id).map(mp => (
                        <motion.button
                          key={mp.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setNewFeed({ name: `${mp.name} Feed`, marketplace: mp.id })
                            setShowCreateDialog(true)
                            setCreateStep(2)
                          }}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                            "hover:border-primary hover:shadow-md bg-card"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg bg-gradient-to-br",
                            mp.color
                          )}>
                            <MarketplaceLogo id={mp.id} emoji={mp.emoji} size={24} />
                          </div>
                          <span className="text-[11px] font-medium text-center leading-tight">
                            {mp.name}
                          </span>
                          {mp.status === 'trending' && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-[9px] px-1.5 py-0">
                              🔥 Hot
                            </Badge>
                          )}
                          {mp.status === 'new' && (
                            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-[9px] px-1.5 py-0">
                              ✨ New
                            </Badge>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters & View Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un feed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Actifs
                  </span>
                </SelectItem>
                <SelectItem value="pending">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-amber-500" />
                    En attente
                  </span>
                </SelectItem>
                <SelectItem value="error">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-500" />
                    En erreur
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Feeds Display */}
        <AnimatePresence mode="wait">
          {isLoadingFeeds ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Chargement des feeds...</p>
              </div>
            </motion.div>
          ) : filteredFeeds.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Rss className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Aucun feed trouvé</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Créez votre premier feed pour synchroniser vos produits sur les marketplaces
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer votre premier feed
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filteredFeeds.map((feed, index) => (
                <FeedCard
                  key={feed.id}
                  feed={feed}
                  onGenerate={() => generateFeed(feed.id)}
                  onDelete={() => deleteFeed(feed.id)}
                  isGenerating={isGenerating}
                  getMarketplaceName={getMarketplaceName}
                  delay={index}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feed</TableHead>
                      <TableHead>Marketplace</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Produits</TableHead>
                      <TableHead>Dernière sync</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeeds.map(feed => {
                      const mp = MARKETPLACES.find(m => m.id === feed.feed_type)
                      const statusConfigs: Record<string, any> = {
                        completed: { icon: CheckCircle, label: 'Actif', class: 'bg-green-500' },
                        pending: { icon: Clock, label: 'En attente', class: 'bg-amber-500' },
                        error: { icon: XCircle, label: 'Erreur', class: 'bg-red-500' },
                        generating: { icon: RefreshCw, label: 'Génération...', class: 'bg-blue-500' },
                      }
                      const status = statusConfigs[feed.generation_status || 'pending']
                      const StatusIcon = status.icon

                      return (
                        <TableRow key={feed.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg bg-gradient-to-br",
                                mp?.color || "from-gray-400 to-gray-500"
                              )}>
                                <MarketplaceLogo id={feed.feed_type} emoji={mp?.emoji || '📦'} size={20} />
                              </div>
                              <div>
                                <p className="font-medium">{feed.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {feed.created_at && new Date(feed.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getMarketplaceName(feed.feed_type)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(status.class, "text-white")}>
                              <StatusIcon className={cn(
                                "h-3 w-3 mr-1",
                                feed.generation_status === 'generating' && "animate-spin"
                              )} />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(feed.product_count || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {feed.last_generated_at ? (
                              <span className="text-sm">
                                {new Date(feed.last_generated_at).toLocaleString('fr-FR')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Jamais</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => generateFeed(feed.id)}
                                disabled={isGenerating}
                              >
                                <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                              </Button>
                              {feed.feed_url && (
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={feed.feed_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteFeed(feed.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            {/* Header with gradient */}
            <div className={cn(
              "relative px-6 pt-6 pb-4 bg-gradient-to-r",
              selectedMp?.color || "from-primary to-primary/80"
            )}>
              <div className="absolute inset-0 bg-grid-white/10" />
              <DialogHeader className="relative text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    {selectedMp ? (
                      <MarketplaceLogo id={selectedMp.id} emoji={selectedMp.emoji} size={24} />
                    ) : (
                      <Plus className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold text-white">
                      {createStep === 1 ? "Choisir un Marketplace" : "Configuration du Feed"}
                    </DialogTitle>
                    <DialogDescription className="text-white/80 mt-0.5">
                      Étape {createStep} sur 2
                    </DialogDescription>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Progress value={(createStep / 2) * 100} className="h-1.5 bg-white/20" />
                </div>
              </DialogHeader>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {createStep === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 w-full">
                        {MARKETPLACE_CATEGORIES.slice(0, 4).map(cat => {
                          const Icon = cat.icon
                          return (
                            <TabsTrigger 
                              key={cat.id} 
                              value={cat.id}
                              className="flex-1 flex items-center justify-center gap-1.5"
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {cat.name}
                            </TabsTrigger>
                          )
                        })}
                      </TabsList>
                      
                      {MARKETPLACE_CATEGORIES.map(cat => (
                        <TabsContent key={cat.id} value={cat.id} className="mt-4">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {MARKETPLACES.filter(mp => mp.category === cat.id).slice(0, 8).map(mp => (
                              <motion.button
                                key={mp.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setNewFeed({ ...newFeed, marketplace: mp.id, name: `${mp.name} Feed` })
                                }}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                  newFeed.marketplace === mp.id
                                    ? "border-primary bg-primary/5 shadow-lg"
                                    : "border-border/50 hover:border-border bg-card"
                                )}
                              >
                                {newFeed.marketplace === mp.id && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 right-2"
                                  >
                                    <div className="p-1 rounded-full bg-primary">
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                  </motion.div>
                                )}
                                <div className={cn(
                                  "p-2.5 rounded-lg bg-gradient-to-br",
                                  mp.color
                                )}>
                                  <MarketplaceLogo id={mp.id} emoji={mp.emoji} size={28} />
                                </div>
                                <span className="text-sm font-medium text-center">{mp.name}</span>
                              </motion.button>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    {selectedMp && (
                      <div className={cn(
                        "p-4 rounded-xl border bg-gradient-to-r",
                        "from-muted/50 to-muted/30"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2.5 rounded-lg bg-gradient-to-br", selectedMp.color)}>
                            <MarketplaceLogo id={selectedMp.id} emoji={selectedMp.emoji} size={24} />
                          </div>
                          <div>
                            <p className="font-medium">{selectedMp.name}</p>
                            <p className="text-xs text-muted-foreground">Marketplace sélectionné</p>
                          </div>
                          <Badge className="ml-auto" variant="outline">
                            <Check className="h-3 w-3 mr-1" />
                            Sélectionné
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Rss className="h-4 w-4 text-primary" />
                        Nom du feed
                      </Label>
                      <Input
                        value={newFeed.name}
                        onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                        placeholder={`Ex: ${selectedMp?.name || 'Amazon'} FR - Catalogue Principal`}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Un nom unique pour identifier ce feed dans votre tableau de bord
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={createStep === 1 ? handleCloseDialog : () => setCreateStep(1)}
                  className="gap-2"
                >
                  {createStep === 1 ? 'Annuler' : (
                    <>
                      <ArrowLeft className="h-4 w-4" />
                      Retour
                    </>
                  )}
                </Button>

                {createStep === 1 ? (
                  <Button
                    onClick={() => setCreateStep(2)}
                    disabled={!newFeed.marketplace}
                    className="gap-2"
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCreateFeed} 
                    disabled={isCreating || !newFeed.name}
                    className="gap-2 min-w-[140px]"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Créer le feed
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
