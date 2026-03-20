import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Package, Palette, Printer, RefreshCw, CheckCircle2,
  AlertCircle, Loader2, DollarSign, ShoppingCart, Link2,
  Settings, ArrowUpRight, Image, Layers, Shirt
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

const POD_CATEGORIES = [
  { name: 'T-Shirts', count: 245, icon: '👕' },
  { name: 'Mugs', count: 89, icon: '☕' },
  { name: 'Posters', count: 156, icon: '🖼️' },
  { name: 'Coques', count: 67, icon: '📱' },
  { name: 'Sacs', count: 34, icon: '👜' },
  { name: 'Stickers', count: 112, icon: '🏷️' },
]

export default function PrintifyPage() {
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [apiToken, setApiToken] = useState('')
  const [shopId, setShopId] = useState('')
  const [autoFulfill, setAutoFulfill] = useState(true)
  const [syncDesigns, setSyncDesigns] = useState(true)

  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ['printify-integration'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'printify')
        .eq('connection_status', 'connected')
        .maybeSingle()
      return data
    },
  })

  const isConnected = !!integration

  const handleConnect = async () => {
    if (!apiToken.trim()) {
      toast({ title: 'Erreur', description: 'Token API requis', variant: 'destructive' })
      return
    }
    setIsConnecting(true)
    try {
      const { error } = await supabase.functions.invoke('marketplace-connect', {
        body: {
          platform: 'printify',
          credentials: { api_token: apiToken, shop_id: shopId },
          config: { auto_fulfill: autoFulfill, sync_designs: syncDesigns }
        }
      })
      if (error) throw error
      toast({ title: 'Connexion réussie', description: 'Printify connecté' })
      refetch()
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
    } finally {
      setIsConnecting(false)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center text-3xl">🖨️</div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Printify
              {isConnected ? (
                <Badge className="bg-success/10 text-success border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Connecté</Badge>
              ) : (
                <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Non connecté</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">Print-on-Demand — Créez et vendez des produits personnalisés</p>
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Connexion Printify API</CardTitle>
              <CardDescription>Générez un token dans Printify → Account → Connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Token API Personnel</Label>
                <Input type="password" value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="eyJhbGciOi..." />
              </div>
              <div className="space-y-2">
                <Label>Shop ID (optionnel)</Label>
                <Input value={shopId} onChange={e => setShopId(e.target.value)} placeholder="123456" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div><p className="text-sm font-medium">Auto-fulfillment</p><p className="text-xs text-muted-foreground">Exécuter automatiquement les commandes via Printify</p></div>
                <Switch checked={autoFulfill} onCheckedChange={setAutoFulfill} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div><p className="text-sm font-medium">Sync designs</p><p className="text-xs text-muted-foreground">Importer vos designs et mockups</p></div>
                <Switch checked={syncDesigns} onCheckedChange={setSyncDesigns} />
              </div>
              <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
                {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                Connecter Printify
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Catalogue Print-on-Demand</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {POD_CATEGORIES.map(cat => (
                  <div key={cat.name} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.count} produits</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Avantages Printify</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {['Zéro stock', '250+ fournisseurs', 'Mockup auto', 'Expédition mondiale', 'Marque blanche', 'Intégration Shopify'].map(f => (
                    <span key={f} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" />{f}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="products">Produits POD</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="providers">Fournisseurs</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Produits actifs', value: '127', icon: Shirt },
                { label: 'Commandes (30j)', value: '89', icon: ShoppingCart },
                { label: 'Revenus POD', value: '3 420 €', icon: DollarSign },
                { label: 'Designs', value: '45', icon: Image },
              ].map(s => (
                <Card key={s.label}>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2"><s.icon className="h-4 w-4" />{s.label}</CardDescription>
                    <CardTitle className="text-2xl">{s.value}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="products"><Card><CardContent className="pt-6"><div className="text-center py-12 text-muted-foreground"><Layers className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Vos produits Printify apparaîtront ici</p></div></CardContent></Card></TabsContent>
          <TabsContent value="orders"><Card><CardContent className="pt-6"><div className="text-center py-12 text-muted-foreground"><ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Commandes POD en attente de fulfillment</p></div></CardContent></Card></TabsContent>
          <TabsContent value="providers"><Card><CardContent className="pt-6"><div className="text-center py-12 text-muted-foreground"><Printer className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Vos print providers connectés</p></div></CardContent></Card></TabsContent>
        </Tabs>
      )}
    </div>
  )
}
