import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Play, Instagram, Facebook, MapPin, ExternalLink, ShoppingBag, TrendingUp, Users, Eye, Link2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TikTokShopConnector } from '@/components/marketplace/TikTokShopConnector'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useToast } from '@/hooks/use-toast'

const SOCIAL_CHANNELS = [
  {
    id: 'instagram',
    name: 'Instagram Shopping',
    icon: Instagram,
    status: 'disconnected' as string,
    products: 0,
    reach: 0,
    engagement: 0,
    description: 'Vendez via Instagram Shop, Stories et Reels avec tagging produit',
    features: ['Shop intégré', 'Tags produit', 'Checkout natif', 'Stories shoppables'],
  },
  {
    id: 'facebook',
    name: 'Facebook Shops',
    icon: Facebook,
    status: 'disconnected' as string,
    products: 0,
    reach: 0,
    engagement: 0,
    description: 'Catalogue Facebook, Marketplace et publicités dynamiques',
    features: ['Catalogue auto', 'Marketplace', 'Ads dynamiques', 'Messenger commerce'],
  },
  {
    id: 'pinterest',
    name: 'Pinterest Shopping',
    icon: MapPin,
    status: 'disconnected' as string,
    products: 0,
    reach: 0,
    engagement: 0,
    description: 'Épingles shoppables et catalogue produit Pinterest',
    features: ['Épingles riches', 'Catalogue auto', 'Ads shopping', 'Visual search'],
  },
]

export default function SocialCommercePage() {
  const { toast } = useToast()
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleConnect = (channelId: string) => {
    setConnecting(channelId)
    setTimeout(() => {
      setConnecting(null)
      toast({
        title: 'Connexion initiée',
        description: 'Configurez votre compte dans les paramètres d\'intégration pour finaliser.',
      })
    }, 1500)
  }

  return (
    <>
      <Helmet>
        <title>Social Commerce | ShopOpti</title>
        <meta name="description" content="Vendez directement sur TikTok Shop, Instagram, Facebook et Pinterest" />
      </Helmet>
      <ChannablePageWrapper
        title="Social Commerce"
        subtitle="Marketing"
        description="Vendez directement sur TikTok Shop, Instagram et autres réseaux sociaux"
        heroImage="marketing"
        badge={{ label: 'Social', icon: Play }}
      >
        <Tabs defaultValue="tiktok" className="mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tiktok"><Play className="h-4 w-4 mr-2" />TikTok Shop</TabsTrigger>
            <TabsTrigger value="instagram"><Instagram className="h-4 w-4 mr-2" />Instagram</TabsTrigger>
            <TabsTrigger value="facebook"><Facebook className="h-4 w-4 mr-2" />Facebook</TabsTrigger>
            <TabsTrigger value="pinterest"><MapPin className="h-4 w-4 mr-2" />Pinterest</TabsTrigger>
          </TabsList>

          <TabsContent value="tiktok" className="mt-6">
            <TikTokShopConnector />
          </TabsContent>

          {SOCIAL_CHANNELS.map((channel) => (
            <TabsContent key={channel.id} value={channel.id} className="mt-6 space-y-6">
              {/* Channel Overview */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Statut</CardTitle>
                    <channel.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <Badge variant={channel.status === 'connected' ? 'default' : 'secondary'}>
                      {channel.status === 'connected' ? 'Connecté' : 'Non connecté'}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Produits Listés</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{channel.products}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Portée</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{channel.reach.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{channel.engagement}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Channel Config */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <channel.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{channel.name}</CardTitle>
                        <CardDescription>{channel.description}</CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleConnect(channel.id)}
                      disabled={connecting === channel.id}
                    >
                      {connecting === channel.id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-2" />
                      )}
                      Connecter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-3">Fonctionnalités disponibles</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {channel.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
                        >
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Prérequis</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Compte Business {channel.name.split(' ')[0]} requis
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Catalogue produit avec au moins 1 article
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </ChannablePageWrapper>
    </>
  )
}
