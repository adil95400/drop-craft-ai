/**
 * Cohort Analysis - Analyse de rétention et LTV avancée
 * Enterprise-ready analytics component
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
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Download,
  RefreshCw,
  Target,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend } from 'recharts';

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

// Données simulées pour la démo
const generateCohortData = (): CohortData[] => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentMonth = new Date().getMonth();
  
  return Array.from({ length: 8 }, (_, i) => {
    const monthIndex = (currentMonth - 7 + i + 12) % 12;
    const baseRetention = 100;
    const decay = 0.15 + Math.random() * 0.1;
    
    return {
      cohort: months[monthIndex] + ' 2024',
      month0: baseRetention,
      month1: Math.round(baseRetention * (1 - decay)),
      month2: Math.round(baseRetention * Math.pow(1 - decay, 2)),
      month3: Math.round(baseRetention * Math.pow(1 - decay, 3)),
      month4: Math.round(baseRetention * Math.pow(1 - decay, 4)),
      month5: Math.round(baseRetention * Math.pow(1 - decay, 5)),
      totalCustomers: Math.round(50 + Math.random() * 150),
      avgLTV: Math.round(80 + Math.random() * 120)
    };
  });
};

const ltvTrendData = [
  { month: 'Jan', newCustomerLTV: 45, returningLTV: 120, averageLTV: 82 },
  { month: 'Fév', newCustomerLTV: 52, returningLTV: 135, averageLTV: 93 },
  { month: 'Mar', newCustomerLTV: 48, returningLTV: 142, averageLTV: 95 },
  { month: 'Avr', newCustomerLTV: 55, returningLTV: 138, averageLTV: 96 },
  { month: 'Mai', newCustomerLTV: 62, returningLTV: 155, averageLTV: 108 },
  { month: 'Juin', newCustomerLTV: 58, returningLTV: 162, averageLTV: 110 },
];

const retentionByChannel = [
  { channel: 'Organic', month1: 78, month3: 52, month6: 38 },
  { channel: 'Paid', month1: 65, month3: 42, month6: 28 },
  { channel: 'Email', month1: 85, month3: 68, month6: 55 },
  { channel: 'Social', month1: 72, month3: 48, month6: 32 },
  { channel: 'Referral', month1: 88, month3: 72, month6: 62 },
];

export function CohortAnalysis() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [metric, setMetric] = useState<'retention' | 'revenue' | 'orders'>('retention');
  const cohortData = useMemo(() => generateCohortData(), []);

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

  // KPIs calculés
  const kpis = useMemo(() => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Users className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Analyse de Cohortes</h2>
            <p className="text-sm text-muted-foreground">
              Rétention client et valeur vie (LTV)
            </p>
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
          <Button variant="outline" size="icon">
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
            <p className="text-xs text-muted-foreground mt-2">+2.3% vs mois dernier</p>
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
            <p className="text-xs text-muted-foreground mt-2">Objectif: 50%</p>
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
            <p className="text-xs text-muted-foreground mt-2">+12% vs trimestre</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients Actifs</p>
                <p className="text-2xl font-bold">{kpis.totalCustomers}</p>
              </div>
              <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">8 cohortes analysées</p>
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
            <p className="text-xs text-muted-foreground mt-2">-1.5% (amélioration)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cohort" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cohort">Tableau de Cohortes</TabsTrigger>
          <TabsTrigger value="ltv">Évolution LTV</TabsTrigger>
          <TabsTrigger value="channels">Par Canal</TabsTrigger>
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
                  <CardDescription>
                    Analyse de la rétention par cohorte mensuelle
                  </CardDescription>
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
              <CardDescription>
                Comparaison LTV nouveaux clients vs clients récurrents
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    dataKey="newCustomerLTV" 
                    name="Nouveaux clients"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="returningLTV" 
                    name="Clients récurrents"
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averageLTV" 
                    name="Moyenne"
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Rétention par Canal d'Acquisition</CardTitle>
              <CardDescription>
                Performance de rétention selon la source du client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={retentionByChannel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="channel" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                  <Legend />
                  <Bar dataKey="month1" name="M+1" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="month3" name="M+3" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="month6" name="M+6" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
