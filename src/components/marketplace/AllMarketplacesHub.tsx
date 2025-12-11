import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Store, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  RefreshCw, 
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Globe
} from 'lucide-react'
import { motion } from 'framer-motion'
import { MarketplaceConnector } from './MarketplaceConnector'
import { useMarketplaceConnections } from '@/hooks/useMarketplaceConnections'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function AllMarketplacesHub() {
  const { toast } = useToast()
  const { connections, stats, isLoading, refetch } = useMarketplaceConnections()
  const [syncing, setSyncing] = useState<string | null>(null)

  const handleConnect = async (platform: string, credentials: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { data, error } = await supabase.functions.invoke(`${platform}-marketplace-integration`, {
      body: {
        action: 'connect',
        user_id: user.id,
        credentials
      }
    })

    if (error) throw error
    await refetch()
    return data
  }

  const handleSync = async (integrationId: string, platform: string) => {
    setSyncing(integrationId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Sync products
      await supabase.functions.invoke(`${platform}-marketplace-integration`, {
        body: {
          action: 'sync_products',
          integration_id: integrationId,
          user_id: user.id
        }
      })

      // Sync orders
      await supabase.functions.invoke(`${platform}-marketplace-integration`, {
        body: {
          action: 'sync_orders',
          integration_id: integrationId,
          user_id: user.id
        }
      })

      toast({
        title: 'Synchronisation terminée',
        description: 'Les produits et commandes ont été synchronisés',
      })
      
      await refetch()
    } catch (error: any) {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    try {
      await supabase
        .from('marketplace_integrations')
        .update({ is_active: false, status: 'disconnected' })
        .eq('id', integrationId)

      toast({
        title: 'Déconnexion réussie',
        description: 'Le marketplace a été déconnecté',
      })
      
      await refetch()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getConnectionForPlatform = (platform: string) => {
    return connections.find(c => c.platform === platform && c.is_active)
  }

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marketplaces</p>
                <p className="text-2xl font-bold">{stats?.activeConnections || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{stats?.totalProducts?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ShoppingCart className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{stats?.totalOrders?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux succès</p>
                <p className="text-2xl font-bold">{stats?.successRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace Cards */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="connected">Connectés</TabsTrigger>
          <TabsTrigger value="available">Disponibles</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(['amazon', 'ebay', 'temu', 'cdiscount'] as const).map((platform) => {
              const connection = getConnectionForPlatform(platform)
              return (
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MarketplaceConnector
                    platform={platform}
                    isConnected={!!connection}
                    connectionData={connection ? {
                      products: connection.total_products_synced,
                      orders: connection.total_orders_synced
                    } : undefined}
                    onConnect={(creds) => handleConnect(platform, creds)}
                    onDisconnect={connection ? () => handleDisconnect(connection.id) : undefined}
                  />
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.filter(c => c.is_active).map((connection) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ConnectedMarketplaceCard
                  connection={connection}
                  onSync={() => handleSync(connection.id, connection.platform)}
                  onDisconnect={() => handleDisconnect(connection.id)}
                  isSyncing={syncing === connection.id}
                />
              </motion.div>
            ))}
            {connections.filter(c => c.is_active).length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Store className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Aucun marketplace connecté</p>
                  <p className="text-sm text-muted-foreground">
                    Connectez votre premier marketplace pour commencer
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(['amazon', 'ebay', 'temu', 'cdiscount'] as const)
              .filter(platform => !getConnectionForPlatform(platform))
              .map((platform) => (
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MarketplaceConnector
                    platform={platform}
                    isConnected={false}
                    onConnect={(creds) => handleConnect(platform, creds)}
                  />
                </motion.div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ConnectedMarketplaceCardProps {
  connection: any
  onSync: () => void
  onDisconnect: () => void
  isSyncing: boolean
}

function ConnectedMarketplaceCard({ connection, onSync, onDisconnect, isSyncing }: ConnectedMarketplaceCardProps) {
  const platformConfigs: Record<string, { name: string; color: string }> = {
    amazon: { name: 'Amazon', color: 'from-orange-500 to-yellow-500' },
    ebay: { name: 'eBay', color: 'from-blue-600 to-blue-400' },
    temu: { name: 'Temu', color: 'from-orange-600 to-red-500' },
    cdiscount: { name: 'Cdiscount', color: 'from-green-500 to-emerald-500' },
  }

  const config = platformConfigs[connection.platform] || { name: connection.platform, color: 'from-gray-500 to-gray-400' }

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.color}`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-r ${config.color}`}>
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <CardDescription className="text-xs truncate max-w-[180px]">
                {connection.shop_url}
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connecté
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Produits</span>
            </div>
            <p className="text-xl font-bold mt-1">
              {connection.total_products_synced?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Commandes</span>
            </div>
            <p className="text-xl font-bold mt-1">
              {connection.total_orders_synced?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Sync info */}
        {connection.last_sync_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Dernière sync: {new Date(connection.last_sync_at).toLocaleString('fr-FR')}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1" 
            onClick={onSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
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
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AllMarketplacesHub
