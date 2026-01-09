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
import {
  Rss, Plus, RefreshCw, CheckCircle, AlertTriangle, XCircle,
  ExternalLink, Trash2, Clock, Package, TrendingUp, Search, Loader2, Store
} from 'lucide-react'

// Marketplace configurations
const MARKETPLACES = [
  { id: 'amazon', name: 'Amazon', logo: '🛒', status: 'popular' },
  { id: 'ebay', name: 'eBay', logo: '🏷️', status: 'popular' },
  { id: 'google_shopping', name: 'Google Shopping', logo: '🔍', status: 'popular' },
  { id: 'meta', name: 'Meta Commerce', logo: '📘', status: 'popular' },
  { id: 'tiktok', name: 'TikTok Shop', logo: '🎵', status: 'trending' },
  { id: 'cdiscount', name: 'Cdiscount', logo: '🇫🇷', status: 'eu' },
  { id: 'etsy', name: 'Etsy', logo: '🎨', status: 'popular' },
  { id: 'shopify', name: 'Shopify', logo: '🛍️', status: 'popular' },
]

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
    return mp?.logo || '📦'
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
                          <span className="text-2xl">{getMarketplaceLogo(feed.feed_type)}</span>
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
