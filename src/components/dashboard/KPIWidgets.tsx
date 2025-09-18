import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Target,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Award,
  Clock,
  Zap
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

interface KPIData {
  id: string
  title: string
  value: string | number
  target?: number
  previousValue?: number
  change: number
  changeType: 'increase' | 'decrease'
  trend: 'up' | 'down' | 'stable'
  category: 'revenue' | 'customers' | 'orders' | 'conversion' | 'performance'
  unit: string
  format: 'currency' | 'percentage' | 'number' | 'time'
  icon: React.ComponentType<{ className?: string }>
  color: string
  chartData?: any[]
}

export function KPIWidgets() {
  const [kpis, setKpis] = useState<KPIData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('week')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    generateKPIData()
  }, [selectedPeriod])

  const generateKPIData = () => {
    const chartData7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        value: Math.floor(Math.random() * 5000) + 2000
      }
    })

    const conversionData = [
      { name: 'Visiteurs', value: 12840, fill: '#3b82f6' },
      { name: 'Intérêts', value: 4320, fill: '#10b981' },
      { name: 'Ajouts panier', value: 1560, fill: '#f59e0b' },
      { name: 'Commandes', value: 456, fill: '#ef4444' }
    ]

    const mockKPIs: KPIData[] = [
      {
        id: '1',
        title: 'Chiffre d\'Affaires',
        value: '€45,280',
        target: 50000,
        previousValue: 38400,
        change: 17.9,
        changeType: 'increase',
        trend: 'up',
        category: 'revenue',
        unit: '€',
        format: 'currency',
        icon: DollarSign,
        color: 'text-green-600',
        chartData: chartData7Days
      },
      {
        id: '2',
        title: 'Nouveaux Clients',
        value: 234,
        target: 300,
        previousValue: 189,
        change: 23.8,
        changeType: 'increase',
        trend: 'up',
        category: 'customers',
        unit: '',
        format: 'number',
        icon: Users,
        color: 'text-blue-600',
        chartData: Array.from({ length: 7 }, (_, i) => ({
          date: `${i + 1}/12`,
          value: Math.floor(Math.random() * 50) + 20
        }))
      },
      {
        id: '3',
        title: 'Commandes Traitées',
        value: 567,
        target: 600,
        previousValue: 512,
        change: 10.7,
        changeType: 'increase',
        trend: 'up',
        category: 'orders',
        unit: '',
        format: 'number',
        icon: ShoppingCart,
        color: 'text-purple-600',
        chartData: Array.from({ length: 7 }, (_, i) => ({
          date: `${i + 1}/12`,
          value: Math.floor(Math.random() * 100) + 50
        }))
      },
      {
        id: '4',
        title: 'Taux de Conversion',
        value: '3.8%',
        target: 4.5,
        previousValue: 3.2,
        change: 18.8,
        changeType: 'increase',
        trend: 'up',
        category: 'conversion',
        unit: '%',
        format: 'percentage',
        icon: Target,
        color: 'text-orange-600',
        chartData: conversionData
      },
      {
        id: '5',
        title: 'Panier Moyen',
        value: '€156.80',
        target: 170,
        previousValue: 142.30,
        change: 10.2,
        changeType: 'increase',
        trend: 'up',
        category: 'revenue',
        unit: '€',
        format: 'currency',
        icon: BarChart3,
        color: 'text-pink-600',
        chartData: chartData7Days
      },
      {
        id: '6',
        title: 'Temps de Réponse',
        value: '1.2s',
        target: 1.0,
        previousValue: 1.8,
        change: -33.3,
        changeType: 'decrease',
        trend: 'up', // Amélioration = up même si c'est une baisse
        category: 'performance',
        unit: 's',
        format: 'time',
        icon: Clock,
        color: 'text-cyan-600',
        chartData: Array.from({ length: 7 }, (_, i) => ({
          date: `${i + 1}/12`,
          value: 0.8 + Math.random() * 0.8 // 0.8 à 1.6s
        }))
      },
      {
        id: '7',
        title: 'Satisfaction Client',
        value: '4.7/5',
        target: 4.5,
        previousValue: 4.3,
        change: 9.3,
        changeType: 'increase',
        trend: 'up',
        category: 'customers',
        unit: '/5',
        format: 'number',
        icon: Award,
        color: 'text-yellow-600',
        chartData: Array.from({ length: 7 }, (_, i) => ({
          date: `${i + 1}/12`,
          value: 4.0 + Math.random() * 1.0 // 4.0 à 5.0
        }))
      },
      {
        id: '8',
        title: 'Taux de Rétention',
        value: '68%',
        target: 75,
        previousValue: 61,
        change: 11.5,
        changeType: 'increase',
        trend: 'up',
        category: 'customers',
        unit: '%',
        format: 'percentage',
        icon: Activity,
        color: 'text-indigo-600',
        chartData: Array.from({ length: 7 }, (_, i) => ({
          date: `${i + 1}/12`,
          value: 60 + Math.random() * 20 // 60% à 80%
        }))
      }
    ]

    setKpis(mockKPIs)
  }

  const formatValue = (value: string | number, format: KPIData['format']) => {
    if (typeof value === 'string') return value
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
      case 'percentage':
        return `${value}%`
      case 'time':
        return `${value}s`
      default:
        return value.toString()
    }
  }

  const getProgressValue = (kpi: KPIData) => {
    if (!kpi.target) return 100
    const numericValue = typeof kpi.value === 'string' ? 
      parseFloat(kpi.value.replace(/[^0-9.]/g, '')) : kpi.value
    return Math.min((numericValue / kpi.target) * 100, 100)
  }

  const getCategoryIcon = (category: KPIData['category']) => {
    switch (category) {
      case 'revenue': return '💰'
      case 'customers': return '👥'
      case 'orders': return '🛒'
      case 'conversion': return '🎯'
      case 'performance': return '⚡'
      default: return '📊'
    }
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Indicateurs Clés de Performance</h2>
        <div className="flex gap-2">
          {[
            { key: 'today', label: 'Aujourd\'hui' },
            { key: 'week', label: '7 jours' },
            { key: 'month', label: '30 jours' },
            { key: 'quarter', label: '3 mois' }
          ].map((period) => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.key as any)}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          const progressValue = getProgressValue(kpi)
          
          return (
            <Card key={kpi.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gray-100`}>
                      <Icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                    <span className="text-lg">{getCategoryIcon(kpi.category)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {kpi.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : kpi.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-gray-400" />
                    )}
                    <Badge 
                      className={`${
                        kpi.changeType === 'increase' ? 'bg-green-500' : 'bg-red-500'
                      } text-white text-xs`}
                    >
                      {kpi.changeType === 'increase' ? '+' : ''}{kpi.change.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatValue(kpi.value, kpi.format)}
                  </div>
                  
                  {kpi.target && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Objectif: {formatValue(kpi.target, kpi.format)}</span>
                        <span>{progressValue.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                    </div>
                  )}
                  
                  {kpi.chartData && (
                    <div className="h-16 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        {kpi.id === '4' ? (
                          <PieChart>
                            <Pie
                              data={kpi.chartData}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={20}
                              outerRadius={30}
                            >
                              {kpi.chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                          </PieChart>
                        ) : (
                          <AreaChart data={kpi.chartData}>
                            <defs>
                              <linearGradient id={`gradient-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={kpi.color.replace('text-', '').replace('-600', '')} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={kpi.color.replace('text-', '').replace('-600', '')} stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke={kpi.color}
                              fill={`url(#gradient-${kpi.id})`}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {kpi.previousValue && (
                    <div className="text-xs text-gray-500">
                      vs. {formatValue(kpi.previousValue, kpi.format)} (période précédente)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Performance Globale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Objectifs atteints:</span>
                <span className="font-semibold text-green-600">6/8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amélioration moyenne:</span>
                <span className="font-semibold text-blue-600">+15.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tendance générale:</span>
                <Badge className="bg-green-500 text-white">Positive</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Focus Prioritaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium text-red-600 mb-1">⚠️ Attention requise:</div>
                <div className="text-gray-600">Temps de réponse à optimiser</div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-yellow-600 mb-1">🎯 Objectif proche:</div>
                <div className="text-gray-600">Taux de conversion (+0.7% nécessaire)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Actions Recommandées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Optimiser le checkout
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Campagne de rétention
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Améliorer la vitesse
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}