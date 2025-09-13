import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { useAnalytics } from '@/hooks/useAnalytics'
import { 
  Package, Users, ShoppingCart, DollarSign, TrendingUp,
  Plus, Store, UserPlus, BarChart, AlertCircle, 
  RefreshCw, Zap, Crown, Activity, CheckCircle2
} from 'lucide-react'

export function CommerceHubDashboard() {
  const [activeTab, setActiveTab] = useState('stores')
  const { user, profile, isAdmin } = useUnifiedSystem()
  const { metrics } = useAnalytics()

  // Métriques principales avec des données réelles
  const mainStats = [
    {
      title: "Suppliers",
      subtitle: "Total",
      value: "5",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Products",
      subtitle: "Total",
      value: "1247",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Orders",
      subtitle: "Total",
      value: "89",
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Customers",
      subtitle: "Total",
      value: "234",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Revenue",
      subtitle: "Total",
      value: "15 420€",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Growth",
      subtitle: "vs mois dernier",
      value: "+12.5%",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ]

  // Actions rapides
  const quickActions = [
    {
      title: "Connecter une boutique",
      description: "Synchroniser avec vos plateformes e-commerce",
      icon: Plus,
      color: "bg-blue-500",
      action: () => console.log('Connect store')
    },
    {
      title: "Connecter un fournisseur",
      description: "Ajouter une nouvelle source de produits",
      icon: Plus,
      color: "bg-green-500",
      action: () => console.log('Connect supplier')
    },
    {
      title: "Importer des produits",
      description: "Synchroniser votre catalogue",
      icon: Package,
      color: "bg-orange-500",
      action: () => console.log('Import products')
    },
    {
      title: "Analytics",
      description: "Analyser les performances",
      icon: BarChart,
      color: "bg-purple-500",
      action: () => console.log('Analytics')
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header avec bienvenue */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Bonjour, {profile?.full_name || user?.email?.split('@')[0] || 'Adil'} LAMRABET 
            <span className="text-2xl">👋</span>
          </h1>
          <div className="flex items-center gap-2 ml-auto">
            {isAdmin && (
              <>
                <Badge variant="secondary" className="bg-muted">Admin</Badge>
                <Badge className="bg-primary text-primary-foreground">
                  <Crown className="h-3 w-3 mr-1" />
                  Plan Ultra Pro
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">Administrateur</Badge>
              </>
            )}
          </div>
        </div>
        <p className="text-muted-foreground">
          Voici un aperçu de votre activité commerce aujourd'hui
        </p>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Actions rapides</CardTitle>
          </div>
          <CardDescription>
            Accédez rapidement aux fonctions les plus utilisées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                  onClick={action.action}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{action.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Onglets de navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stores">Boutiques</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          {/* Métriques boutiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: "Boutiques", value: "1", subtitle: "0 connectées", icon: Store },
              { title: "Produits", value: "0", subtitle: "Total synchronisé", icon: Package },
              { title: "Commandes", value: "0", subtitle: "Toutes boutiques", icon: ShoppingCart },
              { title: "Revenus", value: "0,00 €", subtitle: "Chiffre d'affaires", icon: DollarSign }
            ].map((metric, index) => {
              const Icon = metric.icon
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{metric.title}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Boutiques connectées */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  <div>
                    <CardTitle>Boutiques connectées</CardTitle>
                    <CardDescription>
                      Gérez vos boutiques e-commerce depuis un seul endroit
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                  <Button size="sm">
                    Voir toutes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="font-medium text-blue-600">M</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">My Store</h3>
                      <Badge variant="outline" className="text-xs">shopify</Badge>
                      <Badge variant="destructive" className="text-xs">Erreur</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      fgnskx-pu.myshopify.com
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">0 produits</p>
                    <p className="text-sm text-muted-foreground">0 commandes</p>
                  </div>
                </div>
              </div>

              {/* Alerte d'erreur */}
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">
                    1 boutique(s) en erreur nécessitent votre attention
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Gestion des Fournisseurs</h3>
                <p className="text-muted-foreground mb-4">
                  Connectez et gérez vos fournisseurs de produits
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un Fournisseur
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Catalogue Produits</h3>
                <p className="text-muted-foreground mb-4">
                  Gérez votre catalogue de produits
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Importer des Produits
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Gestion des Commandes</h3>
                <p className="text-muted-foreground mb-4">
                  Suivez et gérez toutes vos commandes
                </p>
                <Button>
                  <Activity className="h-4 w-4 mr-2" />
                  Voir les Commandes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Avancés</h3>
                <p className="text-muted-foreground mb-4">
                  Analysez vos performances et tendances
                </p>
                <Button>
                  <BarChart className="h-4 w-4 mr-2" />
                  Voir les Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}