import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Package, ShoppingCart, TrendingUp, BarChart3, RefreshCw,
  CheckCircle2, AlertCircle, Loader2, Globe, DollarSign,
  Truck, Star, ArrowUpRight, ArrowDownRight, Settings, Link2
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const AMAZON_REGIONS = [
  { id: 'NA', label: 'Amérique du Nord', marketplaces: ['US', 'CA', 'MX', 'BR'] },
  { id: 'EU', label: 'Europe', marketplaces: ['UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'PL', 'BE'] },
  { id: 'FE', label: 'Extrême-Orient', marketplaces: ['JP', 'AU', 'SG', 'IN'] },
]

const mockSalesData = [
  { day: 'Lun', revenue: 1240, orders: 18, units: 32 },
  { day: 'Mar', revenue: 1580, orders: 22, units: 41 },
  { day: 'Mer', revenue: 980, orders: 14, units: 25 },
  { day: 'Jeu', revenue: 2100, orders: 31, units: 55 },
  { day: 'Ven', revenue: 1890, orders: 27, units: 48 },
  { day: 'Sam', revenue: 2450, orders: 35, units: 62 },
  { day: 'Dim', revenue: 1670, orders: 24, units: 39 },
]

const mockBuyBoxData = [
  { name: 'Buy Box gagné', value: 78 },
  { name: 'Buy Box perdu', value: 22 },
]

export default function AmazonSellerPage() {
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [region, setRegion] = useState('EU')
  const [marketplace, setMarketplace] = useState('FR')
  const [sellerId, setSellerId] = useState('')
  const [mwsToken, setMwsToken] = useState('')
  const [syncProducts, setSyncProducts] = useState(true)
  const [syncOrders, setSyncOrders] = useState(true)
  const [syncInventory, setSyncInventory] = useState(true)
  const [syncPricing, setSyncPricing] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ['amazon-seller-integration'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'amazon')
        .eq('connection_status', 'connected')
        .maybeSingle()
      return data
    },
  })

  const isConnected = !!integration

  const handleConnect = async () => {
    if (!sellerId.trim()) {
      toast({ title: 'Erreur', description: 'Seller ID requis', variant: 'destructive' })
      return
    }
    setIsConnecting(true)
    try {
      const { error } = await supabase.functions.invoke('marketplace-connect', {
        body: {
          platform: 'amazon',
          credentials: { seller_id: sellerId, mws_token: mwsToken, region, marketplace },
          config: { sync_products: syncProducts, sync_orders: syncOrders, sync_inventory: syncInventory, sync_pricing: syncPricing }
        }
      })
      if (error) throw error
      toast({ title: 'Connexion réussie', description: 'Amazon Seller Central connecté' })
      refetch()
    } catch (e: any) {
      toast({ title: 'Erreur de connexion', description: e.message, variant: 'destructive' })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSync = async () => {
    if (!integration?.id) return
    setIsSyncing(true)
    try {
      await supabase.functions.invoke('marketplace-sync', {
        body: { integration_id: integration.id, sync_type: 'full' }
      })
      toast({ title: 'Synchronisation lancée', description: 'Amazon Seller Central en cours de sync' })
      refetch()
    } catch {
      toast({ title: 'Erreur', description: 'Échec de la synchronisation', variant: 'destructive' })
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[hsl(var(--accent))]/10 flex items-center justify-center text-3xl">📦</div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Amazon Seller Central
              {isConnected ? (
                <Badge className="bg-success/10 text-success border-success/30"><CheckCircle2 className="h-3 w-3 mr-1" />Connecté</Badge>
              ) : (
                <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Non connecté</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">Gestion des listings, prix, stock et commandes Amazon</p>
          </div>
        </div>
        {isConnected && (
          <Button onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Synchroniser
          </Button>
        )}
      </div>

      {!isConnected ? (
        /* Connection Form */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Connexion SP-API</CardTitle>
              <CardDescription>Connectez votre compte Amazon Seller Central via l'API Selling Partner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Région</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AMAZON_REGIONS.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marketplace</Label>
                <Select value={marketplace} onValueChange={setMarketplace}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AMAZON_REGIONS.find(r => r.id === region)?.marketplaces.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Seller ID</Label>
                <Input value={sellerId} onChange={e => setSellerId(e.target.value)} placeholder="A1B2C3D4E5F6G7" />
              </div>
              <div className="space-y-2">
                <Label>MWS Auth Token (optionnel)</Label>
                <Input type="password" value={mwsToken} onChange={e => setMwsToken(e.target.value)} placeholder="amzn.mws.xxx" />
              </div>
              <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
                {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                Connecter Amazon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Options de synchronisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Produits & Listings', desc: 'Importer et synchroniser les fiches produit', checked: syncProducts, set: setSyncProducts },
                { label: 'Commandes', desc: 'Récupérer les commandes FBA et FBM', checked: syncOrders, set: setSyncOrders },
                { label: 'Inventaire', desc: 'Synchroniser les niveaux de stock en temps réel', checked: syncInventory, set: setSyncInventory },
                { label: 'Prix', desc: 'Mettre à jour les prix et surveiller le Buy Box', checked: syncPricing, set: setSyncPricing },
              ].map(opt => (
                <div key={opt.label} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <Switch checked={opt.checked} onCheckedChange={opt.set} />
                </div>
              ))}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Fonctionnalités Amazon prises en charge</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {['FBA & FBM', 'Buy Box Tracker', 'Multi-marketplace', 'A+ Content', 'Repricing', 'Ads PPC', 'Reviews', 'Rapports'].map(f => (
                    <span key={f} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" />{f}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Connected Dashboard */
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="buybox">Buy Box</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Revenus (7j)', value: '11 910 €', icon: DollarSign, trend: '+12.4%', up: true },
                { label: 'Commandes', value: '171', icon: ShoppingCart, trend: '+8.2%', up: true },
                { label: 'Unités vendues', value: '302', icon: Package, trend: '+15.1%', up: true },
                { label: 'Buy Box %', value: '78%', icon: Star, trend: '-2.1%', up: false },
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
              <CardHeader><CardTitle>Revenus hebdomadaires</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Listings Amazon</CardTitle><CardDescription>Produits synchronisés depuis votre catalogue</CardDescription></CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Synchronisation en cours…</p>
                  <p className="text-sm">Vos produits apparaîtront ici après la prochaine sync</p>
                  <Progress value={45} className="max-w-xs mx-auto mt-4" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Commandes Amazon</CardTitle><CardDescription>FBA et FBM combinées</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: '114-234-8821', status: 'Expédiée', amount: '89.90 €', date: 'Aujourd\'hui', type: 'FBA' },
                    { id: '114-234-8820', status: 'En cours', amount: '42.50 €', date: 'Hier', type: 'FBM' },
                    { id: '114-234-8819', status: 'Livrée', amount: '156.00 €', date: 'Il y a 2j', type: 'FBA' },
                  ].map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">#{o.id}</p>
                        <p className="text-xs text-muted-foreground">{o.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{o.type}</Badge>
                        <Badge variant={o.status === 'Livrée' ? 'default' : 'secondary'}>{o.status}</Badge>
                        <span className="text-sm font-medium">{o.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buybox" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Taux de Buy Box</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">78%</p>
                    <p className="text-sm text-muted-foreground mt-2">Moyenne sur 30 jours</p>
                    <Progress value={78} className="mt-4" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Recommandations</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { text: 'Réduire le prix de SKU-A23 de 2% pour regagner le Buy Box', priority: 'high' },
                    { text: 'Augmenter le stock FBA pour les 3 produits à risque de rupture', priority: 'medium' },
                    { text: 'Optimiser les frais d\'expédition FBM pour améliorer la compétitivité', priority: 'low' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                      <Star className={`h-4 w-4 mt-0.5 ${r.priority === 'high' ? 'text-destructive' : r.priority === 'medium' ? 'text-warning' : 'text-muted-foreground'}`} />
                      <p className="text-sm">{r.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader><CardTitle>Paramètres Amazon</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Région :</span> <span className="font-medium">Europe</span></div>
                  <div><span className="text-muted-foreground">Marketplace :</span> <span className="font-medium">FR</span></div>
                  <div><span className="text-muted-foreground">Seller ID :</span> <span className="font-medium font-mono">A1B2***G7</span></div>
                  <div><span className="text-muted-foreground">Dernière sync :</span> <span className="font-medium">Il y a 15 min</span></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
