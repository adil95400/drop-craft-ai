import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useStores } from '@/hooks/useStores'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  ArrowLeft, 
  RefreshCw, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Settings,
  History,
  Globe,
  Eye,
  Play,
  TestTube,
  Zap
} from 'lucide-react'
import { StoreSettings } from './components/StoreSettings'
import { SyncHistory } from './components/SyncHistory'
import { QuickActions } from './components/QuickActions'
import { AdvancedMetrics } from './components/AdvancedMetrics'

export function StoreDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { stores, syncStore, loading } = useStores()
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncStatus, setSyncStatus] = useState('')
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown')

  const store = stores.find(s => s.id === id)

  // Test de connexion Shopify
  const testConnection = async () => {
    if (!store?.credentials?.shop_domain || !store?.credentials?.access_token) {
      toast({
        title: "Paramètres manquants",
        description: "Veuillez configurer votre domaine et token Shopify",
        variant: "destructive"
      })
      return
    }

    setTestingConnection(true)
    try {
      const { data, error } = await supabase.functions.invoke('store-connection-test', {
        body: { 
          integrationId: store.id,
          shopDomain: store.credentials.shop_domain,
          accessToken: store.credentials.access_token 
        }
      })

      if (error) throw error
      
      setConnectionStatus('success')
      toast({
        title: "Connexion réussie",
        description: `Connecté à ${store.credentials.shop_domain}`
      })
    } catch (error) {
      setConnectionStatus('error')
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Impossible de se connecter à Shopify",
        variant: "destructive"
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSync = async (type: 'full' | 'products' | 'orders' = 'full') => {
    if (!store || syncing) return
    
    // Vérifier les credentials avant de synchroniser
    if (!store.credentials?.shop_domain || !store.credentials?.access_token) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez configurer vos paramètres Shopify dans l'onglet \"Paramètres\" avant de synchroniser.",
        variant: "destructive"
      })
      return
    }
    
    setSyncing(true)
    setSyncProgress(0)
    setSyncStatus(`Initialisation de la synchronisation ${type === 'full' ? 'complète' : `des ${type}`}...`)
    
    // Simulation de progression
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 15, 90)
        if (newProgress < 30) setSyncStatus('Connexion à Shopify...')
        else if (newProgress < 60) setSyncStatus('Récupération des données...')
        else if (newProgress < 85) setSyncStatus('Traitement des données...')
        else setSyncStatus('Finalisation...')
        return newProgress
      })
    }, 500)
    
    try {
      await syncStore(store.id, type)
      setSyncProgress(100)
      setSyncStatus('Synchronisation terminée !')
      toast({
        title: "Synchronisation réussie",
        description: `${type === 'full' ? 'Synchronisation complète' : `Synchronisation des ${type}`} terminée avec succès.`
      })
    } catch (error) {
      setSyncProgress(0)
      setSyncStatus('Erreur lors de la synchronisation')
      toast({
        title: "Erreur de synchronisation", 
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      })
    } finally {
      clearInterval(progressInterval)
      setSyncing(false)
      setTimeout(() => {
        setSyncProgress(0)
        setSyncStatus('')
      }, 3000)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Boutique non trouvée</h1>
          <Button onClick={() => navigate('/dashboard/stores')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour aux boutiques
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/stores')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <span className="text-xl font-bold text-primary">
                {store.platform.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{store.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={store.status === 'connected' ? 'default' : 'destructive'}>
                  {store.status === 'connected' ? 'Connecté' : store.status === 'error' ? 'Erreur' : 'Déconnecté'}
                </Badge>
                <span className="text-sm text-muted-foreground capitalize">
                  {store.platform}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {store.domain && (
            <Button variant="outline" size="sm" asChild>
              <a href={store.domain} target="_blank" rel="noopener noreferrer" className="gap-2">
                <Globe className="w-4 h-4" />
                Voir boutique
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store.products_count}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store.orders_count}</div>
            <p className="text-xs text-muted-foreground">
              +180.1% ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {store.revenue.toLocaleString('fr-FR', { 
                style: 'currency', 
                currency: store.currency 
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              +19% ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière sync</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {store.last_sync ? 
                new Date(store.last_sync).toLocaleDateString('fr-FR') : 
                'Jamais'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {store.last_sync ? 
                `${Math.round((Date.now() - new Date(store.last_sync).getTime()) / (1000 * 60 * 60))}h ago` : 
                'Première synchronisation requise'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes de configuration */}
      {(!store.credentials?.shop_domain || !store.credentials?.access_token) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Configuration incomplète:</strong> Veuillez configurer vos paramètres Shopify dans l'onglet "Paramètres" avant de synchroniser.
          </AlertDescription>
        </Alert>
      )}

      {store.status === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Erreur de synchronisation:</strong> Impossible de synchroniser avec votre boutique. Vérifiez vos paramètres Shopify.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions de synchronisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => handleSync('full')}
              disabled={syncing || loading}
              className="gap-2"
              size="lg"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronisation...' : 'Synchronisation complète'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleSync('products')}
              disabled={syncing || loading}
              className="gap-2"
            >
              <Package className="w-4 h-4" />
              Produits uniquement
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleSync('orders')}
              disabled={syncing || loading}
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Commandes uniquement
            </Button>

            <Button 
              variant="secondary"
              onClick={testConnection}
              disabled={testingConnection || loading}
              className="gap-2"
            >
              <TestTube className={`w-4 h-4 ${testingConnection ? 'animate-pulse' : ''}`} />
              {testingConnection ? 'Test...' : 'Test connexion'}
            </Button>
          </div>

          {/* Barre de progression */}
          {syncing && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{syncStatus}</span>
                <span className="font-medium">{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {/* Statut de connexion */}
          {connectionStatus !== 'unknown' && (
            <Alert className={`mt-4 ${connectionStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CheckCircle className={`h-4 w-4 ${connectionStatus === 'success' ? 'text-green-600' : 'text-red-600'}`} />
              <AlertDescription className={connectionStatus === 'success' ? 'text-green-700' : 'text-red-700'}>
                {connectionStatus === 'success' 
                  ? 'Connexion Shopify vérifiée avec succès' 
                  : 'Échec de la connexion Shopify'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Métriques
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Actions rapides */}
          <QuickActions 
            store={store} 
            onAction={(action) => {
              switch (action) {
                case 'sync-products':
                  handleSync('products')
                  break
                case 'sync-orders':
                  handleSync('orders')
                  break
                case 'view-analytics':
                  // TODO: Implémenter la vue analytics
                  toast({
                    title: "Analytics",
                    description: "Fonctionnalité en développement"
                  })
                  break
                case 'help':
                  // TODO: Ouvrir l'aide
                  toast({
                    title: "Aide",
                    description: "Consultez notre documentation"
                  })
                  break
              }
            }}
          />

          {/* Informations générales */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Plateforme:</span>
                    <p className="font-medium capitalize">{store.platform}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Domaine:</span>
                    <p className="font-medium">{store.credentials?.shop_domain || 'Non configuré'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créé le:</span>
                    <p className="font-medium">
                      {new Date(store.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dernière sync:</span>
                    <p className="font-medium">
                      {store.last_sync ? 
                        new Date(store.last_sync).toLocaleDateString('fr-FR') : 
                        'Jamais'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paramètres de synchronisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Auto-sync:</span>
                    <p className="font-medium">
                      {store.settings?.auto_sync ? 'Activée' : 'Désactivée'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fréquence:</span>
                    <p className="font-medium capitalize">
                      {store.settings?.sync_frequency || 'Non définie'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Produits:</span>
                    <p className="font-medium">
                      {store.settings?.sync_products ? 'Oui' : 'Non'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Commandes:</span>
                    <p className="font-medium">
                      {store.settings?.sync_orders ? 'Oui' : 'Non'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <AdvancedMetrics store={store} />
        </TabsContent>

        <TabsContent value="settings">
          <StoreSettings store={store} onUpdate={() => window.location.reload()} />
        </TabsContent>

        <TabsContent value="history">
          <SyncHistory storeId={store.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}