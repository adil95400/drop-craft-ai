/**
 * Hub d'Intégrations Unifié - Fournisseurs + Marketplaces
 * Vue centralisée de tous les connecteurs externes
 */

import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'
import { useIntegrations } from '@/hooks/useIntegrations'
import { useTranslation } from 'react-i18next'
import {
  Store, ShoppingCart, Settings, TrendingUp, Package, Globe, Zap,
  CheckCircle, AlertCircle, Search, Plus, RefreshCw, Plug, BarChart3,
  ExternalLink, Grid3X3, List, Sparkles, Link2, Unplug, AlertTriangle,
  ShoppingBag, Truck, Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface IntegrationItem {
  id: string
  name: string
  type: 'supplier' | 'marketplace' | 'tool'
  status: 'connected' | 'available' | 'error' | 'pending'
  logo?: string
  description: string
  productsCount?: number
  lastSync?: string
  category?: string
}

export default function UnifiedIntegrationsHub() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch suppliers
  const { suppliers, stats: supplierStats, isLoading: suppliersLoading } = useRealSuppliers({})
  
  // Fetch marketplace integrations
  const { integrations: marketplaceIntegrations, connectedIntegrations, isLoading: integrationsLoading } = useIntegrations()

  // Fetch store connections
  const { data: storeConnections = [] } = useQuery({
    queryKey: ['store-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab })
  }

  // Combine all integrations into unified list
  const allIntegrations: IntegrationItem[] = [
    // Suppliers
    ...suppliers.map(s => ({
      id: `supplier-${s.id}`,
      name: s.name,
      type: 'supplier' as const,
      status: s.status === 'active' ? 'connected' as const : 'available' as const,
      logo: s.website ? `https://www.google.com/s2/favicons?domain=${s.website}&sz=64` : undefined,
      description: `Fournisseur ${s.country || 'international'}`,
      productsCount: 0,
      lastSync: s.updated_at,
      category: s.country
    })),
    // Store connections (Shopify, WooCommerce, etc.)
    ...storeConnections.map(s => ({
      id: `store-${s.id}`,
      name: s.platform_name || s.platform || 'Boutique',
      type: 'marketplace' as const,
      status: s.connection_status === 'connected' ? 'connected' as const : 
              s.connection_status === 'error' ? 'error' as const : 'available' as const,
      logo: getStoreLogo(s.platform || ''),
      description: `Boutique ${s.platform || 'e-commerce'}`,
      productsCount: 0,
      lastSync: s.last_sync_at || undefined,
      category: s.platform || undefined
    })),
    // Available marketplaces (not connected)
    ...getAvailableMarketplaces().filter(m => 
      !storeConnections.some(s => s.platform?.toLowerCase() === m.id.toLowerCase())
    )
  ]

  // Filter integrations
  const filteredIntegrations = allIntegrations.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'suppliers' && item.type === 'supplier') ||
      (activeTab === 'marketplaces' && item.type === 'marketplace') ||
      (activeTab === 'tools' && item.type === 'tool')
    
    return matchesSearch && matchesStatus && matchesTab
  })

  // Stats
  const stats = {
    total: allIntegrations.length,
    connected: allIntegrations.filter(i => i.status === 'connected').length,
    suppliers: allIntegrations.filter(i => i.type === 'supplier').length,
    marketplaces: allIntegrations.filter(i => i.type === 'marketplace').length,
    suppliersConnected: allIntegrations.filter(i => i.type === 'supplier' && i.status === 'connected').length,
    marketplacesConnected: allIntegrations.filter(i => i.type === 'marketplace' && i.status === 'connected').length,
  }

  const isLoading = suppliersLoading || integrationsLoading

  return (
    <>
      <Helmet>
        <title>Hub d'Intégrations - ShopOpti</title>
        <meta name="description" content="Gérez vos fournisseurs et canaux de vente depuis un seul endroit" />
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600">
                  <Plug className="h-6 w-6 text-white" />
                </div>
                Hub d'Intégrations
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Fournisseurs et canaux de vente centralisés
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => navigate('/suppliers/marketplace')}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Fournisseur
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/stores/integrations')}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Connecter Boutique
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Plug className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.connected}</p>
                    <p className="text-xs text-muted-foreground">Connectés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Store className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.suppliersConnected}/{stats.suppliers}</p>
                    <p className="text-xs text-muted-foreground">Fournisseurs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.marketplacesConnected}/{stats.marketplaces}</p>
                    <p className="text-xs text-muted-foreground">Marketplaces</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allIntegrations.reduce((acc, i) => acc + (i.productsCount || 0), 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Produits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs & Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <TabsList className="grid w-full md:w-auto grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">Tous</span>
                <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Fournisseurs</span>
                <Badge variant="secondary" className="ml-1">{stats.suppliers}</Badge>
              </TabsTrigger>
              <TabsTrigger value="marketplaces" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Marketplaces</span>
                <Badge variant="secondary" className="ml-1">{stats.marketplaces}</Badge>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Outils</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Content */}
          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredIntegrations.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune intégration trouvée</h3>
                  <p className="text-muted-foreground mb-4">
                    Ajoutez des fournisseurs ou connectez des boutiques pour commencer
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => navigate('/suppliers/marketplace')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Fournisseur
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/dashboard/stores/integrations')}>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Connecter Boutique
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'flex flex-col gap-2'
              )}>
                {filteredIntegrations.map((item) => (
                  <IntegrationCard 
                    key={item.id} 
                    integration={item} 
                    viewMode={viewMode}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

// Integration Card Component
function IntegrationCard({ 
  integration, 
  viewMode,
  navigate 
}: { 
  integration: IntegrationItem
  viewMode: 'grid' | 'list'
  navigate: (path: string) => void
}) {
  const getStatusBadge = () => {
    switch (integration.status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Connecté</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Erreur</Badge>
      case 'pending':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />En cours</Badge>
      default:
        return <Badge variant="outline">Disponible</Badge>
    }
  }

  const getTypeIcon = () => {
    switch (integration.type) {
      case 'supplier':
        return <Store className="h-4 w-4" />
      case 'marketplace':
        return <ShoppingCart className="h-4 w-4" />
      case 'tool':
        return <Zap className="h-4 w-4" />
    }
  }

  const handleClick = () => {
    if (integration.type === 'supplier') {
      navigate(`/suppliers/${integration.id.replace('supplier-', '')}`)
    } else if (integration.type === 'marketplace') {
      navigate('/dashboard/stores/integrations')
    }
  }

  if (viewMode === 'list') {
    return (
      <Card 
        className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {integration.logo ? (
                <img src={integration.logo} alt={integration.name} className="w-8 h-8 object-contain" />
              ) : (
                getTypeIcon()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{integration.name}</h3>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground truncate">{integration.description}</p>
            </div>
            <div className="text-right hidden md:block">
              {integration.productsCount !== undefined && integration.productsCount > 0 && (
                <p className="text-sm font-medium">{integration.productsCount.toLocaleString()} produits</p>
              )}
              {integration.lastSync && (
                <p className="text-xs text-muted-foreground">
                  Sync: {new Date(integration.lastSync).toLocaleDateString()}
                </p>
              )}
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50 h-full"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {integration.logo ? (
                <img src={integration.logo} alt={integration.name} className="w-10 h-10 object-contain" />
              ) : (
                getTypeIcon()
              )}
            </div>
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {integration.type === 'supplier' ? 'Fournisseur' : 
                   integration.type === 'marketplace' ? 'Marketplace' : 'Outil'}
                </Badge>
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {integration.description}
        </p>
        <div className="flex items-center justify-between text-sm">
          {integration.productsCount !== undefined && integration.productsCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Package className="h-3 w-3" />
              {integration.productsCount.toLocaleString()} produits
            </div>
          )}
          {integration.status === 'connected' ? (
            <Button size="sm" variant="outline">
              <Settings className="h-3 w-3 mr-1" />
              Gérer
            </Button>
          ) : (
            <Button size="sm">
              <Link2 className="h-3 w-3 mr-1" />
              Connecter
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions
function getStoreLogo(platform: string): string {
  const logos: Record<string, string> = {
    shopify: '/logos/shopify.svg',
    woocommerce: '/logos/woocommerce.svg',
    prestashop: '/logos/prestashop.svg',
    magento: '/logos/magento.svg',
    amazon: '/logos/amazon.svg',
    ebay: '/logos/ebay.svg',
    etsy: '/logos/etsy.svg',
    cdiscount: '/logos/cdiscount.svg',
    google: '/logos/google.svg',
    tiktok: '/logos/tiktok.svg',
    facebook: '/logos/facebook.svg',
    meta: '/logos/meta-color.svg',
  }
  return logos[platform?.toLowerCase()] || `/logos/${platform?.toLowerCase()}.svg`
}

function getAvailableMarketplaces(): IntegrationItem[] {
  return [
    { id: 'amazon', name: 'Amazon', type: 'marketplace', status: 'available', description: 'Vendre sur Amazon EU/US', logo: getStoreLogo('amazon') },
    { id: 'ebay', name: 'eBay', type: 'marketplace', status: 'available', description: 'Marketplace internationale', logo: getStoreLogo('ebay') },
    { id: 'etsy', name: 'Etsy', type: 'marketplace', status: 'available', description: 'Produits créatifs et artisanaux', logo: getStoreLogo('etsy') },
    { id: 'cdiscount', name: 'Cdiscount', type: 'marketplace', status: 'available', description: 'Marketplace française leader' },
    { id: 'google-shopping', name: 'Google Shopping', type: 'marketplace', status: 'available', description: 'Annonces Shopping Google' },
    { id: 'tiktok-shop', name: 'TikTok Shop', type: 'marketplace', status: 'available', description: 'Social commerce TikTok' },
    { id: 'meta-commerce', name: 'Meta Commerce', type: 'marketplace', status: 'available', description: 'Facebook & Instagram Shops' },
  ]
}
