/**
 * Channable-Style Feed Manager
 * Gestion professionnelle des feeds marketplace - Connecté à Supabase
 */
import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { useProductFeeds, ProductFeed } from '@/hooks/useProductFeeds'
import { useToast } from '@/hooks/use-toast'
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation'
import {
  Rss, Plus, RefreshCw, CheckCircle, AlertTriangle, XCircle,
  ExternalLink, Trash2, Clock, Package, TrendingUp, Search, Loader2, Store
} from 'lucide-react'

// Marketplace configurations - Complete like Channable
const MARKETPLACE_CATEGORIES = [
  { id: 'popular', name: 'Populaires', icon: '⭐' },
  { id: 'shopping', name: 'Comparateurs', icon: '🔍' },
  { id: 'social', name: 'Social Commerce', icon: '📱' },
  { id: 'europe', name: 'Europe', icon: '🇪🇺' },
  { id: 'international', name: 'International', icon: '🌍' },
  { id: 'niche', name: 'Niche', icon: '🎯' },
  { id: 'affiliate', name: 'Affiliation', icon: '🔗' },
]

// Marketplace logo mapping to SVG files
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
    asos: '/logos/asos.svg',
    costco: '/logos/costco.svg',
    bigcommerce: '/logos/bigcommerce.svg',
    squarespace: '/logos/squarespace.svg',
    wix: '/logos/wix.svg',
    google: '/logos/google.svg',
    google_ads: '/logos/google-ads.svg',
    linkedin: '/logos/linkedin.svg',
    whatsapp: '/logos/whatsapp.svg',
    stripe: '/logos/stripe.svg',
    paypal: '/logos/paypal.svg',
    klaviyo: '/logos/klaviyo.svg',
    zapier: '/logos/zapier.svg',
    canva: '/logos/canva.svg',
    bigbuy: '/logos/bigbuy.svg',
    excel: '/logos/excel.svg',
    twitter: '/logos/x.svg',
    x: '/logos/x.svg',
  }
  return logoMap[id] || null
}

const MARKETPLACES = [
  // Popular Marketplaces
  { id: 'amazon', name: 'Amazon', emoji: '🛒', category: 'popular', status: 'popular' },
  { id: 'ebay', name: 'eBay', emoji: '🏷️', category: 'popular', status: 'popular' },
  { id: 'google_shopping', name: 'Google Shopping', emoji: '🔍', category: 'popular', status: 'popular' },
  { id: 'meta', name: 'Meta Commerce', emoji: '📘', category: 'popular', status: 'popular' },
  { id: 'shopify', name: 'Shopify', emoji: '🛍️', category: 'popular', status: 'popular' },
  { id: 'woocommerce', name: 'WooCommerce', emoji: '🔮', category: 'popular', status: 'popular' },
  { id: 'prestashop', name: 'PrestaShop', emoji: '🛒', category: 'popular', status: 'popular' },
  { id: 'magento', name: 'Magento', emoji: '🧱', category: 'popular', status: 'popular' },
  
  // Social Commerce
  { id: 'tiktok', name: 'TikTok Shop', emoji: '🎵', category: 'social', status: 'trending' },
  { id: 'instagram', name: 'Instagram Shopping', emoji: '📸', category: 'social', status: 'trending' },
  { id: 'pinterest', name: 'Pinterest', emoji: '📌', category: 'social', status: 'popular' },
  { id: 'snapchat', name: 'Snapchat Ads', emoji: '👻', category: 'social', status: 'new' },
  { id: 'youtube', name: 'YouTube Shopping', emoji: '▶️', category: 'social', status: 'trending' },
  { id: 'twitter', name: 'X Shopping', emoji: '✖️', category: 'social', status: 'new' },
  { id: 'facebook', name: 'Facebook Shop', emoji: '📘', category: 'social', status: 'popular' },
  { id: 'linkedin', name: 'LinkedIn Ads', emoji: '💼', category: 'social', status: 'popular' },
  { id: 'whatsapp', name: 'WhatsApp Business', emoji: '💬', category: 'social', status: 'new' },
  
  // Comparateurs / Shopping Engines
  { id: 'bing_shopping', name: 'Bing Shopping', emoji: '🔷', category: 'shopping', status: 'popular' },
  { id: 'idealo', name: 'Idealo', emoji: '💡', category: 'shopping', status: 'eu' },
  { id: 'kelkoo', name: 'Kelkoo', emoji: '🔶', category: 'shopping', status: 'eu' },
  { id: 'leguide', name: 'LeGuide', emoji: '📘', category: 'shopping', status: 'eu' },
  { id: 'twenga', name: 'Twenga', emoji: '🔄', category: 'shopping', status: 'eu' },
  { id: 'pricerunner', name: 'PriceRunner', emoji: '🏃', category: 'shopping', status: 'eu' },
  { id: 'shopzilla', name: 'Shopzilla', emoji: '🦎', category: 'shopping', status: 'popular' },
  { id: 'nextag', name: 'Nextag', emoji: '🏷️', category: 'shopping', status: 'popular' },
  { id: 'shopping_com', name: 'Shopping.com', emoji: '🛒', category: 'shopping', status: 'popular' },
  { id: 'become', name: 'Become', emoji: '🔄', category: 'shopping', status: 'popular' },
  { id: 'google_ads', name: 'Google Ads', emoji: '📢', category: 'shopping', status: 'popular' },
  
  // Europe
  { id: 'cdiscount', name: 'Cdiscount', emoji: '🇫🇷', category: 'europe', status: 'eu' },
  { id: 'fnac', name: 'Fnac', emoji: '🇫🇷', category: 'europe', status: 'eu' },
  { id: 'darty', name: 'Darty', emoji: '🇫🇷', category: 'europe', status: 'eu' },
  { id: 'rue_du_commerce', name: 'Rue du Commerce', emoji: '🇫🇷', category: 'europe', status: 'eu' },
  { id: 'manomano', name: 'ManoMano', emoji: '🔧', category: 'europe', status: 'eu' },
  { id: 'showroomprive', name: 'Showroomprivé', emoji: '👗', category: 'europe', status: 'eu' },
  { id: 'veepee', name: 'Veepee', emoji: '🛍️', category: 'europe', status: 'eu' },
  { id: 'galeries_lafayette', name: 'Galeries Lafayette', emoji: '🇫🇷', category: 'europe', status: 'eu' },
  { id: 'bol_com', name: 'Bol.com', emoji: '🇳🇱', category: 'europe', status: 'eu' },
  { id: 'zalando', name: 'Zalando', emoji: '👟', category: 'europe', status: 'eu' },
  { id: 'otto', name: 'Otto', emoji: '🇩🇪', category: 'europe', status: 'eu' },
  { id: 'kaufland', name: 'Kaufland', emoji: '🇩🇪', category: 'europe', status: 'eu' },
  { id: 'mediamarkt', name: 'MediaMarkt', emoji: '📺', category: 'europe', status: 'eu' },
  { id: 'allegro', name: 'Allegro', emoji: '🇵🇱', category: 'europe', status: 'eu' },
  { id: 'emag', name: 'eMAG', emoji: '🇷🇴', category: 'europe', status: 'eu' },
  { id: 'asos', name: 'ASOS', emoji: '👔', category: 'europe', status: 'eu' },
  { id: 'privalia', name: 'Privalia', emoji: '🇪🇸', category: 'europe', status: 'eu' },
  { id: 'el_corte_ingles', name: 'El Corte Inglés', emoji: '🇪🇸', category: 'europe', status: 'eu' },
  
  // International
  { id: 'walmart', name: 'Walmart', emoji: '🏪', category: 'international', status: 'popular' },
  { id: 'target', name: 'Target', emoji: '🎯', category: 'international', status: 'popular' },
  { id: 'aliexpress', name: 'AliExpress', emoji: '🇨🇳', category: 'international', status: 'popular' },
  { id: 'wish', name: 'Wish', emoji: '⭐', category: 'international', status: 'popular' },
  { id: 'rakuten', name: 'Rakuten', emoji: '🇯🇵', category: 'international', status: 'popular' },
  { id: 'mercado_libre', name: 'Mercado Libre', emoji: '🇧🇷', category: 'international', status: 'popular' },
  { id: 'newegg', name: 'Newegg', emoji: '💻', category: 'international', status: 'popular' },
  { id: 'overstock', name: 'Overstock', emoji: '📦', category: 'international', status: 'popular' },
  { id: 'jet', name: 'Jet', emoji: '✈️', category: 'international', status: 'popular' },
  { id: 'lazada', name: 'Lazada', emoji: '🌏', category: 'international', status: 'popular' },
  { id: 'shopee', name: 'Shopee', emoji: '🧡', category: 'international', status: 'trending' },
  { id: 'flipkart', name: 'Flipkart', emoji: '🇮🇳', category: 'international', status: 'popular' },
  
  // Niche
  { id: 'etsy', name: 'Etsy', emoji: '🎨', category: 'niche', status: 'popular' },
  { id: 'wayfair', name: 'Wayfair', emoji: '🏠', category: 'niche', status: 'popular' },
  { id: 'houzz', name: 'Houzz', emoji: '🏡', category: 'niche', status: 'popular' },
  { id: 'decathlon', name: 'Decathlon', emoji: '⚽', category: 'niche', status: 'eu' },
  { id: 'catch', name: 'Catch', emoji: '🎣', category: 'niche', status: 'popular' },
  { id: 'bestbuy', name: 'Best Buy', emoji: '🔌', category: 'niche', status: 'popular' },
  { id: 'home_depot', name: 'Home Depot', emoji: '🔨', category: 'niche', status: 'popular' },
  { id: 'lowes', name: "Lowe's", emoji: '🪚', category: 'niche', status: 'popular' },
  { id: 'sephora', name: 'Sephora', emoji: '💄', category: 'niche', status: 'popular' },
  { id: 'nordstrom', name: 'Nordstrom', emoji: '👠', category: 'niche', status: 'popular' },
  { id: 'macys', name: "Macy's", emoji: '🛍️', category: 'niche', status: 'popular' },
  { id: 'kohls', name: "Kohl's", emoji: '🎁', category: 'niche', status: 'popular' },
  { id: 'costco', name: 'Costco', emoji: '📦', category: 'niche', status: 'popular' },
  { id: 'kroger', name: 'Kroger', emoji: '🛒', category: 'niche', status: 'popular' },
  
  // Affiliate Networks
  { id: 'awin', name: 'Awin', emoji: '🔗', category: 'affiliate', status: 'popular' },
  { id: 'tradedoubler', name: 'Tradedoubler', emoji: '💱', category: 'affiliate', status: 'eu' },
  { id: 'cj', name: 'CJ Affiliate', emoji: '🤝', category: 'affiliate', status: 'popular' },
  { id: 'shareasale', name: 'ShareASale', emoji: '💰', category: 'affiliate', status: 'popular' },
  { id: 'rakuten_ads', name: 'Rakuten Advertising', emoji: '📢', category: 'affiliate', status: 'popular' },
  { id: 'impact', name: 'Impact', emoji: '💥', category: 'affiliate', status: 'popular' },
  { id: 'partnerize', name: 'Partnerize', emoji: '🤝', category: 'affiliate', status: 'popular' },
  { id: 'webgains', name: 'Webgains', emoji: '🌐', category: 'affiliate', status: 'eu' },
  { id: 'effiliation', name: 'Effiliation', emoji: '🇫🇷', category: 'affiliate', status: 'eu' },
  { id: 'affilinet', name: 'Affilinet', emoji: '🔗', category: 'affiliate', status: 'eu' },
  { id: 'daisycon', name: 'Daisycon', emoji: '🌼', category: 'affiliate', status: 'eu' },
  { id: 'criteo', name: 'Criteo', emoji: '🎯', category: 'affiliate', status: 'popular' },
]

// Component for marketplace logo with fallback to emoji
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
          // Fallback to emoji if image fails to load
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
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFeed, setNewFeed] = useState({ name: '', marketplace: '' })

  // Filter feeds
  const filteredFeeds = useMemo(() => {
    return feeds.filter(feed => {
      const matchesSearch = feed.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || feed.generation_status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [feeds, searchTerm, statusFilter])

  const getStatusBadge = (status: string | null) => {
    const config: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
      completed: { color: 'bg-green-500', icon: CheckCircle, label: 'Actif' },
      pending: { color: 'bg-gray-500', icon: Clock, label: 'En attente' },
      error: { color: 'bg-red-500', icon: XCircle, label: 'Erreur' },
      generating: { color: 'bg-blue-500', icon: RefreshCw, label: 'Génération...' },
    }
    const { color, icon: Icon, label } = config[status || 'pending'] || config.pending
    return (
      <Badge className={`${color} text-white`}>
        <Icon className={`h-3 w-3 mr-1 ${status === 'generating' ? 'animate-spin' : ''}`} />
        {label}
      </Badge>
    )
  }

  const getMarketplaceLogo = (feedType: string) => {
    const mp = MARKETPLACES.find(m => m.id === feedType)
    return mp?.emoji || '📦'
  }
  
  const renderMarketplaceLogo = (feedType: string, size = 24) => {
    const mp = MARKETPLACES.find(m => m.id === feedType)
    if (mp) {
      return <MarketplaceLogo id={mp.id} emoji={mp.emoji} size={size} />
    }
    return <span style={{ fontSize: size }}>📦</span>
  }

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
  }

  return (
    <>
      <Helmet>
        <title>Feeds & Marketplaces - ShopOpti</title>
        <meta name="description" content="Gérez vos feeds marketplace style Channable" />
      </Helmet>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <FeedSubNavigation />
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <Rss className="h-8 w-8 text-primary" />
              Feeds & Marketplaces
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion centralisée de vos flux produits
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Feed
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: Rss, label: 'Feeds', value: stats.totalFeeds, color: 'text-primary' },
            { icon: CheckCircle, label: 'Actifs', value: stats.activeFeeds, color: 'text-green-600' },
            { icon: Package, label: 'Produits', value: stats.totalProducts.toLocaleString(), color: 'text-blue-600' },
            { icon: Clock, label: 'En attente', value: stats.pendingFeeds, color: 'text-yellow-600' },
            { icon: AlertTriangle, label: 'Erreurs', value: stats.errorFeeds, color: 'text-red-600' },
          ].map((stat, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Marketplace Quick Actions - Organized by Category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              Marketplaces Supportés ({MARKETPLACES.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {MARKETPLACE_CATEGORIES.map(category => {
              const categoryMarketplaces = MARKETPLACES.filter(mp => mp.category === category.id)
              if (categoryMarketplaces.length === 0) return null
              
              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                    <Badge variant="outline" className="text-[10px]">{categoryMarketplaces.length}</Badge>
                  </div>
                  <ScrollArea className="w-full">
                    <div className="flex gap-2 pb-2">
                      {categoryMarketplaces.map(mp => (
                        <Button
                          key={mp.id}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0 h-auto py-2 px-3 flex flex-col items-center gap-1 hover:border-primary min-w-[80px]"
                          onClick={() => {
                            setNewFeed({ name: `${mp.name} Feed`, marketplace: mp.id })
                            setShowCreateDialog(true)
                          }}
                        >
                          <MarketplaceLogo id={mp.id} emoji={mp.emoji} size={28} />
                          <span className="text-[10px] font-medium text-center leading-tight">{mp.name}</span>
                          {mp.status === 'trending' && (
                            <Badge className="bg-orange-500 text-[8px] px-1 py-0">Hot</Badge>
                          )}
                          {mp.status === 'new' && (
                            <Badge className="bg-blue-500 text-[8px] px-1 py-0">New</Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un feed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="completed">Actifs</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="error">En erreur</SelectItem>
              <SelectItem value="generating">En génération</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Feeds Table */}
        <Card>
          <CardContent className="p-0">
            {isLoadingFeeds ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFeeds.length === 0 ? (
              <div className="text-center py-12">
                <Rss className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Aucun feed trouvé</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Créez votre premier feed pour commencer
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un feed
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feed</TableHead>
                    <TableHead>Marketplace</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Produits</TableHead>
                    <TableHead>Dernière génération</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeeds.map(feed => (
                    <TableRow key={feed.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {renderMarketplaceLogo(feed.feed_type, 32)}
                          <div>
                            <p className="font-medium">{feed.name}</p>
                            {feed.created_at && (
                              <p className="text-xs text-muted-foreground">
                                Créé {new Date(feed.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getMarketplaceName(feed.feed_type)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(feed.generation_status)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{(feed.product_count || 0).toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        {feed.last_generated_at ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(feed.last_generated_at).toLocaleString('fr-FR')}
                          </div>
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
                            title="Générer le feed"
                          >
                            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                          </Button>
                          {feed.feed_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Voir le feed"
                            >
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
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau feed</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom du feed</Label>
                <Input
                  value={newFeed.name}
                  onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                  placeholder="Ex: Amazon FR - Catalogue Principal"
                />
              </div>
              <div className="space-y-2">
                <Label>Marketplace</Label>
                <Select value={newFeed.marketplace} onValueChange={(v) => setNewFeed({ ...newFeed, marketplace: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un marketplace" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETPLACES.map(mp => (
                      <SelectItem key={mp.id} value={mp.id}>
                        <span className="flex items-center gap-2">
                          <MarketplaceLogo id={mp.id} emoji={mp.emoji} size={20} />
                          <span>{mp.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateFeed} disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Créer le feed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
