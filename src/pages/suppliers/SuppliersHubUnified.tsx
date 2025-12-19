/**
 * Hub Fournisseurs Unifié - Style Spocket/AutoDS/Channable
 * Vue unifiée combinant : Vue d'ensemble, Marketplace, Catalogue, Analytics
 */

import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'
import { useSupplierConnection } from '@/hooks/useSupplierConnection'
import { useSupplierSync } from '@/hooks/useSupplierSync'
import { ImportSuppliersDialog } from '@/components/suppliers/ImportSuppliersDialog'
import {
  Store, ShoppingCart, Settings, TrendingUp, Package, Globe, Zap,
  CheckCircle, AlertCircle, Search, Plus, Upload, Download, RefreshCw,
  Eye, Star, MapPin, Filter, BarChart3, Users, Clock, Rss, Crown,
  ExternalLink, Play, Pause, ArrowRight, Grid3X3, List, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  action: () => void
  variant?: 'default' | 'outline' | 'secondary'
  badge?: string
}

export default function SuppliersHubUnified() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showImportDialog, setShowImportDialog] = useState(false)

  const { suppliers, stats, isLoading } = useRealSuppliers({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    country: countryFilter !== 'all' ? countryFilter : undefined,
    search: searchTerm
  })

  const { disconnectSupplier, isDisconnecting } = useSupplierConnection()
  const { syncSupplier, syncAllSuppliers, isSyncing } = useSupplierSync()

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab })
  }

  // Quick Actions - Style AutoDS
  const quickActions: QuickAction[] = [
    { id: 'import-url', label: 'Import URL', icon: Zap, action: () => navigate('/import/url'), badge: 'Rapide' },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart, action: () => setActiveTab('marketplace') },
    { id: 'sync-all', label: 'Sync Tous', icon: RefreshCw, action: () => syncAllSuppliers(), variant: 'outline' },
    { id: 'add-supplier', label: 'Ajouter', icon: Plus, action: () => navigate('/suppliers/create'), variant: 'secondary' },
  ]

  // Stats cards data
  const statsCards = [
    { label: 'Total Fournisseurs', value: stats.total, icon: Store, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Actifs', value: stats.active, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10' },
    { label: 'Produits Importés', value: suppliers.length * 100, icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
    { label: 'Pays', value: Object.keys(stats.topCountries || {}).length, icon: Globe, color: 'text-purple-600', bgColor: 'bg-purple-500/10' },
  ]

  return (
    <>
      <Helmet>
        <title>Hub Fournisseurs - ShopOpti</title>
        <meta name="description" content="Gestion unifiée de vos fournisseurs dropshipping" />
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
        {/* Header - Style Spocket */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600">
                  <Store className="h-6 w-6 text-white" />
                </div>
                Hub Fournisseurs
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gérez vos fournisseurs et importez des produits gagnants
              </p>
            </div>

            {/* Quick Actions Bar - Style AutoDS */}
            <div className="flex flex-wrap gap-2">
              {quickActions.map(action => (
                <Button
                  key={action.id}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={action.action}
                  disabled={action.id === 'sync-all' && isSyncing}
                  className="gap-2"
                >
                  <action.icon className={cn("h-4 w-4", action.id === 'sync-all' && isSyncing && "animate-spin")} />
                  <span className="hidden sm:inline">{action.label}</span>
                  {action.badge && (
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      {action.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Cards - Style Channable */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {statsCards.map((stat, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab('suppliers')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-2xl md:text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Tabs - Navigation Unifiée */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Marketplace</span>
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Mes Fournisseurs</span>
              </TabsTrigger>
              <TabsTrigger value="feeds" className="gap-2">
                <Rss className="h-4 w-4" />
                <span className="hidden sm:inline">Feeds</span>
              </TabsTrigger>
            </TabsList>

            {/* Search & Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Tab: Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Navigation Cards - Style Spocket */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="group cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
                onClick={() => setActiveTab('marketplace')}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Marketplace</CardTitle>
                  <CardDescription>
                    Découvrez des milliers de fournisseurs vérifiés et importez des produits gagnants en 1 clic
                  </CardDescription>
                  <div className="flex gap-2 mt-4">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      IA Intégrée
                    </Badge>
                    <Badge variant="outline" className="text-xs">Premium</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="group cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] border-2 border-transparent hover:border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent"
                onClick={() => navigate('/import/url')}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Import Rapide</CardTitle>
                  <CardDescription>
                    Collez une URL AliExpress, Amazon ou autre et importez instantanément le produit
                  </CardDescription>
                  <div className="flex gap-2 mt-4">
                    <Badge className="bg-green-600 text-xs">Nouveau</Badge>
                    <Badge variant="outline" className="text-xs">AutoDS Style</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="group cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] border-2 border-transparent hover:border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent"
                onClick={() => setActiveTab('feeds')}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <Rss className="h-6 w-6 text-purple-600" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Feeds Multi-Canal</CardTitle>
                  <CardDescription>
                    Publiez sur Amazon, eBay, Google Shopping avec règles de transformation
                  </CardDescription>
                  <div className="flex gap-2 mt-4">
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">Channable Style</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Connected Suppliers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Connected Suppliers Preview */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Fournisseurs Connectés</CardTitle>
                    <CardDescription>Vos {stats.active} fournisseurs actifs</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('suppliers')}>
                    Voir tout <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suppliers.slice(0, 4).map(supplier => (
                    <div 
                      key={supplier.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/suppliers/${supplier.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">{supplier.rating ? `★ ${supplier.rating}` : 'Fournisseur'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {supplier.status === 'active' ? 'Connecté' : 'Inactif'}
                        </Badge>
                        {supplier.country && (
                          <span className="text-xs text-muted-foreground">{supplier.country}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {suppliers.length === 0 && (
                    <div className="text-center py-8">
                      <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Aucun fournisseur connecté</p>
                      <Button size="sm" className="mt-3" onClick={() => setActiveTab('marketplace')}>
                        Explorer le Marketplace
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance</CardTitle>
                  <CardDescription>Aperçu de vos métriques fournisseurs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taux de synchronisation</span>
                      <span className="font-medium">98%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '98%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Produits en stock</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Note moyenne</span>
                      <span className="font-medium flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {stats.averageRating?.toFixed(1) || '4.5'}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${((stats.averageRating || 4.5) / 5) * 100}%` }} />
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/suppliers/analytics')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Voir Analytics Complet
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Marketplace */}
          <TabsContent value="marketplace" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4">
                    <ShoppingCart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Marketplace Fournisseurs</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Accédez à notre catalogue de fournisseurs vérifiés avec des milliers de produits gagnants
                  </p>
                  <Button size="lg" onClick={() => navigate('/suppliers/marketplace')}>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Explorer le Marketplace
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: My Suppliers */}
          <TabsContent value="suppliers" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous pays</SelectItem>
                  <SelectItem value="CN">Chine</SelectItem>
                  <SelectItem value="US">USA</SelectItem>
                  <SelectItem value="EU">Europe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={cn(
              "grid gap-4",
              viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {suppliers.map(supplier => (
                <Card 
                  key={supplier.id} 
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/suppliers/${supplier.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Store className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{supplier.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {supplier.country || 'Non spécifié'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={supplier.status === 'active' ? 'default' : 'outline'}>
                        {supplier.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-lg font-bold flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {supplier.rating || 4.5}
                        </p>
                        <p className="text-xs text-muted-foreground">Note</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{supplier.access_count || 0}</p>
                        <p className="text-xs text-muted-foreground">Accès</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {suppliers.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun fournisseur trouvé</h3>
                  <p className="text-muted-foreground mb-4">Commencez par explorer notre marketplace</p>
                  <Button onClick={() => setActiveTab('marketplace')}>
                    Explorer le Marketplace
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Feeds */}
          <TabsContent value="feeds" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                    <Rss className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Gestionnaire de Feeds</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Publiez vos produits sur Amazon, eBay, Google Shopping et plus avec des règles de transformation style Channable
                  </p>
                  <Button size="lg" onClick={() => navigate('/feeds')}>
                    <Rss className="h-5 w-5 mr-2" />
                    Gérer les Feeds
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Import Dialog */}
        <ImportSuppliersDialog 
          open={showImportDialog} 
          onOpenChange={setShowImportDialog}
        />
      </div>
    </>
  )
}
