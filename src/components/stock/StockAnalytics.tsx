import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Activity,
  Download,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function StockAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');

  // Fetch stock movements data
  const { data: movements } = useQuery({
    queryKey: ['stock-movements', timeRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, product:products(name, category), warehouse:warehouses(name)')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // Fetch stock levels for current state
  const { data: stockLevels } = useQuery({
    queryKey: ['stock-levels-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_levels')
        .select('*, product:products(name, category, price), warehouse:warehouses(name)');

      if (error) throw error;
      return data;
    }
  });

  // Prepare data for movement trends
  const movementTrends = React.useMemo(() => {
    if (!movements) return [];
    
    const groupedByDate = movements.reduce((acc: any, movement) => {
      const date = new Date(movement.created_at).toLocaleDateString('fr-FR');
      if (!acc[date]) {
        acc[date] = { date, inbound: 0, outbound: 0, net: 0 };
      }
      
      if (movement.movement_type === 'inbound') {
        acc[date].inbound += movement.quantity;
        acc[date].net += movement.quantity;
      } else if (movement.movement_type === 'outbound') {
        acc[date].outbound += movement.quantity;
        acc[date].net -= movement.quantity;
      }
      
      return acc;
    }, {});

    return Object.values(groupedByDate);
  }, [movements]);

  // Prepare data for category distribution
  const categoryDistribution = React.useMemo(() => {
    if (!stockLevels) return [];
    
    const grouped = stockLevels.reduce((acc: Record<string, any>, level) => {
      const category = level.product?.category || 'Sans catégorie';
      if (!acc[category]) {
        acc[category] = { name: category, value: 0, count: 0 };
      }
      acc[category].value += level.available_quantity;
      acc[category].count += 1;
      return acc;
    }, {});

    return Object.values(grouped);
  }, [stockLevels]);

  // Prepare data for warehouse utilization
  const warehouseUtilization = React.useMemo(() => {
    if (!stockLevels) return [];
    
    const grouped = stockLevels.reduce((acc: any, level) => {
      const warehouse = level.warehouse?.name || 'Inconnu';
      if (!acc[warehouse]) {
        acc[warehouse] = { 
          name: warehouse, 
          available: 0, 
          reserved: 0,
          total: 0 
        };
      }
      acc[warehouse].available += level.available_quantity;
      acc[warehouse].reserved += level.reserved_quantity;
      acc[warehouse].total += level.available_quantity + level.reserved_quantity;
      return acc;
    }, {});

    return Object.values(grouped);
  }, [stockLevels]);

  // Calculate stock value by category
  const stockValueByCategory = React.useMemo(() => {
    if (!stockLevels) return [];
    
    const grouped = stockLevels.reduce((acc: any, level) => {
      const category = level.product?.category || 'Sans catégorie';
      const value = (level.available_quantity * (level.product?.price || 0));
      
      if (!acc[category]) {
        acc[category] = { name: category, value: 0 };
      }
      acc[category].value += value;
      return acc;
    }, {});

    return Object.values(grouped);
  }, [stockLevels]);

  // Calculate KPIs
  const kpis = React.useMemo(() => {
    if (!movements || !stockLevels) return null;

    const totalInbound = movements
      .filter(m => m.movement_type === 'inbound')
      .reduce((sum, m) => sum + m.quantity, 0);

    const totalOutbound = movements
      .filter(m => m.movement_type === 'outbound')
      .reduce((sum, m) => sum + m.quantity, 0);

    const totalValue = stockLevels.reduce((sum, level) => {
      return sum + (level.available_quantity * (level.product?.price || 0));
    }, 0);

    const turnoverRate = totalOutbound > 0 
      ? ((totalOutbound / (totalInbound + totalOutbound)) * 100).toFixed(1)
      : 0;

    return {
      totalInbound,
      totalOutbound,
      netChange: totalInbound - totalOutbound,
      totalValue,
      turnoverRate
    };
  }, [movements, stockLevels]);

  const exportReport = () => {
    const csvContent = [
      ['Date', 'Type', 'Produit', 'Quantité', 'Entrepôt'],
      ...movements.map(m => [
        new Date(m.created_at).toLocaleDateString(),
        m.movement_type,
        (m.product as any)?.name || '-',
        m.quantity.toString(),
        (m.warehouse as any)?.name || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="365d">1 an</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Entrepôt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les entrepôts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={exportReport}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Entrées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{kpis.totalInbound}</p>
              <p className="text-xs text-muted-foreground">unités reçues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Sorties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{kpis.totalOutbound}</p>
              <p className="text-xs text-muted-foreground">unités vendues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Variation Nette
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${kpis.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpis.netChange >= 0 ? '+' : ''}{kpis.netChange}
              </p>
              <p className="text-xs text-muted-foreground">unités</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Valeur Totale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpis.totalValue.toFixed(2)} €</p>
              <p className="text-xs text-muted-foreground">stock actuel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-500" />
                Rotation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{kpis.turnoverRate}%</p>
              <p className="text-xs text-muted-foreground">taux de rotation</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="warehouses">Entrepôts</TabsTrigger>
          <TabsTrigger value="value">Valeur</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Mouvements de Stock</CardTitle>
              <CardDescription>
                Évolution des entrées et sorties sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={movementTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="inbound" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Entrées"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="outbound" 
                    stackId="2"
                    stroke="#ef4444" 
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Sorties"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Variation nette"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribution par Catégorie</CardTitle>
                <CardDescription>Quantités par catégorie de produits</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${entry.value})`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nombre de Produits</CardTitle>
                <CardDescription>Répartition par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Nombre de produits" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="warehouses">
          <Card>
            <CardHeader>
              <CardTitle>Utilisation des Entrepôts</CardTitle>
              <CardDescription>Stock disponible et réservé par entrepôt</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={warehouseUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="available" stackId="a" fill="#10b981" name="Disponible" />
                  <Bar dataKey="reserved" stackId="a" fill="#f59e0b" name="Réservé" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="value">
          <Card>
            <CardHeader>
              <CardTitle>Valeur du Stock par Catégorie</CardTitle>
              <CardDescription>Valeur monétaire du stock disponible</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stockValueByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                  <Bar dataKey="value" fill="#8884d8" name="Valeur (€)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
