import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Users, Activity, Download, Calendar } from 'lucide-react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  
  const metrics = [
    {
      title: 'Extensions Actives',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: Activity
    },
    {
      title: 'Utilisateurs Uniques',
      value: '1,847',
      change: '+8%',
      trend: 'up',
      icon: Users
    },
    {
      title: 'Total Downloads',
      value: '12,543',
      change: '-3%',
      trend: 'down',
      icon: Download
    },
    {
      title: 'Sessions Actives',
      value: '892',
      change: '+15%',
      trend: 'up',
      icon: TrendingUp
    }
  ]

  const usageData = [
    { date: '2024-01-08', sessions: 420, users: 180, downloads: 45 },
    { date: '2024-01-09', sessions: 380, users: 165, downloads: 52 },
    { date: '2024-01-10', sessions: 520, users: 220, downloads: 38 },
    { date: '2024-01-11', sessions: 640, users: 280, downloads: 67 },
    { date: '2024-01-12', sessions: 580, users: 245, downloads: 41 },
    { date: '2024-01-13', sessions: 720, users: 310, downloads: 58 },
    { date: '2024-01-14', sessions: 680, users: 295, downloads: 49 }
  ]

  const extensionStats = [
    { name: 'Data Scraper Pro', usage: 35, color: '#3b82f6' },
    { name: 'Review Importer', usage: 25, color: '#10b981' },
    { name: 'Price Monitor', usage: 20, color: '#f59e0b' },
    { name: 'SEO Optimizer', usage: 15, color: '#ef4444' },
    { name: 'Autres', usage: 5, color: '#6b7280' }
  ]

  const performanceData = [
    { extension: 'Data Scraper Pro', loadTime: 1.2, errorRate: 0.5, satisfaction: 4.8 },
    { extension: 'Review Importer', loadTime: 0.9, errorRate: 0.2, satisfaction: 4.9 },
    { extension: 'Price Monitor', loadTime: 2.1, errorRate: 1.1, satisfaction: 4.6 },
    { extension: 'SEO Optimizer', loadTime: 1.5, errorRate: 0.8, satisfaction: 4.7 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics Extensions
          </h1>
          <p className="text-muted-foreground mt-2">
            Analysez l'utilisation et les performances de vos extensions
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Dernières 24h</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <Badge variant={metric.trend === 'up' ? 'default' : 'secondary'}>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {metric.change}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Utilisation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="custom">Rapports Personnalisés</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de l'Utilisation</CardTitle>
              <CardDescription>Sessions, utilisateurs et téléchargements au fil du temps</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="downloads" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Extensions par Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {extensionStats.map((ext, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ext.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{ext.name}</span>
                          <span className="text-sm text-muted-foreground">{ext.usage}%</span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full mt-1">
                          <div
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${ext.usage}%`, 
                              backgroundColor: ext.color 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Extension</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={extensionStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="usage"
                    >
                      {extensionStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métriques de Performance</CardTitle>
              <CardDescription>Temps de chargement, taux d'erreur et satisfaction utilisateur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((ext, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{ext.extension}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          ⭐ {ext.satisfaction}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Temps de chargement</p>
                        <p className="font-semibold">{ext.loadTime}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taux d'erreur</p>
                        <p className="font-semibold">{ext.errorRate}%</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution des Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Personnalisés</CardTitle>
              <CardDescription>Créez des rapports sur mesure pour vos besoins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Rapports Personnalisés</h3>
                <p className="text-muted-foreground mb-4">
                  Fonctionnalité disponible dans la version Pro
                </p>
                <Button>Mettre à niveau vers Pro</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}