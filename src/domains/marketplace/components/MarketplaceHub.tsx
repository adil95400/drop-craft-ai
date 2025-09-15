import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  ShoppingCart, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Settings,
  Play,
  Pause,
  BarChart3,
  Package,
  DollarSign,
  Users,
  Plus,
  RefreshCw as Sync
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Marketplace {
  id: string
  name: string
  logo: string
  status: 'connected' | 'disconnected' | 'syncing' | 'error'
  lastSync: string
  products: number
  orders: number
  revenue: number
  syncEnabled: boolean
  features: string[]
  connection: {
    apiKey?: string
    storeId?: string
    region?: string
  }
}

interface SyncStats {
  totalProducts: number
  syncedProducts: number
  pendingSync: number
  errors: number
  lastUpdate: string
}

export function MarketplaceHub() {
  const { toast } = useToast()
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([])
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data pour la démo
  useEffect(() => {
    const mockMarketplaces: Marketplace[] = [
      {
        id: 'amazon',
        name: 'Amazon',
        logo: '🛒',
        status: 'connected',
        lastSync: '2024-03-15T10:30:00Z',
        products: 1250,
        orders: 342,
        revenue: 45670,
        syncEnabled: true,
        features: ['inventory_sync', 'order_management', 'price_optimization'],
        connection: {
          apiKey: 'ak_live_***',
          storeId: 'ATVPDKIKX0DER',
          region: 'EU'
        }
      },
      {
        id: 'ebay',
        name: 'eBay',
        logo: '🏪',
        status: 'connected',
        lastSync: '2024-03-15T09:45:00Z',
        products: 890,
        orders: 156,
        revenue: 23450,
        syncEnabled: true,
        features: ['inventory_sync', 'order_management', 'listing_optimization'],
        connection: {
          apiKey: 'eb_live_***',
          storeId: 'myebaystore',
          region: 'EBAY_FR'
        }
      },
      {
        id: 'facebook',
        name: 'Facebook Marketplace',
        logo: '📘',
        status: 'syncing',
        lastSync: '2024-03-15T11:00:00Z',
        products: 567,
        orders: 89,
        revenue: 12340,
        syncEnabled: true,
        features: ['catalog_sync', 'ad_integration', 'insights'],
        connection: {
          apiKey: 'fb_live_***',
          storeId: 'my-facebook-page'
        }
      },
      {
        id: 'shopify',
        name: 'Shopify Plus',
        logo: '🛍️',
        status: 'connected',
        lastSync: '2024-03-15T10:15:00Z',
        products: 2100,
        orders: 567,
        revenue: 78900,
        syncEnabled: true,
        features: ['full_sync', 'webhook_support', 'analytics', 'multi_store'],
        connection: {
          apiKey: 'shpat_***',
          storeId: 'my-shopify-store.myshopify.com'
        }
      },
      {
        id: 'woocommerce',
        name: 'WooCommerce',
        logo: '🔌',
        status: 'error',
        lastSync: '2024-03-14T16:30:00Z',
        products: 450,
        orders: 78,
        revenue: 9870,
        syncEnabled: false,
        features: ['rest_api', 'webhook_support', 'custom_fields'],
        connection: {
          apiKey: 'ck_***',
          storeId: 'mystore.com'
        }
      }
    ]

    const mockSyncStats: SyncStats = {
      totalProducts: 5257,
      syncedProducts: 4890,
      pendingSync: 245,
      errors: 122,
      lastUpdate: '2024-03-15T11:00:00Z'
    }

    setMarketplaces(mockMarketplaces)
    setSyncStats(mockSyncStats)
    setLoading(false)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800'
      case 'syncing': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />
      case 'syncing': return <Sync className="h-4 w-4 animate-spin" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const toggleSync = async (marketplaceId: string, enabled: boolean) => {
    setMarketplaces(prev => prev.map(mp => 
      mp.id === marketplaceId ? { ...mp, syncEnabled: enabled } : mp
    ))
    
    toast({
      title: enabled ? "Synchronisation activée" : "Synchronisation désactivée",
      description: `La synchronisation pour ${marketplaces.find(mp => mp.id === marketplaceId)?.name} a été ${enabled ? 'activée' : 'désactivée'}`,
    })
  }

  const forcSync = async (marketplaceId: string) => {
    setMarketplaces(prev => prev.map(mp => 
      mp.id === marketplaceId ? { ...mp, status: 'syncing' } : mp
    ))

    // Simulation d'une synchronisation
    setTimeout(() => {
      setMarketplaces(prev => prev.map(mp => 
        mp.id === marketplaceId ? { 
          ...mp, 
          status: 'connected',
          lastSync: new Date().toISOString()
        } : mp
      ))
      
      toast({
        title: "Synchronisation terminée",
        description: "Les données ont été mises à jour avec succès",
      })
    }, 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hub Marketplace</h1>
          <p className="text-muted-foreground">
            Gérez vos intégrations marketplace et synchronisez vos données
          </p>
        </div>
        
        <Button className="bg-gradient-to-r from-primary to-primary/80">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter Marketplace
        </Button>
      </div>

      {/* Stats Overview */}
      {syncStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="mr-2 h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Produits totaux</p>
                  <p className="text-lg font-semibold">{syncStats.totalProducts.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Synchronisés</p>
                  <p className="text-lg font-semibold">{syncStats.syncedProducts.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Sync className="mr-2 h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-lg font-semibold">{syncStats.pendingSync.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Erreurs</p>
                  <p className="text-lg font-semibold">{syncStats.errors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync Progress */}
      {syncStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Progression de la synchronisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Synchronisation globale</span>
                <span>{Math.round((syncStats.syncedProducts / syncStats.totalProducts) * 100)}%</span>
              </div>
              <Progress 
                value={(syncStats.syncedProducts / syncStats.totalProducts) * 100} 
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Dernière mise à jour: {new Date(syncStats.lastUpdate).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketplace Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="management">Gestion</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplaces.map((marketplace) => (
              <Card key={marketplace.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{marketplace.logo}</span>
                      <CardTitle className="text-lg">{marketplace.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(marketplace.status)}>
                      {getStatusIcon(marketplace.status)}
                      <span className="ml-1">{marketplace.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Produits</p>
                      <p className="font-semibold">{marketplace.products.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Commandes</p>
                      <p className="font-semibold">{marketplace.orders.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <p className="text-muted-foreground">Revenus</p>
                    <p className="text-lg font-bold text-green-600">
                      €{marketplace.revenue.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`sync-${marketplace.id}`} className="text-sm">
                        Sync auto
                      </Label>
                      <Switch
                        id={`sync-${marketplace.id}`}
                        checked={marketplace.syncEnabled}
                        onCheckedChange={(checked) => toggleSync(marketplace.id, checked)}
                      />
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => forcSync(marketplace.id)}
                      disabled={marketplace.status === 'syncing'}
                    >
                      {marketplace.status === 'syncing' ? (
                        <Sync className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Dernière sync: {new Date(marketplace.lastSync).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des marketplaces</CardTitle>
              <CardDescription>
                Gérez les paramètres de synchronisation et les connexions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {marketplaces.map((marketplace) => (
                  <div key={marketplace.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{marketplace.logo}</span>
                        <div>
                          <h3 className="font-medium">{marketplace.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {marketplace.connection.storeId}
                          </p>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Configurer
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">API Key</p>
                        <p className="font-mono">{marketplace.connection.apiKey}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Store ID</p>
                        <p>{marketplace.connection.storeId}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Région</p>
                        <p>{marketplace.connection.region || 'Global'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(marketplace.status)}>
                          {marketplace.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Fonctionnalités activées:</p>
                      <div className="flex flex-wrap gap-1">
                        {marketplace.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Revenus par marketplace
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketplaces
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((marketplace) => {
                      const maxRevenue = Math.max(...marketplaces.map(mp => mp.revenue))
                      const percentage = (marketplace.revenue / maxRevenue) * 100
                      
                      return (
                        <div key={marketplace.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {marketplace.logo} {marketplace.name}
                            </span>
                            <span className="text-sm font-bold">
                              €{marketplace.revenue.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Performance des commandes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketplaces
                    .sort((a, b) => b.orders - a.orders)
                    .map((marketplace) => {
                      const maxOrders = Math.max(...marketplaces.map(mp => mp.orders))
                      const percentage = (marketplace.orders / maxOrders) * 100
                      
                      return (
                        <div key={marketplace.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {marketplace.logo} {marketplace.name}
                            </span>
                            <span className="text-sm font-bold">
                              {marketplace.orders} commandes
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}