/**
 * AutomationMetricsDashboard - Performance analytics with charts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Activity, CheckCircle2, XCircle, Clock, TrendingUp,
  Zap, Timer, AlertTriangle, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EXECUTION_HISTORY = [
  { day: 'Lun', success: 45, failed: 3, skipped: 2 },
  { day: 'Mar', success: 52, failed: 1, skipped: 4 },
  { day: 'Mer', success: 38, failed: 5, skipped: 1 },
  { day: 'Jeu', success: 61, failed: 2, skipped: 3 },
  { day: 'Ven', success: 48, failed: 4, skipped: 2 },
  { day: 'Sam', success: 22, failed: 0, skipped: 1 },
  { day: 'Dim', success: 15, failed: 1, skipped: 0 },
];

const AVG_DURATION = [
  { hour: '00h', duration: 1.2 },
  { hour: '04h', duration: 0.8 },
  { hour: '08h', duration: 2.5 },
  { hour: '12h', duration: 3.1 },
  { hour: '16h', duration: 2.8 },
  { hour: '20h', duration: 1.5 },
];

const TRIGGER_DISTRIBUTION = [
  { name: 'Événement', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Planifié', value: 30, color: 'hsl(var(--chart-2))' },
  { name: 'Webhook', value: 15, color: 'hsl(var(--chart-3))' },
  { name: 'Manuel', value: 10, color: 'hsl(var(--chart-4))' },
];

const KPIS = [
  { label: 'Exécutions totales', value: '1,247', trend: '+12%', icon: Activity, color: 'text-blue-500' },
  { label: 'Taux de succès', value: '96.2%', trend: '+1.5%', icon: Target, color: 'text-green-500' },
  { label: 'Temps moyen', value: '2.3s', trend: '-0.4s', icon: Timer, color: 'text-amber-500' },
  { label: 'Erreurs cette semaine', value: '16', trend: '-8', icon: AlertTriangle, color: 'text-red-500' },
];

export function AutomationMetricsDashboard() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                <span className="text-xs">{kpi.label}</span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{kpi.value}</p>
                <Badge variant="outline" className={cn(
                  "text-[10px]",
                  kpi.trend.startsWith('+') ? 'text-green-600' : kpi.trend.startsWith('-') && kpi.label.includes('Erreurs') ? 'text-green-600' : 'text-green-600'
                )}>
                  {kpi.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Executions by day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Exécutions par jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={EXECUTION_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="success" name="Succès" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Échoué" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="skipped" name="Ignoré" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average duration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              Durée moyenne (secondes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={AVG_DURATION}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" unit="s" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value}s`, 'Durée']}
                />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trigger distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Distribution par déclencheur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={TRIGGER_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {TRIGGER_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {TRIGGER_DISTRIBUTION.map(item => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm flex-1">{item.name}</span>
                    <span className="text-sm font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
