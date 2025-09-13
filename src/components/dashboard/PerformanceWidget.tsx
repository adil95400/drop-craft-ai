import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { 
  Activity, 
  Target, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export const PerformanceWidget: React.FC = () => {
  // KPIs de performance
  const kpis = [
    {
      title: 'Taux de Conversion',
      value: '3.2%',
      target: 4.0,
      current: 3.2,
      trend: '+0.5%',
      status: 'good',
      icon: Target
    },
    {
      title: 'Temps Chargement',
      value: '1.8s',
      target: 2.0,
      current: 1.8,
      trend: '-0.2s',
      status: 'excellent',
      icon: Clock
    },
    {
      title: 'Satisfaction Client',
      value: '4.7/5',
      target: 4.5,
      current: 4.7,
      trend: '+0.1',
      status: 'excellent',
      icon: Users
    },
    {
      title: 'Taux Abandon Panier',
      value: '68%',
      target: 65,
      current: 68,
      trend: '+2%',
      status: 'warning',
      icon: ShoppingCart
    }
  ]

  // Données pour le graphique des conversions
  const conversionData = [
    { month: 'Jan', conversion: 2.8, visitors: 1240, orders: 35 },
    { month: 'Fév', conversion: 3.1, visitors: 1450, orders: 45 },
    { month: 'Mar', conversion: 2.9, visitors: 1580, orders: 46 },
    { month: 'Avr', conversion: 3.4, visitors: 1680, orders: 57 },
    { month: 'Mai', conversion: 3.2, visitors: 1750, orders: 56 },
    { month: 'Jun', conversion: 3.6, visitors: 1820, orders: 66 },
  ]

  // Données pour le graphique en secteurs - Sources de trafic
  const trafficData = [
    { name: 'Recherche Organique', value: 45, color: '#0ea5e9' },
    { name: 'Réseaux Sociaux', value: 25, color: '#8b5cf6' },
    { name: 'Email Marketing', value: 15, color: '#10b981' },
    { name: 'Publicité Payée', value: 10, color: '#f59e0b' },
    { name: 'Direct', value: 5, color: '#ef4444' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600'
      case 'good':
        return 'text-blue-600'
      case 'warning':
        return 'text-orange-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          const progressValue = (kpi.current / kpi.target) * 100
          
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {getStatusIcon(kpi.status)}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {kpi.value}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${getStatusColor(kpi.status)}`}>
                      {kpi.trend}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      vs objectif
                    </span>
                  </div>
                  <Progress value={Math.min(progressValue, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Graphiques de Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution du Taux de Conversion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Évolution des Conversions
            </CardTitle>
            <CardDescription>
              Taux de conversion des 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{`Mois: ${label}`}</p>
                          <p className="text-blue-600">
                            {`Conversion: ${data.conversion}%`}
                          </p>
                          <p className="text-muted-foreground">
                            {`Visiteurs: ${data.visitors}`}
                          </p>
                          <p className="text-green-600">
                            {`Commandes: ${data.orders}`}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversion" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sources de Trafic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Sources de Trafic
            </CardTitle>
            <CardDescription>
              Répartition du trafic par canal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={trafficData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-lg font-bold" style={{ color: data.color }}>
                              {data.value}%
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Légende */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {trafficData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques Détaillées */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques Détaillées</CardTitle>
          <CardDescription>
            Analyse approfondie des performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Performance E-commerce */}
            <div className="space-y-3">
              <h4 className="font-medium">E-commerce</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Revenus par visiteur</span>
                  <span className="font-medium">€12.50</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Temps sur site</span>
                  <span className="font-medium">4min 23s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pages par session</span>
                  <span className="font-medium">3.7</span>
                </div>
              </div>
            </div>

            {/* Performance Technique */}
            <div className="space-y-3">
              <h4 className="font-medium">Performance Technique</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score Performance</span>
                  <span className="font-medium text-green-600">92/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Disponibilité</span>
                  <span className="font-medium text-green-600">99.9%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Erreurs 404</span>
                  <span className="font-medium">0.2%</span>
                </div>
              </div>
            </div>

            {/* Performance Marketing */}
            <div className="space-y-3">
              <h4 className="font-medium">Marketing</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CPA (Coût par Acquisition)</span>
                  <span className="font-medium">€15.20</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ROAS</span>
                  <span className="font-medium text-green-600">4.2x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taux Ouverture Email</span>
                  <span className="font-medium">24.5%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}