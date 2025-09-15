import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Zap,
  Users,
  Globe,
  Activity
} from 'lucide-react'

interface ImportStatsRealTimeProps {
  refreshInterval?: number
}

export const ImportStatsRealTime = ({ refreshInterval = 5000 }: ImportStatsRealTimeProps) => {
  const [stats, setStats] = useState({
    totalImportsToday: 1247,
    successRate: 94.2,
    activeUsers: 89,
    averageTime: 23,
    topSources: [
      { name: 'Amazon', count: 456, percentage: 36.6 },
      { name: 'AliExpress', count: 298, percentage: 23.9 },
      { name: 'Shopify', count: 187, percentage: 15.0 },
      { name: 'eBay', count: 134, percentage: 10.7 }
    ],
    recentActivity: [
      { time: 'Il y a 2s', action: 'Import réussi', source: 'Amazon.fr', user: 'user_a2b3' },
      { time: 'Il y a 15s', action: 'Import réussi', source: 'AliExpress', user: 'user_c4d5' },
      { time: 'Il y a 28s', action: 'Import réussi', source: 'Shopify', user: 'user_e6f7' },
      { time: 'Il y a 45s', action: 'Import réussi', source: 'Amazon.com', user: 'user_g8h9' }
    ]
  })

  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Simuler des données en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prevStats => ({
        ...prevStats,
        totalImportsToday: prevStats.totalImportsToday + Math.floor(Math.random() * 3),
        successRate: 92 + Math.random() * 6, // Entre 92% et 98%
        activeUsers: 80 + Math.floor(Math.random() * 20),
        averageTime: 20 + Math.floor(Math.random() * 10),
        recentActivity: [
          {
            time: 'Il y a 2s',
            action: 'Import réussi',
            source: ['Amazon.fr', 'AliExpress', 'Shopify', 'eBay'][Math.floor(Math.random() * 4)],
            user: `user_${Math.random().toString(36).substring(2, 6)}`
          },
          ...prevStats.recentActivity.slice(0, 3)
        ]
      }))
      setLastUpdate(new Date())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Statistiques en Temps Réel</h3>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Mis à jour {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalImportsToday.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Imports aujourd'hui</div>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600">+23% vs hier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Taux de succès</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <Progress value={stats.successRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.activeUsers}
                </div>
                <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">En ligne maintenant</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.averageTime}s
                </div>
                <div className="text-sm text-muted-foreground">Temps moyen</div>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Zap className="w-3 h-3 text-orange-500" />
              <span className="text-xs text-orange-600">Ultra rapide</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sources populaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Sources Populaires Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.topSources.map((source, index) => (
              <div key={source.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{source.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{source.count}</div>
                    <div className="text-xs text-muted-foreground">
                      {source.percentage}%
                    </div>
                  </div>
                </div>
                <Progress value={source.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activité en Direct
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="font-medium text-sm">{activity.action}</div>
                      <div className="text-xs text-muted-foreground">
                        {activity.source} • {activity.user}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.time}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicateur de performance */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Système optimal</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Tous les services fonctionnent parfaitement
            </div>
            <Badge className="bg-green-500 text-white">
              99.9% Disponibilité
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}