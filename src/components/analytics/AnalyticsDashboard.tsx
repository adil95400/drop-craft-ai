import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

interface ChartData {
  name: string;
  value?: number;
  [key: string]: any;
}

interface AnalyticsDashboardProps {
  className?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: string) => void;
}

const mockMetrics: MetricCard[] = [
  {
    title: 'Chiffre d\'affaires',
    value: '125 450 €',
    change: 12.5,
    icon: <DollarSign className="h-4 w-4" />,
    trend: 'up'
  },
  {
    title: 'Commandes',
    value: '1,234',
    change: -2.4,
    icon: <ShoppingCart className="h-4 w-4" />,
    trend: 'down'
  },
  {
    title: 'Clients actifs',
    value: '8,492',
    change: 18.2,
    icon: <Users className="h-4 w-4" />,
    trend: 'up'
  },
  {
    title: 'Produits vendus',
    value: '3,567',
    change: 5.8,
    icon: <Package className="h-4 w-4" />,
    trend: 'up'
  }
];

const salesData: ChartData[] = [
  { name: 'Jan', sales: 4000, orders: 240, customers: 400 },
  { name: 'Fév', sales: 3000, orders: 139, customers: 300 },
  { name: 'Mar', sales: 2000, orders: 980, customers: 200 },
  { name: 'Avr', sales: 2780, orders: 390, customers: 278 },
  { name: 'Mai', sales: 1890, orders: 480, customers: 189 },
  { name: 'Jun', sales: 2390, orders: 380, customers: 239 },
  { name: 'Jul', sales: 3490, orders: 430, customers: 349 }
];

const productData: ChartData[] = [
  { name: 'Électronique', value: 35, color: '#8884d8' },
  { name: 'Vêtements', value: 25, color: '#82ca9d' },
  { name: 'Maison', value: 20, color: '#ffc658' },
  { name: 'Sport', value: 15, color: '#ff7c7c' },
  { name: 'Autres', value: 5, color: '#8dd1e1' }
];

const trafficData: ChartData[] = [
  { name: 'Lun', visits: 1200, unique: 800, bounce: 45 },
  { name: 'Mar', visits: 1900, unique: 1300, bounce: 38 },
  { name: 'Mer', visits: 800, unique: 600, bounce: 52 },
  { name: 'Jeu', visits: 1500, unique: 1000, bounce: 41 },
  { name: 'Ven', visits: 2000, unique: 1400, bounce: 35 },
  { name: 'Sam', visits: 2400, unique: 1800, bounce: 28 },
  { name: 'Dim', visits: 1800, unique: 1200, bounce: 42 }
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className,
  timeRange = '30d',
  onTimeRangeChange
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  const formatChange = (change: number) => {
    const isPositive = change > 0;
    return (
      <div className={cn(
        "flex items-center gap-1 text-sm",
        isPositive ? "text-green-600" : "text-red-600"
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(change)}%
      </div>
    );
  };

  const renderChart = () => {
    const data = salesData;
    
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Ventes (€)"
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Commandes"
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8"
                name="Ventes (€)"
              />
              <Area 
                type="monotone" 
                dataKey="orders" 
                stackId="1"
                stroke="#82ca9d" 
                fill="#82ca9d"
                name="Commandes"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" name="Ventes (€)" />
              <Bar dataKey="orders" fill="#82ca9d" name="Commandes" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Suivez les performances de votre business
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  {formatChange(metric.change)}
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="traffic">Trafic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tendances des ventes</CardTitle>
                <div className="flex gap-2">
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Barres</SelectItem>
                      <SelectItem value="line">Lignes</SelectItem>
                      <SelectItem value="area">Aires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderChart()}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productData.map((entry, index) => (
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
                <CardTitle>Trafic hebdomadaire</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="visits" 
                      stroke="#8884d8" 
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Visites"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="unique" 
                      stroke="#82ca9d" 
                      fill="#82ca9d"
                      fillOpacity={0.6}
                      name="Visiteurs uniques"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Détails des ventes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    name="Ventes (€)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'iPhone 15 Pro', sales: 1234, revenue: '€48,960' },
                  { name: 'MacBook Air M2', sales: 567, revenue: '€34,020' },
                  { name: 'AirPods Pro', sales: 890, revenue: '€22,250' },
                  { name: 'iPad Air', sales: 432, revenue: '€17,280' }
                ].map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">{product.sales} ventes</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{product.revenue}</div>
                      <Badge variant="secondary">{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle>Analyse du trafic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold">12,453</div>
                          <p className="text-sm text-muted-foreground">Vues de page</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold">8,492</div>
                          <p className="text-sm text-muted-foreground">Visiteurs uniques</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">42%</div>
                      <p className="text-sm text-muted-foreground">Taux de rebond</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">2m 34s</div>
                      <p className="text-sm text-muted-foreground">Temps moyen</p>
                    </CardContent>
                  </Card>
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visits" fill="#8884d8" name="Visites" />
                    <Bar dataKey="unique" fill="#82ca9d" name="Visiteurs uniques" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};