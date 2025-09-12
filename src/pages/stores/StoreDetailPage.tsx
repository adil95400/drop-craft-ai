import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Settings, ExternalLink, Package, ShoppingCart, TrendingUp, Calendar, Activity, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStores, Store } from '@/hooks/useStores'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { StoreSettings } from './components/StoreSettings'
import { SyncHistory } from './components/SyncHistory'

export default function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const { stores, loading, syncStore } = useStores()
  const { toast } = useToast()
  const [syncing, setSyncing] = useState<string | null>(null)
  
  const store = stores.find(s => s.id === storeId)

  const handleSync = async (type: 'products' | 'orders' | 'full' = 'full') => {
    if (!storeId) return
    if (!store?.domain || !store?.credentials?.access_token) {
      toast({
        title: "Configuration requise",
        description: "Veuillez d'abord configurer les paramètres de votre boutique Shopify.",
        variant: "destructive"
      })
      return
    }
    setSyncing(type)
    try {
      await syncStore(storeId, type)
      toast({
        title: "Synchronisation réussie",
        description: `${type === 'full' ? 'Synchronisation complète' : type === 'products' ? 'Produits' : 'Commandes'} synchronisé(e)s avec succès.`
      })
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      })
    } finally {
      setSyncing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'disconnected': return 'bg-red-500'
      case 'syncing': return 'bg-blue-500'
      case 'error': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'connected': return 'Connecté'
      case 'disconnected': return 'Déconnecté'
      case 'syncing': return 'En synchronisation'
      case 'error': return 'Erreur'
      default: return status
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Boutique non trouvée</h1>
          <Button asChild>
            <Link to="/dashboard/stores">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux boutiques
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/stores">
              <ArrowLeft className="w-4 h-4" />
            </Link>
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
                <Badge 
                  variant="secondary" 
                  className={`${getStatusColor(store.status)} text-white`}
                >
                  {getStatusLabel(store.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {store.platform.charAt(0).toUpperCase() + store.platform.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {store.domain && (
            <Button variant="outline" size="sm" asChild>
              <a href={store.domain} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir boutique
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store.products_count.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store.orders_count.toLocaleString()}</div>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière sync</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{formatDate(store.last_sync)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes de configuration */}
      {(!store.domain || !store.credentials?.access_token) && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Configuration incomplète:</strong> Veuillez configurer vos paramètres Shopify dans l'onglet "Paramètres" avant de synchroniser.
          </AlertDescription>
        </Alert>
      )}

      {store.status === 'error' && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Erreur de synchronisation:</strong> Impossible de synchroniser avec votre boutique. Vérifiez vos paramètres Shopify.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions de synchronisation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => handleSync('full')}
              disabled={syncing !== null || !store.domain || !store.credentials?.access_token}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing === 'full' ? 'animate-spin' : ''}`} />
              {syncing === 'full' ? 'Synchronisation...' : 'Synchronisation complète'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleSync('products')}
              disabled={syncing !== null || !store.domain || !store.credentials?.access_token}
              className="gap-2"
            >
              <Package className={`w-4 h-4 ${syncing === 'products' ? 'animate-spin' : ''}`} />
              {syncing === 'products' ? 'Sync...' : 'Produits uniquement'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleSync('orders')}
              disabled={syncing !== null || !store.domain || !store.credentials?.access_token}
              className="gap-2"
            >
              <ShoppingCart className={`w-4 h-4 ${syncing === 'orders' ? 'animate-spin' : ''}`} />
              {syncing === 'orders' ? 'Sync...' : 'Commandes uniquement'}
            </Button>
          </div>
          {syncing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ⏳ Synchronisation en cours... Cela peut prendre quelques minutes selon la quantité de données.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onglets pour les détails */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="logs">Historique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plateforme:</span>
                  <span className="font-medium capitalize">{store.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domaine:</span>
                  <span className="font-medium">{store.domain || 'Non configuré'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut:</span>
                  <Badge variant="secondary" className={`${getStatusColor(store.status)} text-white`}>
                    {getStatusLabel(store.status)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connecté le:</span>
                  <span className="font-medium">{formatDate(store.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paramètres de synchronisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sync automatique:</span>
                  <Badge variant={store.settings.auto_sync ? "default" : "secondary"}>
                    {store.settings.auto_sync ? 'Activée' : 'Désactivée'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fréquence:</span>
                  <span className="font-medium capitalize">{store.settings.sync_frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produits:</span>
                  <Badge variant={store.settings.sync_products ? "default" : "secondary"}>
                    {store.settings.sync_products ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commandes:</span>
                  <Badge variant={store.settings.sync_orders ? "default" : "secondary"}>
                    {store.settings.sync_orders ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <StoreSettings store={store} onUpdate={() => window.location.reload()} />
        </TabsContent>
        
        <TabsContent value="logs">
          <SyncHistory storeId={store.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}