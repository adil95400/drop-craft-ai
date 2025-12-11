import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  BarChart3, LineChart, PieChart, TrendingUp, TrendingDown,
  DollarSign, Package, Users, ShoppingCart, Download, RefreshCw,
  Calendar, Filter, ArrowUpRight, ArrowDownRight, Eye, Target,
  Zap, Award, AlertCircle, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

// Sample data
const revenueData = [
  { name: 'Jan', revenue: 4000, orders: 240, visitors: 1200 },
  { name: 'Fév', revenue: 3000, orders: 180, visitors: 980 },
  { name: 'Mar', revenue: 5000, orders: 320, visitors: 1500 },
  { name: 'Avr', revenue: 4500, orders: 280, visitors: 1350 },
  { name: 'Mai', revenue: 6000, orders: 400, visitors: 1800 },
  { name: 'Juin', revenue: 5500, orders: 360, visitors: 1650 },
  { name: 'Juil', revenue: 7000, orders: 480, visitors: 2100 },
];

const categoryData = [
  { name: 'Électronique', value: 35, color: 'hsl(var(--primary))' },
  { name: 'Mode', value: 28, color: 'hsl(217 91% 60%)' },
  { name: 'Maison', value: 20, color: 'hsl(142 76% 36%)' },
  { name: 'Sport', value: 12, color: 'hsl(38 92% 50%)' },
  { name: 'Autre', value: 5, color: 'hsl(var(--muted-foreground))' },
];

const topProducts = [
  { id: 1, name: 'Écouteurs Bluetooth Pro', sales: 342, revenue: 8550, trend: 12 },
  { id: 2, name: 'Montre Connectée X5', sales: 256, revenue: 12800, trend: 8 },
  { id: 3, name: 'Chargeur Sans Fil', sales: 189, revenue: 3780, trend: -3 },
  { id: 4, name: 'Coque iPhone Premium', sales: 167, revenue: 2505, trend: 15 },
  { id: 5, name: 'Support Téléphone Voiture', sales: 145, revenue: 2175, trend: 5 },
];

function KPICard({ title, value, change, changeType, icon: Icon, subtitle }: {
  title: string;
  value: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {changeType === 'positive' ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : changeType === 'negative' ? (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              ) : null}
              <span className={cn(
                "text-sm",
                changeType === 'positive' && "text-green-500",
                changeType === 'negative' && "text-red-500"
              )}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              {subtitle && <span className="text-xs text-muted-foreground ml-1">{subtitle}</span>}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BIDashboard() {
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Business Intelligence</h2>
          <p className="text-muted-foreground">Analysez vos performances en profondeur</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
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
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Chiffre d'affaires"
          value="35 450 €"
          change={12.5}
          changeType="positive"
          icon={DollarSign}
          subtitle="vs mois dernier"
        />
        <KPICard
          title="Commandes"
          value="2 258"
          change={8.2}
          changeType="positive"
          icon={ShoppingCart}
          subtitle="vs mois dernier"
        />
        <KPICard
          title="Taux de conversion"
          value="3.42%"
          change={-0.3}
          changeType="negative"
          icon={Target}
          subtitle="vs mois dernier"
        />
        <KPICard
          title="Panier moyen"
          value="47.80 €"
          change={5.1}
          changeType="positive"
          icon={Package}
          subtitle="vs mois dernier"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Évolution du CA</CardTitle>
                  <Badge variant="secondary">+12.5%</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPie>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span>{cat.name}</span>
                      </div>
                      <span className="font-medium">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders and Visitors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Commandes vs Visiteurs</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Commandes" />
                    <Bar dataKey="visitors" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} name="Visiteurs" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Top Produits</CardTitle>
                  <Button variant="ghost" size="sm">Voir tout</Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sales} ventes</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{product.revenue.toLocaleString()} €</p>
                          <div className={cn(
                            "flex items-center justify-end text-xs",
                            product.trend > 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {product.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {product.trend > 0 ? '+' : ''}{product.trend}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analyse détaillée des produits</p>
                <p className="text-sm">Performances, marges, tendances</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analyse des clients</p>
                <p className="text-sm">Segmentation, LTV, rétention</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Performance marketing</p>
                <p className="text-sm">ROI, conversions, attribution</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
