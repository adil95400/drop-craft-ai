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
  Settings, Shirt, Image, Layers, MapPin, Truck
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

const PRINTFUL_FEATURES = [
  { name: 'Broderie', desc: 'Logos et textes brodés', icon: '🧵' },
  { name: 'DTG', desc: 'Impression directe textile', icon: '🎨' },
  { name: 'Sublimation', desc: 'All-over print', icon: '🌈' },
  { name: 'Cut & Sew', desc: 'Vêtements sur-mesure', icon: '✂️' },
  { name: 'Emballage', desc: 'Packaging personnalisé', icon: '📦' },
  { name: 'Inserts', desc: 'Cartes et flyers custom', icon: '💌' },
]

export default function PrintfulPage() {
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [autoFulfill, setAutoFulfill] = useState(true)
  const [branding, setBranding] = useState(false)

  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ['printful-integration'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'printful')
        .eq('connection_status', 'connected')
        .maybeSingle()
      return data
    },
  })

  const isConnected = !!integration

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'Erreur', description: 'Clé API requise', variant: 'destructive' })
      return
    }
    setIsConnecting(true)
    try {
      const { error } = await supabase.functions.invoke('marketplace-connect', {
        body: {
          platform: 'printful',
          credentials: { api_key: apiKey },
          config: { auto_fulfill: autoFulfill, custom_branding: branding }
        }
      })
      if (error) throw error
      toast({ title: 'Connexion réussie', description: 'Printful connecté' })
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
          <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-3xl">🎨</div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Printful
              {isConnected ? (
                <Badge className="bg-green-500/10 text-success border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Connecté</Badge>
              ) : (
                <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Non connecté</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">Print-on-Demand premium — Fulfillment automatique avec branding</p>
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Connexion API Printful</CardTitle>
              <CardDescription>Obtenez votre clé dans Printful Dashboard → Settings → API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Clé API</Label>
                <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="pftk_..." />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div><p className="text-sm font-medium">Auto-fulfillment</p><p className="text-xs text-muted-foreground">Envoyer automatiquement les commandes en production</p></div>
                <Switch checked={autoFulfill} onCheckedChange={setAutoFulfill} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div><p className="text-sm font-medium">Branding personnalisé</p><p className="text-xs text-muted-foreground">Emballage et inserts à votre marque</p></div>
                <Switch checked={branding} onCheckedChange={setBranding} />
              </div>
              <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
                {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                Connecter Printful
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Techniques de personnalisation</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {PRINTFUL_FEATURES.map(f => (
                  <div key={f.name} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <span className="text-2xl">{f.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Centres de production</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {['🇺🇸 USA (Charlotte)', '🇪🇺 Europe (Riga)', '🇬🇧 UK (Birmingham)', '🇯🇵 Japon (Tokyo)', '🇦🇺 Australie (Melbourne)', '🇲🇽 Mexique'].map(c => (
                    <span key={c} className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" />{c}</span>
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
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="warehouses">Entrepôts</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Produits POD', value: '89', icon: Shirt },
                { label: 'En production', value: '12', icon: Printer },
                { label: 'Revenus (30j)', value: '4 890 €', icon: DollarSign },
                { label: 'Expédiés', value: '156', icon: Truck },
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
          <TabsContent value="products"><Card><CardContent className="pt-6"><div className="text-center py-12 text-muted-foreground"><Layers className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Vos produits Printful apparaîtront ici</p></div></CardContent></Card></TabsContent>
          <TabsContent value="orders"><Card><CardContent className="pt-6"><div className="text-center py-12 text-muted-foreground"><ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Commandes POD en cours</p></div></CardContent></Card></TabsContent>
          <TabsContent value="warehouses">
            <Card>
              <CardHeader><CardTitle>Centres de production</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Charlotte, NC', region: 'USA', status: 'Opérationnel', capacity: 95 },
                  { name: 'Riga', region: 'Europe', status: 'Opérationnel', capacity: 78 },
                  { name: 'Birmingham', region: 'UK', status: 'Opérationnel', capacity: 82 },
                ].map(w => (
                  <div key={w.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{w.name}</p>
                        <p className="text-xs text-muted-foreground">{w.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-500/10 text-success">{w.status}</Badge>
                      <span className="text-xs text-muted-foreground">{w.capacity}% capacité</span>
                    </div>
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
