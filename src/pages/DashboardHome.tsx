import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RealTimeMonitor } from '@/components/dashboard/RealTimeMonitor'
import { QuickActions } from '@/components/navigation/QuickActions'
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users
} from 'lucide-react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardHome() {
  const { data: stats, isLoading } = useDashboardStats()

  const statsData = stats ? [
    { 
      label: "Produits", 
      value: stats.productsCount.toLocaleString(), 
      change: `${stats.productsChange >= 0 ? '+' : ''}${stats.productsChange.toFixed(1)}%`, 
      icon: Package, 
      color: "text-blue-600" 
    },
    { 
      label: "Commandes", 
      value: stats.ordersCount.toLocaleString(), 
      change: `${stats.ordersChange >= 0 ? '+' : ''}${stats.ordersChange.toFixed(1)}%`, 
      icon: ShoppingCart, 
      color: "text-green-600" 
    },
    { 
      label: "Clients", 
      value: stats.customersCount.toLocaleString(), 
      change: `${stats.customersChange >= 0 ? '+' : ''}${stats.customersChange.toFixed(1)}%`, 
      icon: Users, 
      color: "text-purple-600" 
    },
    { 
      label: "CA Mensuel", 
      value: `€${stats.monthlyRevenue.toFixed(2)}`, 
      change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}%`, 
      icon: TrendingUp, 
      color: "text-orange-600" 
    }
  ] : []
  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre plateforme e-commerce
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsData.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <span className={`text-sm font-medium ${
                          stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Real-time Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Temps Réel</CardTitle>
          <CardDescription>
            Surveillance en direct de l'activité système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RealTimeMonitor />
        </CardContent>
      </Card>
    </div>
  )
}