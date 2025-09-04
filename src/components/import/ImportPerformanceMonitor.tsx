import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Activity,
  Zap,
  Target,
  Database,
  Users
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface PerformanceMetrics {
  totalImports: number
  successRate: number
  avgProcessingTime: number
  throughput: number
  errorRate: number
  dataQuality: number
  userSatisfaction: number
  systemLoad: number
}

const mockMetrics: PerformanceMetrics = {
  totalImports: 15420,
  successRate: 94.2,
  avgProcessingTime: 2.3,
  throughput: 450,
  errorRate: 5.8,
  dataQuality: 88.5,
  userSatisfaction: 92.1,
  systemLoad: 67.3
}

const performanceData = [
  { time: '00:00', imports: 45, errors: 2, quality: 89 },
  { time: '04:00', imports: 67, errors: 1, quality: 92 },
  { time: '08:00', imports: 125, errors: 8, quality: 85 },
  { time: '12:00', imports: 189, errors: 12, quality: 83 },
  { time: '16:00', imports: 234, errors: 15, quality: 87 },
  { time: '20:00', imports: 156, errors: 6, quality: 91 },
]

const categoryData = [
  { name: 'Électronique', value: 35, color: '#3b82f6' },
  { name: 'Vêtements', value: 28, color: '#10b981' },
  { name: 'Maison', value: 20, color: '#f59e0b' },
  { name: 'Sport', value: 12, color: '#ef4444' },
  { name: 'Autres', value: 5, color: '#8b5cf6' },
]

const errorTypes = [
  { type: 'Format invalide', count: 45, percentage: 32 },
  { type: 'Données manquantes', count: 38, percentage: 27 },
  { type: 'Doublons détectés', count: 28, percentage: 20 },
  { type: 'Images inaccessibles', count: 19, percentage: 13 },
  { type: 'Validation échouée', count: 11, percentage: 8 },
]

export const ImportPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(mockMetrics)
  const [realTimeData, setRealTimeData] = useState(performanceData)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalImports: prev.totalImports + Math.floor(Math.random() * 5),
        successRate: Math.max(85, Math.min(98, prev.successRate + (Math.random() - 0.5) * 2)),
        avgProcessingTime: Math.max(1, Math.min(5, prev.avgProcessingTime + (Math.random() - 0.5) * 0.2)),
        throughput: Math.max(200, Math.min(600, prev.throughput + (Math.random() - 0.5) * 20)),
        systemLoad: Math.max(30, Math.min(95, prev.systemLoad + (Math.random() - 0.5) * 10)),
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [isLive])

  const getMetricColor = (value: number, isGood: boolean = true) => {
    if (isGood) {
      return value >= 90 ? 'text-green-600' : value >= 70 ? 'text-orange-600' : 'text-red-600'
    } else {
      return value <= 10 ? 'text-green-600' : value <= 30 ? 'text-orange-600' : 'text-red-600'
    }
  }

  const getProgressColor = (value: number, isGood: boolean = true) => {
    if (isGood) {
      return value >= 90 ? 'bg-green-500' : value >= 70 ? 'bg-orange-500' : 'bg-red-500'
    } else {
      return value <= 10 ? 'bg-green-500' : value <= 30 ? 'bg-orange-500' : 'bg-red-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Monitoring Performance
          </h2>
          <p className="text-muted-foreground">
            Métriques en temps réel de vos imports et traitement des données
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLive 
                ? 'bg-green-100 text-green-600 border border-green-200' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Activity className="w-4 h-4" />
            {isLive ? 'En Direct' : 'Mode Statique'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Imports Totaux</p>
                <p className="text-2xl font-bold">{metrics.totalImports.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% ce mois
                </p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de Succès</p>
                <p className={`text-2xl font-bold ${getMetricColor(metrics.successRate)}`}>
                  {metrics.successRate.toFixed(1)}%
                </p>
                <Progress 
                  value={metrics.successRate} 
                  className="h-2 mt-1"
                />
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps Moyen</p>
                <p className="text-2xl font-bold">{metrics.avgProcessingTime.toFixed(1)}s</p>
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Objectif: &lt;2s
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Débit</p>
                <p className="text-2xl font-bold">{metrics.throughput}</p>
                <p className="text-xs text-muted-foreground">items/h</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tendances Import (24h)
            </CardTitle>
            <CardDescription>
              Volume d'imports et taux d'erreur par période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={realTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="imports" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Imports"
                />
                <Line 
                  type="monotone" 
                  dataKey="errors" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Erreurs"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Répartition par Catégorie
            </CardTitle>
            <CardDescription>
              Distribution des imports par catégorie produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Qualité des Données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Score Global</span>
              <span className={`font-bold ${getMetricColor(metrics.dataQuality)}`}>
                {metrics.dataQuality.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.dataQuality} 
              className="h-2"
            />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Complétude</span>
                <span>92%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validité</span>
                <span>87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cohérence</span>
                <span>89%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Satisfaction Utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Score NPS</span>
              <span className={`font-bold ${getMetricColor(metrics.userSatisfaction)}`}>
                {metrics.userSatisfaction.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.userSatisfaction} 
              className="h-2"
            />
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Basé sur 1,247 retours utilisateur
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Charge Système</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Utilisation</span>
              <span className={`font-bold ${getMetricColor(metrics.systemLoad, false)}`}>
                {metrics.systemLoad.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.systemLoad} 
              className="h-2"
            />
            
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Capacité optimale: &lt;80%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Analyse des Erreurs
          </CardTitle>
          <CardDescription>
            Types d'erreurs les plus fréquents et leurs impacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {errorTypes.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="font-medium">{error.type}</p>
                    <p className="text-sm text-muted-foreground">{error.count} occurrences</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={error.percentage} className="w-20 h-2" />
                  <span className="text-sm font-medium">{error.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}