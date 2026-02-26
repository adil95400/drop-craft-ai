import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Zap, 
  CheckCircle, 
  Clock, 
  XCircle,
  Settings,
  TrendingUp,
  RefreshCw,
  Upload
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAutoFulfillment } from '@/hooks/useAutoFulfillment'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

export default function AutoOrderSystem() {
  const { toast } = useToast()
  const { 
    stats, 
    isLoadingStats, 
    orders, 
    isLoadingOrders,
    connections,
    isLoadingConnections,
    toggleAutoOrder,
    processOrder,
    isProcessingOrder,
    processPending,
    isProcessingPending,
    retryFailed,
    isRetrying,
    syncTracking,
    isSyncingTracking,
  } = useAutoFulfillment()
  
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(true)

  const handleToggleAutoOrder = () => {
    setAutoOrderEnabled(!autoOrderEnabled)
    toast({
      title: autoOrderEnabled ? 'Commandes automatiques désactivées' : 'Commandes automatiques activées',
      description: autoOrderEnabled 
        ? 'Les commandes ne seront plus passées automatiquement'
        : 'Les commandes seront passées automatiquement aux fournisseurs'
    })
  }

  const pendingOrders = orders?.filter((o: any) => o.status === 'pending' || o.status === 'processing') || []
  const completedOrders = orders?.filter((o: any) => o.status === 'completed') || []
  const failedOrders = orders?.filter((o: any) => o.status === 'failed') || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge><CheckCircle className="h-3 w-3 mr-1" />Complétée</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'processing':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En cours</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Échouée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Helmet>
        <title>Auto-Fulfillment - ShopOpti</title>
        <meta name="description" content="Pipeline automatique commande → fournisseur → tracking → Shopify" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Auto-Fulfillment
            </h1>
            <p className="text-muted-foreground mt-1">
              Commande → Fournisseur → Tracking → Shopify
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => syncTracking()}
              disabled={isSyncingTracking}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isSyncingTracking ? 'Sync...' : 'Sync Shopify'}
              {stats?.unsyncedTracking ? (
                <Badge variant="secondary" className="ml-2">{stats.unsyncedTracking}</Badge>
              ) : null}
            </Button>
            <Button 
              size="sm"
              onClick={() => processPending()}
              disabled={isProcessingPending}
            >
              <Zap className="h-4 w-4 mr-2" />
              {isProcessingPending ? 'Traitement...' : 'Traiter tout'}
            </Button>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-order" className="text-sm">Auto</Label>
              <Switch
                id="auto-order"
                checked={autoOrderEnabled}
                onCheckedChange={handleToggleAutoOrder}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoadingStats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-4 text-center">
                  <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.todayOrders || 0}</div>
                  <div className="text-sm text-muted-foreground">Aujourd'hui</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Taux réussite</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.avgProcessingTime || 0} min</div>
                  <div className="text-sm text-muted-foreground">Temps moyen</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
                  <div className="text-sm text-muted-foreground">En attente</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">En Attente ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Complétées ({completedOrders.length})</TabsTrigger>
            <TabsTrigger value="failed">Échouées ({failedOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes en Attente</CardTitle>
                <CardDescription>
                  Commandes prêtes à être envoyées au fournisseur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingOrders ? (
                  <Skeleton className="h-32 w-full" />
                ) : pendingOrders.length > 0 ? (
                  pendingOrders.map((order: any) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{order.shopify_order_id || order.order_id?.slice(0, 8)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {order.created_at && format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Fournisseur</p>
                          <p className="font-medium">{order.supplier_name || 'Non défini'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Articles</p>
                          <p className="font-medium">{order.items_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coût</p>
                          <p className="font-bold text-primary">{order.supplier_cost?.toFixed(2) || '0.00'}€</p>
                        </div>
                      </div>
                      {order.error_message && (
                        <div className="text-xs text-destructive mb-2 bg-destructive/10 p-2 rounded">
                          {order.error_message}
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        className="w-full"
                        disabled={isProcessingOrder}
                        onClick={() => processOrder(order.order_id)}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Passer Commande Maintenant
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune commande en attente
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes Complétées</CardTitle>
                <CardDescription>Commandes envoyées au fournisseur avec succès</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedOrders.length > 0 ? (
                  completedOrders.map((order: any) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{order.shopify_order_id || order.order_id?.slice(0, 8)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {order.processed_at && format(new Date(order.processed_at), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Fournisseur</p>
                          <p className="font-medium">{order.supplier_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">N° Fournisseur</p>
                          <p className="font-mono text-xs">{order.supplier_order_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tracking</p>
                          <p className="font-mono text-xs">{order.tracking_number || 'En attente'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coût</p>
                          <p className="font-bold text-primary">{order.supplier_cost?.toFixed(2)}€</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune commande complétée
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="failed" className="space-y-4">
            <Card>
              {failedOrders.length > 0 ? (
                <>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Commandes Échouées</CardTitle>
                      <CardDescription>Erreurs lors du traitement automatique</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => retryFailed(undefined as any)}
                      disabled={isRetrying}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {isRetrying ? 'Relance...' : 'Relancer tout'}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {failedOrders.map((order: any) => (
                      <div key={order.id} className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{order.shopify_order_id || order.order_id?.slice(0, 8)}</h4>
                            <p className="text-sm text-muted-foreground">
                              Tentatives: {order.retry_count}/{order.max_retries}
                            </p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="bg-destructive/10 p-2 rounded text-sm text-destructive mb-3">
                          {order.error_message || 'Erreur inconnue'}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => retryFailed([order.id] as any)}
                          disabled={isRetrying}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Réessayer
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune commande échouée</h3>
                  <p className="text-muted-foreground">
                    Toutes les commandes ont été traitées avec succès
                  </p>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
