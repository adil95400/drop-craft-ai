import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Store,
  ShoppingBag,
  Package,
  TrendingUp,
  RefreshCw,
  Plus,
  Settings,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  BookOpen,
  Play,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface MarketplaceIntegration {
  id: string
  platform: string
  shop_url: string
  status: string
  is_active: boolean
  last_sync_at: string
  next_sync_at: string
  total_products_synced: number
  total_orders_synced: number
  total_sync_count: number
  failed_sync_count: number
}

const MARKETPLACE_CONFIGS = {
  // Stores
  shopify: {
    name: 'Shopify',
    icon: Store,
    color: 'from-green-600 to-green-400',
    description: 'E-commerce platform',
  },
  woocommerce: {
    name: 'WooCommerce',
    icon: ShoppingBag,
    color: 'from-purple-600 to-purple-400',
    description: 'WordPress e-commerce',
  },
  
  // Marketplaces
  amazon: {
    name: 'Amazon',
    icon: ShoppingBag,
    color: 'from-orange-600 to-yellow-500',
    description: 'Global marketplace leader',
  },
  etsy: {
    name: 'Etsy',
    icon: Store,
    color: 'from-orange-500 to-red-500',
    description: 'Handmade & vintage marketplace',
  },
  cdiscount: {
    name: 'Cdiscount',
    icon: ShoppingBag,
    color: 'from-green-500 to-emerald-500',
    description: 'French e-commerce leader',
  },
  ebay: {
    name: 'eBay',
    icon: Package,
    color: 'from-blue-600 to-blue-400',
    description: 'Online auction & shopping',
  },
  allegro: {
    name: 'Allegro',
    icon: Package,
    color: 'from-purple-500 to-pink-500',
    description: 'Polish marketplace leader',
  },
  manomano: {
    name: 'ManoMano',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
    description: 'DIY & home improvement',
  },
  rakuten: {
    name: 'Rakuten',
    icon: Store,
    color: 'from-red-600 to-pink-500',
    description: 'Japanese e-commerce giant',
  },
  fnac: {
    name: 'Fnac',
    icon: ShoppingBag,
    color: 'from-yellow-600 to-orange-500',
    description: 'French cultural & tech retailer',
  },
  
  // Suppliers
  bigbuy: {
    name: 'BigBuy',
    icon: Package,
    color: 'from-indigo-600 to-blue-500',
    description: 'European dropshipping wholesale',
  },
  aliexpress: {
    name: 'AliExpress',
    icon: TrendingUp,
    color: 'from-red-500 to-orange-500',
    description: 'Global dropshipping platform',
  },
  
  // Social Commerce
  tiktok_shop: {
    name: 'TikTok Shop',
    icon: Play,
    color: 'from-pink-500 to-purple-500',
    description: 'Vente sociale sur TikTok',
  },
}

export function MarketplaceIntegrationsHub() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [integrations, setIntegrations] = useState<MarketplaceIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('marketplace_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setIntegrations(data || [])
    } catch (error) {
      console.error('Error fetching integrations:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les intégrations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId)
    try {
      // Simulate sync with random products/orders count
      const productsCount = Math.floor(Math.random() * 100) + 50
      const ordersCount = Math.floor(Math.random() * 50) + 10

      // Get current sync count
      const { data: currentData } = await supabase
        .from('marketplace_integrations')
        .select('total_sync_count')
        .eq('id', integrationId)
        .single()

      // Update integration stats
      const { error } = await supabase
        .from('marketplace_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          total_products_synced: productsCount,
          total_orders_synced: ordersCount,
          total_sync_count: (currentData?.total_sync_count || 0) + 1,
          status: 'connected'
        })
        .eq('id', integrationId)

      if (error) throw error

      toast({
        title: 'Synchronisation réussie',
        description: `${productsCount} produits et ${ordersCount} commandes synchronisés`,
      })

      await fetchIntegrations()
    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: 'Erreur',
        description: 'Échec de la synchronisation',
        variant: 'destructive',
      })
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_integrations')
        .update({ 
          is_active: false,
          status: 'disconnected'
        })
        .eq('id', integrationId)

      if (error) throw error

      toast({
        title: 'Déconnexion réussie',
        description: 'L\'intégration a été déconnectée',
      })

      await fetchIntegrations()
    } catch (error) {
      console.error('Disconnect error:', error)
      toast({
        title: 'Erreur',
        description: 'Échec de la déconnexion',
        variant: 'destructive',
      })
    }
  }

  const handleConnect = async (platform: string) => {
    // Redirect to Social Commerce page for TikTok Shop
    if (platform === 'tiktok_shop') {
      navigate('/social-commerce')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create new integration
      const { data, error } = await supabase
        .from('marketplace_integrations')
        .insert({
          user_id: user.id,
          platform: platform as any,
          shop_url: `https://${platform}-shop-${Math.random().toString(36).substr(2, 9)}.com`,
          is_active: true,
          status: 'connected'
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Connexion réussie',
        description: `Connecté à ${platform}`,
      })

      await fetchIntegrations()
    } catch (error: any) {
      console.error('Connect error:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de la connexion',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Déconnecté</Badge>
    }

    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connecté
          </Badge>
        )
      case 'syncing':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Synchronisation
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
    }
  }

  const availablePlatforms = Object.entries(MARKETPLACE_CONFIGS).filter(
    ([key]) => !integrations.some((i) => i.platform === key)
  )

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Intégrations Marketplace</h1>
              <p className="text-muted-foreground">
                Connectez et synchronisez vos boutiques sur différentes plateformes
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/integrations/marketplace/integration-guides')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Guides d'intégration
            </Button>
          </div>
        </div>

        <Tabs defaultValue="connected" className="space-y-6">
          <TabsList>
            <TabsTrigger value="connected">
              <CheckCircle className="h-4 w-4 mr-2" />
              Connectées ({integrations.filter((i) => i.is_active).length})
            </TabsTrigger>
            <TabsTrigger value="available">
              <Plus className="h-4 w-4 mr-2" />
              Disponibles ({availablePlatforms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connected" className="space-y-4">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-2">
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : integrations.filter((i) => i.is_active).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Store className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Aucune intégration connectée</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connectez votre première marketplace pour commencer
                  </p>
                  <Button onClick={() => {
                    const tab = document.querySelector('[value="available"]') as HTMLButtonElement
                    tab?.click()
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une intégration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {integrations
                  .filter((i) => i.is_active)
                  .map((integration) => {
                    const config = MARKETPLACE_CONFIGS[integration.platform]
                    const Icon = config.icon

                    return (
                      <motion.div
                        key={integration.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg bg-gradient-to-r ${config.color}`}
                                >
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{config.name}</CardTitle>
                                  <CardDescription className="text-xs">
                                    {integration.shop_url}
                                  </CardDescription>
                                </div>
                              </div>
                              {getStatusBadge(integration.status, integration.is_active)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Produits</p>
                                <p className="font-semibold">
                                  {integration.total_products_synced.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Commandes</p>
                                <p className="font-semibold">
                                  {integration.total_orders_synced.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Syncs</p>
                                <p className="font-semibold">
                                  {integration.total_sync_count}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Échecs</p>
                                <p className="font-semibold text-destructive">
                                  {integration.failed_sync_count}
                                </p>
                              </div>
                            </div>

                            {integration.last_sync_at && (
                              <p className="text-xs text-muted-foreground">
                                Dernière sync:{' '}
                                {new Date(integration.last_sync_at).toLocaleString('fr-FR')}
                              </p>
                            )}

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleSync(integration.id)}
                                disabled={syncing === integration.id}
                              >
                                {syncing === integration.id ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Synchronisation...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Synchroniser
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDisconnect(integration.id)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePlatforms.map(([key, config]) => {
                const Icon = config.icon

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 rounded-lg bg-gradient-to-r ${config.color} group-hover:scale-110 transition-transform`}
                          >
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle>{config.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {config.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full bg-gradient-primary"
                          onClick={() => handleConnect(key)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Connecter
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}