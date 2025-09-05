/**
 * Dashboard moderne unifié - inspiré d'AutoDS/Spocket
 * Adapte l'interface selon le rôle (admin vs user)
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { Helmet } from 'react-helmet-async'
import { 
  TrendingUp, TrendingDown, Package, Users, 
  ShoppingCart, DollarSign, Activity, AlertCircle,
  Plus, Settings, RefreshCw, BarChart3,
  Zap, Globe, Database, Wifi
} from 'lucide-react'

const ModernDashboard: React.FC = () => {
  const { 
    user, 
    profile, 
    loading, 
    isAdmin, 
    dashboardStats,
    refresh
  } = useUnifiedSystem()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  const quickStats = [
    {
      title: 'Fournisseurs Connectés',
      value: dashboardStats.totalSuppliers,
      change: '+12%',
      trend: 'up',
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Produits Catalogue', 
      value: dashboardStats.totalProducts.toLocaleString(),
      change: '+5.2%',
      trend: 'up', 
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Jobs Import',
      value: dashboardStats.totalJobs,
      change: '+8 aujourd\'hui',
      trend: 'neutral',
      icon: RefreshCw,
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Produits Publiés',
      value: dashboardStats.publishedProducts,
      change: `${((dashboardStats.publishedProducts / dashboardStats.totalProducts) * 100).toFixed(1)}%`,
      trend: 'up',
      icon: Globe,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <>
      <Helmet>
        <title>Tableau de Bord - Drop Craft AI | Dropshipping Automation</title>
        <meta name="description" content="Vue d'ensemble de votre activité dropshipping. Statistiques, performances et insights en temps réel." />
      </Helmet>

      <div className="space-y-8 p-6">
        {/* Header avec actions rapides */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tableau de Bord {isAdmin && <Badge variant="destructive" className="ml-2">Admin</Badge>}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Vue d\'ensemble complète de la plateforme et gestion système'
                : 'Bienvenue dans votre hub de dropshipping intelligent'
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh} className="btn-hover">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              {isAdmin ? 'Gérer Système' : 'Nouveau Produit'}
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="stats-grid">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1">
                        {stat.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : stat.trend === 'down' ? (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        ) : (
                          <Activity className="h-3 w-3 text-orange-600" />
                        )}
                        <span className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-orange-600'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Actions rapides et aperçus */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions rapides */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Actions Rapides
              </CardTitle>
              <CardDescription>
                Accédez rapidement aux fonctionnalités principales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto p-4 flex-col gap-2" asChild>
                  <div>
                    <Package className="h-6 w-6" />
                    <span className="text-sm">Import Produits</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col gap-2" asChild>
                  <div>
                    <Database className="h-6 w-6" />
                    <span className="text-sm">Fournisseurs</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col gap-2" asChild>
                  <div>
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Analytics</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col gap-2" asChild>
                  <div>
                    <Settings className="h-6 w-6" />
                    <span className="text-sm">Paramètres</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Jobs récents */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Jobs d'Import Récents
              </CardTitle>
              <CardDescription>
                Dernières synchronisations et imports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats.recentJobs.length > 0 ? (
                  dashboardStats.recentJobs.map((job: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="font-medium text-sm">Import #{job.id?.slice(-6) || index + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.source_type || 'API'} • {job.success_rows || 0} produits
                          </p>
                        </div>
                      </div>
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {job.status === 'completed' ? 'Terminé' : 'En cours'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Aucun job récent</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Admin uniquement */}
        {isAdmin && (
          <Card className="border-2 border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Administration Système
              </CardTitle>
              <CardDescription>
                Outils et statistiques réservés aux administrateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">Utilisateurs</p>
                  <p className="text-2xl font-bold">247</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold">Uptime</p>
                  <p className="text-2xl font-bold">99.9%</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <Database className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="font-semibold">Requêtes/h</p>
                  <p className="text-2xl font-bold">1.2k</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

export default ModernDashboard