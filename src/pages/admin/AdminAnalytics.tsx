import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Eye, Download, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Cell, AreaChart, Area, Pie } from 'recharts';

// Mock data pour les analytics
const mockRevenueData = [
  { month: 'Jan', revenue: 4500, users: 120, orders: 89 },
  { month: 'Fév', revenue: 5200, users: 145, orders: 102 },
  { month: 'Mar', revenue: 4800, users: 134, orders: 95 },
  { month: 'Avr', revenue: 6100, users: 189, orders: 125 },
  { month: 'Mai', revenue: 7200, users: 234, orders: 156 },
  { month: 'Juin', revenue: 8100, users: 267, orders: 178 }
];

const mockUserActivity = [
  { day: 'Lun', active: 45, new: 12, churned: 3 },
  { day: 'Mar', active: 52, new: 15, churned: 2 },
  { day: 'Mer', active: 48, new: 8, churned: 5 },
  { day: 'Jeu', active: 61, new: 18, churned: 1 },
  { day: 'Ven', active: 55, new: 14, churned: 4 },
  { day: 'Sam', active: 38, new: 9, churned: 2 },
  { day: 'Dim', active: 29, new: 6, churned: 1 }
];

const mockPlanDistribution = [
  { name: 'Standard', value: 60, color: '#8884d8' },
  { name: 'Pro', value: 30, color: '#82ca9d' },
  { name: 'Ultra Pro', value: 10, color: '#ffc658' }
];

const mockFeatureUsage = [
  { feature: 'Import Produits', usage: 85, users: 234 },
  { feature: 'Analytics', usage: 72, users: 189 },
  { feature: 'IA Assistant', usage: 45, users: 67 },
  { feature: 'Automation', usage: 38, users: 45 },
  { feature: 'CRM', usage: 65, users: 156 },
  { feature: 'SEO Tools', usage: 52, users: 98 }
];

const AdminAnalytics = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [metricType, setMetricType] = useState('revenue');

  const totalStats = {
    totalRevenue: mockRevenueData.reduce((acc, curr) => acc + curr.revenue, 0),
    totalUsers: mockRevenueData[mockRevenueData.length - 1].users,
    totalOrders: mockRevenueData.reduce((acc, curr) => acc + curr.orders, 0),
    avgOrderValue: mockRevenueData.reduce((acc, curr) => acc + curr.revenue, 0) / mockRevenueData.reduce((acc, curr) => acc + curr.orders, 0),
    conversionRate: 4.2,
    churnRate: 2.1
  };

  const revenueGrowth = ((mockRevenueData[mockRevenueData.length - 1].revenue - mockRevenueData[0].revenue) / mockRevenueData[0].revenue * 100).toFixed(1);
  const userGrowth = ((mockRevenueData[mockRevenueData.length - 1].users - mockRevenueData[0].users) / mockRevenueData[0].users * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Avancés</h1>
          <p className="text-muted-foreground">Analyse complète des performances de la plateforme</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">1 année</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalRevenue.toLocaleString()}€</div>
            <div className="flex items-center text-xs text-green-600 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{revenueGrowth}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalUsers}</div>
            <div className="flex items-center text-xs text-green-600 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{userGrowth}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalOrders}</div>
            <div className="flex items-center text-xs text-green-600 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgOrderValue.toFixed(0)}€</div>
            <div className="flex items-center text-xs text-red-600 font-medium">
              <TrendingDown className="w-3 h-3 mr-1" />
              -2%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Conversion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.conversionRate}%</div>
            <div className="flex items-center text-xs text-green-600 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" />
              +0.5%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Churn</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.churnRate}%</div>
            <div className="flex items-center text-xs text-green-600 font-medium">
              <TrendingDown className="w-3 h-3 mr-1" />
              -0.3%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">
            <DollarSign className="w-4 h-4 mr-2" />
            Revenus
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="plans">
            <PieChart className="w-4 h-4 mr-2" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="features">
            <BarChart3 className="w-4 h-4 mr-2" />
            Fonctionnalités
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Revenus</CardTitle>
                <CardDescription>Revenus mensuels sur les 6 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenus vs Commandes</CardTitle>
                <CardDescription>Corrélation revenus et nombre de commandes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Croissance Utilisateurs</CardTitle>
                <CardDescription>Nombre d'utilisateurs actifs par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activité Hebdomadaire</CardTitle>
                <CardDescription>Utilisateurs actifs, nouveaux et churned par jour</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockUserActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="active" fill="#8884d8" name="Actifs" />
                    <Bar dataKey="new" fill="#82ca9d" name="Nouveaux" />
                    <Bar dataKey="churned" fill="#ff7c7c" name="Partis" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Plans</CardTitle>
                <CardDescription>Répartition des utilisateurs par plan d'abonnement</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={mockPlanDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {mockPlanDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenus par Plan</CardTitle>
                <CardDescription>Répartition des revenus par type d'abonnement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockPlanDistribution.map((plan, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: plan.color }}
                      />
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{plan.value}% des utilisateurs</p>
                      <p className="text-sm text-muted-foreground">
                        {(totalStats.totalRevenue * plan.value / 100).toLocaleString()}€
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisation des Fonctionnalités</CardTitle>
              <CardDescription>Taux d'adoption des différentes fonctionnalités de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockFeatureUsage.map((feature, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{feature.feature}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{feature.users} utilisateurs</span>
                        <Badge variant="secondary">{feature.usage}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${feature.usage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;