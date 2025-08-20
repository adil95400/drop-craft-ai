import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useRealAnalytics } from "@/hooks/useRealAnalytics"
import { useStripeSubscription } from "@/hooks/useStripeSubscription"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Star,
  RefreshCw,
  Plus
} from 'lucide-react'

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { checkSubscription } = useStripeSubscription()
  const { analytics, isLoading } = useRealAnalytics()
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Handle checkout success/cancel notifications
  useEffect(() => {
    const checkout = searchParams.get('checkout')
    const plan = searchParams.get('plan')

    if (checkout === 'success' && plan) {
      toast({
        title: "Paiement réussi !",
        description: `Bienvenue dans le plan ${plan === 'pro' ? 'Pro' : 'Ultra Pro'} ! Votre abonnement est maintenant actif.`,
        variant: "default"
      })
      
      // Refresh subscription status
      setTimeout(() => {
        checkSubscription()
      }, 2000)
      
      // Clean URL
      window.history.replaceState({}, '', '/dashboard')
    } else if (checkout === 'cancelled') {
      toast({
        title: "Paiement annulé",
        description: "Vous pouvez reprendre votre abonnement à tout moment.",
        variant: "default"
      })
      
      // Clean URL
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams, toast, checkSubscription])

  // Set initial load complete when auth loading is done
  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setInitialLoadComplete(true)
      }, 100) // Small delay to prevent flash
      
      return () => clearTimeout(timer)
    }
  }, [authLoading])

  // Real metrics data
  const metrics = [
    {
      title: "Chiffre d'affaires",
      value: analytics ? `€${analytics.revenue.toLocaleString()}` : "€0",
      change: { value: 12.5, trend: 'up' },
      icon: DollarSign,
      description: "Total des ventes"
    },
    {
      title: "Commandes",
      value: analytics?.orders.toString() || "0",
      change: { value: 8.2, trend: 'up' },
      icon: ShoppingCart,
      description: "Commandes livrées"
    },
    {
      title: "Produits",
      value: analytics?.products.toString() || "0",
      change: { value: 3.1, trend: 'up' },
      icon: Package,
      description: "En catalogue"
    },
    {
      title: "Clients",
      value: analytics?.customers.toString() || "0",
      change: { value: 2.4, trend: 'up' },
      icon: Users,
      description: "Clients enregistrés"
    }
  ]

  const handleRefresh = async () => {
    toast({
      title: "Actualisation",
      description: "Mise à jour des données en cours...",
    })
  }

  if (authLoading || !initialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>Vous devez être connecté pour accéder au dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/auth'} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header avec informations utilisateur */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Standard</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.email} ! Vue d'ensemble de votre activité.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Badge variant="outline" className="gap-1">
            🟢 En ligne
          </Badge>
        </div>
      </div>

      {/* Vue d'ensemble rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Résumé d'activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Panier moyen</p>
              <p className="font-semibold">€{analytics?.averageOrderValue.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Taux conversion</p>
              <p className="font-semibold">{analytics?.conversionRate.toFixed(1) || '0.0'}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dernière commande</p>
              <p className="font-semibold">
                {analytics?.recentOrders?.[0] ? 
                  new Date(analytics.recentOrders[0].created_at).toLocaleDateString() : 
                  'Aucune'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Statut</p>
              <Badge variant="default" className="text-xs">Actif</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {metric.change.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={metric.change.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {metric.change.value}%
                  </span>
                  <span className="ml-1">{metric.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Graphique des ventes */}
      {analytics?.salesByDay && analytics.salesByDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Évolution des ventes (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`€${value}`, 'Revenus']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => window.location.href = '/import'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ajouter des produits
            </CardTitle>
            <CardDescription>
              Importez de nouveaux produits dans votre catalogue
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => window.location.href = '/orders'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Gérer les commandes
            </CardTitle>
            <CardDescription>
              Consultez et traitez vos commandes
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => window.location.href = '/customers'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clients
            </CardTitle>
            <CardDescription>
              Gérez votre base clients
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Commandes récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Commandes récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.recentOrders && analytics.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {analytics.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className={`h-2 w-2 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-500' : 
                    order.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Commande {order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">€{order.total_amount}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune commande récente</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.href = '/orders'}
              >
                Voir toutes les commandes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
