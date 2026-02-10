import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStores } from '@/hooks/useStores'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { 
  RefreshCw, Package, ShoppingCart, TrendingUp, Calendar,
  AlertTriangle, CheckCircle, TestTube, Zap, Eye, Globe, Wifi, WifiOff
} from 'lucide-react'

export default function StoreDetailPage() {
  const { storeId } = useParams()
  const navigate = useNavigate()
  const { stores, loading, syncStore } = useStores()
  const { toast } = useToast()

  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncStatus, setSyncStatus] = useState('')
  const [testingConnection, setTestingConnection] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const store = stores.find(s => s.id === storeId)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))
  }

  const testConnection = async () => {
    if (!store?.credentials) {
      toast({ title: "Paramètres manquants", description: "Veuillez configurer vos identifiants", variant: "destructive" })
      return
    }
    setTestingConnection(true)
    try {
      const { data, error } = await supabase.functions.invoke('store-connection-test', {
        body: { integrationId: store.id, platform: store.platform, credentials: store.credentials }
      })
      if (error) throw error
      toast({ title: data?.success ? "✅ Test réussi" : "❌ Test échoué", description: data?.message || data?.error, variant: data?.success ? undefined : "destructive" })
    } catch (error) {
      toast({ title: "Erreur de test", description: error instanceof Error ? error.message : 'Erreur inattendue', variant: "destructive" })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSync = async (type: 'products' | 'orders' | 'full' = 'full') => {
    if (!store) return
    setSyncing(true)
    setSyncProgress(0)
    setSyncStatus(`Initialisation...`)
    const steps = [
      { progress: 15, message: 'Connexion...' }, { progress: 30, message: 'Authentification...' },
      { progress: 45, message: 'Récupération...' }, { progress: 65, message: 'Traitement...' },
      { progress: 80, message: 'Mise à jour...' }, { progress: 95, message: 'Finalisation...' }
    ]
    let stepIndex = 0
    const interval = setInterval(() => {
      if (stepIndex < steps.length) { setSyncProgress(steps[stepIndex].progress); setSyncStatus(steps[stepIndex].message); stepIndex++ }
    }, 800)
    try {
      await syncStore(store.id, type)
      setSyncProgress(100)
      setSyncStatus('✅ Terminé !')
      toast({ title: "Synchronisation réussie", description: `Synchronisation ${type} terminée.` })
    } catch (error) {
      setSyncProgress(0)
      setSyncStatus('❌ Erreur')
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Erreur", variant: "destructive" })
    } finally {
      clearInterval(interval)
      setTimeout(() => { setSyncing(false); setSyncProgress(0); setSyncStatus('') }, 3000)
    }
  }

  if (!loading && !store) {
    return (
      <ChannablePageWrapper title="Boutique non trouvée" heroImage="integrations" badge={{ label: 'Erreur', icon: AlertTriangle }}>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Boutique non trouvée</h2>
          <p className="text-muted-foreground mb-6">Cette boutique n'existe pas ou a été supprimée.</p>
          <Button onClick={() => navigate('/stores-channels')} className="gap-2">Retour aux boutiques</Button>
        </div>
      </ChannablePageWrapper>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <ChannablePageWrapper
      title={store?.name || 'Boutique'}
      description={`${store?.platform || 'Shopify'} • ${store?.products_count || 0} produits • ${store?.orders_count || 0} commandes • Sync: ${formatDate(store?.last_sync ?? null)}`}
      heroImage="integrations"
      badge={{ label: store?.status === 'connected' ? 'Connectée' : 'Déconnectée', icon: store?.status === 'connected' ? CheckCircle : AlertTriangle }}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={testConnection} disabled={testingConnection} className="gap-2 bg-background/80 backdrop-blur">
            {testingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
            Tester
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`https://${store?.domain}`, '_blank')} disabled={!store?.domain} className="gap-2 bg-background/80 backdrop-blur">
            <Eye className="w-4 h-4" />Voir
          </Button>
          <Button onClick={() => handleSync('full')} disabled={syncing || !isOnline} className="gap-2">
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Synchroniser
          </Button>
        </div>
      }
    >
      {/* Sync Progress */}
      {syncing && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Synchronisation en cours</h3>
                <Badge variant="secondary">{Math.round(syncProgress)}%</Badge>
              </div>
              <Progress value={syncProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">{syncStatus}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store?.products_count || 0}</div>
            <p className="text-xs text-muted-foreground">Total synchronisés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store?.orders_count || 0}</div>
            <p className="text-xs text-muted-foreground">Importées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: store?.currency || 'EUR' }).format(store?.revenue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
            <div className={`h-3 w-3 rounded-full ${store?.status === 'connected' ? 'bg-green-500' : store?.status === 'error' ? 'bg-destructive' : 'bg-muted'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store?.status === 'connected' ? 'OK' : store?.status === 'error' ? 'Erreur' : 'Inactif'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" onClick={() => handleSync('products')} disabled={syncing || !isOnline} className="gap-2 justify-start">
              <Package className="w-4 h-4" />Synchroniser les produits
            </Button>
            <Button variant="outline" onClick={() => handleSync('orders')} disabled={syncing || !isOnline} className="gap-2 justify-start">
              <ShoppingCart className="w-4 h-4" />Synchroniser les commandes
            </Button>
            <Button variant="outline" onClick={() => navigate(`/stores-channels/${store?.id}/settings`)} className="gap-2 justify-start">
              <Globe className="w-4 h-4" />Paramètres avancés
            </Button>
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  )
}
