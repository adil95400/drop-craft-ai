import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  Zap, 
  Database, 
  Server, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Users,
  ShoppingCart,
  TrendingUp,
  Wifi,
  HardDrive
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SystemMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  lastUpdate: string
}

interface NetworkMetric {
  endpoint: string
  responseTime: number
  status: 'online' | 'slow' | 'error'
  uptime: number
}

export function RealTimeMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetric[]>([])
  const [isMonitoring, setIsMonitoring] = useState(true)
  const { toast } = useToast()

  // Simuler les métriques en temps réel
  useEffect(() => {
    const generateMetrics = (): SystemMetric[] => [
      {
        id: 'cpu',
        name: 'CPU Usage',
        value: Math.random() * 30 + 20, // 20-50%
        unit: '%',
        status: 'healthy',
        trend: Math.random() > 0.5 ? 'up' : 'down',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'memory',
        name: 'Memory Usage',
        value: Math.random() * 20 + 40, // 40-60%
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'storage',
        name: 'Storage Usage',
        value: Math.random() * 15 + 65, // 65-80%
        unit: '%',
        status: 'warning',
        trend: 'up',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'active_users',
        name: 'Active Users',
        value: Math.floor(Math.random() * 50 + 150), // 150-200
        unit: 'users',
        status: 'healthy',
        trend: 'up',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'response_time',
        name: 'API Response Time',
        value: Math.random() * 100 + 120, // 120-220ms
        unit: 'ms',
        status: Math.random() > 0.7 ? 'warning' : 'healthy',
        trend: 'stable',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        value: Math.random() * 2, // 0-2%
        unit: '%',
        status: 'healthy',
        trend: 'down',
        lastUpdate: new Date().toISOString()
      }
    ]

    const generateNetworkMetrics = (): NetworkMetric[] => [
      {
        endpoint: '/api/products',
        responseTime: Math.random() * 50 + 80,
        status: 'online',
        uptime: 99.9
      },
      {
        endpoint: '/api/orders',
        responseTime: Math.random() * 100 + 150,
        status: Math.random() > 0.8 ? 'slow' : 'online',
        uptime: 99.7
      },
      {
        endpoint: '/api/customers',
        responseTime: Math.random() * 80 + 100,
        status: 'online',
        uptime: 99.8
      },
      {
        endpoint: '/api/analytics',
        responseTime: Math.random() * 200 + 200,
        status: Math.random() > 0.9 ? 'error' : 'online',
        uptime: 98.5
      }
    ]

    if (isMonitoring) {
      setMetrics(generateMetrics())
      setNetworkMetrics(generateNetworkMetrics())
    }

    const interval = setInterval(() => {
      if (isMonitoring) {
        setMetrics(generateMetrics())
        setNetworkMetrics(generateNetworkMetrics())
      }
    }, 3000) // Mise à jour toutes les 3 secondes

    return () => clearInterval(interval)
  }, [isMonitoring])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'warning':
      case 'slow':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'bg-green-500'
      case 'warning':
      case 'slow':
        return 'bg-yellow-500'
      case 'critical':
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-400" />
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Métriques Système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-500" />
            Métriques Système
            <div className="flex items-center gap-2 ml-auto">
              {isMonitoring && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600">LIVE</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? 'Pause' : 'Resume'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Surveillance en temps réel des performances système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(metric.status)}
                    <span className="font-medium text-sm">{metric.name}</span>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
                      {metric.unit}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(metric.status)} text-white`}
                    >
                      {metric.status}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={Math.min(metric.value, 100)} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métriques Réseau */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-500" />
            État du Réseau
          </CardTitle>
          <CardDescription>
            Performance des API et endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {networkMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(metric.status)}
                  <div>
                    <div className="font-medium text-sm">{metric.endpoint}</div>
                    <div className="text-xs text-gray-500">
                      Uptime: {metric.uptime}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono">
                    {metric.responseTime.toFixed(0)}ms
                  </div>
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${getStatusColor(metric.status)} text-white`}
                  >
                    {metric.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">99.2%</div>
              <div className="text-xs text-gray-500">Uptime Global</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">142ms</div>
              <div className="text-xs text-gray-500">Latence Moy.</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">0.8%</div>
              <div className="text-xs text-gray-500">Taux d'Erreur</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}