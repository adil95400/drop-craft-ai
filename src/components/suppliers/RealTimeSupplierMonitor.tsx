import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Zap,
  Database,
  RefreshCw,
  Package,
  DollarSign,
  Users,
  AlertCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { toast } from 'sonner'

interface SupplierStatus {
  id: string
  name: string
  status: 'online' | 'offline' | 'syncing' | 'error'
  lastSync: Date
  responseTime: number
  uptime: number
  productsCount: number
  ordersToday: number
  syncProgress?: number
  issues: string[]
  performanceScore: number
  region: string
  tier: 'premium' | 'standard' | 'basic'
}

interface AlertItem {
  id: string
  supplierId: string
  supplierName: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: Date
  resolved: boolean
}

const mockSuppliers: SupplierStatus[] = [
  {
    id: 'aliexpress',
    name: 'AliExpress',
    status: 'online',
    lastSync: new Date(Date.now() - 300000),
    responseTime: 245,
    uptime: 99.8,
    productsCount: 15420,
    ordersToday: 28,
    performanceScore: 94,
    region: 'Asia',
    tier: 'premium',
    issues: []
  },
  {
    id: 'bigbuy',
    name: 'BigBuy',
    status: 'syncing',
    lastSync: new Date(),
    responseTime: 180,
    uptime: 99.9,
    productsCount: 8930,
    ordersToday: 12,
    syncProgress: 67,
    performanceScore: 96,
    region: 'Europe',
    tier: 'premium',
    issues: []
  },
  {
    id: 'shopify',
    name: 'Shopify Store',
    status: 'error',
    lastSync: new Date(Date.now() - 3600000),
    responseTime: 1200,
    uptime: 87.2,
    productsCount: 450,
    ordersToday: 3,
    performanceScore: 72,
    region: 'Global',
    tier: 'standard',
    issues: ['API Rate Limit Exceeded', 'Authentication Failed']
  },
  {
    id: 'printful',
    name: 'Printful',
    status: 'online',
    lastSync: new Date(Date.now() - 900000),
    responseTime: 320,
    uptime: 98.5,
    productsCount: 230,
    ordersToday: 7,
    performanceScore: 89,
    region: 'Global',
    tier: 'standard',
    issues: []
  }
]

const mockAlerts: AlertItem[] = [
  {
    id: '1',
    supplierId: 'shopify',
    supplierName: 'Shopify Store',
    type: 'error',
    message: 'Échec d\'authentification API - vérifiez vos identifiants',
    timestamp: new Date(Date.now() - 600000),
    resolved: false
  },
  {
    id: '2',
    supplierId: 'aliexpress',
    supplierName: 'AliExpress',
    type: 'warning',
    message: 'Temps de réponse élevé détecté (>500ms)',
    timestamp: new Date(Date.now() - 1800000),
    resolved: true
  },
  {
    id: '3',
    supplierId: 'bigbuy',
    supplierName: 'BigBuy',
    type: 'info',
    message: 'Synchronisation de masse démarrée - 2,300 produits',
    timestamp: new Date(Date.now() - 300000),
    resolved: false
  }
]

const responseTimeData = [
  { time: '00:00', aliexpress: 245, bigbuy: 180, shopify: 450, printful: 320 },
  { time: '04:00', aliexpress: 220, bigbuy: 175, shopify: 380, printful: 290 },
  { time: '08:00', aliexpress: 280, bigbuy: 195, shopify: 1200, printful: 340 },
  { time: '12:00', aliexpress: 230, bigbuy: 160, shopify: 950, printful: 310 },
  { time: '16:00', aliexpress: 250, bigbuy: 185, shopify: 800, printful: 330 },
  { time: '20:00', aliexpress: 235, bigbuy: 170, shopify: 720, printful: 300 },
]

export const RealTimeSupplierMonitor = () => {
  const [suppliers, setSuppliers] = useState<SupplierStatus[]>(mockSuppliers)
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<'responseTime' | 'uptime' | 'performance'>('responseTime')

  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      setSuppliers(prev => prev.map(supplier => ({
        ...supplier,
        responseTime: Math.max(100, supplier.responseTime + (Math.random() - 0.5) * 50),
        uptime: Math.min(100, Math.max(80, supplier.uptime + (Math.random() - 0.5) * 0.5)),
        performanceScore: Math.min(100, Math.max(60, supplier.performanceScore + (Math.random() - 0.5) * 2)),
        syncProgress: supplier.status === 'syncing' 
          ? Math.min(100, (supplier.syncProgress || 0) + Math.random() * 15)
          : undefined,
        status: supplier.status === 'syncing' && (supplier.syncProgress || 0) >= 100 
          ? 'online' 
          : supplier.status
      })))
    }, 2000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  const startMonitoring = () => {
    setIsMonitoring(true)
    toast.success('Monitoring temps réel activé')
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    toast.info('Monitoring temps réel arrêté')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100'
      case 'syncing': return 'text-blue-600 bg-blue-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'offline': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />
      case 'syncing': return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'error': return <AlertTriangle className="w-4 h-4" />
      case 'offline': return <WifiOff className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'text-purple-600 bg-purple-100'
      case 'standard': return 'text-blue-600 bg-blue-100'
      case 'basic': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatLastSync = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `il y a ${hours}h`
    if (minutes > 0) return `il y a ${minutes}min`
    return 'maintenant'
  }

  const onlineSuppliers = suppliers.filter(s => s.status === 'online' || s.status === 'syncing').length
  const avgResponseTime = suppliers.reduce((acc, s) => acc + s.responseTime, 0) / suppliers.length
  const avgPerformance = suppliers.reduce((acc, s) => acc + s.performanceScore, 0) / suppliers.length
  const totalProducts = suppliers.reduce((acc, s) => acc + s.productsCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Monitoring Fournisseurs
          </h2>
          <p className="text-muted-foreground">
            Surveillance en temps réel de vos connexions fournisseurs
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isMonitoring ? (
            <Button onClick={startMonitoring} className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Démarrer Monitoring
            </Button>
          ) : (
            <Button onClick={stopMonitoring} variant="outline" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Arrêter Monitoring
            </Button>
          )}
          {isMonitoring && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Activity className="w-3 h-3 mr-1" />
              En Direct
            </Badge>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fournisseurs Actifs</p>
                <p className="text-2xl font-bold">{onlineSuppliers}/{suppliers.length}</p>
              </div>
              <Wifi className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps Réponse Moy.</p>
                <p className="text-2xl font-bold">{Math.round(avgResponseTime)}ms</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance Moy.</p>
                <p className="text-2xl font-bold">{Math.round(avgPerformance)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits Total</p>
                <p className="text-2xl font-bold">{totalProducts.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance en Temps Réel</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={selectedMetric === 'responseTime' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('responseTime')}
              >
                Temps Réponse
              </Button>
              <Button
                size="sm"
                variant={selectedMetric === 'uptime' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('uptime')}
              >
                Disponibilité
              </Button>
              <Button
                size="sm"
                variant={selectedMetric === 'performance' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('performance')}
              >
                Performance
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="aliexpress"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="AliExpress"
              />
              <Area
                type="monotone"
                dataKey="bigbuy"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                name="BigBuy"
              />
              <Area
                type="monotone"
                dataKey="shopify"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
                name="Shopify"
              />
              <Area
                type="monotone"
                dataKey="printful"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.3}
                name="Printful"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suppliers Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              État des Fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(supplier.status)}>
                        {getStatusIcon(supplier.status)}
                        <span className="ml-1 capitalize">{supplier.status}</span>
                      </Badge>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatLastSync(supplier.lastSync)} • {supplier.region}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getTierColor(supplier.tier)}>
                          {supplier.tier}
                        </Badge>
                        <span className="text-sm font-medium">{supplier.performanceScore}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {supplier.responseTime}ms • {supplier.productsCount.toLocaleString()} produits
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertes & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 border rounded-lg ${alert.resolved ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{alert.supplierName}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatLastSync(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        {alert.resolved && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Résolu
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Sync Progress */}
      {suppliers.some(s => s.status === 'syncing') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Synchronisations en Cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suppliers
                .filter(s => s.status === 'syncing')
                .map((supplier) => (
                  <div key={supplier.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{supplier.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {supplier.syncProgress?.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={supplier.syncProgress} className="h-2" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}