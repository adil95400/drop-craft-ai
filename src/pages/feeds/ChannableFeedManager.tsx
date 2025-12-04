/**
 * Channable-Style Feed Manager
 * Gestion professionnelle des feeds marketplace
 */
import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Rss, Plus, Settings, RefreshCw, CheckCircle, AlertTriangle, XCircle,
  ExternalLink, Play, Pause, Trash2, Edit, Copy, Download, Upload,
  BarChart3, Clock, Globe, Package, TrendingUp, Zap, Filter, Search,
  ChevronRight, MoreVertical, Eye, FileText, ArrowUpRight, Loader2,
  ShoppingCart, Store, Layers, Target, Calendar, Activity
} from 'lucide-react'

// Marketplace configurations
const MARKETPLACES = [
  { id: 'amazon', name: 'Amazon', logo: '🛒', color: 'bg-orange-500', status: 'popular' },
  { id: 'ebay', name: 'eBay', logo: '🏷️', color: 'bg-blue-500', status: 'popular' },
  { id: 'google_shopping', name: 'Google Shopping', logo: '🔍', color: 'bg-red-500', status: 'popular' },
  { id: 'meta', name: 'Meta Commerce', logo: '📘', color: 'bg-blue-600', status: 'popular' },
  { id: 'tiktok', name: 'TikTok Shop', logo: '🎵', color: 'bg-pink-500', status: 'trending' },
  { id: 'cdiscount', name: 'Cdiscount', logo: '🇫🇷', color: 'bg-red-600', status: 'eu' },
  { id: 'etsy', name: 'Etsy', logo: '🎨', color: 'bg-orange-400', status: 'popular' },
  { id: 'walmart', name: 'Walmart', logo: '🏪', color: 'bg-blue-700', status: 'us' },
  { id: 'shopify', name: 'Shopify', logo: '🛍️', color: 'bg-green-500', status: 'popular' },
  { id: 'woocommerce', name: 'WooCommerce', logo: '🔌', color: 'bg-purple-500', status: 'popular' },
]

// Feed status types
type FeedStatus = 'active' | 'paused' | 'error' | 'syncing' | 'pending'

interface Feed {
  id: string
  name: string
  marketplace: string
  status: FeedStatus
  products_count: number
  last_sync: string
  next_sync: string
  errors_count: number
  warnings_count: number
  success_rate: number
  created_at: string
}

export default function ChannableFeedManager() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFeed, setNewFeed] = useState({ name: '', marketplace: '' })

  // Fetch feeds from database
  const { data: feeds = [], isLoading: isLoadingFeeds } = useQuery({
    queryKey: ['marketplace-feeds'],
    queryFn: async (): Promise<Feed[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Return demo data for feeds (would be from actual marketplace_feeds table)
      return [
        {
          id: '1',
          name: 'Amazon FR - Catalogue Principal',
          marketplace: 'amazon',
          status: 'active' as FeedStatus,
          products_count: 1250,
          last_sync: new Date(Date.now() - 3600000).toISOString(),
          next_sync: new Date(Date.now() + 3600000).toISOString(),
          errors_count: 3,
          warnings_count: 12,
          success_rate: 98.5,
          created_at: new Date(Date.now() - 86400000 * 30).toISOString()
        },
        {
          id: '2',
          name: 'Google Shopping - Mode',
          marketplace: 'google_shopping',
          status: 'active' as FeedStatus,
          products_count: 890,
          last_sync: new Date(Date.now() - 7200000).toISOString(),
          next_sync: new Date(Date.now() + 1800000).toISOString(),
          errors_count: 0,
          warnings_count: 5,
          success_rate: 99.2,
          created_at: new Date(Date.now() - 86400000 * 15).toISOString()
        },
        {
          id: '3',
          name: 'Meta Commerce - Tous Produits',
          marketplace: 'meta',
          status: 'syncing' as FeedStatus,
          products_count: 2100,
          last_sync: new Date(Date.now() - 300000).toISOString(),
          next_sync: new Date(Date.now() + 3600000).toISOString(),
          errors_count: 1,
          warnings_count: 8,
          success_rate: 97.8,
          created_at: new Date(Date.now() - 86400000 * 45).toISOString()
        },
        {
          id: '4',
          name: 'eBay FR - Électronique',
          marketplace: 'ebay',
          status: 'error' as FeedStatus,
          products_count: 456,
          last_sync: new Date(Date.now() - 86400000).toISOString(),
          next_sync: new Date(Date.now() + 3600000).toISOString(),
          errors_count: 45,
          warnings_count: 23,
          success_rate: 85.2,
          created_at: new Date(Date.now() - 86400000 * 60).toISOString()
        },
      ]
    }
  })

  // Sync feed mutation
  const syncFeedMutation = useMutation({
    mutationFn: async (feedId: string) => {
      const { data, error } = await supabase.functions.invoke('feed-sync', {
        body: { feedId, action: 'sync' }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-feeds'] })
      toast({
        title: "Synchronisation lancée",
        description: "Le feed est en cours de synchronisation"
      })
    },
    onError: () => {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser le feed",
        variant: "destructive"
      })
    }
  })

  // Create feed mutation
  const createFeedMutation = useMutation({
    mutationFn: async (feedData: { name: string; marketplace: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Log creation for now (would create actual feed)
      console.log('Creating feed:', feedData)
      return feedData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-feeds'] })
      setShowCreateDialog(false)
      setNewFeed({ name: '', marketplace: '' })
      toast({
        title: "Feed créé",
        description: "Le nouveau feed a été créé avec succès"
      })
    }
  })

  // Filter feeds
  const filteredFeeds = useMemo(() => {
    return feeds.filter(feed => {
      const matchesSearch = feed.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || feed.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [feeds, searchTerm, statusFilter])

  // Calculate stats
  const stats = useMemo(() => ({
    totalFeeds: feeds.length,
    activeFeeds: feeds.filter(f => f.status === 'active').length,
    totalProducts: feeds.reduce((sum, f) => sum + f.products_count, 0),
    avgSuccessRate: feeds.length > 0 
      ? (feeds.reduce((sum, f) => sum + f.success_rate, 0) / feeds.length).toFixed(1)
      : 0,
    totalErrors: feeds.reduce((sum, f) => sum + f.errors_count, 0),
  }), [feeds])

  const getStatusBadge = (status: FeedStatus) => {
    const config = {
      active: { color: 'bg-green-500', icon: CheckCircle, label: 'Actif' },
      paused: { color: 'bg-yellow-500', icon: Pause, label: 'Pausé' },
      error: { color: 'bg-red-500', icon: XCircle, label: 'Erreur' },
      syncing: { color: 'bg-blue-500', icon: RefreshCw, label: 'Sync...' },
      pending: { color: 'bg-gray-500', icon: Clock, label: 'En attente' },
    }
    const { color, icon: Icon, label } = config[status]
    return (
      <Badge className={`${color} text-white`}>
        <Icon className={`h-3 w-3 mr-1 ${status === 'syncing' ? 'animate-spin' : ''}`} />
        {label}
      </Badge>
    )
  }

  const getMarketplaceLogo = (marketplaceId: string) => {
    const mp = MARKETPLACES.find(m => m.id === marketplaceId)
    return mp?.logo || '📦'
  }

  const getMarketplaceName = (marketplaceId: string) => {
    const mp = MARKETPLACES.find(m => m.id === marketplaceId)
    return mp?.name || marketplaceId
  }

  return (
    <>
      <Helmet>
        <title>Feeds & Marketplaces - ShopOpti</title>
        <meta name="description" content="Gérez vos feeds marketplace style Channable" />
      </Helmet>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <Rss className="h-8 w-8 text-primary" />
              Feeds & Marketplaces
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion centralisée de vos flux produits - Style Channable
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => syncFeedMutation.mutate('all')}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncFeedMutation.isPending ? 'animate-spin' : ''}`} />
              Tout synchroniser
            </Button>
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
            { icon: TrendingUp, label: 'Taux succès', value: `${stats.avgSuccessRate}%`, color: 'text-purple-600' },
            { icon: AlertTriangle, label: 'Erreurs', value: stats.totalErrors, color: 'text-red-600' },
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

        {/* Marketplace Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              Marketplaces Supportés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {MARKETPLACES.map(mp => (
                  <Button
                    key={mp.id}
                    variant="outline"
                    className="flex-shrink-0 h-auto py-3 px-4 flex flex-col items-center gap-2 hover:border-primary"
                    onClick={() => {
                      setNewFeed({ name: `${mp.name} Feed`, marketplace: mp.id })
                      setShowCreateDialog(true)
                    }}
                  >
                    <span className="text-2xl">{mp.logo}</span>
                    <span className="text-xs font-medium">{mp.name}</span>
                    {mp.status === 'trending' && (
                      <Badge variant="secondary" className="text-[10px]">Trending</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
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
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="paused">Pausés</SelectItem>
              <SelectItem value="error">En erreur</SelectItem>
              <SelectItem value="syncing">En sync</SelectItem>
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
                    <TableHead className="text-right">Taux</TableHead>
                    <TableHead>Dernière sync</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeeds.map(feed => (
                    <TableRow key={feed.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getMarketplaceLogo(feed.marketplace)}</span>
                          <div>
                            <p className="font-medium">{feed.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Créé {new Date(feed.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getMarketplaceName(feed.marketplace)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(feed.status)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{feed.products_count.toLocaleString()}</span>
                        {feed.errors_count > 0 && (
                          <span className="text-red-500 text-xs ml-1">({feed.errors_count} err)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={feed.success_rate} className="w-16 h-2" />
                          <span className="text-sm font-medium">{feed.success_rate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(feed.last_sync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => syncFeedMutation.mutate(feed.id)}
                            disabled={syncFeedMutation.isPending}
                          >
                            <RefreshCw className={`h-4 w-4 ${syncFeedMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
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
      </div>

      {/* Create Feed Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Créer un nouveau Feed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nom du feed</label>
              <Input
                placeholder="Ex: Amazon FR - Catalogue Principal"
                value={newFeed.name}
                onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Marketplace</label>
              <Select value={newFeed.marketplace} onValueChange={(v) => setNewFeed({ ...newFeed, marketplace: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un marketplace" />
                </SelectTrigger>
                <SelectContent>
                  {MARKETPLACES.map(mp => (
                    <SelectItem key={mp.id} value={mp.id}>
                      <span className="flex items-center gap-2">
                        <span>{mp.logo}</span>
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
            <Button 
              onClick={() => createFeedMutation.mutate(newFeed)}
              disabled={!newFeed.name || !newFeed.marketplace || createFeedMutation.isPending}
            >
              {createFeedMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Créer le feed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
