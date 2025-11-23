import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Play, Instagram, Facebook, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TikTokShopConnector } from '@/components/marketplace/TikTokShopConnector'

export default function SocialCommercePage() {
  return (
    <>
      <Helmet>
        <title>Social Commerce - ShopOpti</title>
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
            <Play className="h-6 w-6 text-pink-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Social Commerce</h1>
            <p className="text-muted-foreground">Vendez directement sur TikTok Shop</p>
          </div>
        </div>

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
          
          <TabsContent value="instagram">
            <Card><CardContent className="pt-6 text-center">
              <Instagram className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Disponible prochainement</p>
            </CardContent></Card>
          </TabsContent>
          
          <TabsContent value="facebook">
            <Card><CardContent className="pt-6 text-center">
              <Facebook className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Disponible prochainement</p>
            </CardContent></Card>
          </TabsContent>
          
          <TabsContent value="pinterest">
            <Card><CardContent className="pt-6 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Disponible prochainement</p>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
