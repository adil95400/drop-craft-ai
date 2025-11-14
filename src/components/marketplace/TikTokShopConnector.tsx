import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Play, ShoppingBag, TrendingUp, Users } from 'lucide-react'

export function TikTokShopConnector() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [shopId, setShopId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopRegion, setShopRegion] = useState('US')

  const handleConnect = async () => {
    if (!shopId || !accessToken) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-shop-integration', {
        body: {
          action: 'connect',
          shop_id: shopId,
          access_token: accessToken,
          shop_name: shopName,
          shop_region: shopRegion,
        },
      })

      if (error) throw error

      toast({
        title: 'Connexion réussie',
        description: 'Votre boutique TikTok Shop est maintenant connectée',
      })

      // Reset form
      setShopId('')
      setAccessToken('')
      setShopName('')
      setShopRegion('US')
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message || 'Impossible de connecter TikTok Shop',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
            <Play className="h-6 w-6 text-pink-500" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              TikTok Shop
              <Badge variant="outline" className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/30">
                Social Commerce
              </Badge>
            </CardTitle>
            <CardDescription>
              Vendez directement sur TikTok avec +1 milliard d'utilisateurs
            </CardDescription>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span>Audience</span>
            </div>
            <p className="text-lg font-semibold">1B+ Users</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ShoppingBag className="h-4 w-4" />
              <span>Conversion</span>
            </div>
            <p className="text-lg font-semibold">3.5%</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>ROI Moyen</span>
            </div>
            <p className="text-lg font-semibold">285%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shop-id">
            Shop ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="shop-id"
            placeholder="Votre TikTok Shop ID"
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Trouvez votre Shop ID dans TikTok Seller Center {'>'} Settings
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="access-token">
            Access Token <span className="text-destructive">*</span>
          </Label>
          <Input
            id="access-token"
            type="password"
            placeholder="Votre Access Token"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Générez un token dans TikTok Seller Center {'>'} API & SDK
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shop-name">Nom de la boutique (optionnel)</Label>
          <Input
            id="shop-name"
            placeholder="Ex: Ma Boutique TikTok"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shop-region">Région</Label>
          <Select value={shopRegion} onValueChange={setShopRegion} disabled={loading}>
            <SelectTrigger id="shop-region">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">États-Unis</SelectItem>
              <SelectItem value="UK">Royaume-Uni</SelectItem>
              <SelectItem value="EU">Europe</SelectItem>
              <SelectItem value="SEA">Asie du Sud-Est</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Play className="h-4 w-4" />
            Fonctionnalités TikTok Shop
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Publication automatique de produits</li>
            <li>• Synchronisation des stocks en temps réel</li>
            <li>• Gestion des commandes TikTok Shop</li>
            <li>• Analytics et performances de ventes</li>
            <li>• Intégration avec TikTok Live Shopping</li>
          </ul>
        </div>

        <Button 
          onClick={handleConnect} 
          disabled={loading || !shopId || !accessToken}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          {loading ? 'Connexion en cours...' : 'Connecter TikTok Shop'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          En connectant TikTok Shop, vous acceptez les{' '}
          <a href="#" className="text-primary hover:underline">
            conditions d'utilisation
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
