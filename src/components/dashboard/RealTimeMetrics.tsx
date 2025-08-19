import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  Zap,
  Globe,
  Clock,
  Target
} from 'lucide-react'

interface RealTimeData {
  activeUsers: number
  salesLastHour: number
  conversionRate: number
  serverHealth: number
  trafficSources: { source: string; percentage: number; color: string }[]
  recentActivity: { type: string; message: string; timestamp: string }[]
}

export const RealTimeMetrics = () => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    activeUsers: 23,
    salesLastHour: 8,
    conversionRate: 3.2,
    serverHealth: 98,
    trafficSources: [
      { source: 'Recherche Google', percentage: 45, color: 'bg-blue-500' },
      { source: 'Direct', percentage: 30, color: 'bg-green-500' },
      { source: 'Réseaux sociaux', percentage: 15, color: 'bg-purple-500' },
      { source: 'Email', percentage: 10, color: 'bg-orange-500' }
    ],
    recentActivity: [
      { type: 'sale', message: 'Nouvelle vente - €45.99', timestamp: '2 min' },
      { type: 'visitor', message: 'Visiteur depuis Paris', timestamp: '3 min' },
      { type: 'stock', message: 'Alerte stock faible - Produit #123', timestamp: '5 min' },
      { type: 'review', message: 'Nouvel avis 5⭐ reçu', timestamp: '8 min' }
    ]
  })

  // Simulation de mise à jour temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        activeUsers: Math.max(10, prev.activeUsers + Math.floor(Math.random() * 6 - 3)),
        salesLastHour: prev.salesLastHour + (Math.random() < 0.3 ? 1 : 0),
        conversionRate: Math.max(1, Math.min(10, prev.conversionRate + (Math.random() - 0.5) * 0.1)),
        serverHealth: Math.max(90, Math.min(100, prev.serverHealth + (Math.random() - 0.5) * 2))
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale': return '💰'
      case 'visitor': return '👤'
      case 'stock': return '📦'
      case 'review': return '⭐'
      default: return '📊'
    }
  }

  const getRealTimeStatus = () => {
    if (realTimeData.activeUsers > 50) return { label: 'Très actif', color: 'text-green-600', bg: 'bg-green-100' }
    if (realTimeData.activeUsers > 20) return { label: 'Actif', color: 'text-blue-600', bg: 'bg-blue-100' }
    return { label: 'Calme', color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  const status = getRealTimeStatus()

  return (
    <div className="space-y-6">
      {/* Header Temps Réel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold">Métriques Temps Réel</h3>
        </div>
        <Badge className={`${status.bg} ${status.color} border-0`}>
          {status.label}
        </Badge>
      </div>

      {/* Métriques principales temps réel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visiteurs actifs</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{realTimeData.activeUsers}</div>
            <p className="text-xs text-muted-foreground">En ligne maintenant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes/heure</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{realTimeData.salesLastHour}</div>
            <p className="text-xs text-muted-foreground">Dernière heure</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{realTimeData.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Taux temps réel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Santé serveur</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{realTimeData.serverHealth}%</div>
            <Progress value={realTimeData.serverHealth} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sources de Trafic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sources de Trafic Live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realTimeData.trafficSources.map((source, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{source.source}</span>
                      <span className="font-medium">{source.percentage}%</span>
                    </div>
                    <Progress value={source.percentage} className="mt-1 h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activité Récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realTimeData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">Il y a {activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}