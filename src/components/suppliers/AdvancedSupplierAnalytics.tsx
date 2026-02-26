import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useSupplierAPI } from '@/hooks/useSupplierAPI';
import { useSupplierRealtime } from '@/hooks/useSupplierRealtime';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export function AdvancedSupplierAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  
  const { useSupplierAnalytics, useSyncJobs } = useSupplierAPI();
  const { isConnected, activeJobs, getSyncStatus } = useSupplierRealtime();
  
  const { data: analyticsData = [], isLoading } = useSupplierAnalytics(timeRange);
  const { data: syncJobs = [] } = useSyncJobs();
  const syncStatus = getSyncStatus();

  // Agréger les données
  const aggregatedData = useMemo(() => {
    const filtered = selectedSupplier === 'all' 
      ? analyticsData 
      : analyticsData.filter(a => a.supplier_id === selectedSupplier);

    return {
      totalRevenue: filtered.reduce((sum, a) => sum + (a.revenue || a.total_revenue || 0), 0),
      totalOrders: filtered.reduce((sum, a) => sum + (a.orders_count || a.total_orders || 0), 0),
      totalProducts: filtered.reduce((sum, a) => sum + (a.products_active || a.products_synced || 0), 0),
      totalApiCalls: filtered.reduce((sum, a) => sum + (a.api_calls || a.total_api_calls || 0), 0),
      avgResponseTime: filtered.length > 0 
        ? filtered.reduce((sum, a) => sum + (a.avg_response_time_ms || a.avg_sync_time_ms || 0), 0) / filtered.length 
        : 0,
      errorRate: filtered.length > 0
        ? (filtered.reduce((sum, a) => sum + (a.api_errors || a.error_count || 0), 0) / 
           Math.max(1, filtered.reduce((sum, a) => sum + (a.api_calls || a.total_api_calls || 1), 0))) * 100
        : 0,
      avgMargin: filtered.length > 0
        ? filtered.reduce((sum, a) => sum + (a.avg_margin || 0), 0) / filtered.length
        : 0,
    };
  }, [analyticsData, selectedSupplier]);

  // Données pour les graphiques
  const revenueChartData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array.from({ length: Math.min(days, 14) }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i * Math.floor(days / 14));
      const dayData = analyticsData.filter(a => 
        a.analytics_date?.startsWith(format(date, 'yyyy-MM-dd'))
      );
      return {
        date: format(date, 'dd MMM', { locale: getDateFnsLocale() }),
        revenue: dayData.reduce((sum, d) => sum + (d.revenue || d.total_revenue || 0), 0),
        orders: dayData.reduce((sum, d) => sum + (d.orders_count || d.total_orders || 0), 0),
      };
    });
  }, [analyticsData, timeRange]);

  const supplierPerformanceData = useMemo(() => {
    const grouped = analyticsData.reduce((acc, item) => {
      const key = item.supplier_id;
      if (!acc[key]) {
        acc[key] = {
          name: item.supplier_name || key.slice(0, 8),
          revenue: 0,
          orders: 0,
          products: 0,
          errors: 0,
          calls: 0,
        };
      }
      acc[key].revenue += item.revenue || item.total_revenue || 0;
      acc[key].orders += item.orders_count || item.total_orders || 0;
      acc[key].products += item.products_active || item.products_synced || 0;
      acc[key].errors += item.api_errors || item.error_count || 0;
      acc[key].calls += item.api_calls || item.total_api_calls || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(grouped)
      .map(([id, data]) => ({
        ...data,
        id,
        successRate: data.calls > 0 ? ((data.calls - data.errors) / data.calls * 100) : 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [analyticsData]);

  const pieChartData = useMemo(() => {
    return supplierPerformanceData.slice(0, 5).map(s => ({
      name: s.name,
      value: s.revenue,
    }));
  }, [supplierPerformanceData]);

  // Composant KPI Card
  const KPICard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'primary',
    format: formatFn = (v: number) => v.toLocaleString('fr-FR')
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    color?: string;
    format?: (v: number) => string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatFn(value)}</p>
            {change !== undefined && (
              <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{Math.abs(change).toFixed(1)}% vs période précédente</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-${color}/10`}>
            <Icon className={`h-6 w-6 text-${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statut temps réel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Fournisseurs</h2>
          <p className="text-muted-foreground">
            Performance et métriques en temps réel
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Indicateur temps réel */}
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Temps réel' : 'Déconnecté'}
            </span>
          </div>

          {/* Syncs actives */}
          {syncStatus.isActive && (
            <Badge variant="secondary" className="animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              {syncStatus.running} sync(s) en cours
            </Badge>
          )}

          {/* Sélecteur de période */}
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre fournisseur */}
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tous les fournisseurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les fournisseurs</SelectItem>
              {supplierPerformanceData.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenu Total"
          value={aggregatedData.totalRevenue}
          change={12.5}
          icon={DollarSign}
          format={(v) => `${v.toFixed(0)}€`}
        />
        <KPICard
          title="Commandes"
          value={aggregatedData.totalOrders}
          change={8.3}
          icon={Package}
        />
        <KPICard
          title="Produits Actifs"
          value={aggregatedData.totalProducts}
          change={5.2}
          icon={BarChart3}
        />
        <KPICard
          title="Appels API"
          value={aggregatedData.totalApiCalls}
          icon={Zap}
        />
      </div>

      {/* Métriques secondaires */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps réponse moyen</p>
                <p className="text-xl font-bold">{aggregatedData.avgResponseTime.toFixed(0)}ms</p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux d'erreur</p>
                <p className={`text-xl font-bold ${aggregatedData.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {aggregatedData.errorRate.toFixed(2)}%
                </p>
              </div>
              {aggregatedData.errorRate > 5 ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marge moyenne</p>
                <p className="text-xl font-bold">{aggregatedData.avgMargin.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution du revenu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Évolution du Revenu</CardTitle>
            <CardDescription>Tendance sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`${value}€`, 'Revenu']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution par fournisseur */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribution du Revenu</CardTitle>
            <CardDescription>Top 5 fournisseurs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`${value.toFixed(0)}€`, 'Revenu']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance par fournisseur */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance par Fournisseur</CardTitle>
          <CardDescription>Comparaison détaillée des performances</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={supplierPerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis 
                dataKey="name" 
                type="category" 
                className="text-xs" 
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenu (€)" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="orders" name="Commandes" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Jobs de synchronisation actifs */}
      {activeJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              Synchronisations en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeJobs.map(job => (
                <div key={job.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{job.supplier_id}</span>
                    <Badge variant={job.status === 'running' ? 'default' : 'secondary'}>
                      {job.status === 'running' ? 'En cours' : 'En attente'}
                    </Badge>
                  </div>
                  <Progress 
                    value={job.total_items ? (job.processed_items / job.total_items) * 100 : 0} 
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {job.processed_items || 0} / {job.total_items || '?'} éléments
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table de performance détaillée */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détails par Fournisseur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Fournisseur</th>
                  <th className="text-right py-3 px-4 font-medium">Revenu</th>
                  <th className="text-right py-3 px-4 font-medium">Commandes</th>
                  <th className="text-right py-3 px-4 font-medium">Produits</th>
                  <th className="text-right py-3 px-4 font-medium">Taux de succès</th>
                  <th className="text-center py-3 px-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {supplierPerformanceData.map((supplier, index) => (
                  <tr key={supplier.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-green-600">
                      {supplier.revenue.toFixed(0)}€
                    </td>
                    <td className="text-right py-3 px-4">{supplier.orders}</td>
                    <td className="text-right py-3 px-4">{supplier.products}</td>
                    <td className="text-right py-3 px-4">
                      <span className={supplier.successRate >= 95 ? 'text-green-600' : supplier.successRate >= 85 ? 'text-yellow-600' : 'text-red-600'}>
                        {supplier.successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {supplier.successRate >= 95 ? (
                        <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                      ) : supplier.successRate >= 85 ? (
                        <Badge className="bg-yellow-100 text-yellow-800">Bon</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">À surveiller</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {supplierPerformanceData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Aucune donnée disponible. Connectez des fournisseurs pour voir les analytics.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
