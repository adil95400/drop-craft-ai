import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { PlanDashboard } from "@/components/plan/PlanDashboard"
import { useStripeSubscription } from "@/hooks/useStripeSubscription"
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
  Star
} from 'lucide-react'

const Dashboard = () => {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { checkSubscription } = useStripeSubscription()

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

  // Sample metrics data
  const metrics = [
    {
      title: "Ventes du mois",
      value: "€12,345",
      change: { value: 12.5, trend: 'up' },
      icon: DollarSign,
      description: "Chiffre d'affaires"
    },
    {
      title: "Commandes",
      value: "156",
      change: { value: 8.2, trend: 'up' },
      icon: ShoppingCart,
      description: "Nouvelles commandes"
    },
    {
      title: "Produits",
      value: "1,234",
      change: { value: 3.1, trend: 'up' },
      icon: Package,
      description: "En catalogue"
    },
    {
      title: "Clients actifs",
      value: "89",
      change: { value: 2.4, trend: 'down' },
      icon: Users,
      description: "Ce mois-ci"
    }
  ]

  if (loading) {
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

  return (
    <div className="space-y-8">
      {/* Header avec informations utilisateur */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.email} ! Gérez votre boutique e-commerce.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            🟢 En ligne
          </Badge>
          <Badge variant="secondary">
            Connecté
          </Badge>
        </div>
      </div>

      {/* Plan Dashboard - Système de plans et abonnements */}
      <PlanDashboard />

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

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => window.location.href = '/import'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Import de produits
            </CardTitle>
            <CardDescription>
              Ajoutez de nouveaux produits à votre catalogue
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => window.location.href = '/catalogue'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Gérer le catalogue
            </CardTitle>
            <CardDescription>
              Consultez et modifiez vos produits
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => window.location.href = '/analytics'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              Analysez vos performances de vente
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nouvelle commande reçue</p>
                <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
              </div>
              <Badge variant="outline">€45.99</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">5 nouveaux produits importés</p>
                <p className="text-xs text-muted-foreground">Il y a 4 heures</p>
              </div>
              <Badge variant="outline">Import</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Stock faible détecté</p>
                <p className="text-xs text-muted-foreground">Il y a 6 heures</p>
              </div>
              <Badge variant="outline">Alerte</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard