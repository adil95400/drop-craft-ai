import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RealTimeMonitor } from '@/components/dashboard/RealTimeMonitor'
import { QuickActions } from '@/components/navigation/QuickActions'
import { StatCard } from '@/components/dashboard/StatCard'
import { FavoritesQuickAccess } from '@/components/navigation/FavoritesQuickAccess'
import { FavoritesManager } from '@/components/navigation/FavoritesManager'
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
      color: "from-blue-500 to-blue-600",
      href: "/products"
    },
    { 
      label: "Commandes", 
      value: stats.ordersCount.toLocaleString(), 
      change: `${stats.ordersChange >= 0 ? '+' : ''}${stats.ordersChange.toFixed(1)}%`, 
      icon: ShoppingCart, 
      color: "from-green-500 to-green-600",
      href: "/dashboard/orders"
    },
    { 
      label: "Clients", 
      value: stats.customersCount.toLocaleString(), 
      change: `${stats.customersChange >= 0 ? '+' : ''}${stats.customersChange.toFixed(1)}%`, 
      icon: Users, 
      color: "from-purple-500 to-purple-600",
      href: "/customers"
    },
    { 
      label: "CA Mensuel", 
      value: `€${stats.monthlyRevenue.toFixed(2)}`, 
      change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}%`, 
      icon: TrendingUp, 
      color: "from-orange-500 to-orange-600",
      href: "/analytics"
    }
  ] : []
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Tableau de Bord
          </h1>
          <p className="text-lg text-muted-foreground">
            Vue d'ensemble de votre plateforme e-commerce
          </p>
        </div>
        <FavoritesManager />
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                  <Skeleton className="h-14 w-14 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsData.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              color={stat.color}
              href={stat.href}
            />
          ))
        )}
      </div>

      {/* Favorites Quick Access */}
      <FavoritesQuickAccess />

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