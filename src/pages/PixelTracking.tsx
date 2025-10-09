import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Eye, TrendingUp, DollarSign, Users, Facebook, Chrome, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export default function PixelTracking() {
  const queryClient = useQueryClient()
  const [fbPixelId, setFbPixelId] = useState('')
  const [tiktokPixelId, setTiktokPixelId] = useState('')
  const [googleAdsId, setGoogleAdsId] = useState('')
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('')

  const { data: pixelConfig } = useQuery({
    queryKey: ['pixel-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return (data?.settings as any)?.pixel_tracking_config || {}
    }
  })

  const { data: conversionEvents } = useQuery({
    queryKey: ['conversion-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('conversion_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return data || []
    }
  })

  const savePixelMutation = useMutation({
    mutationFn: async (config: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('profiles')
        .update({ 
          settings: { pixel_tracking_config: config } 
        })
        .eq('id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixel-config'] })
      toast.success('Configuration des pixels sauvegardée')
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde')
    }
  })

  const handleSaveFacebook = () => {
    savePixelMutation.mutate({
      ...pixelConfig,
      facebook: {
        pixel_id: fbPixelId,
        enabled: true
      }
    })
  }

  const handleSaveTikTok = () => {
    savePixelMutation.mutate({
      ...pixelConfig,
      tiktok: {
        pixel_id: tiktokPixelId,
        enabled: true
      }
    })
  }

  const handleSaveGoogle = () => {
    savePixelMutation.mutate({
      ...pixelConfig,
      google: {
        ads_id: googleAdsId,
        analytics_id: googleAnalyticsId,
        enabled: true
      }
    })
  }

  const stats = {
    pageViews: conversionEvents?.filter(e => e.event_type === 'page_view').length || 0,
    addToCarts: conversionEvents?.filter(e => e.event_type === 'add_to_cart').length || 0,
    purchases: conversionEvents?.filter(e => e.event_type === 'purchase').length || 0,
    revenue: conversionEvents?.filter(e => e.event_type === 'purchase')
      .reduce((sum, e) => sum + (e.conversion_value || 0), 0) || 0
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tracking & Pixels</h1>
        <p className="text-muted-foreground">Configurez vos pixels de conversion et suivez vos performances</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Vues</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pageViews}</div>
            <p className="text-xs text-muted-foreground">Dernières 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ajouts Panier</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.addToCarts}</div>
            <p className="text-xs text-muted-foreground">Taux: {stats.pageViews > 0 ? ((stats.addToCarts / stats.pageViews) * 100).toFixed(1) : 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.purchases}</div>
            <p className="text-xs text-muted-foreground">Taux: {stats.pageViews > 0 ? ((stats.purchases / stats.pageViews) * 100).toFixed(1) : 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Tracké</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revenue.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">Panier moyen: {stats.purchases > 0 ? (stats.revenue / stats.purchases).toFixed(2) : 0} €</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="facebook" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="facebook">
            <Facebook className="w-4 h-4 mr-2" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="tiktok">
            <Zap className="w-4 h-4 mr-2" />
            TikTok
          </TabsTrigger>
          <TabsTrigger value="google">
            <Chrome className="w-4 h-4 mr-2" />
            Google
          </TabsTrigger>
          <TabsTrigger value="events">
            Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facebook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facebook Pixel</CardTitle>
              <CardDescription>
                Configurez votre pixel Facebook pour tracker les conversions et créer des audiences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fb-pixel">Pixel ID Facebook</Label>
                <Input
                  id="fb-pixel"
                  placeholder="123456789012345"
                  value={fbPixelId}
                  onChange={(e) => setFbPixelId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Trouvez votre pixel ID dans le gestionnaire d'événements Facebook
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="fb-enabled" defaultChecked={pixelConfig?.facebook?.enabled} />
                <Label htmlFor="fb-enabled">Activer le tracking Facebook</Label>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Événements trackés automatiquement:</h4>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">PageView</span>
                    <Badge>Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">ViewContent</span>
                    <Badge>Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">AddToCart</span>
                    <Badge>Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">InitiateCheckout</span>
                    <Badge>Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">Purchase</span>
                    <Badge>Actif</Badge>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveFacebook} className="w-full">
                Sauvegarder la configuration Facebook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiktok" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TikTok Pixel</CardTitle>
              <CardDescription>
                Configurez votre pixel TikTok pour optimiser vos campagnes publicitaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tiktok-pixel">Pixel ID TikTok</Label>
                <Input
                  id="tiktok-pixel"
                  placeholder="ABCDEFGH123456"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Trouvez votre pixel ID dans TikTok Events Manager
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="tiktok-enabled" defaultChecked={pixelConfig?.tiktok?.enabled} />
                <Label htmlFor="tiktok-enabled">Activer le tracking TikTok</Label>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Événements trackés:</h4>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">PageView</span>
                    <Badge>Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">ViewContent</span>
                    <Badge>Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">AddToCart</span>
                    <Badge>Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">CompletePayment</span>
                    <Badge>Actif</Badge>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveTikTok} className="w-full">
                Sauvegarder la configuration TikTok
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Tracking</CardTitle>
              <CardDescription>
                Configurez Google Ads et Google Analytics pour un tracking complet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google-ads">Google Ads Conversion ID</Label>
                <Input
                  id="google-ads"
                  placeholder="AW-123456789"
                  value={googleAdsId}
                  onChange={(e) => setGoogleAdsId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-analytics">Google Analytics 4 ID</Label>
                <Input
                  id="google-analytics"
                  placeholder="G-XXXXXXXXXX"
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="google-enabled" defaultChecked={pixelConfig?.google?.enabled} />
                <Label htmlFor="google-enabled">Activer le tracking Google</Label>
              </div>

              <Button onClick={handleSaveGoogle} className="w-full">
                Sauvegarder la configuration Google
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Événements Récents</CardTitle>
              <CardDescription>Dernières conversions trackées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conversionEvents?.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{event.event_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                    {event.conversion_value && (
                      <Badge>{event.conversion_value} €</Badge>
                    )}
                  </div>
                ))}
                {(!conversionEvents || conversionEvents.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun événement tracké pour le moment
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
