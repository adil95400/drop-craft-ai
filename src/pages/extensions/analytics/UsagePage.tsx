import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { Activity, Users, Clock, Zap, TrendingUp, Calendar, Download, RefreshCw } from 'lucide-react'

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('sessions')

  const usageStats = [
    {
      title: 'Sessions Actives',
      value: '2,847',
      change: '+15%',
      trend: 'up',
      icon: Activity,
      description: 'Sessions d\'extensions aujourd\'hui'
    },
    {
      title: 'Utilisateurs Uniques',
      value: '1,247',
      change: '+8%',
      trend: 'up',
      icon: Users,
      description: 'Utilisateurs actifs cette semaine'
    },
    {
      title: 'Temps d\'Utilisation Moyen',
      value: '42 min',
      change: '+12%',
      trend: 'up',
      icon: Clock,
      description: 'Par session utilisateur'
    },
    {
      title: 'Actions par Session',
      value: '23.4',
      change: '+5%',
      trend: 'up',
      icon: Zap,
      description: 'Interactions moyennes'
    }
  ]

  const usageOverTime = [
    { date: '2024-01-08', sessions: 2100, users: 890, actions: 45680 },
    { date: '2024-01-09', sessions: 2340, users: 920, actions: 52340 },
    { date: '2024-01-10', sessions: 2580, users: 1050, actions: 48920 },
    { date: '2024-01-11', sessions: 2720, users: 1120, actions: 56780 },
    { date: '2024-01-12', sessions: 2890, users: 1180, actions: 61240 },
    { date: '2024-01-13', sessions: 3020, users: 1250, actions: 58930 },
    { date: '2024-01-14', sessions: 2847, users: 1247, actions: 54620 }
  ]

  const extensionUsage = [
    { name: 'Data Scraper Pro', usage: 35, sessions: 1247, color: '#3b82f6' },
    { name: 'Review Importer', usage: 28, sessions: 989, color: '#10b981' },
    { name: 'Price Monitor', usage: 22, sessions: 782, color: '#f59e0b' },
    { name: 'SEO Optimizer', usage: 15, sessions: 534, color: '#ef4444' }
  ]

  const featureUsage = [
    {
      feature: 'Data Scraping',
      usage: 87,
      users: 1089,
      avgTime: '15 min',
      category: 'Core'
    },
    {
      feature: 'Export CSV',
      usage: 73,
      users: 907,
      avgTime: '3 min',
      category: 'Export'
    },
    {
      feature: 'API Integration',
      usage: 62,
      users: 771,
      avgTime: '8 min',
      category: 'Integration'
    },
    {
      feature: 'Automated Scheduling',
      usage: 45,
      users: 561,
      avgTime: '12 min',
      category: 'Automation'
    },
    {
      feature: 'Advanced Analytics',
      usage: 34,
      users: 424,
      avgTime: '20 min',
      category: 'Analytics'
    }
  ]

  const userBehavior = [
    {
      timeSlot: '00-06h',
      sessions: 145,
      avgDuration: 28
    },
    {
      timeSlot: '06-12h',
      sessions: 892,
      avgDuration: 45
    },
    {
      timeSlot: '12-18h',
      sessions: 1247,
      avgDuration: 52
    },
    {
      timeSlot: '18-24h',
      sessions: 563,
      avgDuration: 38
    }
  ]

  const deviceStats = [
    { device: 'Desktop', percentage: 68, users: 848 },
    { device: 'Mobile', percentage: 24, users: 299 },
    { device: 'Tablet', percentage: 8, users: 100 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Statistiques d'Utilisation
          </h1>
          <p className="text-muted-foreground mt-2">
            Analysez comment vos utilisateurs interagissent avec vos extensions
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Dernières 24h</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {usageStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <Badge variant={stat.trend === 'up' ? 'default' : 'secondary'}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-sm font-medium">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="extensions">Par Extension</TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="behavior">Comportement</TabsTrigger>
          <TabsTrigger value="devices">Appareils</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de l'Utilisation</CardTitle>
              <CardDescription>
                Tendances des sessions, utilisateurs et actions au fil du temps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="sessions" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Sessions" />
                  <Area type="monotone" dataKey="users" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Utilisateurs" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Extension</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={extensionUsage}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="usage"
                      label={({name, usage}) => `${name}: ${usage}%`}
                    >
                      {extensionUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activité par Créneaux Horaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userBehavior.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{slot.timeSlot}</span>
                          <span className="text-sm text-muted-foreground">{slot.sessions} sessions</span>
                        </div>
                        <Progress value={slot.sessions / 1247 * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Durée moyenne: {slot.avgDuration} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="extensions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisation Détaillée par Extension</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {extensionUsage.map((ext, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ext.color }} />
                        <h3 className="font-semibold">{ext.name}</h3>
                      </div>
                      <Badge variant="outline">{ext.usage}% d'utilisation</Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{ext.sessions}</div>
                        <p className="text-sm text-muted-foreground">Sessions</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{Math.round(ext.sessions * 0.8)}</div>
                        <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{Math.round(ext.sessions * 2.3)}</div>
                        <p className="text-sm text-muted-foreground">Actions totales</p>
                      </div>
                    </div>
                    
                    <Progress value={ext.usage} className="mt-4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisation des Fonctionnalités</CardTitle>
              <CardDescription>
                Analysez quelles fonctionnalités sont les plus utilisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureUsage.map((feature, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{feature.feature}</h3>
                          <Badge variant="outline">{feature.category}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{feature.usage}%</div>
                          <p className="text-xs text-muted-foreground">d'adoption</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <div className="font-semibold">{feature.users}</div>
                          <p className="text-xs text-muted-foreground">Utilisateurs</p>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{feature.avgTime}</div>
                          <p className="text-xs text-muted-foreground">Temps moyen</p>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{Math.round(feature.users * 1.8)}</div>
                          <p className="text-xs text-muted-foreground">Sessions/jour</p>
                        </div>
                      </div>
                      
                      <Progress value={feature.usage} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Parcours Utilisateur Moyen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                    <div>
                      <p className="font-medium">Installation</p>
                      <p className="text-sm text-muted-foreground">100% des utilisateurs</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                    <div>
                      <p className="font-medium">Configuration initiale</p>
                      <p className="text-sm text-muted-foreground">87% des utilisateurs</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                    <div>
                      <p className="font-medium">Première utilisation</p>
                      <p className="text-sm text-muted-foreground">76% des utilisateurs</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
                    <div>
                      <p className="font-medium">Utilisation régulière</p>
                      <p className="text-sm text-muted-foreground">64% des utilisateurs</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques d'Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">76%</div>
                    <p className="text-sm text-muted-foreground">Taux d'activation</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">64%</div>
                    <p className="text-sm text-muted-foreground">Rétention 7 jours</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">42%</div>
                    <p className="text-sm text-muted-foreground">Rétention 30 jours</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">3.4x</div>
                    <p className="text-sm text-muted-foreground">Sessions/semaine</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Type d'Appareil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {deviceStats.map((device, index) => (
                  <Card key={index}>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold mb-2">{device.percentage}%</div>
                      <p className="font-semibold mb-1">{device.device}</p>
                      <p className="text-sm text-muted-foreground">{device.users} utilisateurs</p>
                      <Progress value={device.percentage} className="mt-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}