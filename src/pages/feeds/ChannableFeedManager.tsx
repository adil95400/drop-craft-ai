/**
 * Channable-Style Feed Manager — Inspired by Channable's Export Feeds UI
 * Professional feed management with channel table, quality scores, and rules
 */
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useProductFeeds, ProductFeed } from '@/hooks/useProductFeeds'
import { useToast } from '@/hooks/use-toast'
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rss, Plus, RefreshCw, CheckCircle, AlertTriangle, XCircle,
  ExternalLink, Trash2, Clock, Package, TrendingUp, Search, Loader2, Store,
  Sparkles, Zap, Globe, Filter, Settings, ArrowRight, ArrowLeft,
  Check, Tag, Star, Shield, Eye, BarChart3, GitBranch, FolderTree,
  AlertCircle, ChevronDown, MoreHorizontal, Download, Copy
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Marketplace configurations
const MARKETPLACE_CATEGORIES = [
  { id: 'popular', name: 'Populaires', icon: Star },
  { id: 'shopping', name: 'Comparateurs', icon: Search },
  { id: 'social', name: 'Social Commerce', icon: Globe },
  { id: 'europe', name: 'Europe', icon: Globe },
  { id: 'international', name: 'International', icon: Globe },
  { id: 'niche', name: 'Niche', icon: Tag },
  { id: 'affiliate', name: 'Affiliation', icon: Zap },
]

const getMarketplaceLogoPath = (id: string): string | null => {
  const logoMap: Record<string, string> = {
    amazon: '/logos/amazon.svg', ebay: '/logos/ebay.svg', google_shopping: '/logos/google.svg',
    meta: '/logos/meta-color.svg', shopify: '/logos/shopify.svg', woocommerce: '/logos/woocommerce.svg',
    prestashop: '/logos/prestashop.svg', magento: '/logos/magento.svg', tiktok: '/logos/tiktok-shop.svg',
    instagram: '/logos/instagram-color.svg', pinterest: '/logos/pinterest.svg', facebook: '/logos/facebook.svg',
    cdiscount: '/logos/cdiscount.svg', fnac: '/logos/fnac.svg', zalando: '/logos/zalando.svg',
    aliexpress: '/logos/aliexpress.svg', rakuten: '/logos/rakuten.svg', etsy: '/logos/etsy.svg',
    google: '/logos/google.svg', google_ads: '/logos/google-ads.svg',
  }
  return logoMap[id] || null
}

const MARKETPLACES = [
  { id: 'amazon', name: 'Amazon', emoji: '🛒', category: 'popular', status: 'popular' },
  { id: 'ebay', name: 'eBay', emoji: '🏷️', category: 'popular', status: 'popular' },
  { id: 'google_shopping', name: 'Google Shopping', emoji: '🔍', category: 'popular', status: 'popular' },
  { id: 'meta', name: 'Meta Commerce', emoji: '📘', category: 'popular', status: 'popular' },
  { id: 'shopify', name: 'Shopify', emoji: '🛍️', category: 'popular', status: 'popular' },
  { id: 'woocommerce', name: 'WooCommerce', emoji: '🔮', category: 'popular', status: 'popular' },
  { id: 'prestashop', name: 'PrestaShop', emoji: '🛒', category: 'popular', status: 'popular' },
  { id: 'magento', name: 'Magento', emoji: '🧱', category: 'popular', status: 'popular' },
  { id: 'tiktok', name: 'TikTok Shop', emoji: '🎵', category: 'social', status: 'trending' },
  { id: 'instagram', name: 'Instagram Shopping', emoji: '📸', category: 'social', status: 'trending' },
  { id: 'pinterest', name: 'Pinterest', emoji: '📌', category: 'social', status: 'popular' },
  { id: 'facebook', name: 'Facebook Shop', emoji: '📘', category: 'social', status: 'popular' },
  { id: 'bing_shopping', name: 'Bing Shopping', emoji: '🔷', category: 'shopping', status: 'popular' },
  { id: 'idealo', name: 'Idealo', emoji: '💡', category: 'shopping', status: 'eu' },
  { id: 'kelkoo', name: 'Kelkoo', emoji: '🔶', category: 'shopping', status: 'eu' },
  { id: 'google_ads', name: 'Google Ads', emoji: '📢', category: 'shopping', status: 'popular' },
  { id: 'cdiscount', name: 'Cdiscount', emoji: '🇫🇷', category: 'europe', status: 'eu' },
  { id: 'fnac', name: 'Fnac', emoji: '🇫🇷', category: 'europe', status: 'eu' },
  { id: 'zalando', name: 'Zalando', emoji: '👟', category: 'europe', status: 'eu' },
  { id: 'manomano', name: 'ManoMano', emoji: '🔧', category: 'europe', status: 'eu' },
  { id: 'walmart', name: 'Walmart', emoji: '🏪', category: 'international', status: 'popular' },
  { id: 'aliexpress', name: 'AliExpress', emoji: '🇨🇳', category: 'international', status: 'popular' },
  { id: 'rakuten', name: 'Rakuten', emoji: '🇯🇵', category: 'international', status: 'popular' },
  { id: 'shopee', name: 'Shopee', emoji: '🧡', category: 'international', status: 'trending' },
  { id: 'etsy', name: 'Etsy', emoji: '🎨', category: 'niche', status: 'popular' },
  { id: 'wayfair', name: 'Wayfair', emoji: '🏠', category: 'niche', status: 'popular' },
  { id: 'decathlon', name: 'Decathlon', emoji: '⚽', category: 'niche', status: 'eu' },
  { id: 'awin', name: 'Awin', emoji: '🔗', category: 'affiliate', status: 'popular' },
  { id: 'cj', name: 'CJ Affiliate', emoji: '🤝', category: 'affiliate', status: 'popular' },
  { id: 'criteo', name: 'Criteo', emoji: '🎯', category: 'affiliate', status: 'popular' },
]

const MarketplaceLogo = ({ id, emoji, size = 24 }: { id: string; emoji: string; size?: number }) => {
  const logoPath = getMarketplaceLogoPath(id)
  if (logoPath) {
    return (
      <img src={logoPath} alt={id} className="object-contain" style={{ width: size, height: size }}
        onError={(e) => {
          const parent = e.currentTarget.parentElement
          if (parent) parent.innerHTML = `<span style="font-size: ${size}px">${emoji}</span>`
        }}
      />
    )
  }
  return <span style={{ fontSize: size }}>{emoji}</span>
}

// Quality score component — inspired by Channable's quality indicator
const QualityScore = ({ score }: { score: number }) => {
  const getColor = () => {
    if (score >= 80) return 'text-green-600 bg-green-500/10 border-green-500/20'
    if (score >= 50) return 'text-amber-600 bg-amber-500/10 border-amber-500/20'
    return 'text-red-600 bg-red-500/10 border-red-500/20'
  }
  const getIcon = () => {
    if (score >= 80) return <CheckCircle className="h-3.5 w-3.5" />
    if (score >= 50) return <AlertCircle className="h-3.5 w-3.5" />
    return <XCircle className="h-3.5 w-3.5" />
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold", getColor())}>
            {getIcon()}
            {score}%
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Score de qualité du feed</p>
          <p className="text-xs text-muted-foreground">
            {score >= 80 ? 'Excellent — prêt pour la marketplace' : score >= 50 ? 'Moyen — améliorations recommandées' : 'Faible — corrections nécessaires'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Feed status chip
const FeedStatusChip = ({ status }: { status: string | null }) => {
  const configs: Record<string, { color: string; icon: any; label: string }> = {
    completed: { color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: CheckCircle, label: 'Actif' },
    pending: { color: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: Clock, label: 'En attente' },
    error: { color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: XCircle, label: 'Erreur' },
    generating: { color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: RefreshCw, label: 'Génération...' },
  }
  const config = configs[status || 'pending'] || configs.pending
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn("gap-1 border", config.color)}>
      <Icon className={cn("h-3 w-3", status === 'generating' && "animate-spin")} />
      {config.label}
    </Badge>
  )
}

export default function ChannableFeedManager() {
  const { toast } = useToast()
  const { feeds, isLoading: isLoadingFeeds, stats, createFeed, isCreating, deleteFeed, generateFeed, isGenerating } = useProductFeeds()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('popular')
  const [newFeed, setNewFeed] = useState({ name: '', marketplace: '' })
  const [expandedFeed, setExpandedFeed] = useState<string | null>(null)

  const filteredFeeds = useMemo(() => {
    return feeds.filter(feed => {
      const matchesSearch = feed.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || feed.generation_status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [feeds, searchTerm, statusFilter])

  const getMarketplaceName = (feedType: string) => {
    return MARKETPLACES.find(m => m.id === feedType)?.name || feedType
  }

  const getQualityScore = (feed: ProductFeed) => {
    // Compute quality score based on feed completeness
    let score = 0
    if (feed.name) score += 15
    if (feed.product_count && feed.product_count > 0) score += 25
    if (feed.generation_status === 'completed') score += 25
    if (feed.feed_url) score += 20
    if (feed.last_generated_at) score += 15
    return Math.min(score, 100)
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

  const selectedMp = MARKETPLACES.find(mp => mp.id === newFeed.marketplace)

  return (
    <ChannablePageWrapper
      title="Export Feeds"
      subtitle="Canaux de vente"
      description={`${stats.totalFeeds} feeds configurés • ${stats.activeFeeds} actifs • ${stats.totalProducts.toLocaleString()} produits synchronisés sur ${MARKETPLACES.length}+ marketplaces`}
      heroImage="integrations"
      badge={{ label: "Feeds", icon: Rss }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur" onClick={() => {/* refresh */}}>
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Feed
          </Button>
        </div>
      }
    >
      <FeedSubNavigation />

      {/* Channable-style KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Feeds actifs', value: stats.activeFeeds, icon: Rss, color: 'text-primary' },
          { label: 'Produits exportés', value: stats.totalProducts.toLocaleString(), icon: Package, color: 'text-blue-600' },
          { label: 'Canaux connectés', value: new Set(feeds.map(f => f.feed_type)).size, icon: Globe, color: 'text-green-600' },
          { label: 'Erreurs', value: feeds.filter(f => f.generation_status === 'error').length, icon: AlertTriangle, color: 'text-red-600' },
          { label: 'Qualité moyenne', value: feeds.length > 0 ? `${Math.round(feeds.reduce((sum, f) => sum + getQualityScore(f), 0) / feeds.length)}%` : '--', icon: Shield, color: 'text-amber-600' },
        ].map(kpi => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Bar — Channable style */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par nom, canal..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">Actifs</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="error">En erreur</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="h-9 px-3 flex items-center gap-1 whitespace-nowrap">
              {filteredFeeds.length} feed{filteredFeeds.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Feed Table — Channable's Export Feeds Style */}
      <AnimatePresence mode="wait">
        {isLoadingFeeds ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Chargement des feeds...</p>
            </div>
          </div>
        ) : filteredFeeds.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-2xl bg-primary/5 mb-4">
                <Rss className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucun feed configuré</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Connectez vos premiers canaux de vente pour exporter vos produits vers 2,500+ marketplaces, plateformes publicitaires et comparateurs.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un feed
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12">Canal</TableHead>
                  <TableHead>Nom du feed</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Produits</TableHead>
                  <TableHead className="text-center">Qualité</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeeds.map((feed, index) => {
                  const mp = MARKETPLACES.find(m => m.id === feed.feed_type)
                  const quality = getQualityScore(feed)
                  const isExpanded = expandedFeed === feed.id

                  return (
                    <>
                      <TableRow 
                        key={feed.id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isExpanded && "bg-muted/20 border-b-0"
                        )}
                        onClick={() => setExpandedFeed(isExpanded ? null : feed.id)}
                      >
                        <TableCell>
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                            <MarketplaceLogo id={feed.feed_type} emoji={mp?.emoji || '📦'} size={28} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{feed.name}</p>
                            <p className="text-xs text-muted-foreground">{getMarketplaceName(feed.feed_type)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <FeedStatusChip status={feed.generation_status} />
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-semibold text-sm">{(feed.product_count || 0).toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <QualityScore score={quality} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {feed.last_generated_at 
                              ? new Date(feed.last_generated_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                              : 'Jamais'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => generateFeed(feed.id)} disabled={isGenerating}>
                                    <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Synchroniser</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {feed.feed_url && (
                                  <DropdownMenuItem asChild>
                                    <a href={feed.feed_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-2" />Ouvrir le feed
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(feed.feed_url || '')}>
                                  <Copy className="h-4 w-4 mr-2" />Copier l'URL
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />Télécharger
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="h-4 w-4 mr-2" />Paramètres
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteFeed(feed.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded row — Channable-style feed details with tabs */}
                      {isExpanded && (
                        <TableRow key={`${feed.id}-detail`} className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={7} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="p-5 border-t">
                                <Tabs defaultValue="settings" className="w-full">
                                  <TabsList className="h-9 bg-muted/50">
                                    <TabsTrigger value="settings" className="text-xs gap-1.5"><Settings className="h-3.5 w-3.5" />Paramètres</TabsTrigger>
                                    <TabsTrigger value="categories" className="text-xs gap-1.5"><FolderTree className="h-3.5 w-3.5" />Catégories</TabsTrigger>
                                    <TabsTrigger value="rules" className="text-xs gap-1.5"><GitBranch className="h-3.5 w-3.5" />Règles</TabsTrigger>
                                    <TabsTrigger value="quality" className="text-xs gap-1.5"><Shield className="h-3.5 w-3.5" />Qualité</TabsTrigger>
                                    <TabsTrigger value="preview" className="text-xs gap-1.5"><Eye className="h-3.5 w-3.5" />Aperçu</TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="settings" className="mt-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Format</p>
                                        <Badge variant="outline">XML</Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Fréquence</p>
                                        <Badge variant="outline">Toutes les 24h</Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Pays cible</p>
                                        <Badge variant="outline">🇫🇷 France</Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Optimisation IA</p>
                                        <Badge className="bg-primary/10 text-primary border-primary/20">
                                          <Sparkles className="h-3 w-3 mr-1" />Activée
                                        </Badge>
                                      </div>
                                    </div>
                                    {feed.feed_url && (
                                      <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center gap-2">
                                        <code className="text-xs flex-1 truncate text-muted-foreground">{feed.feed_url}</code>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigator.clipboard.writeText(feed.feed_url || '')}>
                                          <Copy className="h-3 w-3 mr-1" />Copier
                                        </Button>
                                      </div>
                                    )}
                                  </TabsContent>

                                  <TabsContent value="categories" className="mt-4">
                                    <div className="text-center py-6 text-muted-foreground">
                                      <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm font-medium">Smart Categorization</p>
                                      <p className="text-xs">Mappez vos catégories vers la taxonomie {getMarketplaceName(feed.feed_type)}</p>
                                      <Button variant="outline" size="sm" className="mt-3 gap-1">
                                        <Sparkles className="h-3.5 w-3.5" />Auto-mapper
                                      </Button>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="rules" className="mt-4">
                                    <div className="text-center py-6 text-muted-foreground">
                                      <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm font-medium">Règles IF/THEN</p>
                                      <p className="text-xs">Transformez automatiquement vos données produit</p>
                                      <Button variant="outline" size="sm" className="mt-3 gap-1">
                                        <Plus className="h-3.5 w-3.5" />Ajouter une règle
                                      </Button>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="quality" className="mt-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Score global</span>
                                        <QualityScore score={quality} />
                                      </div>
                                      <Progress value={quality} className="h-2" />
                                      <div className="grid grid-cols-2 gap-3 mt-3">
                                        {[
                                          { label: 'Titres optimisés', done: true },
                                          { label: 'Images présentes', done: feed.product_count ? feed.product_count > 0 : false },
                                          { label: 'Catégories mappées', done: false },
                                          { label: 'Prix & disponibilité', done: feed.generation_status === 'completed' },
                                        ].map(item => (
                                          <div key={item.label} className="flex items-center gap-2 text-sm">
                                            {item.done ? (
                                              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                            ) : (
                                              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                                            )}
                                            <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="preview" className="mt-4">
                                    <div className="text-center py-6 text-muted-foreground">
                                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm font-medium">Aperçu du Feed</p>
                                      <p className="text-xs">{feed.product_count || 0} produits • Format XML</p>
                                      <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => generateFeed(feed.id)} disabled={isGenerating}>
                                        <RefreshCw className={cn("h-3.5 w-3.5", isGenerating && "animate-spin")} />
                                        Générer l'aperçu
                                      </Button>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </AnimatePresence>

      {/* Quick Add Marketplace Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Ajouter un canal
              </CardTitle>
              <CardDescription>{MARKETPLACES.length}+ marketplaces et canaux supportés</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {MARKETPLACE_CATEGORIES.map(cat => {
                const Icon = cat.icon
                const count = MARKETPLACES.filter(mp => mp.category === cat.id).length
                return (
                  <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background">
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{cat.name}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">{count}</Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {MARKETPLACE_CATEGORIES.map(cat => (
              <TabsContent key={cat.id} value={cat.id} className="mt-3">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
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
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all hover:border-primary hover:shadow-md bg-card"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <MarketplaceLogo id={mp.id} emoji={mp.emoji} size={20} />
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight">{mp.name}</span>
                    </motion.button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMp ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <MarketplaceLogo id={selectedMp.id} emoji={selectedMp.emoji} size={20} />
                  </div>
                  {createStep === 1 ? "Choisir un canal" : `Configuration — ${selectedMp.name}`}
                </>
              ) : (
                <><Plus className="h-5 w-5" />Nouveau feed</>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            <div className="flex items-center gap-2 mb-4">
              <div className={cn("flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold", createStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>1</div>
              <div className={cn("h-0.5 flex-1", createStep >= 2 ? "bg-primary" : "bg-muted")} />
              <div className={cn("flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold", createStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>2</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {createStep === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 w-full">
                    {MARKETPLACE_CATEGORIES.slice(0, 4).map(cat => {
                      const Icon = cat.icon
                      return (
                        <TabsTrigger key={cat.id} value={cat.id} className="flex-1 flex items-center justify-center gap-1 text-xs">
                          <Icon className="h-3 w-3" />{cat.name}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                  {MARKETPLACE_CATEGORIES.map(cat => (
                    <TabsContent key={cat.id} value={cat.id} className="mt-3">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {MARKETPLACES.filter(mp => mp.category === cat.id).slice(0, 8).map(mp => (
                          <button
                            key={mp.id}
                            onClick={() => setNewFeed({ ...newFeed, marketplace: mp.id, name: `${mp.name} Feed` })}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm",
                              newFeed.marketplace === mp.id ? "border-primary bg-primary/5 shadow-md" : "border-border/50 hover:border-border bg-card"
                            )}
                          >
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <MarketplaceLogo id={mp.id} emoji={mp.emoji} size={24} />
                            </div>
                            <span className="text-xs font-medium">{mp.name}</span>
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {selectedMp && (
                  <div className="p-3 rounded-xl border bg-muted/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <MarketplaceLogo id={selectedMp.id} emoji={selectedMp.emoji} size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedMp.name}</p>
                      <p className="text-xs text-muted-foreground">Canal sélectionné</p>
                    </div>
                    <Badge className="ml-auto" variant="outline"><Check className="h-3 w-3 mr-1" />OK</Badge>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Nom du feed</Label>
                  <Input
                    value={newFeed.name}
                    onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                    placeholder={`Ex: ${selectedMp?.name || 'Amazon'} FR — Catalogue`}
                    className="h-10"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button variant="ghost" onClick={createStep === 1 ? handleCloseDialog : () => setCreateStep(1)} className="gap-2">
              {createStep === 1 ? 'Annuler' : <><ArrowLeft className="h-4 w-4" />Retour</>}
            </Button>
            {createStep === 1 ? (
              <Button onClick={() => setCreateStep(2)} disabled={!newFeed.marketplace} className="gap-2">
                Continuer<ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCreateFeed} disabled={isCreating || !newFeed.name} className="gap-2">
                {isCreating ? <><Loader2 className="h-4 w-4 animate-spin" />Création...</> : <><Check className="h-4 w-4" />Créer le feed</>}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ChannablePageWrapper>
  )
}
