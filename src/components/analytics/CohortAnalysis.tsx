/**
 * Cohort Analysis - Analyse de rétention et LTV avancée
 * Connecté aux données réelles (customers + orders)
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Download,
  RefreshCw,
  Target,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CohortData {
  cohort: string;
  month0: number;
  month1: number;
  month2: number;
  month3: number;
  month4: number;
  month5: number;
  totalCustomers: number;
  avgLTV: number;
}

async function fetchCohortData(): Promise<{ cohorts: CohortData[]; ltvTrend: any[]; channelRetention: any[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { cohorts: [], ltvTrend: [], channelRetention: [] };

  // Fetch customers grouped by creation month
  const { data: customers } = await supabase
    .from('customers')
    .select('id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  // Fetch orders with customer and amount
  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_id, created_at, total_amount')
    .eq('user_id', user.id);

  if (!customers?.length) return { cohorts: [], ltvTrend: [], channelRetention: [] };

  // Group customers by month cohort
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const cohortMap = new Map<string, { customers: string[]; monthKey: string }>();

  customers.forEach(c => {
    const d = new Date(c.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (!cohortMap.has(key)) cohortMap.set(key, { customers: [], monthKey: label });
    cohortMap.get(key)!.customers.push(c.id);
  });

  // Build order lookup by customer
  const ordersByCustomer = new Map<string, { month: string; amount: number }[]>();
  (orders || []).forEach(o => {
    if (!o.customer_id) return;
    const d = new Date(o.created_at);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!ordersByCustomer.has(o.customer_id)) ordersByCustomer.set(o.customer_id, []);
    ordersByCustomer.get(o.customer_id)!.push({ month: monthKey, amount: o.total_amount || 0 });
  });

  // Calculate retention for each cohort
  const sortedKeys = Array.from(cohortMap.keys()).sort().slice(-8);
  const cohorts: CohortData[] = sortedKeys.map(cohortKey => {
    const { customers: customerIds, monthKey } = cohortMap.get(cohortKey)!;
    const total = customerIds.length;
    const cohortYear = parseInt(cohortKey.split('-')[0]);
    const cohortMonth = parseInt(cohortKey.split('-')[1]) - 1;

    const retention = [100]; // month0 is always 100%
    let totalRevenue = 0;

    for (let m = 1; m <= 5; m++) {
      const targetDate = new Date(cohortYear, cohortMonth + m);
      const targetKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      
      const activeCount = customerIds.filter(cid => {
        const custOrders = ordersByCustomer.get(cid) || [];
        return custOrders.some(o => o.month === targetKey);
      }).length;
      
      retention.push(total > 0 ? Math.round((activeCount / total) * 100) : 0);
    }

    // Calculate LTV
    customerIds.forEach(cid => {
      const custOrders = ordersByCustomer.get(cid) || [];
      totalRevenue += custOrders.reduce((sum, o) => sum + o.amount, 0);
    });

    return {
      cohort: monthKey,
      month0: retention[0],
      month1: retention[1],
      month2: retention[2],
      month3: retention[3],
      month4: retention[4],
      month5: retention[5],
      totalCustomers: total,
      avgLTV: total > 0 ? Math.round(totalRevenue / total) : 0
    };
  });

  // LTV trend from recent months
  const ltvTrend = sortedKeys.slice(-6).map(key => {
    const { customers: customerIds, monthKey } = cohortMap.get(key)!;
    let totalRev = 0;
    customerIds.forEach(cid => {
      const custOrders = ordersByCustomer.get(cid) || [];
      totalRev += custOrders.reduce((sum, o) => sum + o.amount, 0);
    });
    return {
      month: monthKey.split(' ')[0],
      averageLTV: customerIds.length > 0 ? Math.round(totalRev / customerIds.length) : 0
    };
  });

  return { cohorts, ltvTrend, channelRetention: [] };
}

export function CohortAnalysis() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [metric, setMetric] = useState<'retention' | 'revenue' | 'orders'>('retention');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cohort-analysis'],
    queryFn: fetchCohortData,
  });

  const cohortData = data?.cohorts || [];
  const ltvTrendData = data?.ltvTrend || [];

  const getRetentionColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-green-400';
    if (value >= 40) return 'bg-yellow-400';
    if (value >= 20) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getRetentionTextColor = (value: number) => {
    if (value >= 50) return 'text-white';
    return 'text-gray-900';
  };

  const kpis = useMemo(() => {
    if (!cohortData.length) return { avgRetention1m: 0, avgRetention3m: 0, avgLTV: 0, totalCustomers: 0, churnRate: 0 };
    const avgRetention1m = cohortData.reduce((acc, c) => acc + c.month1, 0) / cohortData.length;
    const avgRetention3m = cohortData.reduce((acc, c) => acc + c.month3, 0) / cohortData.length;
    const avgLTV = cohortData.reduce((acc, c) => acc + c.avgLTV, 0) / cohortData.length;
    const totalCustomers = cohortData.reduce((acc, c) => acc + c.totalCustomers, 0);
    return {
      avgRetention1m: Math.round(avgRetention1m),
      avgRetention3m: Math.round(avgRetention3m),
      avgLTV: Math.round(avgLTV),
      totalCustomers,
      churnRate: Math.round(100 - avgRetention1m)
    };
  }, [cohortData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cohortData.length) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée de cohorte</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Les données de rétention apparaîtront ici une fois que vous aurez des clients et des commandes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Analyse de Cohortes</h2>
            <p className="text-sm text-muted-foreground">Rétention client et valeur vie (LTV)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
              <SelectItem value="quarterly">Trimestriel</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rétention M+1</p>
                <p className="text-2xl font-bold">{kpis.avgRetention1m}%</p>
              </div>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rétention M+3</p>
                <p className="text-2xl font-bold">{kpis.avgRetention3m}%</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">LTV Moyen</p>
                <p className="text-2xl font-bold">{kpis.avgLTV}€</p>
              </div>
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients Actifs</p>
                <p className="text-2xl font-bold">{kpis.totalCustomers}</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de Churn</p>
                <p className="text-2xl font-bold">{kpis.churnRate}%</p>
              </div>
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cohort" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cohort">Tableau de Cohortes</TabsTrigger>
          <TabsTrigger value="ltv">Évolution LTV</TabsTrigger>
        </TabsList>

        <TabsContent value="cohort">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Matrice de Rétention
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Pourcentage de clients actifs par mois après inscription</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription>Analyse de la rétention par cohorte mensuelle</CardDescription>
                </div>
                <Select value={metric} onValueChange={(v: any) => setMetric(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retention">Rétention %</SelectItem>
                    <SelectItem value="revenue">Revenu</SelectItem>
                    <SelectItem value="orders">Commandes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-3 font-medium bg-muted">Cohorte</th>
                      <th className="text-center py-2 px-3 font-medium bg-muted">Clients</th>
                      <th className="text-center py-2 px-3 font-medium bg-muted">M+0</th>
                      <th className="text-center py-2 px-3 font-medium bg-muted">M+1</th>
                      <th className="text-center py-2 px-3 font-medium bg-muted">M+2</th>
                      <th className="text-center py-2 px-3 font-medium bg-muted">M+3</th>
                      <th className="text-center py-2 px-3 font-medium bg-muted">M+4</th>
                      <th className="text-center py-2 px-3 font-medium bg-muted">M+5</th>
                      <th className="text-center py-2 px-3 font-medium bg-muted">LTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map((row, i) => (
                      <motion.tr
                        key={row.cohort}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b"
                      >
                        <td className="py-2 px-3 font-medium">{row.cohort}</td>
                        <td className="text-center py-2 px-3 text-muted-foreground">{row.totalCustomers}</td>
                        {[row.month0, row.month1, row.month2, row.month3, row.month4, row.month5].map((value, j) => (
                          <td key={j} className="py-2 px-3">
                            <div
                              className={cn(
                                "mx-auto w-12 py-1 rounded text-center text-xs font-medium",
                                getRetentionColor(value),
                                getRetentionTextColor(value)
                              )}
                              style={{ opacity: 0.4 + (value / 100) * 0.6 }}
                            >
                              {value}%
                            </div>
                          </td>
                        ))}
                        <td className="text-center py-2 px-3 font-semibold text-green-600">
                          {row.avgLTV}€
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ltv">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la Valeur Vie Client</CardTitle>
              <CardDescription>LTV moyen par cohorte mensuelle</CardDescription>
            </CardHeader>
            <CardContent>
              {ltvTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={ltvTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}€`} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}€`, '']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="averageLTV"
                      name="LTV Moyen"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  Pas assez de données pour afficher le graphique LTV
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}