import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Package, ShoppingCart, TrendingUp, RefreshCw, CheckCircle2,
  AlertCircle, Loader2, DollarSign, BarChart3, Link2, Settings,
  ArrowUpRight, ArrowDownRight, Star, Truck
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockSalesData = [
  { day: 'Lun', revenue: 620, orders: 8 },
  { day: 'Mar', revenue: 890, orders: 12 },
  { day: 'Mer', revenue: 540, orders: 7 },
  { day: 'Jeu', revenue: 1100, orders: 15 },
  { day: 'Ven', revenue: 980, orders: 13 },
  { day: 'Sam', revenue: 1350, orders: 18 },
  { day: 'Dim', revenue: 760, orders: 10 },
]

export default function CDiscountPage() {
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [apiLogin, setApiLogin] = useState('')
  const [apiPassword, setApiPassword] = useState('')
  const [syncProducts, setSyncProducts] = useState(true)
  const [syncOrders, setSyncOrders] = useState(true)
  const [syncStock, setSyncStock] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ['cdiscount-integration'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'cdiscount')
        .eq('connection_status', 'connected')
        .maybeSingle()
      return data
    },
  })

  const isConnected = !!integration

  const handleConnect = async () => {
    if (!apiLogin.trim()) {
      toast({ title: 'Erreur', description: 'Login API requis', variant: 'destructive' })
      return
    }
    setIsConnecting(true)
    try {
      const { error } = await supabase.functions.invoke('marketplace-connect', {
        body: {
          platform: 'cdiscount',
          credentials: { api_login: apiLogin, api_password: apiPassword },
          config: { sync_products: syncProducts, sync_orders: syncOrders, sync_stock: syncStock }
        }
      })
      if (error) throw error
      toast({ title: 'Connexion réussie', description: 'Cdiscount Marketplace connecté' })
      refetch()
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSync = async () => {
    if (!integration?.id) return
    setIsSyncing(true)
    try {
      await supabase.functions.invoke('marketplace-sync', { body: { integration_id: integration.id, sync_type: 'full' } })
      toast({ title: 'Sync lancée' })
      refetch()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-info/10 flex items-center justify-center text-3xl">🟦</div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Cdiscount Marketplace
              {isConnected ? (
                <Badge className="bg-success/10 text-success border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Connecté</Badge>
              ) : (
                <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Non connecté</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">Vendez sur la 2ème marketplace française</p>
          </div>
        </div>
        {isConnected && (
          <Button onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />Synchroniser
          </Button>
        )}
      </div>

      {!isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Connexion API Cdiscount</CardTitle>
              <CardDescription>Connectez votre compte vendeur via l'API Marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Login API</Label>
                <Input value={apiLogin} onChange={e => setApiLogin(e.target.value)} placeholder="votre-login-api" />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe API</Label>
                <Input type="password" value={apiPassword} onChange={e => setApiPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
                {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                Connecter Cdiscount
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Synchronisation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Produits', desc: 'Synchroniser les offres et fiches produit', checked: syncProducts, set: setSyncProducts },
                { label: 'Commandes', desc: 'Récupérer et traiter les commandes', checked: syncOrders, set: setSyncOrders },
                { label: 'Stock', desc: 'Mise à jour en temps réel des quantités', checked: syncStock, set: setSyncStock },
              ].map(opt => (
                <div key={opt.label} className="flex items-center justify-between p-3 rounded-lg border">
                  <div><p className="text-sm font-medium">{opt.label}</p><p className="text-xs text-muted-foreground">{opt.desc}</p></div>
                  <Switch checked={opt.checked} onCheckedChange={opt.set} />
                </div>
              ))}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Spécificités Cdiscount</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {['EAN obligatoire', 'Offres groupées', 'Relais Colis', 'Fulfillment CD', 'Scoring qualité', 'SAV intégré'].map(f => (
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
            <TabsTrigger value="products">Offres</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="quality">Qualité</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Revenus (7j)', value: '6 240 €', icon: DollarSign, trend: '+9.3%', up: true },
                { label: 'Commandes', value: '83', icon: ShoppingCart, trend: '+5.1%', up: true },
                { label: 'Offres actives', value: '412', icon: Package, trend: '+22', up: true },
                { label: 'Score qualité', value: '94%', icon: Star, trend: '+1.2%', up: true },
              ].map(s => (
                <Card key={s.label}>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2"><s.icon className="h-4 w-4" />{s.label}</CardDescription>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      {s.value}
                      <Badge variant="secondary" className={`text-xs ${s.up ? 'text-success' : 'text-destructive'}`}>
                        {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{s.trend}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle>Performance hebdomadaire</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={mockSalesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="products"><Card><CardContent className="pt-6"><div className="text-center py-12 text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Vos offres Cdiscount apparaîtront ici</p></div></CardContent></Card></TabsContent>
          <TabsContent value="orders"><Card><CardContent className="pt-6"><div className="text-center py-12 text-muted-foreground"><ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Vos commandes Cdiscount apparaîtront ici</p></div></CardContent></Card></TabsContent>
          <TabsContent value="quality">
            <Card>
              <CardHeader><CardTitle>Score Qualité Vendeur</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Taux d\'acceptation', value: 98, target: 95 },
                  { label: 'Expédition dans les délais', value: 96, target: 90 },
                  { label: 'Taux de retour', value: 3, target: 5 },
                  { label: 'Satisfaction client', value: 92, target: 85 },
                ].map(m => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{m.label}</span>
                      <span className="font-medium">{m.value}% <span className="text-muted-foreground text-xs">(objectif: {m.target}%)</span></span>
                    </div>
                    <Progress value={m.value} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
