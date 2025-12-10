import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Mail,
  Target,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899'];

export const CRMReports: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts
  const customerGrowthData = [
    { month: 'Jan', nouveaux: 120, actifs: 450, churned: 15 },
    { month: 'Fév', nouveaux: 150, actifs: 520, churned: 20 },
    { month: 'Mar', nouveaux: 180, actifs: 610, churned: 18 },
    { month: 'Avr', nouveaux: 220, actifs: 750, churned: 25 },
    { month: 'Mai', nouveaux: 190, actifs: 820, churned: 22 },
    { month: 'Juin', nouveaux: 250, actifs: 980, churned: 30 }
  ];

  const segmentData = [
    { name: 'VIP', value: 45, color: '#eab308' },
    { name: 'Réguliers', value: 180, color: '#22c55e' },
    { name: 'Occasionnels', value: 320, color: '#3b82f6' },
    { name: 'Nouveaux', value: 230, color: '#8b5cf6' },
    { name: 'Inactifs', value: 89, color: '#ef4444' }
  ];

  const engagementData = [
    { date: '01/06', emails: 85, sms: 92, push: 78 },
    { date: '08/06', emails: 88, sms: 90, push: 82 },
    { date: '15/06', emails: 82, sms: 88, push: 75 },
    { date: '22/06', emails: 90, sms: 94, push: 85 },
    { date: '29/06', emails: 87, sms: 91, push: 80 }
  ];

  const lifecycleData = [
    { stage: 'Prospect', count: 450, conversion: 25 },
    { stage: 'Lead', count: 320, conversion: 40 },
    { stage: 'Opportunité', count: 180, conversion: 55 },
    { stage: 'Client', count: 120, conversion: 70 },
    { stage: 'Fidèle', count: 85, conversion: 85 }
  ];

  const revenueBySegment = [
    { segment: 'VIP', revenue: 45000, orders: 180 },
    { segment: 'Réguliers', revenue: 32000, orders: 420 },
    { segment: 'Occasionnels', revenue: 18000, orders: 280 },
    { segment: 'Nouveaux', revenue: 12000, orders: 230 }
  ];

  const kpis = [
    { 
      label: 'Total clients', 
      value: '2,456', 
      change: '+12.5%', 
      trend: 'up',
      icon: Users 
    },
    { 
      label: 'Taux de rétention', 
      value: '78.3%', 
      change: '+3.2%', 
      trend: 'up',
      icon: Target 
    },
    { 
      label: 'CLV moyen', 
      value: '€234', 
      change: '+8.1%', 
      trend: 'up',
      icon: ShoppingCart 
    },
    { 
      label: 'Taux d\'engagement', 
      value: '42.5%', 
      change: '-2.3%', 
      trend: 'down',
      icon: Mail 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Rapports CRM
          </h2>
          <p className="text-muted-foreground">Analyse détaillée de votre base clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <div className={`flex items-center text-sm ${
                    kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {kpi.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {kpi.change}
                  </div>
                </div>
                <kpi.icon className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="lifecycle">Cycle de vie</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Customer Growth */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Croissance clients</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={customerGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="actifs" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      name="Clients actifs"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="nouveaux" 
                      stackId="2"
                      stroke="#22c55e" 
                      fill="#22c55e" 
                      fillOpacity={0.3}
                      name="Nouveaux"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Segments Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Répartition par segment</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))'
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analyse des segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {segmentData.map((segment, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: segment.color }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{segment.name}</span>
                        <span className="text-muted-foreground">{segment.value} clients</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${(segment.value / 864) * 100}%`,
                            backgroundColor: segment.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Taux d'engagement par canal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))'
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="emails" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    name="Emails"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sms" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                    name="SMS"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="push" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6' }}
                    name="Push"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funnel du cycle de vie client</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={lifecycleData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="stage" type="category" className="text-xs" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))'
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Nombre" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenus par segment</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueBySegment}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="segment" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))'
                    }}
                    formatter={(value, name) => [
                      name === 'revenue' ? `€${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenus' : 'Commandes'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenus (€)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orders" fill="#22c55e" name="Commandes" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Top segments en croissance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">VIP</span>
                <Badge className="bg-green-500/10 text-green-500">+24%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Nouveaux clients</span>
                <Badge className="bg-green-500/10 text-green-500">+18%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">B2B</span>
                <Badge className="bg-green-500/10 text-green-500">+12%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Segments à risque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Inactifs 90j+</span>
                <Badge className="bg-red-500/10 text-red-500">89 clients</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Désengagés</span>
                <Badge className="bg-red-500/10 text-red-500">45 clients</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Churn prédit</span>
                <Badge className="bg-red-500/10 text-red-500">23 clients</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Objectifs mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Nouveaux clients</span>
                  <span>180/200</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '90%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Taux de rétention</span>
                  <span>78%/80%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '97.5%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
