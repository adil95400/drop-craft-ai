/**
 * Multi-Store Sync Page - Synchronisation bidirectionnelle multi-boutiques
 * Shopify, WooCommerce, eBay avec dashboard centralisé
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  RefreshCw, Store, Link2, Unlink, CheckCircle, AlertTriangle,
  ArrowLeftRight, Clock, Package, ShoppingBag, Globe, Zap,
  Settings, BarChart3, Plus, ExternalLink, Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ConnectedStore {
  id: string
  name: string
  platform: 'shopify' | 'woocommerce' | 'ebay' | 'amazon' | 'etsy'
  url: string
  status: 'connected' | 'syncing' | 'error' | 'paused'
  productsCount: number
  syncedProducts: number
  ordersToday: number
  lastSync: string
  autoSync: boolean
  syncDirection: 'bidirectional' | 'push' | 'pull'
}

interface SyncActivity {
  id: string
  storeName: string
  action: string
  productsAffected: number
  status: 'success' | 'partial' | 'failed'
  timestamp: string
}

const mockStores: ConnectedStore[] = [
  { id: '1', name: 'Ma Boutique Shopify', platform: 'shopify', url: 'mystore.myshopify.com', status: 'connected', productsCount: 342, syncedProducts: 338, ordersToday: 12, lastSync: 'Il y a 5 min', autoSync: true, syncDirection: 'bidirectional' },
  { id: '2', name: 'WooCommerce FR', platform: 'woocommerce', url: 'shop.example.fr', status: 'syncing', productsCount: 156, syncedProducts: 140, ordersToday: 5, lastSync: 'En cours...', autoSync: true, syncDirection: 'push' },
  { id: '3', name: 'eBay Europe', platform: 'ebay', url: 'ebay.fr/usr/monshop', status: 'connected', productsCount: 89, syncedProducts: 89, ordersToday: 3, lastSync: 'Il y a 15 min', autoSync: false, syncDirection: 'bidirectional' },
  { id: '4', name: 'Amazon FR', platform: 'amazon', url: 'amazon.fr/seller/xxx', status: 'error', productsCount: 210, syncedProducts: 195, ordersToday: 28, lastSync: 'Échec il y a 1h', autoSync: true, syncDirection: 'pull' },
]

const mockActivity: SyncActivity[] = [
  { id: '1', storeName: 'Shopify', action: 'Sync prix & stock', productsAffected: 45, status: 'success', timestamp: 'Il y a 5 min' },
  { id: '2', storeName: 'WooCommerce', action: 'Push nouveaux produits', productsAffected: 12, status: 'partial', timestamp: 'Il y a 20 min' },
  { id: '3', storeName: 'Amazon', action: 'Pull commandes', productsAffected: 8, status: 'failed', timestamp: 'Il y a 1h' },
  { id: '4', storeName: 'eBay', action: 'Sync inventaire', productsAffected: 89, status: 'success', timestamp: 'Il y a 15 min' },
  { id: '5', storeName: 'Shopify', action: 'Update descriptions', productsAffected: 23, status: 'success', timestamp: 'Il y a 2h' },
]

const platformIcons: Record<string, string> = {
  shopify: '🟢',
  woocommerce: '🟣',
  ebay: '🔵',
  amazon: '🟠',
  etsy: '🟤',
}

const platformLabels: Record<string, string> = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  ebay: 'eBay',
  amazon: 'Amazon',
  etsy: 'Etsy',
}

export default function MultiStoreSyncPage() {
  const { toast } = useToast()
  const [stores, setStores] = useState(mockStores)
  const [syncingAll, setSyncingAll] = useState(false)

  const syncAll = () => {
    setSyncingAll(true)
    toast({ title: 'Sync globale lancée', description: 'Synchronisation de toutes les boutiques en cours...' })
    setTimeout(() => setSyncingAll(false), 3000)
  }

  const toggleAutoSync = (id: string) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, autoSync: !s.autoSync } : s))
    toast({ title: 'Auto-sync mis à jour' })
  }

  const syncStore = (id: string) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, status: 'syncing' as const, lastSync: 'En cours...' } : s))
    toast({ title: 'Sync lancée' })
    setTimeout(() => {
      setStores(prev => prev.map(s => s.id === id ? { ...s, status: 'connected' as const, lastSync: "À l'instant" } : s))
    }, 2000)
  }

  const totalProducts = stores.reduce((a, s) => a + s.productsCount, 0)
  const totalSynced = stores.reduce((a, s) => a + s.syncedProducts, 0)
  const totalOrders = stores.reduce((a, s) => a + s.ordersToday, 0)

  return (
    <ChannablePageWrapper
      title="Multi-Store Sync"
      description="Synchronisation bidirectionnelle de vos boutiques : produits, prix, stock et commandes en temps réel."
      heroImage="integrations"
      badge={{ label: 'Multi-Store', icon: Globe }}
      actions={
        <>
          <Button onClick={syncAll} disabled={syncingAll}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncingAll ? 'animate-spin' : ''}`} />
            {syncingAll ? 'Sync en cours...' : 'Tout synchroniser'}
          </Button>
          <Button variant="outline" onClick={() => toast({ title: 'Connecter une boutique', description: 'Assistant de connexion bientôt disponible.' })}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter une boutique
          </Button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Store className="h-4 w-4" /> Boutiques
            </div>
            <div className="text-2xl font-bold">{stores.length}</div>
            <p className="text-xs text-green-600 mt-1">{stores.filter(s => s.status === 'connected').length} connectées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Package className="h-4 w-4" /> Produits total
            </div>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalSynced} synchronisés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <ArrowLeftRight className="h-4 w-4" /> Taux de sync
            </div>
            <div className="text-2xl font-bold text-primary">{totalProducts > 0 ? Math.round(totalSynced / totalProducts * 100) : 0}%</div>
            <Progress value={totalProducts > 0 ? (totalSynced / totalProducts * 100) : 0} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <ShoppingBag className="h-4 w-4" /> Commandes
            </div>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">aujourd'hui toutes boutiques</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stores"><Store className="mr-2 h-4 w-4" /> Boutiques</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4" /> Activité</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" /> Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          {stores.map(store => (
            <Card key={store.id} className={store.status === 'error' ? 'border-destructive/50' : ''}>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{platformIcons[store.platform]}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{store.name}</h3>
                        <Badge variant={store.status === 'connected' ? 'default' : store.status === 'syncing' ? 'secondary' : store.status === 'error' ? 'destructive' : 'outline'} className="text-xs">
                          {store.status === 'connected' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {store.status === 'syncing' && <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
                          {store.status === 'error' && <AlertTriangle className="mr-1 h-3 w-3" />}
                          {store.status === 'connected' ? 'Connecté' : store.status === 'syncing' ? 'Sync...' : store.status === 'error' ? 'Erreur' : 'Pause'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {store.syncDirection === 'bidirectional' ? '↔ Bidirectionnel' : store.syncDirection === 'push' ? '→ Push' : '← Pull'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{platformLabels[store.platform]} · {store.url}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{store.syncedProducts}/{store.productsCount} produits</span>
                        <span>{store.ordersToday} commandes aujourd'hui</span>
                        <span><Clock className="inline h-3 w-3 mr-1" />{store.lastSync}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Auto</span>
                      <Switch checked={store.autoSync} onCheckedChange={() => toggleAutoSync(store.id)} />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => syncStore(store.id)} disabled={store.status === 'syncing'}>
                      <RefreshCw className={`mr-1 h-3 w-3 ${store.status === 'syncing' ? 'animate-spin' : ''}`} /> Sync
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique de synchronisation</CardTitle>
              <CardDescription>Dernières activités de sync entre vos boutiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockActivity.map(act => (
                  <div key={act.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {act.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : act.status === 'partial' ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{act.storeName} — {act.action}</p>
                      <p className="text-xs text-muted-foreground">{act.productsAffected} produits · {act.timestamp}</p>
                    </div>
                    <Badge variant={act.status === 'success' ? 'default' : act.status === 'partial' ? 'secondary' : 'destructive'} className="text-xs">
                      {act.status === 'success' ? 'Succès' : act.status === 'partial' ? 'Partiel' : 'Échec'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de synchronisation</CardTitle>
              <CardDescription>Configurez le comportement de sync pour toutes vos boutiques</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Sync automatique globale</p>
                  <p className="text-xs text-muted-foreground">Synchroniser toutes les 15 minutes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Sync prix en temps réel</p>
                  <p className="text-xs text-muted-foreground">Propager les changements de prix immédiatement</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Sync stock bidirectionnel</p>
                  <p className="text-xs text-muted-foreground">Déduire le stock quand une vente est faite sur n'importe quelle boutique</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Alertes de désynchronisation</p>
                  <p className="text-xs text-muted-foreground">Notification quand un produit est désynchronisé depuis +1h</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
