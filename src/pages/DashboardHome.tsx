import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RealTimeMonitor } from '@/components/dashboard/RealTimeMonitor'
import { QuickActions } from '@/components/navigation/QuickActions'
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users, 
  Upload,
  ArrowRight,
  Activity,
  BarChart3
} from 'lucide-react'
import { Link } from 'react-router-dom'

const statsData = [
  { label: "Produits", value: "1,247", change: "+12%", icon: Package, color: "text-blue-600" },
  { label: "Commandes", value: "89", change: "+8%", icon: ShoppingCart, color: "text-green-600" },
  { label: "Clients", value: "456", change: "-2%", icon: Users, color: "text-purple-600" },
  { label: "CA Mensuel", value: "€12,450", change: "+15%", icon: TrendingUp, color: "text-orange-600" }
]

export default function DashboardHome() {
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
        {statsData.map((stat, index) => {
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
        })}
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