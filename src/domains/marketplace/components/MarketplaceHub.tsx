import { useState, useEffect } from 'react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Store, 
  TrendingUp, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Plus,
  Settings
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface MarketplaceConnection {
  id: string
  platform: string
  status: string
  last_sync_at: string
  sync_stats: any
  credentials: any
  user_id: string
  created_at: string
}

export const MarketplaceHub = () => {
  const { user } = useAuthOptimized()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<MarketplaceConnection[]>([])
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadConnections()
    }
  }, [user])

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setConnections(data || [])
    } catch (error) {
      console.error('Error loading marketplace connections:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les connexions marketplace",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const syncMarketplace = async (connectionId: string, platform: string) => {
    setSyncing(connectionId)
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-hub', {
        body: { 
          action: 'sync',
          connection_id: connectionId,
          platform
        }
      })

      if (error) throw error

      toast({
        title: "Synchronisation réussie",
        description: `${data.products_synced} produits synchronisés avec ${platform}`
      })
      
      await loadConnections()
    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: "Erreur de synchronisation",
        description: "Échec de la synchronisation",
        variant: "destructive"
      })
    } finally {
      setSyncing(null)
    }
  }

  const connectMarketplace = async (platform: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-hub', {
        body: { 
          action: 'connect',
          platform,
          user_id: user?.id
        }
      })

      if (error) throw error

      toast({
        title: "Connexion établie",
        description: `Connexion réussie avec ${platform}`
      })
      
      await loadConnections()
    } catch (error) {
      console.error('Connection error:', error)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à la plateforme",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const availableMarketplaces = [
    { id: 'amazon', name: 'Amazon' },
    { id: 'ebay', name: 'eBay' },
    { id: 'facebook', name: 'Facebook Marketplace' },
    { id: 'shopify', name: 'Shopify' },
    { id: 'cdiscount', name: 'Cdiscount' },
    { id: 'rakuten', name: 'Rakuten' },
    { id: 'manomano', name: 'ManoMano' },
    { id: 'fnac', name: 'Fnac' },
    { id: 'backmarket', name: 'Back Market' },
    { id: 'wish', name: 'Wish' },
    { id: 'aliexpress', name: 'AliExpress' },
    { id: 'etsy', name: 'Etsy' },
    { id: 'walmart', name: 'Walmart' },
    { id: 'google-shopping', name: 'Google Shopping' },
    { id: 'leboncoin', name: 'Leboncoin' },
    { id: 'veepee', name: 'Veepee' },
    { id: 'laredoute', name: 'La Redoute' },
    { id: 'spartoo', name: 'Spartoo' },
    { id: 'showroomprive', name: 'Showroom Privé' },
    { id: 'vinted', name: 'Vinted' },
    { id: 'vestiairecollective', name: 'Vestiaire Collective' },
    { id: 'mercari', name: 'Mercari' },
    { id: 'poshmark', name: 'Poshmark' },
    { id: 'depop', name: 'Depop' },
    { id: 'zalando', name: 'Zalando' },
    { id: 'asos', name: 'ASOS' },
    { id: 'faire', name: 'Faire (B2B)' },
    { id: 'ankorstore', name: 'Ankorstore (B2B)' },
    { id: 'chrono24', name: 'Chrono24' },
    { id: 'reverb', name: 'Reverb' },
    { id: 'discogs', name: 'Discogs' },
    { id: 'allegro', name: 'Allegro' },
    { id: 'bol', name: 'Bol.com' },
    { id: 'kaufland', name: 'Kaufland' },
    { id: 'otto', name: 'Otto' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const totalRevenue = connections.reduce((sum, c) => sum + ((c.sync_stats as any)?.revenue || 0), 0)
  const totalProducts = connections.reduce((sum, c) => sum + ((c.sync_stats as any)?.products_synced || 0), 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8" />
            Marketplace Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestion centralisée des intégrations marketplace
          </p>
        </div>
        <Badge variant="secondary">PHASE 3</Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Plateformes connectées</CardDescription>
            <CardTitle className="text-3xl">{connections.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Produits synchronisés</CardDescription>
            <CardTitle className="text-3xl">{totalProducts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Revenus total</CardDescription>
            <CardTitle className="text-3xl">{totalRevenue.toFixed(2)} €</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList>
          <TabsTrigger value="connections">Connexions</TabsTrigger>
          <TabsTrigger value="available">Disponibles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          {connections.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Aucune connexion marketplace active. Ajoutez-en une depuis l'onglet "Disponibles".
                </p>
              </CardContent>
            </Card>
          ) : (
            connections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Store className="h-6 w-6" />
                      <div>
                        <CardTitle>{connection.platform}</CardTitle>
                        <CardDescription>
                          Dernière sync: {new Date(connection.last_sync_at).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connection.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={syncing === connection.id}
                        onClick={() => syncMarketplace(connection.id, connection.platform)}
                      >
                        {syncing === connection.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Produits synchronisés</span>
                      <span className="font-medium">{(connection.sync_stats as any)?.products_synced || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenus</span>
                      <span className="font-medium">{((connection.sync_stats as any)?.revenue || 0).toFixed(2)} €</span>
                    </div>
                    <Progress value={connection.status === 'connected' ? 100 : 0} />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableMarketplaces.map((marketplace) => (
              <Card key={marketplace.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Store className="h-6 w-6" />
                      <CardTitle>{marketplace.name}</CardTitle>
                    </div>
                    <Button
                      onClick={() => connectMarketplace(marketplace.id)}
                      disabled={connections.some(c => c.platform === marketplace.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connecter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Synchronisez vos produits avec {marketplace.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Revenus totaux</span>
                  <span className="text-2xl font-bold">{totalRevenue.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Produits actifs</span>
                  <span className="text-2xl font-bold">{totalProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Taux de synchronisation</span>
                  <span className="text-2xl font-bold">98.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
