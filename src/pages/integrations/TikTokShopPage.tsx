import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, ShoppingBag, TrendingUp, Users, RefreshCw, Package, Unplug, CheckCircle2, Loader2 } from 'lucide-react'
import { useTikTokShop } from '@/hooks/useTikTokShop'
import { TikTokShopConnector } from '@/components/marketplace/TikTokShopConnector'
import { supabase } from '@/integrations/supabase/client'

export default function TikTokShopPage() {
  const { syncProducts, syncOrders, isSyncingProducts, isSyncingOrders } = useTikTokShop()
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ['tiktok-shop-integration'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data } = await (supabase as any)
        .from('marketplace_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'tiktok_shop')
        .eq('status', 'connected')
        .maybeSingle()

      return data
    },
  })

  const isConnected = !!integration

  const handleDisconnect = async () => {
    if (!integration?.id) return
    setIsDisconnecting(true)
    try {
      await supabase.functions.invoke('tiktok-shop-integration', {
        body: { action: 'disconnect', integration_id: integration.id },
      })
      refetch()
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
            <Play className="h-8 w-8 text-pink-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">TikTok Shop</h1>
            <p className="text-muted-foreground">Vendez sur TikTok avec +1 milliard d'utilisateurs</p>
          </div>
        </div>
        {isConnected && (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Connecté
          </Badge>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => syncProducts(integration.id)} disabled={isSyncingProducts}>
                {isSyncingProducts ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Synchroniser les produits
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => syncOrders(integration.id)} disabled={isSyncingOrders}>
                {isSyncingOrders ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                Synchroniser les commandes
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive" onClick={handleDisconnect} disabled={isDisconnecting}>
                {isDisconnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unplug className="h-4 w-4 mr-2" />}
                Déconnecter
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TikTokShopConnector />
          <Card>
            <CardHeader><CardTitle>Pourquoi TikTok Shop ?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-pink-500" />
                <div><h4 className="font-medium">+1 Milliard d'utilisateurs</h4><p className="text-sm text-muted-foreground">Audience sociale mondiale</p></div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div><h4 className="font-medium">Taux de conversion 3.5%</h4><p className="text-sm text-muted-foreground">3x supérieur aux autres plateformes</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
